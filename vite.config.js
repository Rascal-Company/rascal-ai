import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
