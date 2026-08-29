import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      /*
       * astro:content is a virtual module that only resolves inside the
       * Astro runtime; point it at a stub so files that import it can be
       * unit-tested under Vitest.
       */
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
