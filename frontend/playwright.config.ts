import { defineConfig, devices } from "@playwright/test";

/**
 * Testes de ponta a ponta (navegador real). Sobem o app Next de PRODUÇÃO (`next start`, exige
 * `npm run build` antes) e um backend simulado (`e2e/mock-backend.mjs`), então não precisam de
 * Laravel nem de banco. Rodar: `npm run build && npm run e2e`.
 */
const PORTA_APP = 3100;
const PORTA_BACKEND = 4010;
const URL_APP = `http://127.0.0.1:${PORTA_APP}`;

// Opcional: usar um Chromium já instalado (ambientes sem acesso ao download do Playwright).
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;
const args = process.env.PW_CHROMIUM_ARGS ? process.env.PW_CHROMIUM_ARGS.split(" ") : undefined;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  // O backend simulado guarda o registro das requisições: execução serial mantém os testes determinísticos.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  timeout: 30_000,
  expect: { timeout: 7_000 },
  use: {
    baseURL: URL_APP,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: { executablePath, args },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node e2e/mock-backend.mjs",
      url: `http://127.0.0.1:${PORTA_BACKEND}/__requests`,
      reuseExistingServer: !process.env.CI,
      env: { MOCK_BACKEND_PORT: String(PORTA_BACKEND) },
    },
    {
      command: `npx next start -p ${PORTA_APP} -H 127.0.0.1`,
      url: `${URL_APP}/admin`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        BACKEND_URL: `http://127.0.0.1:${PORTA_BACKEND}/api`,
        FRONTEND_URL: URL_APP,
        NEXT_TELEMETRY_DISABLED: "1",
      },
    },
  ],
});
