import { useState } from "react";
import {
  AiAgentPanel,
  type AiAgentHistory,
  type AiAgentHistoryChange,
  type AiAgentSnapshot,
  type AiChatHandler,
} from "easy-email-pro-theme";
import React from 'react';

const AI_AGENT_HISTORY_STORAGE_KEY =
  "easy-email-pro:demo-ai-agent:v2:ai-agent-history";
const AI_AGENT_SNAPSHOT_STORAGE_PREFIX =
  "easy-email-pro:demo-ai-agent:v2:ai-agent-snapshot:";
const MAX_STORED_AI_AGENT_SNAPSHOTS = 6;

function readStoredAiAgentHistory(): AiAgentHistory | undefined {
  if (typeof window === "undefined") return undefined;

  try {
    const raw = window.localStorage.getItem(AI_AGENT_HISTORY_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as AiAgentHistory;
    if (!Array.isArray(parsed.messages)) return undefined;
    return {
      messages: parsed.messages,
      currentSnapshotId: parsed.currentSnapshotId,
      snapshots: Array.isArray(parsed.snapshots) ? parsed.snapshots : [],
    };
  } catch {
    return undefined;
  }
}

function writeStoredAiAgentHistory(history: AiAgentHistory) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      AI_AGENT_HISTORY_STORAGE_KEY,
      JSON.stringify(sanitizeAiAgentHistoryForStorage(history)),
    );
  } catch {
    // History persistence is best-effort and should not interrupt the editor.
  }
}

function writeStoredAiAgentSnapshot(snapshot: AiAgentSnapshot) {
  if (typeof window === "undefined") return;
  const key = `${AI_AGENT_SNAPSHOT_STORAGE_PREFIX}${snapshot.id}`;
  const value = JSON.stringify(snapshot);
  try {
    window.localStorage.setItem(key, value);
  } catch {
    pruneStoredAiAgentSnapshots(MAX_STORED_AI_AGENT_SNAPSHOTS - 1);
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Snapshot persistence is best-effort and should not interrupt the editor.
    }
  }
}

function readStoredAiAgentSnapshot(snapshotId: string): AiAgentSnapshot | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(
      `${AI_AGENT_SNAPSHOT_STORAGE_PREFIX}${snapshotId}`,
    );
    return raw ? (JSON.parse(raw) as AiAgentSnapshot) : null;
  } catch {
    return null;
  }
}

function sanitizeAiAgentHistoryForStorage(
  history: AiAgentHistory,
): AiAgentHistory {
  return {
    ...history,
    messages: history.messages.map((message) => ({
      ...message,
      attachments: message.attachments?.map((attachment) => ({
        id: attachment.id,
        type: attachment.type,
        name: attachment.name,
        url: attachment.url?.startsWith("data:") ? "" : attachment.url,
        mimeType: attachment.mimeType,
        size: attachment.size,
      })),
    })),
  };
}

function pruneStoredAiAgentSnapshots(maxCount: number) {
  if (typeof window === "undefined") return;
  const snapshots = Object.keys(window.localStorage)
    .filter((key) => key.startsWith(AI_AGENT_SNAPSHOT_STORAGE_PREFIX))
    .map((key) => {
      try {
        const raw = window.localStorage.getItem(key);
        const parsed = raw ? (JSON.parse(raw) as AiAgentSnapshot) : null;
        return {
          key,
          createdAt: parsed?.createdAt || "",
        };
      } catch {
        return { key, createdAt: "" };
      }
    })
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  snapshots
    .slice(0, Math.max(0, snapshots.length - maxCount))
    .forEach((snapshot) => window.localStorage.removeItem(snapshot.key));
}

const onChat: AiChatHandler = async (request) => {
  const sessionId = "demo-ai-agent";

  return fetch("https://agent-api.beacas.com/v1/easy-email/respond-stream", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    signal: request.signal,
    body: JSON.stringify({
      sessionId,
      prompt: { text: request.message },
      images: request.images || [],
      template: request.template,
      history: request.history,
      editorContext: request.editorContext,
      decisionResponse: request.decisionResponse,
    }),
  });
};

export function DemoAiAgent() {
  const [history, setHistory] = useState<AiAgentHistory | undefined>(() =>
    readStoredAiAgentHistory(),
  );

  return (
    <AiAgentPanel
      onChat={onChat}
      history={history}
      onHistoryChange={(
        nextHistory: AiAgentHistory,
        _change: AiAgentHistoryChange,
      ) => {
        setHistory(nextHistory);
        writeStoredAiAgentHistory(nextHistory);
      }}
      snapshots={{
        onCreate: writeStoredAiAgentSnapshot,
        onRestore: readStoredAiAgentSnapshot,
      }}

      quickActions={[
        {
          label: "Restyle image",
          prompt:
            "Edit the currently selected image asset itself. Keep the same subject and composition, but restyle it as a cleaner, more premium product photo with soft studio light and a neutral backdrop. Replace the selected image with the generated image. Do not change template styles, theme colors, text, layout, or any other image.",
        },
        {
          label: "Professional",
          prompt:
            "Make the overall design feel more premium, reduce cheap promotion cues, and keep the brand tone polished.",
        },
        {
          label: "Improve hero",
          prompt:
            "Improve the hero section: make the headline more focused, shorten the supporting copy, and make the CTA stand out.",
        },
        {
          label: "Align colors",
          prompt:
            "Align the brand colors and button colors, reduce visual noise, and make the email feel more cohesive.",
        },
        {
          label: "Optimize products",
          prompt:
            "Optimize the product section layout and text hierarchy so products are easier to browse and compare.",
        },
        {
          label: "Compact mobile",
          prompt:
            "Optimize the mobile layout, reduce crowding and long text, and keep the content readable.",
        },
        {
          label: "Boost contrast",
          prompt:
            "Improve the contrast between the background, body text, and buttons to keep the email readable.",
        },
        {
          label: "Add urgency",
          prompt:
            "Add more promotional energy and urgency without hurting the brand feel.",
        },
        {
          label: "Softer tone",
          prompt:
            "Make the visuals and copy softer, lighter, and more suitable for a lifestyle brand.",
        },
        {
          label: "Check issues",
          prompt:
            "Review the current email for copy, hierarchy, mobile, and CTA issues, then make small improvements directly.",
        },
      ]}
    />
  );
}
