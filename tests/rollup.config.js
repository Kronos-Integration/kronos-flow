import multiEntry from 'rollup-plugin-multi-entry';

export default {
  input: 'tests/**/*-test.js',
  external: [
    'ava',
    'kronos-step',
    'registry-mixin',
    'kronos-service',
    'model-attributes'
  ],
  plugins: [multiEntry()],
  output: {
    file: 'build/bundle-test.js',
    format: 'cjs',
    sourcemap: true
  }
};
