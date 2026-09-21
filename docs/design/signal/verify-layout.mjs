import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const base = process.env.SIGNAL_PREVIEW_URL || "http://127.0.0.1:4173";
const root = fileURLToPath(new URL("./implemented/", import.meta.url));
await mkdir(root, { recursive: true });
const browser = process.env.SIGNAL_BROWSER_URL || "http://127.0.0.1:43485";
const connection = await (await fetch(browser + "/json/version")).json();
const ws = new WebSocket(connection.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let sessionId;
let id = 0;
const pending = new Map();
let authed = false;
const errors = [];
const endpoints = new Set();
const user = {
  id: 777,
  username: "design-preview",
  display_name: "Design Preview",
  role: 1,
  quota: 640000000,
  used_quota: 240000,
  request_count: 520,
  group: "default",
};
const now = Math.floor(Date.now() / 1000);
const day = new Date();
day.setHours(0, 0, 0, 0);
const start = Math.floor(day.getTime() / 1000);
const models = ["deepseek-chat", "qwen3-235b-a22b", "glm-4.5", "doubao-seed"];
const data = Array.from({ length: new Date().getHours() + 1 }, (_, hour) =>
  models.map((model_name, i) => ({
    created_at: start + hour * 3600,
    model_name,
    count: Math.round((hour + 1) * (4 - i) * 13),
    token_used: (hour + 1) * (4 - i) * 6800,
    quota: (hour + 1) * (4 - i) * 80,
  })),
).flat();
const logs = models.map((model_name, i) => ({
  id: i + 1,
  user_id: 777,
  created_at: now - i * 63,
  type: 2,
  content: "",
  model_name,
  token_name: "preview-app",
  quota: Math.round(4200 / (i + 1)),
  prompt_tokens: 842 * (i + 1),
  completion_tokens: 103 * (i + 1),
}));
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const n = ++id;
    pending.set(n, { resolve, reject });
    ws.send(
      JSON.stringify({
        id: n,
        method,
        params,
        ...(sessionId && !method.startsWith("Target.") ? { sessionId } : {}),
      }),
    );
  });
}
ws.addEventListener("message", async (e) => {
  const m = JSON.parse(e.data);
  if (m.id) {
    const p = pending.get(m.id);
    pending.delete(m.id);
    m.error ? p.reject(m.error) : p.resolve(m.result);
    return;
  }
  if (m.method === "Runtime.exceptionThrown")
    errors.push(
      m.params.exceptionDetails.text +
        " " +
        JSON.stringify(m.params.exceptionDetails.exception?.description),
    );
  if (m.method === "Fetch.requestPaused") {
    const p = m.params,
      path = new URL(p.request.url).pathname;
    endpoints.add(path);
    let result = { success: true, data: [] },
      status = 200;
    if (path === "/api/status")
      result = {
        success: true,
        data: {
          system_name: "Token Center",
          logo: "",
          version: "preview",
          docs_link: "https://docs.newapi.pro",
          display_in_currency: true,
          quota_per_unit: 500000,
          display_token_stat_enabled: true,
          HeaderNavModules: JSON.stringify({
            home: true,
            console: true,
            pricing: true,
            rankings: false,
            docs: true,
            about: false,
          }),
        },
      };
    else if (path === "/api/setup") result = { success: true, data: { status: true } };
    else if (path === "/api/user/auth/refresh") {
      if (authed)
        result = {
          success: true,
          data: {
            access_token: "browser-fixture-only",
            token_type: "Bearer",
            access_expires_at: now + 7200,
            user,
            session: {
              sid: "browser-fixture-session",
              current: true,
              login_method: "password",
              ip: "127.0.0.1",
              user_agent: "test",
              created_at: now,
              last_active_at: now,
              expires_at: now + 7200,
            },
          },
        };
      else {
        status = 401;
        result = { success: false, message: "Not signed in" };
      }
    } else if (path === "/api/user/self") result = { success: true, data: user };
    else if (path === "/api/home_page_content" || path === "/api/notice")
      result = { success: true, data: "" };
    else if (path === "/api/data/self") result = { success: true, data };
    else if (path === "/api/log/self")
      result = { success: true, data: { items: logs, total: logs.length, page: 1, page_size: 5 } };
    else if (path === "/api/user/models") result = { success: true, data: models };
    else if (path === "/api/token/")
      result = {
        success: true,
        data: { items: [{ id: 1, name: "preview-app", key: "masked", status: 1 }], total: 1 },
      };
    await send("Fetch.fulfillRequest", {
      requestId: p.requestId,
      responseCode: status,
      responseHeaders: [{ name: "Content-Type", value: "application/json" }],
      body: Buffer.from(JSON.stringify(result)).toString("base64"),
    });
  }
});
async function evaluate(expression) {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
  return r.result.value;
}
async function until(expression) {
  for (let n = 0; n < 160; n++) {
    try {
      if (await evaluate(expression)) return;
    } catch (error) {
      if (
        !/Inspected target navigated|Execution context was destroyed|Cannot find context/.test(
          error.message || "",
        )
      )
        throw error;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("Timeout: " + expression);
}
const context = await send("Target.createBrowserContext");
const target = await send("Target.createTarget", {
  url: "about:blank",
  browserContextId: context.browserContextId,
});
sessionId = (await send("Target.attachToTarget", { targetId: target.targetId, flatten: true }))
  .sessionId;
await send("Network.enable");
await send("Runtime.enable");
await send("Page.enable");
await send("Fetch.enable", { patterns: [{ urlPattern: "*/api/*" }] });
await send("Page.addScriptToEvaluateOnNewDocument", {
  source:
    "localStorage.setItem('i18nextLng','zh');localStorage.setItem('dashboard_overview_setup_guide_expanded','collapsed');",
});
for (const [name, path] of [
  ["home", "/"],
  ["dashboard", "/dashboard/overview"],
]) {
  authed = name === "dashboard";
  for (const [mode, width, height] of [
    ["desktop", 1440, 1050],
    ["mobile", 390, 844],
  ]) {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send("Page.navigate", { url: base + path });
    await until(
      name === "home"
        ? "!!document.querySelector('.signal-network')"
        : "!!document.querySelector('.signal-metrics')&&document.body.innerText.includes('preview-app')",
    );
    await evaluate("document.fonts.ready");
    await evaluate(
      "Promise.all(document.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})))",
    );
    const check = await evaluate(
      `JSON.stringify({width:innerWidth,scroll:document.documentElement.scrollWidth,bg:getComputedStyle(document.body).getPropertyValue('--background').trim(),primary:getComputedStyle(document.body).getPropertyValue('--primary').trim(),logo:[...document.images].filter(i=>i.src.includes('logo.svg')).every(i=>i.complete&&i.naturalWidth>0),hasLogo:[...document.images].some(i=>i.src.includes('logo.svg')),overflow:[...document.querySelectorAll('main, .signal-metrics, [data-slot="card"]')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>e.className)})`,
    );
    console.log(name, mode, check);
    const checked = JSON.parse(check);
    if (checked.scroll > width || checked.overflow.length || !checked.hasLogo || !checked.logo)
      throw new Error("Layout/image check failed");
    const layout = await send("Page.getLayoutMetrics");
    const png = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
      clip: { x: 0, y: 0, width, height: layout.cssContentSize.height, scale: 1 },
    });
    await writeFile(`${root}/${name}-${mode}.png`, Buffer.from(png.data, "base64"));
    if (name === "home" && mode === "mobile") {
      await evaluate("document.querySelector('[aria-controls=public-mobile-navigation]').click()");
      await until(
        "document.querySelector('[aria-controls=public-mobile-navigation]').getAttribute('aria-expanded')==='true'",
      );
      await send("Input.dispatchKeyEvent", {
        type: "keyDown",
        key: "Escape",
        code: "Escape",
        windowsVirtualKeyCode: 27,
      });
      await send("Input.dispatchKeyEvent", {
        type: "keyUp",
        key: "Escape",
        code: "Escape",
        windowsVirtualKeyCode: 27,
      });
      await until(
        "document.querySelector('[aria-controls=public-mobile-navigation]').getAttribute('aria-expanded')==='false'",
      );
      if (!(await evaluate("document.querySelector('#public-mobile-navigation').inert")))
        throw new Error("Closed menu is not inert");
    }
    if (name === "dashboard" && mode === "mobile") {
      if (
        !(await evaluate(
          "(()=>{const region=document.querySelector('[role=region][tabindex]');const table=region?.querySelector('[data-slot=table-container]');if(!table)return false;table.scrollLeft=100;return table.scrollLeft>0})()",
        ))
      )
        throw new Error("Mobile log table cannot scroll");
    }
    if (name === "dashboard") {
      await send("Page.bringToFront");
      await evaluate(
        "[...document.querySelectorAll('summary')].find(e=>e.textContent.includes('每小时')).focus()",
      );
      await send("Input.dispatchKeyEvent", {
        type: "keyDown",
        key: "Enter",
        code: "Enter",
        text: "\r",
        unmodifiedText: "\r",
        windowsVirtualKeyCode: 13,
      });
      await send("Input.dispatchKeyEvent", {
        type: "keyUp",
        key: "Enter",
        code: "Enter",
        windowsVirtualKeyCode: 13,
      });
      if (
        !(await evaluate(
          "[...document.querySelectorAll('summary')].find(e=>e.textContent.includes('每小时')).parentElement.open",
        ))
      )
        throw new Error("Keyboard details failed");
    }
  }
  for (const width of [320, 768]) {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    const fits = await evaluate(
      "document.documentElement.scrollWidth<=innerWidth&&[...document.querySelectorAll('header,main,.signal-metrics')].every(e=>e.getBoundingClientRect().right<=innerWidth+1)",
    );
    if (!fits) throw new Error(`${name} overflows at ${width}px`);
    console.log(name, width, "layout fits");
  }
}
await evaluate("document.cookie='vite-ui-theme=light; path=/'");
await send("Page.reload");
await until(
  "document.documentElement.classList.contains('light')&&!!document.querySelector('.signal-metrics')",
);
console.log(
  "light theme",
  await evaluate("getComputedStyle(document.body).getPropertyValue('--background').trim()"),
);
console.log("runtime errors", JSON.stringify(errors));
console.log("API fixtures", JSON.stringify([...endpoints]));
if (errors.length) throw new Error("Runtime exceptions");
await send("Target.disposeBrowserContext", { browserContextId: context.browserContextId });
ws.close();
