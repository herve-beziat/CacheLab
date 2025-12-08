// src/api/logger.ts

type LogLevel = "info" | "warn" | "error";

function formatMessage(level: LogLevel, message: string, meta?: unknown) {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

  if (meta !== undefined) {
    return `${base} | ${JSON.stringify(meta)}`;
  }

  return base;
}

export function logInfo(message: string, meta?: unknown) {
  console.log(formatMessage("info", message, meta));
}

export function logWarn(message: string, meta?: unknown) {
  console.warn(formatMessage("warn", message, meta));
}

export function logError(message: string, meta?: unknown) {
  console.error(formatMessage("error", message, meta));
}
