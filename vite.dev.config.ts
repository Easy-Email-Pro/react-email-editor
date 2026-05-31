import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import svgr from "vite-plugin-svgr";
import monacoEditorPlugin from "vite-plugin-monaco-editor";
// https://vitejs.dev/config/
export default defineConfig({
  define: {
    "process.env.UNSPLASH_CLIENT_ID": JSON.stringify(
      process.env.UNSPLASH_CLIENT_ID,
    ),
    "process.env.CLIENT_ID": JSON.stringify(process.env.CLIENT_ID),
  },
  plugins: [
    react(),
    svgr({ exportAsDefault: true }) as any,
    monacoEditorPlugin({}) as any,
  ] as any,
  build: {
    emptyOutDir: true,
    minify: false,
    manifest: false,
    sourcemap: false,
  },

  optimizeDeps: {
    // Do not pre-bundle mjml2amp so its import of "easy-email-pro-core" is resolved
    // at runtime via resolve.alias → same workspace package as the app (single singleton)
    exclude: ["mjml2amp"],
  },

  resolve: {
    alias: {
      "mjml-browser": path.resolve("./node_modules/mjml-browser"),
      mjml2amp: path.resolve("./node_modules/mjml2amp"),
      "html-minifier-terser": path.resolve(
        "./node_modules/html-minifier-terser/dist/htmlminifier.esm.bundle.js",
      ),
      slate: path.resolve("./node_modules/slate"),
      react: path.resolve("./node_modules/react"),
      // "react-dom": path.resolve("./node_modules/react-dom"),
      // "react-dom/sever": path.resolve("./node_modules/react-dom/sever"),
      "slate-react": path.resolve("./node_modules/slate-react"),
      "easy-email-pro-theme/lib/style.css": path.resolve(
        __dirname,
        "package.json",
      ), // 防止404 报错
      "easy-email-pro-modern/lib/style.css": path.resolve(
        __dirname,
        "package.json",
      ), // 防止404 报错
      "easy-email-pro-asset-manager/lib/style.css": path.resolve(
        __dirname,
        "package.json",
      ), // 防止404 报错

      "easy-email-pro-localization": path.resolve(
        __dirname,
        "../packages/easy-email-pro-localization",
      ),
      "easy-email-pro-core": path.resolve(
        __dirname,
        "../packages/easy-email-pro-core/src/index",
      ),
      "easy-email-pro-kit": path.resolve(
        __dirname,
        "../packages/easy-email-pro-kit/src",
      ),
      "easy-email-pro-plugins": path.resolve(
        __dirname,
        "../packages/easy-email-pro-plugins/src",
      ),
      "easy-email-pro-migrations": path.resolve(
        __dirname,
        "../packages/easy-email-pro-migrations/src",
      ),
      "easy-email-pro-asset-manager": path.resolve(
        __dirname,
        "../packages/easy-email-pro-asset-manager/src",
      ),
      "easy-email-pro-editor": path.resolve(
        __dirname,
        "../packages/easy-email-pro-editor/src",
      ),

      "@easy-email-pro-editor": path.resolve(
        __dirname,
        "../packages/easy-email-pro-editor/src",
      ),
      "@easy-email-pro-core": path.resolve(
        __dirname,
        "../packages/easy-email-pro-core/src",
      ),
      "@easy-email-pro-kit": path.resolve(
        __dirname,
        "../packages/easy-email-pro-kit/src",
      ),
      "@easy-email-pro-plugins": path.resolve(
        __dirname,
        "../packages/easy-email-pro-plugins/src",
      ),
      "@easy-email-pro-asset-manager": path.resolve(
        __dirname,
        "../packages/easy-email-pro-asset-manager/src",
      ),
      "easy-email-pro-theme": path.resolve(
        __dirname,
        "../packages/easy-email-pro-theme/src",
      ),
      "@easy-email-pro-theme": path.resolve(
        __dirname,
        "../packages/easy-email-pro-theme/src",
      ),
      "easy-email-pro-modern": path.resolve(
        __dirname,
        "../packages/easy-email-pro-modern/src",
      ),
      "@easy-email-pro-modern": path.resolve(
        __dirname,
        "../packages/easy-email-pro-modern/src",
      ),
      "@": path.resolve("src"),
    },
  },
});
