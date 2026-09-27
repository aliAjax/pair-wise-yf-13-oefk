// 本机持久化：数据只保存在浏览器 localStorage，不发往任何服务端

import type { AppState } from "../types";

const STORAGE_KEY = "engine-room-watch-v1";

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppState;
    if (!Array.isArray(parsed.watches) || !Array.isArray(parsed.issues)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 存储不可用时静默降级为内存态
  }
}
