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
  external: ["firebase-admin", "firebase"],
  noExternal: [
    "@techsprint/firebase",
    "@techsprint/types",
    "@techsprint/utils",
    "@techsprint/validation",
  ],
  tsconfig: "./tsconfig.json",
});
