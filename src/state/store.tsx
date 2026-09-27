// 状态 Store（Context）：界面层只通过 useStore 读状态、派发动作，
// 不直接操作 localStorage，持久化细节收敛在本文件。

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { AppState } from "../types";
import { reducer, type Action } from "./reducer";
import { loadState, saveState } from "./storage";
import { seedState } from "./seed";

interface Store {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    return loadState() ?? seedState();
  });

  useEffect(() => {
    saveState(state);
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore 必须在 StoreProvider 内使用");
  return store;
}
