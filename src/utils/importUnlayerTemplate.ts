import type { EmailTemplate } from "easy-email-pro-editor";
import { PluginManager } from "easy-email-pro-core";
import { unlayerToEasyEmailPro } from "easy-email-pro-migrations";

export function importUnlayerDesign(
  design: unknown,
  fileName: string
): { template: EmailTemplate; warnings: string[] } {
  const { page, warnings } = unlayerToEasyEmailPro(
    normalizeUnlayerVariables(design)
  );

  return {
    template: {
      subject: fileName,
      content: page,
    },
    warnings,
  };
}

function normalizeUnlayerVariables<T>(value: T): T {
  if (typeof value === "string") {
    return value.replace(/%%([A-Za-z0-9_.-]+)%%/g, (_, name: string) =>
      PluginManager.generateVariable(name)
    ) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeUnlayerVariables(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        normalizeUnlayerVariables(item),
      ])
    ) as T;
  }

  return value;
}
