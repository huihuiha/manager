import { terser } from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';

module.exports = {
  input: 'src/index.ts',
  output: [
    {
      format: 'cjs',
      file: 'lib/manager.cjs.js',
    },
    {
      format: 'es',
      file: 'lib/manager.esm.js',
    },
    {
      format: 'es',
      file: 'lib/manager.esm.mini.js',
      plugins: [terser()],
    },
    {
      format: 'cjs',
      file: 'lib/manager.cjs.mini.js',
      plugins: [terser()],
    },
  ],
  plugins: [typescript()],
};
