// 状态流转层：纯函数 reducer + 校验规则。
// 不依赖 React、不接触 localStorage、不渲染界面；
// 所有“什么时候生成未结事项 / 何时能完成 / 何时能交班”的规则都集中在这里。

import { INSPECTION_DEFS, PARAM_DEFS } from "./definitions";
import type {
  AppState,
  InspectionRecord,
  ItemOrigin,
  LegacyItem,
  OpenItem,
  ParamRecord,
  ShiftRecord,
} from "./types";

export const STORAGE_KEY = "engine-watch-console-v1";
export const STATE_VERSION = 1;

export const initialState: AppState = {
  version: STATE_VERSION,
  activeShiftId: null,
  shifts: [],
  legacy: [],
  crews: [],
};

export type Action =
  | { type: "HYDRATE"; state: AppState }
  | { type: "NEW_SHIFT"; crewId: string; date: string; slot: string }
  | { type: "SET_READING"; defId: string; raw: string }
  | { type: "SET_INSPECTION"; defId: string; result: "正常" | "异常"; note: string }
  | { type: "PATCH_ITEM"; id: string; field: "handler" | "retest" | "remark"; value: string }
  | { type: "COMPLETE_ITEM"; id: string }
  | { type: "CARRY_ITEM"; id: string; handoverNote: string }
  | { type: "ADD_LEGACY"; equipmentId: string; title: string; detail: string }
  | { type: "CONFIRM_HANDOVER" }
  | { type: "ARCHIVE_SHIFT"; note: string };

let seq = 0;
export function uid(prefix = "id"): string {
  seq += 1;
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${seq}-${rand}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

// ---------- 纯工具 ----------

export function parseReading(raw: string): number | null {
  const t = raw.trim();
  if (t === "") return null;
  const v = Number(t);
  return Number.isFinite(v) ? v : null;
}

export function readingStatus(defId: string, value: number | null): ParamRecord["status"] {
  if (value === null) return "未填";
  const def = PARAM_DEFS.find((p) => p.id === defId);
  if (!def) return "正常";
  return value < def.min || value > def.max ? "越限" : "正常";
}

function emptyParams(): Record<string, ParamRecord> {
  const map: Record<string, ParamRecord> = {};
  for (const def of PARAM_DEFS) {
    map[def.id] = { defId: def.id, raw: "", value: null, status: "未填", updatedAt: null };
  }
  return map;
}

function emptyInspections(): Record<string, InspectionRecord> {
  const map: Record<string, InspectionRecord> = {};
  for (const def of INSPECTION_DEFS) {
    map[def.id] = { defId: def.id, result: "未检", note: "", updatedAt: null };
  }
  return map;
}

export function activeShift(state: AppState): ShiftRecord | null {
  return state.shifts.find((s) => s.id === state.activeShiftId) ?? null;
}

export function openItems(shift: ShiftRecord | null): OpenItem[] {
  if (!shift) return [];
  return shift.items.filter((i) => i.status === "open");
}

/** 交班摘要：按设备逐台汇总未结事项 */
export function openItemsByEquipment(
  shift: ShiftRecord | null
): { equipmentId: string; items: OpenItem[] }[] {
  const groups = new Map<string, OpenItem[]>();
  for (const item of openItems(shift)) {
    const list = groups.get(item.equipmentId) ?? [];
    list.push(item);
    groups.set(item.equipmentId, list);
  }
  return [...groups.entries()].map(([equipmentId, items]) => ({ equipmentId, items }));
}

export function shiftProgress(shift: ShiftRecord | null) {
  if (!shift) return { paramsFilled: 0, paramsTotal: PARAM_DEFS.length, inspectionsDone: 0, inspectionsTotal: INSPECTION_DEFS.length };
  const paramsFilled = PARAM_DEFS.filter((d) => shift.params[d.id]?.status !== "未填").length;
  const inspectionsDone = INSPECTION_DEFS.filter((d) => shift.inspections[d.id]?.result !== "未检").length;
  return {
    paramsFilled,
    paramsTotal: PARAM_DEFS.length,
    inspectionsDone,
    inspectionsTotal: INSPECTION_DEFS.length,
  };
}

// ---------- 未结事项校验 ----------

/** 完成三要素：处理人、复测读数、备注，缺一不可；参数越限还要求复测回到界限内 */
export function completeBlockers(item: OpenItem): string[] {
  const blockers: string[] = [];
  if (!item.handler.trim()) blockers.push("未填处理人");
  if (!item.retest.trim()) {
    blockers.push("未填复测读数");
  } else if (item.origin === "参数越限") {
    const def = PARAM_DEFS.find((p) => p.id === item.sourceRef);
    const v = Number(item.retest);
    if (!Number.isFinite(v) || def === undefined || v < def.min || v > def.max) {
      blockers.push(`复测读数需在安全界限 ${def?.min}~${def?.max} ${def?.unit ?? ""} 内`);
    }
  }
  if (!item.remark.trim()) blockers.push("未填处理备注");
  return blockers;
}

export function canHandover(shift: ShiftRecord | null): { ok: boolean; reasons: string[] } {
  if (!shift) return { ok: false, reasons: ["尚未开班"] };
  const reasons: string[] = [];
  const open = openItems(shift);
  if (open.length > 0) reasons.push(`仍有 ${open.length} 项未结事项（完成或移交遗留后再交班）`);
  return { ok: reasons.length === 0, reasons };
}

// ---------- reducer ----------

function makeParamItem(defId: string, value: number): OpenItem {
  const def = PARAM_DEFS.find((p) => p.id === defId)!;
  const dir = value > def.max ? "高于上限" : "低于下限";
  return {
    id: uid("item"),
    kind: "current",
    origin: "参数越限",
    sourceRef: defId,
    equipmentId: def.equipmentId,
    title: `${def.name}越限`,
    detail: `${def.name} ${value}${def.unit}，${dir}（安全界限 ${def.min}~${def.max}${def.unit}）`,
    triggerValue: `${value}${def.unit}`,
    createdAt: nowIso(),
    status: "open",
    handler: "",
    retest: "",
    remark: "",
    resolvedAt: null,
  };
}

function makeInspectionItem(defId: string, note: string): OpenItem {
  const def = INSPECTION_DEFS.find((d) => d.id === defId)!;
  return {
    id: uid("item"),
    kind: "current",
    origin: "巡检异常",
    sourceRef: defId,
    equipmentId: def.equipmentId,
    title: `巡检异常：${def.label}`,
    detail: note ? `巡检项「${def.label}」勾选异常。${note}` : `巡检项「${def.label}」勾选异常`,
    triggerValue: "—",
    createdAt: nowIso(),
    status: "open",
    handler: "",
    retest: "",
    remark: "",
    resolvedAt: null,
  };
}

function snapshotLegacy(legacy: LegacyItem[]): OpenItem[] {
  return legacy
    .filter((l) => l.status === "open")
    .map((l) => ({
      id: uid("legacy-item"),
      kind: "legacy" as const,
      origin: "遗留并入" as ItemOrigin,
      sourceRef: l.id,
      equipmentId: l.equipmentId,
      title: l.title,
      detail: l.detail,
      triggerValue: "—",
      createdAt: l.carriedAt,
      status: "open" as const,
      handler: l.handler,
      retest: l.retest,
      remark: l.remark,
      resolvedAt: null,
    }));
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "HYDRATE":
      return action.state;

    case "NEW_SHIFT": {
      if (!action.crewId || !action.date || !action.slot) return state;
      // 同时只能有一个在值班次
      const stillOpen = state.shifts.some((s) => s.status === "active");
      if (stillOpen) return state;
      const shift: ShiftRecord = {
        id: uid("shift"),
        crewId: action.crewId,
        slot: action.slot,
        date: action.date,
        startedAt: nowIso(),
        status: "active",
        params: emptyParams(),
        inspections: emptyInspections(),
        items: snapshotLegacy(state.legacy),
        handoverConfirmed: false,
        archivedAt: null,
        archivedNote: "",
      };
      return { ...state, shifts: [shift, ...state.shifts], activeShiftId: shift.id };
    }

    case "SET_READING": {
      const shift = activeShift(state);
      if (!shift) return state;
      const def = PARAM_DEFS.find((p) => p.id === action.defId);
      if (!def) return state;
      const parsed = parseReading(action.raw);
      const value = parsed === null ? null : Number(parsed.toFixed(def.decimals));
      const status = readingStatus(action.defId, value);
      const params = {
        ...shift.params,
        [action.defId]: {
          defId: action.defId,
          raw: action.raw,
          value,
          status,
          updatedAt: action.raw.trim() === "" ? null : nowIso(),
        },
      };

      let items = shift.items;
      // 冲过安全界限：若同源没有未结事项则生成一条；已存在则更新最新读数
      if (status === "越限" && value !== null) {
        const idx = items.findIndex((i) => i.status === "open" && i.sourceRef === action.defId);
        if (idx >= 0) {
          const updated = { ...items[idx], triggerValue: `${value}${def.unit}` };
          const fresh = makeParamItem(action.defId, value);
          updated.detail = fresh.detail;
          items = [...items.slice(0, idx), updated, ...items.slice(idx + 1)];
        } else {
          items = [makeParamItem(action.defId, value), ...items];
        }
      }
      return { ...state, shifts: patchShift(state, shift.id, { params, items }) };
    }

    case "SET_INSPECTION": {
      const shift = activeShift(state);
      if (!shift) return state;
      const def = INSPECTION_DEFS.find((d) => d.id === action.defId);
      if (!def) return state;
      const inspections = {
        ...shift.inspections,
        [action.defId]: { defId: action.defId, result: action.result, note: action.note, updatedAt: nowIso() },
      };
      let items = shift.items;
      if (action.result === "异常") {
        const idx = items.findIndex((i) => i.status === "open" && i.sourceRef === action.defId);
        if (idx >= 0) {
          const updated = { ...items[idx], detail: action.note ? `${def.label}：${action.note}` : items[idx].detail };
          items = [...items.slice(0, idx), updated, ...items.slice(idx + 1)];
        } else {
          items = [makeInspectionItem(action.defId, action.note), ...items];
        }
      } else {
        // 改回正常：仅撤销尚未填写处置信息的同源事项，避免误删已有记录
        items = items.filter(
          (i) =>
            !(
              i.status === "open" &&
              i.origin === "巡检异常" &&
              i.sourceRef === action.defId &&
              !i.handler.trim() &&
              !i.retest.trim() &&
              !i.remark.trim()
            )
        );
      }
      return { ...state, shifts: patchShift(state, shift.id, { inspections, items }) };
    }

    case "PATCH_ITEM": {
      const shift = activeShift(state);
      if (!shift) return state;
      const items = shift.items.map((i) =>
        i.id === action.id && i.status === "open" ? { ...i, [action.field]: action.value } : i
      );
      return { ...state, shifts: patchShift(state, shift.id, { items }) };
    }

    case "COMPLETE_ITEM": {
      const shift = activeShift(state);
      if (!shift) return state;
      const target = shift.items.find((i) => i.id === action.id);
      if (!target || target.status !== "open") return state;
      if (completeBlockers(target).length > 0) return state;

      // 遗留并入的事项在本班完成：回写遗留登记销项
      let legacy = state.legacy;
      if (target.kind === "legacy") {
        legacy = state.legacy.map((l) =>
          l.id === target.sourceRef
            ? {
                ...l,
                status: "resolved" as const,
                handler: target.handler,
                retest: target.retest,
                remark: target.remark,
                resolvedAt: nowIso(),
                resolvedInShiftId: shift.id,
              }
            : l
        );
      }
      const items = shift.items.map((i) =>
        i.id === action.id ? { ...i, status: "resolved" as const, resolvedAt: nowIso() } : i
      );
      return { ...state, legacy, shifts: patchShift(state, shift.id, { items }) };
    }

    case "CARRY_ITEM": {
      const shift = activeShift(state);
      if (!shift) return state;
      const target = shift.items.find((i) => i.id === action.id);
      if (!target || target.status !== "open" || !action.handoverNote.trim()) return state;

      // 从本班摘除，并入遗留登记；本就来自遗留的仅补充交接说明
      const items = shift.items.filter((i) => i.id !== action.id);
      let legacy = state.legacy;
      if (target.kind === "legacy") {
        legacy = state.legacy.map((l) =>
          l.id === target.sourceRef
            ? { ...l, remark: [l.remark, `交接说明：${action.handoverNote.trim()}`].filter(Boolean).join("；") }
            : l
        );
      } else {
        const entry: LegacyItem = {
          id: uid("legacy"),
          origin: target.origin,
          sourceRef: target.sourceRef,
          equipmentId: target.equipmentId,
          title: target.title,
          detail: target.detail,
          sourceShiftId: shift.id,
          sourceLabel: `${shift.date} ${shift.slot}交班移交`,
          carriedAt: nowIso(),
          status: "open",
          handler: target.handler,
          retest: target.retest,
          remark: [target.remark, `交接说明：${action.handoverNote.trim()}`].filter(Boolean).join("；"),
          resolvedAt: null,
        };
        legacy = [entry, ...state.legacy];
      }
      return { ...state, legacy, shifts: patchShift(state, shift.id, { items }) };
    }

    case "ADD_LEGACY": {
      const equipmentId = action.equipmentId.trim();
      const title = action.title.trim();
      const detail = action.detail.trim();
      if (!equipmentId || !title) return state;
      const entry: LegacyItem = {
        id: uid("legacy"),
        origin: "遗留并入",
        sourceRef: uid("manual"),
        equipmentId,
        title,
        detail,
        sourceShiftId: "",
        sourceLabel: "新异常登记",
        carriedAt: nowIso(),
        status: "open",
        handler: "",
        retest: "",
        remark: "",
        resolvedAt: null,
      };
      let legacy = [entry, ...state.legacy];
      let shifts = state.shifts;
      // 正在值更的班次即时并入，作为本班待处理事项
      const shift = activeShift(state);
      if (shift) {
        const snap: OpenItem = {
          id: uid("legacy-item"),
          kind: "legacy",
          origin: "遗留并入",
          sourceRef: entry.id,
          equipmentId,
          title,
          detail,
          triggerValue: "—",
          createdAt: entry.carriedAt,
          status: "open",
          handler: "",
          retest: "",
          remark: "",
          resolvedAt: null,
        };
        shifts = patchShift(state, shift.id, { items: [snap, ...shift.items] });
      }
      return { ...state, legacy, shifts };
    }

    case "CONFIRM_HANDOVER": {
      const shift = activeShift(state);
      if (!shift || !canHandover(shift).ok) return state;
      return { ...state, shifts: patchShift(state, shift.id, { handoverConfirmed: true }) };
    }

    case "ARCHIVE_SHIFT": {
      const shift = activeShift(state);
      if (!shift || !shift.handoverConfirmed) return state;
      const shifts = state.shifts.map((s) =>
        s.id === shift.id
          ? { ...s, status: "archived" as const, archivedAt: nowIso(), archivedNote: action.note.trim() }
          : s
      );
      return { ...state, shifts, activeShiftId: null };
    }

    default:
      return state;
  }
}

function patchShift(state: AppState, shiftId: string, patch: Partial<ShiftRecord>): ShiftRecord[] {
  return state.shifts.map((s) => (s.id === shiftId ? { ...s, ...patch } : s));
}
