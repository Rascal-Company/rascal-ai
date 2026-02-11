import { defineConfig } from "vite";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function versionJsonPlugin() {
  let buildHash;
  let outDir;

  return {
    name: "version-json",
    config(_, { command }) {
      if (command === "build") {
        buildHash = Date.now().toString(36);
        return {
          define: {
            __BUILD_HASH__: JSON.stringify(buildHash),
          },
        };
      }
    },
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      if (buildHash && outDir) {
        writeFileSync(
          resolve(outDir, "version.json"),
          JSON.stringify({ buildHash }),
        );
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __BUILD_HASH__: JSON.stringify("dev"),
  },
  plugins: [react(), tailwindcss(), versionJsonPlugin()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    // Pre-commit (ja joissain ympäristöissä) Vitestin worker-pooli (tinypool)
    // voi kaatua "Maximum call stack size exceeded" -virheeseen.
    // Ajetaan testit yksisäikeisesti vakauden vuoksi.
    pool: "threads",
    fileParallelism: false,
    poolOptions: {
      threads: {
        // Aja kaikki samassa workerissa ja ilman eristystä,
        // jotta vältetään tinypool/worker-teardown -bugit joissain Node-versioissa.
        singleThread: true,
        isolate: false,
        minThreads: 1,
        maxThreads: 1,
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "src/test/", "*.config.js", "dist/"],
    },
  },
});
