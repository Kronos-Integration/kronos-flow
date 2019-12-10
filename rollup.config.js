import acornClassFields from 'acorn-class-fields';
import builtins from "builtin-modules";
import json from "rollup-plugin-json";
import cleanup from 'rollup-plugin-cleanup';
import executable from 'rollup-plugin-executable';
import commonjs from 'rollup-plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
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
