import resolve from '@rollup/plugin-node-resolve';
import glslify from 'rollup-plugin-glslify';
import copy from 'rollup-plugin-copy';
import alias from '@rollup/plugin-alias';

export default {
  input: [
    'src/bootstrap.js',
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
    format: 'es',
    preserveModules: true,
    preserveModulesRoot: 'src',
    entryFileNames: '[name].js'
  },
  plugins: [
    alias( {
      entries: [
        { find: 'three', replacement: 'super-three' },
        { find: 'three/examples/jsm', replacement: 'super-three/examples/jsm' }
      ]
    } ),
    resolve( {
      browser: true,
      preferBuiltins: false
    } ),
    glslify(),
    copy( {
      targets: [
        {
          src: 'node_modules/peerjs/dist/peerjs.min.js',
          dest: 'public/assets/js/libs'
        },
        {
          src: 'node_modules/@ar-js-org/ar.js/aframe/build/aframe-ar.js',
          dest: 'public/assets/js/libs'
        }
      ]
    } )
  ]
};