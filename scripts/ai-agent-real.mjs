import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import puppeteer from "puppeteer";

const targetUrl = process.env.AI_AGENT_E2E_URL || "http://localhost:5173/full";
const targetImageUrl =
  process.env.AI_AGENT_TARGET_IMAGE_URL ||
  "https://picsum.photos/seed/easy-email-ai-test/600/400";
const targetLinkUrl =
  process.env.AI_AGENT_TARGET_LINK_URL ||
  "https://example.com/easy-email-agent-link-test";
const templatePollTimeout = Number.parseInt(
  process.env.AI_AGENT_TEMPLATE_TIMEOUT || "90000",
  10,
);
const brandColor = "#7C3AED";
const pinkThemeColor = "#EC4899";
const headlineText = "AI Agent Test Headline";
const skipImageGeneration = process.env.SKIP_IMAGE_GENERATION === "true";
const pauseOnDone = process.env.PAUSE_ON_DONE === "true";
const slowMo = Number.parseInt(process.env.SLOWMO || "0", 10) || 0;
const requestedCases = new Set(
  (process.env.AI_AGENT_CASES || "url,text,color,pink,clarify,ask,image")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean),
);

const snapshotPrefix = "easy-email-pro:demo-ai-agent:v2:ai-agent-snapshot:";
const historyKey = "easy-email-pro:demo-ai-agent:v2:ai-agent-history";
const agentEndpoint = "https://agent-api.beacas.com/v1/easy-email/respond-stream";
const textareaSelector = "textarea[placeholder*='Tell AI']";
const initialTemplate = JSON.parse(
  readFileSync(new URL("../src/examples/Full/template.json", import.meta.url), "utf8"),
);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeColor(value) {
  return String(value || "").trim().toLowerCase();
}

function walk(value, visitor) {
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visitor);
    return;
  }
  if (!value || typeof value !== "object") return;
  visitor(value);
  for (const item of Object.values(value)) walk(item, visitor);
}

function textFromNode(node) {
  if (!node || typeof node !== "object") return "";
  if (Array.isArray(node.children)) {
    return node.children.map(textFromNode).join("");
  }
  return typeof node.text === "string" ? node.text : "";
}

function collectNodes(template) {
  const nodes = [];
  walk(template, (node) => nodes.push(node));
  return nodes;
}

function findImageUrls(template) {
  const urls = [];
  walk(template, (node) => {
    const attributes = node.attributes || {};
    const data = node.data || {};
    for (const key of ["src", "background-url"]) {
      const value = attributes[key] || data[key];
      if (typeof value === "string" && value) urls.push(value);
    }
  });
  return urls;
}

function countValueOccurrences(value, expected) {
  let count = 0;
  walk(value, (node) => {
    if (includesValue(node, expected)) count += 1;
  });
  return count;
}

function findTextNode(template, text) {
  return collectNodes(template)
    .filter((node) => textFromNode(node).includes(text))
    .sort((a, b) => textFromNode(a).length - textFromNode(b).length)[0];
}

function findNodeById(template, id) {
  return collectNodes(template).find((node) => node.id === id) || null;
}

function findImageNodeBySrc(template, src) {
  return collectNodes(template).find((node) => {
    const attributes = node.attributes || {};
    const data = node.data || {};
    return attributes.src === src || attributes["background-url"] === src || data.src === src;
  }) || null;
}

function imageUrlFromNode(node) {
  const attributes = node?.attributes || {};
  const data = node?.data || {};
  return attributes.src || attributes["background-url"] || data.src || data["background-url"] || "";
}

function findLinkValues(node) {
  const links = [];
  walk(node, (item) => {
    const attributes = item.attributes || {};
    const data = item.data || {};
    for (const key of ["href", "url", "link", "link-href"]) {
      const value = attributes[key] || data[key];
      if (typeof value === "string" && value) links.push(value);
    }
  });
  return links;
}

function findTextValues(template) {
  const values = [];
  walk(template, (node) => {
    const text = textFromNode(node);
    if (text) values.push(text);
  });
  return Array.from(new Set(values)).slice(0, 80);
}

function findHrefValues(template) {
  const hrefs = [];
  walk(template, (node) => {
    const attributes = node.attributes || {};
    const data = node.data || {};
    for (const key of ["href", "url", "link", "link-href"]) {
      const value = attributes[key] || data[key];
      if (typeof value === "string" && value) hrefs.push(value);
    }
  });
  return hrefs;
}

function nodeOrDescendantHasAttribute(node, key, expectedValue) {
  let matched = false;
  walk(node, (item) => {
    const attrs = item.attributes || {};
    if (String(attrs[key] || attrs.fontSize || "") === expectedValue) {
      matched = true;
    }
  });
  return matched;
}

function textNodeContainsAll(template, parts) {
  return collectNodes(template).some((node) => {
    const text = textFromNode(node);
    return parts.every((part) => text.includes(part));
  });
}

function includesValue(value, expected) {
  if (typeof value === "string") return value.toLowerCase().includes(expected);
  if (!value || typeof value !== "object") return false;
  return Object.values(value).some((item) => includesValue(item, expected));
}

async function clickText(page, text) {
  await page.waitForFunction(
    (value) =>
      Array.from(
        document.querySelectorAll("button, [role='tab'], .arco-tabs-header-title, div, span"),
      ).some((element) => element.textContent?.trim() === value),
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

async function selectLargestCanvasImage(page) {
  const { frame, frameRect } = await getCanvasFrame(page);
  await frame.waitForFunction(() =>
    Array.from(document.querySelectorAll("img")).some((image) => {
      const rect = image.getBoundingClientRect();
      return image.src && rect.width >= 120 && rect.height >= 120;
    }),
  );
  const candidate = await frame.evaluate(() => {
    const images = Array.from(document.querySelectorAll("img"));
    const image = images
      .map((image, index) => {
        const rect = image.getBoundingClientRect();
        return {
          index,
          src: image.getAttribute("src") || image.currentSrc || image.src,
          area: rect.width * rect.height,
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          width: rect.width,
          height: rect.height,
        };
      })
      .filter(
        (image) =>
          image.src &&
          image.width >= 120 &&
          image.height >= 120 &&
          image.area >= 20_000,
      )
      .sort((a, b) => b.area - a.area)[0];
    if (!image) return null;
    images[image.index].scrollIntoView({ block: "center", inline: "center" });
    const rect = images[image.index].getBoundingClientRect();
    return {
      ...image,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      width: rect.width,
      height: rect.height,
    };
  });
  assert(candidate, "Could not find a large canvas image to select");
  await page.mouse.click(frameRect.x + candidate.x, frameRect.y + candidate.y);
  await page.waitForFunction(
    () => document.querySelector(".eep-ai-agent__selection")?.textContent?.includes("Image"),
    { timeout: 10_000 },
  );
  return candidate.src;
}

async function selectTextByContent(page, text) {
  const { frame, frameRect } = await getCanvasFrame(page);
  const target = await frame.evaluate((value) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let current = walker.nextNode();
    while (current) {
      if (current.textContent?.includes(value)) {
        const element = current.parentElement;
        const rect = element?.getBoundingClientRect();
        if (rect && rect.width > 0 && rect.height > 0) {
          element.scrollIntoView({ block: "center", inline: "center" });
          const nextRect = element.getBoundingClientRect();
          return {
            x: nextRect.left + Math.min(nextRect.width / 2, 80),
            y: nextRect.top + nextRect.height / 2,
          };
        }
      }
      current = walker.nextNode();
    }
    return null;
  }, text);
  assert(target, `Could not find text to select: ${text}`);
  await page.mouse.click(frameRect.x + target.x, frameRect.y + target.y);
  await page.waitForFunction(
    () => Boolean(document.querySelector(".eep-ai-agent__selection")),
    { timeout: 10_000 },
  );
}

async function getCanvasFrame(page) {
  let frame = page.frames().find((item) => item.name() === "easy-email-pro-iframe");
  const deadline = Date.now() + 60_000;
  while (!frame && Date.now() < deadline) {
    await sleep(250);
    frame = page.frames().find((item) => item.name() === "easy-email-pro-iframe");
  }
  assert(frame, "Could not access editor iframe");
  const frameHandle = await frame.frameElement();
  const frameRect = await frameHandle.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
  });
  return { frame, frameRect };
}

async function sendPrompt(page, prompt, timeout = 240_000, options = {}) {
  await page.waitForSelector(textareaSelector, { visible: true });
  await page.click(textareaSelector, { clickCount: 3 });
  await page.keyboard.press("Backspace");
  await page.type(textareaSelector, prompt);
  await page.waitForSelector(".eep-ai-agent__send:not(:disabled)", { visible: true });
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    (value) => document.body.innerText.includes(value),
    { timeout: 10_000 },
    prompt,
  );
  await waitForAgentSettled(page, timeout, options);
}

async function waitForAgentSettled(page, timeout, options = {}) {
  const deadline = Date.now() + timeout;
  let lastBody = "";

  while (Date.now() < deadline) {
    const state = await page.evaluate(() => {
      const pendingAction = document.querySelector(".eep-ai-agent__pending-action");
      const decision = document.querySelector(".eep-ai-agent__decision");
      const decisionChoice = document.querySelector(".eep-ai-agent__decision-choice");
      const working = document.querySelector(".eep-ai-agent__activity.is-working");
      const body = document.body.innerText;
      return {
        hasPendingAction: Boolean(pendingAction),
        hasDecision: Boolean(decision),
        hasDecisionChoice: Boolean(decisionChoice),
        isWorking: Boolean(working),
        failed: body.includes("This request failed"),
        hasGenericDecisionCopy:
          body.includes("More premium") ||
          body.includes("More conversion focused") ||
          body.includes("Cleaner and simpler") ||
          body.includes("Which direction should I use?"),
        body,
      };
    });

    lastBody = state.body;
    if (state.failed) {
      throw new Error(`AI Agent request failed.\n${lastBody.slice(-1200)}`);
    }

    if (state.hasPendingAction) {
      await page.click(".eep-ai-agent__pending-action");
      await page.waitForSelector(".eep-ai-agent__pending-action", {
        hidden: true,
        timeout: 5000,
      }).catch(() => undefined);
      await sleep(1000);
      continue;
    }

    if (state.hasDecision) {
      if (state.hasGenericDecisionCopy) {
        throw new Error(`AI Agent showed generic style-direction clarification.\n${lastBody.slice(-1200)}`);
      }
      if (options.allowDecision) return;
      throw new Error(`AI Agent asked for clarification unexpectedly.\n${lastBody.slice(-1200)}`);
    }

    if (!state.isWorking) {
      await sleep(800);
      const stillWorking = await page.$(".eep-ai-agent__activity.is-working");
      if (!stillWorking) return;
    }

    await sleep(1000);
  }

  throw new Error(`Timed out waiting for AI Agent to finish.\n${lastBody.slice(-1200)}`);
}

async function submitDecisionCustom(page, value, timeout = 240_000) {
  await page.waitForSelector(".eep-ai-agent__decision", { visible: true });
  await page.waitForSelector(".eep-ai-agent__decision-custom input", { visible: true });
  await page.click(".eep-ai-agent__decision-custom input", { clickCount: 3 });
  await page.keyboard.press("Backspace");
  await page.type(".eep-ai-agent__decision-custom input", value);
  await page.waitForSelector(".eep-ai-agent__decision-custom button:not(:disabled)", {
    visible: true,
  });
  await page.click(".eep-ai-agent__decision-custom button");
  await waitForAgentSettled(page, timeout);
}

async function assertTypedClarification(page, expectedText) {
  await page.waitForSelector(".eep-ai-agent__decision", { visible: true });
  await page.waitForSelector(".eep-ai-agent__decision-custom input", { visible: true });
  const state = await page.evaluate(() => {
    const decision = document.querySelector(".eep-ai-agent__decision");
    const body = document.body.innerText;
    return {
      body,
      decisionText: decision?.textContent || "",
      choices: Array.from(document.querySelectorAll(".eep-ai-agent__decision-choice")).map(
        (element) => element.textContent?.trim() || "",
      ),
      hasCustomInput: Boolean(document.querySelector(".eep-ai-agent__decision-custom input")),
    };
  });
  assert(
    state.decisionText.includes(expectedText),
    `Expected typed clarification text "${expectedText}". Decision: ${state.decisionText}. Body: ${state.body.slice(-1200)}`,
  );
  assert.equal(state.hasCustomInput, true, "Expected custom clarification input");
  for (const forbidden of ["More premium", "More conversion focused", "Cleaner and simpler"]) {
    assert(!state.body.includes(forbidden), `Unexpected generic decision copy: ${forbidden}`);
  }
  for (const choice of state.choices) {
    for (const forbidden of ["More premium", "More conversion focused", "Cleaner and simpler"]) {
      assert(!choice.includes(forbidden), `Unexpected generic decision choice: ${choice}`);
    }
  }
}

async function appliedSnapshotCount(page) {
  return page.evaluate(
    (prefix) =>
      Object.keys(localStorage)
        .filter((key) => key.startsWith(prefix))
        .map((key) => {
          try {
            return JSON.parse(localStorage.getItem(key) || "null");
          } catch {
            return null;
          }
        })
        .filter((snapshot) => snapshot?.reason === "after-ai-apply").length,
    snapshotPrefix,
  );
}

async function clearAgentState(page) {
  await page.evaluate((historyStorageKey, snapshotStoragePrefix) => {
    localStorage.setItem("modern-theme-promo-shown", "true");
    localStorage.removeItem(historyStorageKey);
    Object.keys(localStorage)
      .filter((key) => key.startsWith(snapshotStoragePrefix))
      .forEach((key) => localStorage.removeItem(key));
  }, historyKey, snapshotPrefix);
}

async function latestTemplate(page) {
  const result = await page.evaluate((prefix) => {
    const snapshots = Object.keys(localStorage)
      .filter((key) => key.startsWith(prefix))
      .map((key) => {
        try {
          return JSON.parse(localStorage.getItem(key) || "null");
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));
    const applied = snapshots.filter((snapshot) => snapshot.reason === "after-ai-apply");
    const snapshot = applied.at(-1) || snapshots.at(-1) || null;
    return {
      snapshot,
      reasons: snapshots.map((item) => ({
        reason: item.reason,
        summary: item.summary,
        createdAt: item.createdAt,
      })),
    };
  }, snapshotPrefix);
  assert(
    result.snapshot?.template,
    `Could not read latest AI Agent snapshot template. Snapshots: ${JSON.stringify(result.reasons)}`,
  );
  return result.snapshot.template;
}

async function waitForTemplate(page, assertion, timeout = templatePollTimeout) {
  const deadline = Date.now() + timeout;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const template = await latestTemplate(page);
      assertion(template);
      return template;
    } catch (error) {
      lastError = error;
      await sleep(1000);
    }
  }

  throw lastError || new Error("Timed out waiting for template assertion");
}

async function assertTemplate(page, assertion, message) {
  const template = await waitForTemplate(page, assertion);
  console.log(`✓ ${message}`);
  return template;
}

async function assertEndpointAvailable(url, label, options) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new Error(`${label} is not reachable: ${error instanceof Error ? error.message : error}`);
  }

  assert(
    response.ok || response.status === 204,
    `${label} returned ${response.status} ${response.statusText}`,
  );
}

async function main() {
  const browser = await puppeteer.launch({
    headless: process.env.HEADLESS === "false" ? false : "new",
    slowMo,
    defaultViewport:
      process.env.HEADLESS === "false" ? null : { width: 1440, height: 1000 },
    args: process.env.HEADLESS === "false" ? ["--start-fullscreen"] : [],
  });
  const failures = [];

  async function runStep(name, action) {
    console.log(name);
    try {
      await action();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ name, message });
      console.error(`✗ ${name}\n${message}`);
    }
  }

  function shouldRunCase(name) {
    return requestedCases.has(name);
  }

  try {
    await assertEndpointAvailable(targetUrl, "AI Agent demo page");
    await assertEndpointAvailable(agentEndpoint, "AI Agent API", { method: "OPTIONS" });

    const page = await browser.newPage();
    page.setDefaultTimeout(60_000);
    page.on("console", (message) => {
      if (message.type() === "error") {
        console.error(`[browser:${message.type()}] ${message.text()}`);
      }
    });
    page.on("response", (response) => {
      if (response.url() === agentEndpoint) {
        console.log(`AI Agent response: ${response.status()}`);
      }
    });
    page.on("request", (request) => {
      if (request.url() === agentEndpoint) {
        console.log("AI Agent request sent");
      }
    });
    page.on("pageerror", (error) => {
      console.error("[pageerror]", error.message);
    });

    await page.evaluateOnNewDocument((historyStorageKey, snapshotStoragePrefix) => {
      localStorage.setItem("modern-theme-promo-shown", "true");
      localStorage.removeItem(historyStorageKey);
      Object.keys(localStorage)
        .filter((key) => key.startsWith(snapshotStoragePrefix))
        .forEach((key) => localStorage.removeItem(key));
    }, historyKey, snapshotPrefix);

    async function prepareCase() {
      await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
      await clearAgentState(page);
      await page.goto(targetUrl, { waitUntil: "networkidle2" });
      await clickText(page, "Agent");
    }

    if (shouldRunCase("url")) await runStep("Selecting image and replacing its URL...", async () => {
      await prepareCase();
      const selectedImageSrc = await selectLargestCanvasImage(page);
      const selectedImageNode = findImageNodeBySrc(initialTemplate, selectedImageSrc);
      assert(
        selectedImageNode?.id,
        `Could not map selected image back to the template. Selected src: ${selectedImageSrc}`,
      );
      await sendPrompt(
        page,
        `Set the selected image src attribute to exactly ${targetImageUrl}. Do not generate a new image. Do not choose another URL. Do not ask a follow-up question. Do not change anything else.`,
        180_000,
      );
      await assertTemplate(
        page,
        (template) => {
          const urls = findImageUrls(template);
          assert(
            urls.some((url) => url.includes(targetImageUrl)),
            `Expected selected image URL to be replaced. URLs: ${JSON.stringify(urls)}`,
          );
          const updatedNode = findNodeById(template, selectedImageNode.id);
          assert.equal(
            imageUrlFromNode(updatedNode),
            targetImageUrl,
            `Expected selected image block ${selectedImageNode.id} to use target URL. Node: ${JSON.stringify(updatedNode)}`,
          );
        },
        "selected image URL was replaced",
      );
    });

    if (shouldRunCase("text")) await runStep("Updating headline block copy plus font size...", async () => {
      await prepareCase();
      const originalHeadlineNode = findTextNode(initialTemplate, "Timeless pieces,made to stay");
      assert(originalHeadlineNode?.id, "Could not find original headline node in initial template");
      await sendPrompt(
        page,
        `Find the headline text block that currently says "Timeless pieces,made to stay". Change that text block to exactly "${headlineText}" and set its font-size attribute to exactly 42px. Do not ask a follow-up question.`,
        180_000,
      );
      await assertTemplate(
        page,
        (template) => {
          const node = findNodeById(template, originalHeadlineNode.id);
          assert(
            textFromNode(node).includes(headlineText),
            `Expected original headline block ${originalHeadlineNode.id} to contain updated text. Node: ${JSON.stringify(node)}. Texts: ${JSON.stringify(findTextValues(template))}`,
          );
          assert(
            nodeOrDescendantHasAttribute(node, "font-size", "42px"),
            `Expected updated headline node to include font-size 42px: ${JSON.stringify(node)}`,
          );
          assert(
            !textNodeContainsAll(template, ["Timeless", "made to stay"]),
            "Expected original headline copy to be removed",
          );
        },
        "headline block copy and font size were updated",
      );
    });

    if (shouldRunCase("color")) await runStep("Applying global brand color...", async () => {
      await prepareCase();
      const beforeCount = countValueOccurrences(initialTemplate, normalizeColor(brandColor));
      await sendPrompt(
        page,
        `Change the whole email brand color to exactly ${brandColor}. Apply it to buttons and prominent accent colors. Do not ask a follow-up question.`,
        240_000,
      );
      await assertTemplate(
        page,
        (template) => {
          const afterCount = countValueOccurrences(template, normalizeColor(brandColor));
          assert(
            afterCount > beforeCount,
            `Expected ${brandColor} occurrence count to increase. Before: ${beforeCount}, after: ${afterCount}`,
          );
        },
        "global brand color was applied",
      );
    });

    if (shouldRunCase("pink")) await runStep("Applying Chinese pink theme without clarification...", async () => {
      await prepareCase();
      const beforeCount = countValueOccurrences(initialTemplate, normalizeColor(pinkThemeColor));
      await sendPrompt(
        page,
        `改成粉色主题，使用 ${pinkThemeColor} 作为主要品牌色。不要追问，不要展示风格方向选择。`,
        240_000,
      );
      await assertTemplate(
        page,
        (template) => {
          const afterCount = countValueOccurrences(template, normalizeColor(pinkThemeColor));
          assert(
            afterCount > beforeCount,
            `Expected ${pinkThemeColor} occurrence count to increase. Before: ${beforeCount}, after: ${afterCount}`,
          );
        },
        "Chinese pink theme request applied without generic clarification",
      );
    });

    if (shouldRunCase("clarify")) await runStep("Completing a typed link clarification flow...", async () => {
      await prepareCase();
      const selectedButtonNode = findTextNode(initialTemplate, "EXPLORE THE EDIT");
      assert(selectedButtonNode?.id, "Could not find original CTA node in initial template");
      await selectTextByContent(page, "EXPLORE THE EDIT");
      await sendPrompt(
        page,
        "把当前按钮链接换掉。不要自己猜链接，如果缺少 URL 就问我要具体链接。",
        180_000,
        { allowDecision: true },
      );
      await assertTypedClarification(page, "链接");
      await submitDecisionCustom(page, targetLinkUrl, 240_000);
      await assertTemplate(
        page,
        (template) => {
          const hrefs = findHrefValues(template);
          assert(
            hrefs.some((href) => href.includes(targetLinkUrl)),
            `Expected button link to be updated. Hrefs: ${JSON.stringify(hrefs)}`,
          );
          const updatedButtonNode = findNodeById(template, selectedButtonNode.id);
          const selectedLinks = findLinkValues(updatedButtonNode);
          assert(
            selectedLinks.some((href) => href.includes(targetLinkUrl)),
            `Expected selected CTA ${selectedButtonNode.id} link to be updated. Links: ${JSON.stringify(selectedLinks)}. Node: ${JSON.stringify(updatedButtonNode)}`,
          );
        },
        "typed link clarification completed and updated the link",
      );
    });

    if (shouldRunCase("ask")) await runStep("Answering an ask-mode question without applying changes...", async () => {
      await prepareCase();
      const beforeCount = await appliedSnapshotCount(page);
      await sendPrompt(
        page,
        "这个模板主要在卖什么？只回答问题，不要修改模板。",
        120_000,
      );
      const afterCount = await appliedSnapshotCount(page);
      assert.equal(
        afterCount,
        beforeCount,
        `Ask mode should not apply template changes. Before: ${beforeCount}, after: ${afterCount}`,
      );
      const latest = await latestTemplate(page);
      assert.deepEqual(
        latest,
        initialTemplate,
        "Ask mode should leave the template unchanged",
      );
      console.log("✓ ask-mode answer did not apply template changes");
    });

    if (!skipImageGeneration && shouldRunCase("image")) {
      await runStep("Generating a replacement image for the selected image...", async () => {
        await prepareCase();
        const selectedImageSrc = await selectLargestCanvasImage(page);
        const selectedImageNode = findImageNodeBySrc(initialTemplate, selectedImageSrc);
        assert(
          selectedImageNode?.id,
          `Could not map selected image back to the template. Selected src: ${selectedImageSrc}`,
        );
        const beforeUrls = new Set(findImageUrls(initialTemplate));
        await sendPrompt(
          page,
          "当前的图片，改成粉色色调，匹配主题。不要只修改邮件主题颜色，请修改当前选中的图片。",
          420_000,
        );
        await assertTemplate(
          page,
          (template) => {
            const afterUrls = findImageUrls(template);
            const newUrls = afterUrls.filter((url) => !beforeUrls.has(url));
            assert(
              newUrls.length > 0,
              `Expected generated image to introduce a new image URL. URLs: ${JSON.stringify(afterUrls)}`,
            );
            const updatedNode = findNodeById(template, selectedImageNode.id);
            const updatedUrl = imageUrlFromNode(updatedNode);
            assert(
              updatedUrl && updatedUrl !== selectedImageSrc && !beforeUrls.has(updatedUrl),
              `Expected selected image block ${selectedImageNode.id} to use a newly generated URL. Node: ${JSON.stringify(updatedNode)}`,
            );
          },
          "generated image replaced an image URL",
        );
      });
    }

    if (failures.length) {
      throw new Error(
        `AI Agent real workflow test failed:\n${failures
          .map((failure) => `- ${failure.name}: ${failure.message}`)
          .join("\n")}`,
      );
    }

    console.log("AI Agent real workflow test passed");

    if (pauseOnDone) {
      console.log("PAUSE_ON_DONE=true, keeping browser open. Press Ctrl+C to close.");
      await new Promise(() => {});
    }
  } finally {
    if (!pauseOnDone) {
      await browser.close();
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
