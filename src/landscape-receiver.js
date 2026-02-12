import { librariesLoaded } from './bootstrap.js';
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { Loader3DTiles, PointCloudColoring } from 'three-loader-3dtiles';
import emojiFS from "./emojiFS.frag";
import emojiVS from "./emojiVSreceiver.vert";

const canvasElement = document.getElementById( 'textureCanvas' );
const videoProcessingCanvas = document.createElement( 'canvas' );
videoProcessingCanvas.width = 1920;
videoProcessingCanvas.height = 1080;

const WIDTH = 128;
const queryParams = new URLSearchParams( document.location.search );

let container, camera, scene, renderer, controls;
const BOUNDS = 4000;
let birdUniforms;
let videoTexture;
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

  renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
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
    const peer = new Peer( 'functor001bboidreceiver', {
      config: { 'iceServers': [{ urls: 'stun:stun.l.google.com:19302' }] }
    } );

    peer.on( 'call', ( call ) => {
      call.answer();
      call.on( 'stream', ( stream ) => {
        canvasElement.srcObject = stream;
        const processVideoFrame = () => {
          if ( canvasElement.readyState === canvasElement.HAVE_ENOUGH_DATA ) {
            if ( !videoTexture ) {
              videoTexture = new THREE.Texture( videoProcessingCanvas );
              videoTexture.flipY = false;
              videoTexture.minFilter = THREE.NearestFilter;
              videoTexture.magFilter = THREE.NearestFilter;
              videoTexture.generateMipmaps = false;
              if ( birdUniforms ) birdUniforms['textureVideo'].value = videoTexture;
            }
            const ctx = videoProcessingCanvas.getContext( '2d' );
            if ( ctx ) {
              ctx.drawImage( canvasElement, 0, 0, 1920, 1080 );
              videoTexture.needsUpdate = true;
            }
          }
          requestAnimationFrame( processVideoFrame );
        };
        processVideoFrame();
      } );
    } );
  }

  Loader3DTiles.load( {
    url: "https://tile.googleapis.com/v1/3dtiles/root.json",
    viewport: { width: document.body.clientWidth, height: document.body.clientHeight, devicePixelRatio: window.devicePixelRatio },
    options: {
      googleApiKey: queryParams.get( 'key' ),
      dracoDecoderPath: 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco',
      pointCloudColoring: PointCloudColoring.RGB,
      maximumScreenSpaceError: queryParams.get( 'sse' ) ?? 48
    }
  } ).then( ( result ) => {
    tilesRuntime = result.runtime;
    scene.add( result.model );
    tilesRuntime.orientToGeocoord( { lat: 35.6740679, long: 139.7108025, height: 60 } );
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
  atlasTexture.flipY = false;

  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( [0, 0, 0] ), 3 ) );
  const birdIndices = new Float32Array( BIRD_COUNT );
  for ( let i = 0; i < BIRD_COUNT; i++ ) birdIndices[i] = i;
  geometry.setAttribute( 'aBirdIndex', new THREE.InstancedBufferAttribute( birdIndices, 1 ) );
  geometry.instanceCount = BIRD_COUNT;

  const material = new THREE.ShaderMaterial( {
    uniforms: {
      'tBirdAtlas': { value: atlasTexture },
      'uWidth': { value: WIDTH },
      'uAtlasWidth': { value: ATLAS_GRID_WIDTH },
      'textureVideo': { value: null },
      'uMin': { value: -2000.0 },
      'uRange': { value: 4000.0 }
    },
    vertexShader: emojiVS,
    fragmentShader: emojiFS,
    transparent: true
  } );
  birdUniforms = material.uniforms;
  scene.add( new THREE.Points( geometry, material ) );
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
  render();
  controls.update();
}

function render() {
  renderer.render( scene, camera );
  if ( tilesRuntime ) {
    tilesRuntime.update( clock.getDelta(), camera );
  }
}