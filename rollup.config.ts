import { defineConfig } from 'rollup';
import typescript from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import clear from 'rollup-plugin-clear';
import json from '@rollup/plugin-json';

export default defineConfig({
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'cjs',
    chunkFileNames: '[name].js'
  },

  plugins: [
    json(),
    nodeResolve(),
    commonjs(),
    clear({ targets: ['dist'] }),
    typescript({
      tsconfig: 'tsconfig.json',
    }),
  ]
});