// 通用领域类型定义

/** 四类机仓参数的键 */
export type ParamKey = "rpm" | "lubOil" | "cooling" | "fuel";

/** 巡检结果：逐台勾选 */
export type CheckStatus = "unchecked" | "normal" | "abnormal";

/** 问题来源：本班参数/巡检自动生成，或从遗留列表并入 */
export type IssueOrigin = "parameter" | "inspection" | "legacy";

/** 问题状态流转：open（未结）→ resolved（已结） */
export type IssueStatus = "open" | "resolved";

/** 班次状态流转：recording（值更中）→ handed（已交班/归档只读） */
export type WatchStatus = "recording" | "handed";

/** 参数定义（在 definitions/parameters.ts 维护） */
export interface ParamDef {
  key: ParamKey;
  name: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  hint: string;
}

/** 巡检设备项定义 */
export interface InspectionDef {
  key: string;
  device: string;
  point: string;
}

/** 班组定义 */
export interface Crew {
  id: string;
  label: string;
  time: string;
  engineer: string;
}

/** 未结 / 已结事项 */
export interface Issue {
  id: string;
  origin: IssueOrigin;
  device: string;
  title: string;
  triggerValue?: string;
  status: IssueStatus;
  createdAt: number;
  resolvedAt?: number;
  handler: string;
  recheckReading: string;
  note: string;
  /** 在哪个班次处理关闭；遗留事项未处理时为空 */
  watchId: string | null;
}

/** 一个班次（值更工作台的一次记录） */
export interface Watch {
  id: string;
  crewId: string;
  engineer: string;
  startedAt: number;
  status: WatchStatus;
  handedAt?: number;
  readings: Partial<Record<ParamKey, string>>;
  checks: Record<string, CheckStatus>;
}

export interface AppState {
  watches: Watch[];
  activeWatchId: string | null;
  /** 遗留问题池：跨班次的异常，新异常仍可并入 */
  issues: Issue[];
  /** 示例归档标记，不参与业务逻辑，仅用于阅读态展示 */
  seeded?: boolean;
}
