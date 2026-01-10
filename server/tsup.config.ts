import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  dts: true,
  splitting: false,
  sourcemap: false,
  clean: true,
  bundle: true,
  minify: true,
  external: [],
  tsconfig: "./tsconfig.json",
});
