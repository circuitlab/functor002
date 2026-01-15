import resolve from '@rollup/plugin-node-resolve';
import glslify from 'rollup-plugin-glslify';

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
  plugins: [glslify(), resolve()]
};