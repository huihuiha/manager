import { terser } from 'rollup-plugin-terser';

module.exports = {
  input: 'packages/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'es',
    plugins: [terser()],
  },
};
