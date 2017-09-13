export default {
  input: 'tests/flow-test.js',
  output: {
    file: 'build/test-bundle.js',
    format: 'cjs',
    sourcemap: true
  },
  external: ['ava', 'kronos-step'],
  plugins: []
};
