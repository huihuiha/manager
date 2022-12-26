import { terser } from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';

module.exports = {
  input: 'packages/index.ts',
  output: [
    {
      format: 'cjs',
      file: 'lib/manager.cjs.js',
    },
    {
      format: 'es',
      file: 'lib/manager.esm.js',
    },
  ],
  plugins: [typescript(), terser()],
};
