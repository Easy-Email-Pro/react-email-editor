import { defineConfig } from "vite";
import path from "path";
import svgr from "vite-plugin-svgr";
import monacoEditorPlugin from "vite-plugin-monaco-editor";
import dotenv from "dotenv";

const env = dotenv.config();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svgr({ exportAsDefault: true }) as any,
    monacoEditorPlugin({}) as any,
    // sentryVitePlugin({
    //   authToken: process.env.SENTRY_AUTH_TOKEN,
    //   org: "mao-wa",
    //   project: "b-react",
    // }),
  ].filter(Boolean) as any,
  define: {
    "process.env.UNSPLASH_CLIENT_ID": JSON.stringify(
      process.env.UNSPLASH_CLIENT_ID,
    ),
    "process.env.CLIENT_ID": JSON.stringify(
      env.parsed?.CLIENT_ID || process.env.CLIENT_ID,
    ),
  },
  build: {
    emptyOutDir: true,
    minify: false,
    manifest: false,
    sourcemap: false,
  },

  resolve: {
    alias: {
      "mjml-browser": path.resolve("./node_modules/mjml-browser"),
      "html-minifier-terser": path.resolve(
        "./node_modules/html-minifier-terser/dist/htmlminifier.esm.bundle.js",
      ),
      "@": path.resolve("src"),
    },
  },
  optimizeDeps: {
    needsInterop: ["velocityjs"],
  },
});
