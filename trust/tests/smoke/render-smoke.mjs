// Render smoke test: builds nothing, changes nothing. It starts the already-built
// app against the fixture server, opens every page on a phone-sized and a
// desktop-sized screen, and fails on: a non-200 page, the error screen, a browser
// console error, or content wider than the screen.
//
//   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54399 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=smoke npx next build
//   node tests/smoke/render-smoke.mjs [screenshot-dir]
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { IDS, startFakeSupabase, USER } from "./fake-supabase.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const APP_PORT = 3199;
const API_PORT = 54399;
const ORIGIN = `http://127.0.0.1:${APP_PORT}`;
const shots = process.argv[2];
if (shots) mkdirSync(shots, { recursive: true });

const b64url = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const accessToken = `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url({ sub: USER.id, role: "authenticated", email: USER.email, exp: 4102444800 })}.smoke`;
const session = { access_token: accessToken, token_type: "bearer", expires_in: 3600, expires_at: 4102444800, refresh_token: "smoke", user: USER };
const cookie = { name: "sb-127-auth-token", value: `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`, url: ORIGIN };

const SIGNED_IN = ["/app", "/app/contracts", "/app/contracts/new", `/app/contracts/${IDS.CONTRACT}`, "/app/deadlines", "/app/obligations", "/app/reviews", "/app/team", "/app/audit", "/app/billing", "/onboarding", `/invite/${"ab".repeat(32)}`];
const SIGNED_OUT = ["/", "/login", "/signup"];
const VIEWPORTS = [{ name: "phone", width: 390, height: 844 }, { name: "desktop", width: 1280, height: 900 }];

const fake = await startFakeSupabase(API_PORT);
// Started with node directly (not through npx) so that stopping it stops the server itself.
const app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(APP_PORT), "-H", "127.0.0.1"], {
  env: { ...process.env, SUPABASE_SECRET_KEY: "smoke", ANTHROPIC_API_KEY: "smoke", NEXT_TELEMETRY_DISABLED: "1" },
  stdio: ["ignore", "pipe", "pipe"],
});
let serverLog = "";
app.stdout.on("data", (chunk) => (serverLog += chunk));
app.stderr.on("data", (chunk) => (serverLog += chunk));

const failures = [];
let checked = 0;
try {
  for (let attempt = 0; ; attempt++) {
    try { if ((await fetch(`${ORIGIN}/login`)).ok) break; } catch { /* not up yet */ }
    if (attempt > 60) throw new Error(`app did not start:\n${serverLog}`);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  const browser = await chromium.launch();
  for (const viewport of VIEWPORTS) {
    for (const [paths, signedIn] of [[SIGNED_OUT, false], [SIGNED_IN, true]]) {
      const context = await browser.newContext({ viewport, deviceScaleFactor: shots ? 2 : 1 });
      if (signedIn) await context.addCookies([cookie]);
      const page = await context.newPage();
      const consoleErrors = [];
      page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
      page.on("pageerror", (error) => consoleErrors.push(String(error)));
      for (const path of paths) {
        consoleErrors.length = 0;
        const response = await page.goto(ORIGIN + path, { waitUntil: "networkidle" });
        const label = `${viewport.name} ${path}`;
        checked++;
        if (response.status() !== 200) failures.push(`${label}: HTTP ${response.status()}`);
        if (new URL(page.url()).pathname !== path) failures.push(`${label}: redirected to ${page.url()}`);
        if (await page.getByText("Something went wrong").count()) failures.push(`${label}: error screen shown`);
        if ((await page.locator("h1").count()) !== 1) failures.push(`${label}: expected exactly one h1`);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (overflow > 1) failures.push(`${label}: content is ${overflow}px wider than the screen`);
        const unlabelled = await page.evaluate(() => [...document.querySelectorAll("input:not([type=hidden]), select, textarea")]
          .filter((element) => !element.labels?.length && !element.getAttribute("aria-label")).length);
        if (unlabelled) failures.push(`${label}: ${unlabelled} form field(s) without a label`);
        if (consoleErrors.length) failures.push(`${label}: console: ${consoleErrors.join(" | ")}`);
        if (shots) await page.screenshot({ path: `${shots}/${viewport.name}${path.replace(/\//g, "_").slice(0, 40) || "_home"}.png`, fullPage: true });
      }
      await context.close();
    }
  }
  // Signed-out visitors must not reach the application or its API.
  const anonymous = await browser.newContext();
  const page = await anonymous.newPage();
  await page.goto(`${ORIGIN}/app/contracts`);
  if (new URL(page.url()).pathname !== "/login") failures.push("signed-out visitor was not sent to /login");
  const api = await anonymous.request.post(`${ORIGIN}/api/contracts/${IDS.CONTRACT}/analyze`, { data: { documentId: IDS.CONTRACT } });
  if (api.status() !== 401) failures.push(`analysis API answered ${api.status()} to a signed-out caller, expected 401`);
  const headers = (await anonymous.request.get(`${ORIGIN}/login`)).headers();
  for (const header of ["x-frame-options", "x-content-type-options", "strict-transport-security", "referrer-policy"]) {
    if (!headers[header]) failures.push(`missing security header ${header}`);
  }
  if (headers["x-powered-by"]) failures.push("x-powered-by header is exposed");
  await browser.close();
} finally {
  app.kill("SIGTERM");
  fake.close();
}

if (failures.length) {
  console.error(`render smoke: ${failures.length} problem(s)\n- ${failures.join("\n- ")}`);
  if (/error/i.test(serverLog)) console.error(`\nserver log:\n${serverLog.slice(-3000)}`);
  process.exit(1);
}
console.log(`render smoke: ${checked} page renders checked, no problems`);
