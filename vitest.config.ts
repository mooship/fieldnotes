import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "astro:content": fileURLToPath(
        new URL("src/__mocks__/astro-content.ts", import.meta.url)
      ),
    },
  },
  test: {
    clearMocks: true,
    environment: "happy-dom",
  },
});
