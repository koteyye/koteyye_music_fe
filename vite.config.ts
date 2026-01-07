import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const keyPath = path.resolve(__dirname, 'localhost-key.pem');
  const certPath = path.resolve(__dirname, 'localhost.pem');
  
  let httpsConfig = undefined;
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      httpsConfig = {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
      };
  }

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: true,
      port: 3000,
      https: httpsConfig,
      proxy: {
        "/api": {
          target: env.VITE_PROXY_TARGET || "http://localhost:8080",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
