// 状态常量：状态机中允许出现的状态取值，统一在此维护

import type { CheckStatus, IssueOrigin, IssueStatus, WatchStatus } from "../types";

export const WATCH: Record<"RECORDING" | "HANDED", WatchStatus> = {
  RECORDING: "recording",
  HANDED: "handed",
};

export const ISSUE: Record<"OPEN" | "RESOLVED", IssueStatus> = {
  OPEN: "open",
  RESOLVED: "resolved",
};

export const CHECK: Record<"UNCHECKED" | "NORMAL" | "ABNORMAL", CheckStatus> = {
  UNCHECKED: "unchecked",
  NORMAL: "normal",
  ABNORMAL: "abnormal",
};

export const ORIGIN: Record<"PARAMETER" | "INSPECTION" | "LEGACY", IssueOrigin> = {
  PARAMETER: "parameter",
  INSPECTION: "inspection",
  LEGACY: "legacy",
};
