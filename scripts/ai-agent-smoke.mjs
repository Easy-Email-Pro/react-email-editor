import assert from "node:assert/strict";
import puppeteer from "puppeteer";

const targetUrl = process.env.AI_AGENT_E2E_URL || "http://localhost:5173/full";
const agentEndpoint = "https://agent-api.beacas.com/v1/easy-email/respond-stream";
const userMessage = "AI Agent smoke test message";
const assistantReply = "AI smoke response from mocked stream.";

function sseEvent(seq, type, payload) {
  return [
    `event: ${type}`,
    `data: ${JSON.stringify({
      seq,
      type,
      payload,
      createdAt: new Date().toISOString(),
    })}`,
    "",
  ].join("\n");
}

function mockedAgentStream() {
  return [
    sseEvent(1, "status", { status: "RUNNING" }),
    sseEvent(2, "easy_email_answer", { answer: assistantReply }),
    sseEvent(3, "status", { status: "FINISHED", exitCode: 0 }),
    "",
  ].join("\n");
}

async function clickText(page, text) {
  await page.waitForFunction(
    (value) =>
      Array.from(document.querySelectorAll("button, [role='tab'], .arco-tabs-header-title, div, span"))
        .some((element) => element.textContent?.trim() === value),
    {},
    text,
  );
  const clicked = await page.evaluate((value) => {
    const element = Array.from(
      document.querySelectorAll("button, [role='tab'], .arco-tabs-header-title, div, span"),
    ).find((item) => item.textContent?.trim() === value);
    if (!element) return false;
    (element instanceof HTMLElement ? element : element.parentElement)?.click();
    return true;
  }, text);
  assert.equal(clicked, true, `Could not click text: ${text}`);
}

async function dispatchComposingEnter(page, selector) {
  await page.$eval(selector, (element) => {
    const event = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
      isComposing: true,
    });
    element.dispatchEvent(event);
  });
}

async function main() {
  const capturedAgentRequests = [];
  const browser = await puppeteer.launch({
    headless: process.env.HEADLESS === "false" ? false : "new",
    defaultViewport: { width: 1440, height: 1000 },
  });

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(45_000);
    page.on("console", (message) => {
      if (message.type() === "error") {
        console.error(`[browser:${message.type()}] ${message.text()}`);
      }
    });
    page.on("pageerror", (error) => {
      console.error("[pageerror]", error.message);
    });

    await page.evaluateOnNewDocument(() => {
      localStorage.setItem("modern-theme-promo-shown", "true");
      Object.keys(localStorage)
        .filter((key) => key.startsWith("easy-email-pro:demo-ai-agent"))
        .forEach((key) => localStorage.removeItem(key));
    });

    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (request.url() === agentEndpoint) {
        const body = request.postData() || "";
        if (!body) {
          request.respond({
            status: 204,
            headers: {
              "access-control-allow-headers": "content-type",
              "access-control-allow-methods": "POST, OPTIONS",
              "access-control-allow-origin": "*",
            },
            body: "",
          });
          return;
        }
        capturedAgentRequests.push(JSON.parse(body));
        request.respond({
          status: 200,
          headers: {
            "access-control-allow-origin": "*",
            "cache-control": "no-cache",
            "content-type": "text/event-stream; charset=utf-8",
          },
          body: mockedAgentStream(),
        });
        return;
      }
      request.continue();
    });

    await page.goto(targetUrl, { waitUntil: "networkidle2" });
    await clickText(page, "Agent");

    const textareaSelector = "textarea[placeholder*='Tell AI']";
    await page.waitForSelector(textareaSelector, { visible: true });
    await page.click(textareaSelector);
    await page.type(textareaSelector, userMessage);

    await dispatchComposingEnter(page, textareaSelector);
    await new Promise((resolve) => setTimeout(resolve, 300));
    assert.equal(
      capturedAgentRequests.length,
      0,
      "IME composing Enter should not send the AI Agent request",
    );

    await page.click(".eep-ai-agent__send:not(:disabled)");
    await page.waitForFunction(
      (reply) => document.body.innerText.includes(reply),
      {},
      assistantReply,
    );

    assert.equal(capturedAgentRequests.length, 1, "AI Agent should send one request");
    const request = capturedAgentRequests[0];
    assert.equal(request.prompt?.text, userMessage);
    assert(request.template, "AI Agent request should include the template");
    assert(
      Object.prototype.hasOwnProperty.call(request, "editorContext"),
      "AI Agent request should include editorContext",
    );

    console.log("AI Agent smoke test passed");
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
