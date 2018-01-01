import pkg from './package.json';

export default {
  input: pkg.module,
  output: {
    file: pkg.main,
    format: 'cjs'
  },
  external: [
    'kronos-service',
    'kronos-step',
    'model-attributes',
    'registry-mixin'
  ]
};
