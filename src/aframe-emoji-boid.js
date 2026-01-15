import './bootstrap.js';

import { GPUComputationRenderer } from "three/examples/jsm/Addons.js";

import emojiFS from "./emojiFSRoom.frag";
import emojiVS from "./emojiVSRoom.vert";
import fragmentShaderPosition from "./FragmentShaderPositionSmall.frag";
import fragmentShaderVelocity from "./FragmentShaderVelocitySmall.frag";

AFRAME.registerComponent( "emoji-boid", {
  init() {
    this.ready = false;

    /* TEXTURE WIDTH FOR SIMULATION */
    this.WIDTH = 4;

    this.queryParams = new URLSearchParams( document.location.search );

    this.mouseX = 0;
    this.mouseY = 0;

    this.windowHalfX = window.innerWidth / 2;
    this.windowHalfY = window.innerHeight / 2;

    this.BOUNDS = 0.5;
    this.BOUNDS_HALF = this.BOUNDS / 2;

    this.last = performance.now();

    this.gpuCompute = null;
    this.velocityVariable = null;
    this.positionVariable = null;
    this.positionUniforms = null;
    this.velocityUniforms = null;
    this.birdUniforms = null;

    this.tilesRuntime = null;
    this.clock = new THREE.Clock();

    this.initComputeRenderer();

    this.emojitexture = new Image();
    this.emojitexture.src = "/assets/images/emoji.png";
    this.emojitexture.onload = () => {
      this.initBirds();
      this.ready = true;
    };
  },
  fillPositionTexture( texture ) {
    const theArray = texture.image.data;

    for ( let k = 0, kl = theArray.length; k < kl; k += 4 ) {
      const x = Math.random() * this.BOUNDS - this.BOUNDS_HALF;
      const y = Math.random() * this.BOUNDS - this.BOUNDS_HALF;
      const z = Math.random() * this.BOUNDS - this.BOUNDS_HALF;

      theArray[k + 0] = x;
      theArray[k + 1] = y;
      theArray[k + 2] = z;
      theArray[k + 3] = 1;
    }
  },
  fillVelocityTexture( texture ) {
    const theArray = texture.image.data;

    for ( let k = 0, kl = theArray.length; k < kl; k += 4 ) {
      const x = Math.random() - 0.5;
      const y = Math.random() - 0.5;
      const z = Math.random() - 0.5;

      theArray[k + 0] = x * 4;
      theArray[k + 1] = y * 2 + 1.5;
      theArray[k + 2] = z * 4;
      theArray[k + 3] = 1;
    }
  },
  initComputeRenderer() {
    this.gpuCompute = new GPUComputationRenderer( this.WIDTH, this.WIDTH, this.el.sceneEl.renderer );

    const dtPosition = this.gpuCompute.createTexture();
    const dtVelocity = this.gpuCompute.createTexture();
    this.fillPositionTexture( dtPosition );
    this.fillVelocityTexture( dtVelocity );

    this.velocityVariable = this.gpuCompute.addVariable( 'textureVelocity', fragmentShaderVelocity, dtVelocity );
    this.positionVariable = this.gpuCompute.addVariable( 'texturePosition', fragmentShaderPosition, dtPosition );

    this.gpuCompute.setVariableDependencies( this.velocityVariable, [this.positionVariable, this.velocityVariable] );
    this.gpuCompute.setVariableDependencies( this.positionVariable, [this.positionVariable, this.velocityVariable] );

    this.positionUniforms = this.positionVariable.material.uniforms;
    this.velocityUniforms = this.velocityVariable.material.uniforms;

    this.positionUniforms['time'] = { value: 0.0 };
    this.positionUniforms['delta'] = { value: 0.0 };
    this.velocityUniforms['time'] = { value: 1.0 };
    this.velocityUniforms['delta'] = { value: 0.0 };
    this.velocityUniforms['testing'] = { value: 1.0 };
    this.velocityUniforms['separationDistance'] = { value: 0.1 };
    this.velocityUniforms['alignmentDistance'] = { value: 20.0 };
    this.velocityUniforms['cohesionDistance'] = { value: 20.0 };
    this.velocityUniforms['freedomFactor'] = { value: 0.75 };
    this.velocityUniforms['predator'] = { value: new THREE.Vector3() };
    this.velocityVariable.material.defines.BOUNDS = this.BOUNDS.toFixed( 2 );

    this.velocityVariable.wrapS = THREE.RepeatWrapping;
    this.velocityVariable.wrapT = THREE.RepeatWrapping;
    this.positionVariable.wrapS = THREE.RepeatWrapping;
    this.positionVariable.wrapT = THREE.RepeatWrapping;

    const error = this.gpuCompute.init();

    if ( error !== null ) {

      console.error( error );

    }

  },
  initBirds() {
    const BIRD_COUNT = this.WIDTH * this.WIDTH;
    const emojis = ['😄', '😃', '😀', '😊', '☺', '😉', '😍', '😘', '😚', '😗', '😙', '😜', '😝', '😛', '😳', '😁', '😔', '😌', '😒', '😞', '😣', '😢', '😂', '😭', '😪', '😥', '😰', '😅', '😓', '😩', '😫', '😨', '😱', '😠', '😡', '😤', '😖', '😆', '😋', '😷', '😎', '😴', '😵', '😲', '😟', '😦', '😧', '😈', '👿', '😮', '😬', '😐', '😕', '😯', '😶', '😇', '😏', '😑', '👲', '👳', '👮', '👷', '💂', '👶', '👦', '👧', '👨', '👩', '👴', '👵', '👱', '👼', '👸', '😺', '😸', '😻', '😽', '😼', '🙀', '😿', '😹', '😾', '👹', '👺', '🙈', '🙉', '🙊', '💀', '👽', '🐶', '🐺', '🐱', '🐭', '🐹', '🐰', '🐸', '🐯', '🐨', '🐻', '🐷', '🐽', '🐮', '🐗', '🐵', '🐒', '🐴', '🐑', '🐘', '🐼', '🐧', '🐦', '🐤', '🐥', '🐣', '🐔', '🐍', '🐢', '🐛', '🐝', '🐜', '🐞', '🐌', '🐙', '🐚', '🐠', '🐟', '🐬', '🐳', '🐋', '🐄', '🐏', '🐀', '🐃', '🐅', '🐇', '🐉', '🐎', '🐐', '🐓', '🐕', '🐖', '🐁', '🐂', '🐲', '🐡', '🐊', '🐫', '🐪', '🐆', '🐈', '🐩'];
    const ATLAS_GRID_WIDTH = Math.ceil( Math.sqrt( emojis.length ) );
    const CELL_SIZE = 128;
    const canvas = document.createElement( 'canvas' );
    canvas.width = canvas.height = ATLAS_GRID_WIDTH * CELL_SIZE;
    const ctx = canvas.getContext( '2d' );
    ctx.font = `${CELL_SIZE * 0.9}px sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    /*
      for ( let i = 0; i < emojis.length; i++ ) {
        const x = ( i % ATLAS_GRID_WIDTH ) * CELL_SIZE + CELL_SIZE / 2;
        const y = Math.floor( i / ATLAS_GRID_WIDTH ) * CELL_SIZE + CELL_SIZE / 2;
        ctx.fillText( emojis[i], x, y );
      }
    */

    ctx.drawImage( this.emojitexture, 0, 0 );

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
        'uWidth': { value: this.WIDTH },
        'uAtlasWidth': { value: ATLAS_GRID_WIDTH }
      },
      vertexShader: emojiVS,
      fragmentShader: emojiFS,
      transparent: true
    } );

    this.birdUniforms = material.uniforms;

    const birds = new THREE.Points( geometry, material );
    birds.frustumCulled = false;
    this.el.sceneEl.object3D.add( birds );
  },
  tick() {
    if ( this.ready ) {
      const now = performance.now();
      let delta = ( now - this.last ) / 1000;

      if ( delta > 1 ) delta = 1; // safety cap on large deltas
      this.last = now;

      this.positionUniforms['time'].value = now;
      this.positionUniforms['delta'].value = delta;
      this.velocityUniforms['time'].value = now;
      this.velocityUniforms['delta'].value = delta;

      this.velocityUniforms['predator'].value.set( 0.5 * this.mouseX / this.windowHalfX, - 0.5 * this.ouseY / this.windowHalfY, 0 );

      this.mouseX = 10000;
      this.mouseY = 10000;

      this.gpuCompute.compute();

      this.birdUniforms['texturePosition'].value = this.gpuCompute.getCurrentRenderTarget( this.positionVariable ).texture;
      this.birdUniforms['textureVelocity'].value = this.gpuCompute.getCurrentRenderTarget( this.velocityVariable ).texture;
    }
  }
} );
