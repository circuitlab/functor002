import * as THREE from 'three';

import { OrbitControls } from "three/examples/jsm/Addons.js";
import { Loader3DTiles, PointCloudColoring } from 'three-loader-3dtiles';

import emojiFS from "./emojiFS.frag";
import emojiVS from "./emojiVSreceiver.vert";

import { Peer } from "https://esm.sh/peerjs@1.5.5?bundle-deps";

const canvasElement = document.getElementById( 'textureCanvas' );
// Create a separate canvas for video processing to avoid conflicts
const videoProcessingCanvas = document.createElement( 'canvas' );
videoProcessingCanvas.width = 128;
videoProcessingCanvas.height = 128;

/* TEXTURE WIDTH FOR SIMULATION */
const WIDTH = 128;

const queryParams = new URLSearchParams( document.location.search );

let container, stats;
let camera, scene, renderer, controls;
let mouseX = 0, mouseY = 0;

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

const BOUNDS = 800, BOUNDS_HALF = BOUNDS / 2;

let last = performance.now();

let shibuya;

let gpuCompute;
let velocityVariable;
let positionVariable;
let positionUniforms;
let velocityUniforms;
let birdUniforms;

// 新しいテクスチャ用の変数
let videoTexture;
let videoTextureNeedsUpdate = false;

let tilesRuntime = null;
const clock = new THREE.Clock();

const copyrightElement = document.querySelector( "#credit" );

init();

function init() {

  container = document.createElement( 'div' );
  document.body.appendChild( container );

  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000000 );
  camera.position.z = 150;
  camera.position.y = 50;

  scene = new THREE.Scene();
  //scene.background = new THREE.Color( 0xffffff );
  //scene.fog = new THREE.Fog( 0xffffff, 100, 1000 );

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
        // Receive messages
        conn.on( 'data', ( data ) => {
          console.log( 'Received', data );
        } );

        // Send messages
        conn.send( 'Hello!' );
      } );
    } );

    peer.on( 'call', ( call ) => {
      console.log( "peer on call", new Date() );

      call.answer();

      call.on( 'stream', ( stream ) => {
        canvasElement.srcObject = stream;
        console.log( "stream on", stream );

        // Handle video data processing
        const processVideoFrame = () => {
          if ( canvasElement.readyState === canvasElement.HAVE_ENOUGH_DATA ) {
            // Draw video frame to our processing canvas
            const ctx = videoProcessingCanvas.getContext( '2d' );
            if ( ctx ) {
              // Draw the video frame to our processing canvas
              ctx.drawImage( canvasElement, 0, 0, videoProcessingCanvas.width, videoProcessingCanvas.height );

              // Update the texture if it exists
              if ( videoTexture ) {
                videoTextureNeedsUpdate = true;
              }
            }
          }
          // Continue processing frames at ~30fps
          requestAnimationFrame( processVideoFrame );
        };

        // Start processing video frames
        processVideoFrame();
      }, ( err ) => {
        console.log( "call error", err );
      } );

      call.on( 'close', () => {
        console.log( "call on close", new Date() );
      } );

      call.on( 'error', ( e ) => {
        console.log( "call on close", new Date(), e );
      } );
    } );

    peer.on( 'peer on disconnected', () => {
      console.log( "peer on disconnected", new Date() );

      peer.reconnect();
    } );

    peer.on( 'peer on close', () => {
      console.log( "peer on close", new Date() );
    } );

    peer.on( 'peer on error', ( e ) => {
      console.log( "error", new Date(), e );
    } );


  }

  document.addEventListener( "click", () => {
    if ( navigator.wakeLock ) {
      try {
        navigator.wakeLock.request( "screen" )
          .then( () => {
            console.log( "wakeLock: on" );
          } );
      } catch ( err ) {
        console.log( 'wakeLock: ' + `${err.name}, ${err.message}` );
      }
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
    birdIndices[i] = i % emojis.length;
  }
  geometry.setAttribute( 'aBirdIndex', new THREE.InstancedBufferAttribute( birdIndices, 1 ) );

  geometry.instanceCount = BIRD_COUNT;

  const material = new THREE.ShaderMaterial( {
    uniforms: {
      'tBirdAtlas': { value: atlasTexture },
      'texturePosition': { value: null },
      'textureVelocity': { value: null },
      'uWidth': { value: WIDTH },
      'uAtlasWidth': { value: ATLAS_GRID_WIDTH },
      // 映像テクスチャを追加
      'textureVideo': { value: null }
    },
    vertexShader: emojiVS,
    fragmentShader: emojiFS,
    transparent: true
  } );

  birdUniforms = material.uniforms;

  const birds = new THREE.Points( geometry, material );
  birds.frustumCulled = false;
  scene.add( birds );

  // 映像テクスチャの初期化
  if ( canvasElement ) {
    // Wait for video to be ready before creating texture
    const initializeVideoTexture = () => {
      // Check if we have valid dimensions from either canvas
      const validDimensions = ( canvasElement.videoWidth > 0 && canvasElement.videoHeight > 0 ) ||
        ( videoProcessingCanvas.width > 0 && videoProcessingCanvas.height > 0 );

      if ( validDimensions ) {
        // Create texture from our processing canvas instead of the display canvas
        videoTexture = new THREE.Texture( videoProcessingCanvas );
        videoTexture.needsUpdate = false;
        videoTexture.flipY = false;
        videoTexture.wrapS = THREE.ClampToEdgeWrapping;
        videoTexture.wrapT = THREE.ClampToEdgeWrapping;
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;
        // Disable mipmap generation for video textures
        videoTexture.generateMipmaps = false;

        // パーティクルのuniformsに映像テクスチャを設定
        birdUniforms['textureVideo'].value = videoTexture;
      } else {
        // Retry after a short delay
        setTimeout( initializeVideoTexture, 100 );
      }
    };

    // Start the initialization process
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
  //birdUniforms['texturePosition'].value = gpuCompute.getCurrentRenderTarget( positionVariable ).texture;
  //birdUniforms['textureVelocity'].value = gpuCompute.getCurrentRenderTarget( velocityVariable ).texture;

  // 映像テクスチャの更新処理
  if ( videoTextureNeedsUpdate ) {
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
