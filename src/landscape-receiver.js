import { librariesLoaded } from './bootstrap.js';

import { OrbitControls } from "three/examples/jsm/Addons.js";
import { Loader3DTiles, PointCloudColoring } from 'three-loader-3dtiles';

import emojiFS from "./emojiFS.frag";
import emojiVS from "./emojiVSreceiver.vert";

const canvasElement = document.getElementById( 'textureCanvas' );
// Video processing canvas (size is determined dynamically when receiving video)
const videoProcessingCanvas = document.createElement( 'canvas' );

/* TEXTURE WIDTH FOR SIMULATION */
const WIDTH = 128; // Number of particles (128x128)

const queryParams = new URLSearchParams( document.location.search );

let container, stats;
let camera, scene, renderer, controls;

const BOUNDS = 800; // Coordinate range

let birdUniforms;

// Video texture related
let videoTexture;
let videoTextureNeedsUpdate = false;

let tilesRuntime = null;
const clock = new THREE.Clock();

const copyrightElement = document.querySelector( "#credit" );

await librariesLoaded;

init();

function init() {

  container = document.createElement( 'div' );
  document.body.appendChild( container );

  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000000 );
  camera.position.z = 150;
  camera.position.y = 50;

  scene = new THREE.Scene();

  renderer = new THREE.WebGLRenderer( {
    antialias: true,
    preserveDrawingBuffer: true,
    alpha: true,
  } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setAnimationLoop( animate );
  container.appendChild( renderer.domElement );

  controls = new OrbitControls( camera, container );
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.1;

  window.addEventListener( 'resize', onWindowResize );

  initBirds();

  if ( canvasElement ) {
    const peer = new Peer(
      'functor001bboidreceiver', {
      config: {
        'iceServers': [
          { urls: 'stun:stun.l.google.com:19302' },
        ]
      }
    } );

    peer.on( 'connection', ( conn ) => {
      console.log( "peer on connection", new Date() );

      conn.on( 'open', () => {
        conn.on( 'data', ( data ) => { console.log( 'Received', data ); } );
        conn.send( 'Hello!' );
      } );
    } );

    peer.on( 'call', ( call ) => {
      console.log( "peer on call", new Date() );
      call.answer();

      call.on( 'stream', ( stream ) => {
        canvasElement.srcObject = stream;
        console.log( "stream on", stream );

        const processVideoFrame = () => {
          if ( canvasElement.readyState === canvasElement.HAVE_ENOUGH_DATA ) {
            const videoW = canvasElement.videoWidth;
            const videoH = canvasElement.videoHeight;

            // Video size is valid and size change has occurred
            if ( videoW > 0 && videoH > 0 &&
              ( videoProcessingCanvas.width !== videoW || videoProcessingCanvas.height !== videoH ) ) {

              console.log( `Resize detected: ${videoProcessingCanvas.width}x${videoProcessingCanvas.height} -> ${videoW}x${videoH}` );

              // 1. Update canvas size
              videoProcessingCanvas.width = videoW;
              videoProcessingCanvas.height = videoH;

              // 2. Dispose of old texture to prevent memory leaks
              if ( videoTexture ) {
                videoTexture.dispose();
              }

              // 3. Create new texture (to support size changes)
              videoTexture = new THREE.Texture( videoProcessingCanvas );
              videoTexture.flipY = false;
              videoTexture.minFilter = THREE.NearestFilter;
              videoTexture.magFilter = THREE.NearestFilter;
              videoTexture.generateMipmaps = false;

              // 4. Set new texture to shader uniforms
              if ( birdUniforms ) {
                birdUniforms['textureVideo'].value = videoTexture;
              }
            }

            const ctx = videoProcessingCanvas.getContext( '2d' );
            if ( ctx && videoProcessingCanvas.width > 0 ) {
              ctx.drawImage( canvasElement, 0, 0, videoProcessingCanvas.width, videoProcessingCanvas.height );

              if ( videoTexture ) {
                videoTexture.needsUpdate = true;
              }
            }
          }
          requestAnimationFrame( processVideoFrame );
        };
        processVideoFrame();
      }, ( err ) => { console.log( "call error", err ); } );

      call.on( 'close', () => { console.log( "call on close", new Date() ); } );
      call.on( 'error', ( e ) => { console.log( "call on close", new Date(), e ); } );
    } );

    peer.on( 'peer on disconnected', () => {
      console.log( "peer on disconnected", new Date() );
      peer.reconnect();
    } );

    peer.on( 'peer on close', () => { console.log( "peer on close", new Date() ); } );
    peer.on( 'peer on error', ( e ) => { console.log( "error", new Date(), e ); } );
  }

  document.addEventListener( "click", () => {
    if ( navigator.wakeLock ) {
      try {
        navigator.wakeLock.request( "screen" ).then( () => { console.log( "wakeLock: on" ); } );
      } catch ( err ) { console.log( 'wakeLock: ' + `${err.name}, ${err.message}` ); }
    }
  } );

  const getViewport = () => {
    return {
      width: document.body.clientWidth,
      height: document.body.clientHeight,
      devicePixelRatio: window.devicePixelRatio
    };
  };

  Loader3DTiles.load( {
    url: "https://tile.googleapis.com/v1/3dtiles/root.json",
    viewport: getViewport(),
    options: {
      googleApiKey: queryParams.get( 'key' ),
      dracoDecoderPath: 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco',
      basisTranscoderPath: 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/basis',
      pointCloudColoring: PointCloudColoring.RGB,
      maximumScreenSpaceError: queryParams.get( 'sse' ) ?? 48
    }
  } )
    .then( ( result ) => {
      const model = result.model;
      const runtime = result.runtime;
      const demoLat = queryParams.get( 'lat' ) ?? 35.6740679;
      const demoLong = queryParams.get( 'long' ) ?? 139.7108025;
      const demoHeight = queryParams.get( 'height' ) ?? 60;
      tilesRuntime = runtime;
      scene.add( model );
      scene.add( runtime.getTileBoxes() );
      runtime.orientToGeocoord( {
        lat: Number( demoLat ),
        long: Number( demoLong ),
        height: Number( demoHeight )
      } );
    } );
}

function initBirds() {
  const BIRD_COUNT = WIDTH * WIDTH;
  const emojis = ['😄', '😃', '😀', '😊', '☺', '😉', '😍', '😘', '😚', '😗', '😙', '😜', '😝', '😛', '😳', '😁', '😔', '😌', '😒', '😞', '😣', '😢', '😂', '😭', '😪', '😥', '😰', '😅', '😓', '😩', '😫', '😨', '😱', '😠', '😡', '😤', '😖', '😆', '😋', '😷', '😎', '😴', '😵', '😲', '😟', '😦', '😧', '😈', '👿', '😮', '😬', '😐', '😕', '😯', '😶', '😇', '😏', '😑', '👲', '👳', '👮', '👷', '💂', '👶', '👦', '👧', '👨', '👩', '👴', '👵', '👱', '👼', '👸', '😺', '😸', '😻', '😽', '😼', '🙀', '😿', '😹', '😾', '👹', '👺', '🙈', '🙉', '🙊', '💀', '👽', '🐶', '🐺', '🐱', '🐭', '🐹', '🐰', '🐸', '🐯', '🐨', '🐻', '🐷', '🐽', '🐮', '🐗', '🐵', '🐒', '🐴', '🐑', '🐘', '🐼', '🐧', '🐦', '🐤', '🐥', '🐣', '🐔', '🐍', '🐢', '🐛', '🐝', '🐜', '🐞', '🐌', '🐙', '🐚', '🐠', '🐟', '🐬', '🐳', '🐋', '🐄', '🐏', '🐀', '🐃', '🐅', '🐇', '🐉', '🐎', '🐐', '🐓', '🐕', '🐖', '🐁', '🐂', '🐲', '🐡', '🐊', '🐫', '🐪', '🐆', '🐈', '🐩'];
  const ATLAS_GRID_WIDTH = Math.ceil( Math.sqrt( emojis.length ) );
  const CELL_SIZE = 128;
  const canvas = document.createElement( 'canvas' );
  canvas.width = canvas.height = ATLAS_GRID_WIDTH * CELL_SIZE;
  const ctx = canvas.getContext( '2d' );
  ctx.font = `${CELL_SIZE * 0.9}px sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  for ( let i = 0; i < emojis.length; i++ ) {
    const x = ( i % ATLAS_GRID_WIDTH ) * CELL_SIZE + CELL_SIZE / 2;
    const y = Math.floor( i / ATLAS_GRID_WIDTH ) * CELL_SIZE + CELL_SIZE / 2;
    ctx.fillText( emojis[i], x, y );
  }

  const atlasTexture = new THREE.CanvasTexture( canvas );
  atlasTexture.needsUpdate = true;
  atlasTexture.flipY = false;

  const geometry = new THREE.InstancedBufferGeometry();
  const baseVertices = new Float32Array( [0, 0, 0] );
  geometry.setAttribute( 'position', new THREE.BufferAttribute( baseVertices, 3 ) );
  const birdIndices = new Float32Array( BIRD_COUNT );
  for ( let i = 0; i < BIRD_COUNT; i++ ) {
    birdIndices[i] = i;
  }
  geometry.setAttribute( 'aBirdIndex', new THREE.InstancedBufferAttribute( birdIndices, 1 ) );
  geometry.setAttribute( 'aBirdIndex', new THREE.InstancedBufferAttribute( birdIndices, 1 ) );
  geometry.instanceCount = BIRD_COUNT;

  const material = new THREE.ShaderMaterial( {
    uniforms: {
      'tBirdAtlas': { value: atlasTexture },
      'uWidth': { value: WIDTH }, // 128
      'uAtlasWidth': { value: ATLAS_GRID_WIDTH },
      'textureVideo': { value: null },
      // Parameters for coordinate recovery
      'uMin': { value: -2000.0 },  // BOUNDS_HALF * -1
      'uRange': { value: 4000.0 }  // BOUNDS
    },
    vertexShader: emojiVS,
    fragmentShader: emojiFS,
    transparent: true
  } );

  birdUniforms = material.uniforms;
  const birds = new THREE.Points( geometry, material );
  birds.frustumCulled = false;
  scene.add( birds );

  if ( canvasElement ) {
    const initializeVideoTexture = () => {
      // Check if video dimensions are determined
      const validDimensions = ( canvasElement.videoWidth > 0 && canvasElement.videoHeight > 0 ) ||
        ( videoProcessingCanvas.width > 0 && videoProcessingCanvas.height > 0 );

      if ( validDimensions ) {
        // Initial size setting (if videoProcessingCanvas is 0x0)
        if ( videoProcessingCanvas.width === 0 ) {
          videoProcessingCanvas.width = canvasElement.videoWidth || 256;
          videoProcessingCanvas.height = canvasElement.videoHeight || 256;
        }

        videoTexture = new THREE.Texture( videoProcessingCanvas );
        videoTexture.needsUpdate = false;
        videoTexture.flipY = false; // Align with WebGL coordinate system

        // Use NearestFilter (dot grid mode) to prevent adjacent values from mixing
        videoTexture.minFilter = THREE.NearestFilter;
        videoTexture.magFilter = THREE.NearestFilter;
        videoTexture.generateMipmaps = false;

        birdUniforms['textureVideo'].value = videoTexture;
      } else {
        setTimeout( initializeVideoTexture, 100 );
      }
    };
    initializeVideoTexture();
  }
}

function onWindowResize() {
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
  render();
  controls.update();
}

function render() {
  if ( videoTextureNeedsUpdate && videoTexture ) {
    videoTexture.needsUpdate = true;
    videoTextureNeedsUpdate = false;
  }

  renderer.render( scene, camera );

  if ( tilesRuntime ) {
    const dt = clock.getDelta();
    tilesRuntime.update( dt, camera );
    copyrightElement.innerHTML = tilesRuntime.getDataAttributions();
  }
}