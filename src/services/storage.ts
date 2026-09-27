// 本机持久化：仅使用 localStorage，数据不离开本浏览器。
import { initialState, STORAGE_KEY, STATE_VERSION } from "../domain/engine";
import type { AppState } from "../domain/types";
import { CREWS } from "../domain/definitions";

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...initialState, crews: CREWS };
    const parsed = JSON.parse(raw) as AppState;
    if (parsed.version !== STATE_VERSION) return { ...initialState, crews: CREWS };
    return { ...parsed, crews: CREWS };
  } catch {
    return { ...initialState, crews: CREWS };
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 存储空间不足或隐私模式下静默失败，不影响当班操作
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
