// 领域模型：参数定义、班次记录、未结事项、遗留事项
// 本文件只描述数据结构，不含界面，也不决定状态如何流转。

export type ParamType = "转速" | "压力" | "温度" | "流量";

export interface ParamDef {
  id: string;
  /** 参数名称（四类：主机转速 / 滑油压力 / 冷却水温 / 燃油消耗） */
  name: string;
  type: ParamType;
  unit: string;
  equipmentId: string;
  /** 安全下限，读数低于该值视为越限 */
  min: number;
  /** 安全上限，读数高于该值视为越限 */
  max: number;
  /** 小数位数，用于解析与展示 */
  decimals: number;
}

export interface EquipmentDef {
  id: string;
  name: string;
}

export interface InspectionDef {
  id: string;
  equipmentId: string;
  label: string;
}

export interface CrewDef {
  id: string;
  /** 班组名称，如 08-12 甲班 */
  name: string;
}

export type ReadingStatus = "未填" | "正常" | "越限";
export type InspectionResult = "未检" | "正常" | "异常";
export type ItemOrigin = "参数越限" | "巡检异常" | "遗留并入";
export type ItemKind = "current" | "legacy";

export interface ParamRecord {
  defId: string;
  raw: string;
  value: number | null;
  status: ReadingStatus;
  updatedAt: string | null;
}

export interface InspectionRecord {
  defId: string;
  result: InspectionResult;
  note: string;
  updatedAt: string | null;
}

export interface OpenItem {
  id: string;
  kind: ItemKind;
  origin: ItemOrigin;
  /** 触发来源：参数/巡检定义 id，或遗留登记 id */
  sourceRef: string;
  equipmentId: string;
  title: string;
  detail: string;
  /** 触发时的读数（巡检异常无读数时为空） */
  triggerValue: string;
  createdAt: string;
  status: "open" | "resolved" | "carried";
  handler: string;
  retest: string;
  remark: string;
  resolvedAt: string | null;
}

export interface LegacyItem {
  id: string;
  origin: ItemOrigin;
  sourceRef: string;
  equipmentId: string;
  title: string;
  detail: string;
  sourceShiftId: string;
  sourceLabel: string;
  carriedAt: string;
  status: "open" | "resolved";
  handler: string;
  retest: string;
  remark: string;
  resolvedAt: string | null;
  resolvedInShiftId?: string;
}

export interface ShiftRecord {
  id: string;
  crewId: string;
  /** 值班日期 YYYY-MM-DD */
  date: string;
  /** 班次时段，如 08-12 */
  slot: string;
  startedAt: string;
  status: "active" | "archived";
  params: Record<string, ParamRecord>;
  inspections: Record<string, InspectionRecord>;
  items: OpenItem[];
  handoverConfirmed: boolean;
  archivedAt: string | null;
  archivedNote: string;
}

export interface AppState {
  version: number;
  crews: CrewDef[];
  activeShiftId: string | null;
  shifts: ShiftRecord[];
  legacy: LegacyItem[];
}
