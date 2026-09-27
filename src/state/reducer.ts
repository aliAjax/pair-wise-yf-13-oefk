// 状态流转（reducer 状态机）
// 班次：recording → handed（不可逆，归档只读）
// 事项：open → resolved（处理人/复测读数/备注三项齐全才允许流转）
// 其余为记录动作：写入读数、逐台勾选、并入遗留异常

import { CREWS, INSPECTIONS, PARAMETERS, PARAM_MAP } from "../definitions/parameters";
import { CHECK, ISSUE, ORIGIN, WATCH } from "./constants";
import { judgeValue, uid } from "./utils";
import type {
  AppState,
  CheckStatus,
  Issue,
  IssueOrigin,
  ParamKey,
  Watch,
} from "../types";

export type Action =
  | { type: "START_WATCH"; crewId: string }
  | { type: "ENTER_READING"; watchId: string; key: ParamKey; value: string }
  | { type: "SET_CHECK"; watchId: string; checkKey: string; status: CheckStatus }
  | {
      type: "PATCH_ISSUE";
      issueId: string;
      patch: Partial<Pick<Issue, "handler" | "recheckReading" | "note">>;
    }
  | { type: "RESOLVE_ISSUE"; issueId: string }
  | { type: "ADD_LEGACY"; device: string; title: string }
  | { type: "HAND_OVER"; watchId: string };

function emptyChecks(): Record<string, CheckStatus> {
  return Object.fromEntries(INSPECTIONS.map((item) => [item.key, CHECK.UNCHECKED]));
}

function findIssue(state: AppState, issueId: string): Issue | undefined {
  return state.issues.find((issue) => issue.id === issueId);
}

/** 读数冲过安全界限时生成/刷新一条本班未结事项 */
function syncParameterIssue(
  issues: Issue[],
  watchId: string,
  key: ParamKey,
  value: string,
): Issue[] {
  const def = PARAM_MAP[key];
  const state = judgeValue(key, value);
  const existing = issues.find(
    (issue) =>
      issue.watchId === watchId &&
      issue.origin === ORIGIN.PARAMETER &&
      issue.title === `${def.name}越限`,
  );

  if (state === "normal" || state === "empty") {
    // 回到安全区间：自动生成的事项关闭（仍保留处理闭环要求时可改为人工处理，此处保持自动撤销）
    if (!existing) return issues;
    return issues.map((issue) =>
      issue.id === existing.id
        ? {
            ...issue,
            status: ISSUE.RESOLVED,
            resolvedAt: Date.now(),
            handler: issue.handler || "值更员",
            recheckReading: issue.recheckReading || `${def.name}恢复至 ${value}${def.unit}`,
            note: issue.note || "复测回到安全区间，自动关闭",
          }
        : issue,
    );
  }

  const trigger = `${value} ${def.unit}（${state === "low" ? "低于下限" : "高于上限"} ${
    state === "low" ? def.min : def.max
  }${def.unit}）`;

  if (existing) {
    // 未结事项跟随最新读数更新触发值
    return issues.map((issue) =>
      issue.id === existing.id && issue.status === ISSUE.OPEN
        ? { ...issue, triggerValue: trigger }
        : issue,
    );
  }

  const issue: Issue = {
    id: uid("iss"),
    origin: ORIGIN.PARAMETER,
    device: "主机",
    title: `${def.name}越限`,
    triggerValue: trigger,
    status: ISSUE.OPEN,
    createdAt: Date.now(),
    handler: "",
    recheckReading: "",
    note: "",
    watchId,
  };
  return [...issues, issue];
}

/** 巡检勾选异常时生成未结事项；改回正常/未勾选时撤销该事项 */
function syncInspectionIssue(
  issues: Issue[],
  watchId: string,
  checkKey: string,
  status: CheckStatus,
): Issue[] {
  const def = INSPECTIONS.find((item) => item.key === checkKey);
  if (!def) return issues;
  const title = `${def.device}巡检异常：${def.point}`;
  const existing = issues.find(
    (issue) =>
      issue.watchId === watchId &&
      issue.origin === ORIGIN.INSPECTION &&
      issue.title === title,
  );

  if (status !== CHECK.ABNORMAL) {
    if (!existing) return issues;
    return issues.filter((issue) => issue.id !== existing.id);
  }

  if (existing) {
    return existing.status === ISSUE.OPEN
      ? issues
      : issues.map((issue) =>
          issue.id === existing.id
            ? { ...issue, status: ISSUE.OPEN, resolvedAt: undefined }
            : issue,
        );
  }

  const issue: Issue = {
    id: uid("iss"),
    origin: ORIGIN.INSPECTION,
    device: def.device,
    title,
    status: ISSUE.OPEN,
    createdAt: Date.now(),
    handler: "",
    recheckReading: "",
    note: "",
    watchId,
  };
  return [...issues, issue];
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "START_WATCH": {
      const crew = CREWS.find((item) => item.id === action.crewId);
      if (!crew || state.activeWatchId) return state;
      const watch: Watch = {
        id: uid("watch"),
        crewId: crew.id,
        engineer: crew.engineer,
        startedAt: Date.now(),
        status: WATCH.RECORDING,
        readings: {},
        checks: emptyChecks(),
      };
      return {
        ...state,
        watches: [watch, ...state.watches],
        activeWatchId: watch.id,
        // 遗留异常并入新班：pool 中的未结事项挂到本班
        issues: state.issues.map((issue) =>
          issue.watchId === null && issue.status === ISSUE.OPEN
            ? { ...issue, watchId: watch.id }
            : issue,
        ),
      };
    }

    case "ENTER_READING": {
      const watch = state.watches.find((item) => item.id === action.watchId);
      if (!watch || watch.status !== WATCH.RECORDING) return state;
      const watches = state.watches.map((item) =>
        item.id === watch.id
          ? { ...item, readings: { ...item.readings, [action.key]: action.value } }
          : item,
      );
      return {
        ...state,
        watches,
        issues: syncParameterIssue(state.issues, watch.id, action.key, action.value),
      };
    }

    case "SET_CHECK": {
      const watch = state.watches.find((item) => item.id === action.watchId);
      if (!watch || watch.status !== WATCH.RECORDING) return state;
      const watches = state.watches.map((item) =>
        item.id === watch.id
          ? { ...item, checks: { ...item.checks, [action.checkKey]: action.status } }
          : item,
      );
      return {
        ...state,
        watches,
        issues: syncInspectionIssue(
          state.issues,
          watch.id,
          action.checkKey,
          action.status,
        ),
      };
    }

    case "PATCH_ISSUE": {
      const issue = findIssue(state, action.issueId);
      if (!issue || issue.status !== ISSUE.OPEN) return state;
      return {
        ...state,
        issues: state.issues.map((item) =>
          item.id === issue.id
            ? {
                ...item,
                handler: action.patch.handler ?? item.handler,
                recheckReading: action.patch.recheckReading ?? item.recheckReading,
                note: action.patch.note ?? item.note,
              }
            : item,
        ),
      };
    }

    case "RESOLVE_ISSUE": {
      const issue = findIssue(state, action.issueId);
      if (!issue || issue.status !== ISSUE.OPEN) return state;
      // 三项缺一项不能点完成
      if (!issue.handler.trim() || !issue.recheckReading.trim() || !issue.note.trim()) {
        return state;
      }
      return {
        ...state,
        issues: state.issues.map((item) =>
          item.id === issue.id
            ? { ...item, status: ISSUE.RESOLVED, resolvedAt: Date.now() }
            : item,
        ),
      };
    }

    case "ADD_LEGACY": {
      const device = action.device.trim();
      const title = action.title.trim();
      if (!device || !title) return state;
      const issue: Issue = {
        id: uid("iss"),
        origin: ORIGIN.LEGACY,
        device,
        title,
        status: ISSUE.OPEN,
        createdAt: Date.now(),
        handler: "",
        recheckReading: "",
        note: "",
        // 值更中登记则直接并入本班；归档时登记则留在遗留池
        watchId: state.activeWatchId,
      };
      return { ...state, issues: [...state.issues, issue] };
    }

    case "HAND_OVER": {
      const watch = state.watches.find((item) => item.id === action.watchId);
      if (!watch || watch.status !== WATCH.RECORDING) return state;
      // 前置条件由界面（handoverBlockers）保证，reducer 再兜底：
      const readingsComplete = PARAMETERS.every((def) => {
        const raw = watch.readings[def.key];
        return raw !== undefined && raw.trim() !== "" && !Number.isNaN(Number(raw));
      });
      const checksComplete = INSPECTIONS.every(
        (def) => watch.checks[def.key] === CHECK.NORMAL || watch.checks[def.key] === CHECK.ABNORMAL,
      );
      const noOpen = !state.issues.some(
        (issue) => issue.watchId === watch.id && issue.status === ISSUE.OPEN,
      );
      if (!readingsComplete || !checksComplete || !noOpen) return state;

      return {
        ...state,
        activeWatchId: null,
        watches: state.watches.map((item) =>
          item.id === watch.id
            ? { ...item, status: WATCH.HANDED, handedAt: Date.now() }
            : item,
        ),
      };
    }

    default:
      return state;
  }
}

export const issueOriginLabel: Record<IssueOrigin, string> = {
  parameter: "参数越限",
  inspection: "巡检异常",
  legacy: "遗留并入",
};
