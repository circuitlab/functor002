import resolve from '@rollup/plugin-node-resolve';
import glslify from 'rollup-plugin-glslify';

export default {
  input: [
    'src/main.js',
    'src/landscape.js',
    'src/pa.js',
    'src/atmosphere.js',
    'src/pigeon-functor.js',
    'src/pigeon-receiver.js',
    'src/aframe-emoji-boid.js',
    'src/emoji-starter.js',
    'src/pigeon-functor-local.js',
    'src/pigeon-receiver-local.js',
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