export default {
  input: 'src/index.js',
  output: {
    file: 'dist/index.js',
    format: 'cjs'
  },
  external: ['lodash.escape', 'lodash.unescape', 'lodash.merge', 'fs', 'util', 'path']
};