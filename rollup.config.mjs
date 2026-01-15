import resolve from '@rollup/plugin-node-resolve';
import glslify from 'rollup-plugin-glslify';
import copy from 'rollup-plugin-copy';

export default {
  input: [
    'src/landscape.js',
    'src/landscape-receiver.js',
    'src/pigeon-functor.js',
    'src/pigeon-receiver.js',
    'src/aframe-emoji-boid.js',
    'src/emoji-starter.js',
    'src/peerjs-functor.js',
    'src/peerjs-room.js'
  ],
  output: {
    dir: 'public/assets/js/',
    preserveModules: true,
    preserveModulesRoot: 'src'
  },
  plugins: [
    copy( {
      targets: [
        {
          src: 'node_modules/peerjs/dist/peerjs.min.js',
          dest: 'public/assets/js/libs'
        },
        {
          src: 'node_modules/aframe/dist/aframe-v1.7.1.min.js',
          dest: 'public/assets/js/libs'
        },
        {
          src: 'node_modules/@ar-js-org/ar.js/aframe/build/aframe-ar.js',
          dest: 'public/assets/js/libs'
        },
        {
          src: 'node_modules/aframe-environment-component/dist/aframe-environment-component.min.js',
          dest: 'public/assets/js/libs'
        },
        {
          src: 'node_modules/aframe-orbit-controls/dist/aframe-orbit-controls.min.js',
          dest: 'public/assets/js/libs'
        }
      ]
    } ),
    glslify(),
    resolve( {
      browser: true
    } )]
};