import resolve from '@rollup/plugin-node-resolve';
import glslify from 'rollup-plugin-glslify';

export default {
  input: [
    'src/main.js',
    'src/landscape.js'
  ],
  output: {
    dir: 'public/assets/js/',
    preserveModules: true,
    preserveModulesRoot: 'src'
  },
  plugins: [glslify(), resolve()]
};