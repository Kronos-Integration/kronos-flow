export default {
  input: 'tests/flow-test.js',
  output: {
    file: 'build/flow-test.js',
    format: 'cjs',
    sourcemap: true
  },
  external: ['ava', 'kronos-step', 'registry-mixin', 'kronos-service']
};
