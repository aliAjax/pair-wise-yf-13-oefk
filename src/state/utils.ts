// 纯函数工具：读数判定、ID、时间、阻塞项判断

import { PARAMETERS, PARAM_MAP } from "../definitions/parameters";
import { CHECK, ISSUE, WATCH } from "./constants";
import type { AppState, CheckStatus, Issue, ParamKey, Watch } from "../types";

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(
    d.getHours(),
  )}:${pad2(d.getMinutes())}`;
}

export type ValueState = "empty" | "normal" | "low" | "high";

/** 判定参数读数相对安全界限的状态 */
export function judgeValue(key: ParamKey, raw: string | undefined): ValueState {
  if (raw === undefined || raw.trim() === "") return "empty";
  const value = Number(raw);
  if (Number.isNaN(value)) return "empty";
  const def = PARAM_MAP[key];
  if (value < def.min) return "low";
  if (value > def.max) return "high";
  return "normal";
}

export function describeValue(state: ValueState, key: ParamKey): string {
  const def = PARAM_MAP[key];
  if (state === "low") return `低于下限 ${def.min}${def.unit}`;
  if (state === "high") return `高于上限 ${def.max}${def.unit}`;
  return "处于安全区间";
}

/** 本班相关事项：本班生成的 + 并入本班处理的遗留事项 */
export function watchIssues(state: AppState, watch: Watch): Issue[] {
  return state.issues
    .filter((issue) => issue.watchId === watch.id)
    .sort((a, b) => a.createdAt - b.createdAt);
}

/** 尚未并入任何班次的遗留事项（归档页新登记的异常进入这里） */
export function poolIssues(state: AppState): Issue[] {
  return state.issues
    .filter((issue) => issue.watchId === null)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function openIssues(list: Issue[]): Issue[] {
  return list.filter((issue) => issue.status === ISSUE.OPEN);
}

export function missingReadings(watch: Watch): string[] {
  return PARAMETERS.filter((def) => {
    const raw = watch.readings[def.key];
    return raw === undefined || raw.trim() === "" || Number.isNaN(Number(raw));
  }).map((def) => def.name);
}

export function uncheckedItems(watch: Watch): string[] {
  return PARAMETERS.length
    ? Object.entries(watch.checks)
        .filter(([, status]) => status !== CHECK.NORMAL && status !== CHECK.ABNORMAL)
        .map(([key]) => key)
    : [];
}

export function checkStatus(watch: Watch, key: string): CheckStatus {
  return watch.checks[key] ?? CHECK.UNCHECKED;
}

export interface HandoverBlockers {
  readings: string[];
  checks: string[];
  issues: Issue[];
}

/** 交班确认前置条件：四类参数齐、巡检逐台勾选、未结事项全部处理完成 */
export function handoverBlockers(state: AppState, watch: Watch): HandoverBlockers {
  return {
    readings: missingReadings(watch),
    checks: uncheckedItems(watch),
    issues: openIssues(watchIssues(state, watch)),
  };
}

export function canHandOver(blockers: HandoverBlockers): boolean {
  return (
    blockers.readings.length === 0 &&
    blockers.checks.length === 0 &&
    blockers.issues.length === 0
  );
}

export function isActive(watch: Watch): boolean {
  return watch.status === WATCH.RECORDING;
}
