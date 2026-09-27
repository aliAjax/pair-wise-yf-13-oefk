// React 与状态流转层的唯一接缝：useReducer + localStorage 持久化。
import { useEffect, useMemo, useReducer } from "react";
import {
  activeShift,
  canHandover,
  completeBlockers,
  openItemsByEquipment,
  reducer,
  shiftProgress,
} from "../domain/engine";
import type { AppState } from "../domain/types";
import { loadState, saveState } from "../services/storage";

export function useWatchStore() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const shift = activeShift(state);

  const derived = useMemo(
    () => ({
      shift,
      isActive: shift?.status === "active",
      handover: canHandover(shift),
      equipmentGroups: openItemsByEquipment(shift),
      progress: shiftProgress(shift),
      completeBlockers,
    }),
    [shift]
  );

  return { state, dispatch, ...derived } as const;
}

export type WatchStore = ReturnType<typeof useWatchStore>;
export type { AppState };
