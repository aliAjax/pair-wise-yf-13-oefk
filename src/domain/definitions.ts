// 参数定义层：班组、设备、四类参数安全界限、巡检项。
// 调整安全界限或巡检内容只需改本文件，状态流转与界面无需改动。

import type { CrewDef, EquipmentDef, InspectionDef, ParamDef } from "./types";

export const CREWS: CrewDef[] = [
  { id: "crew-a", name: "甲班（00-04 / 12-16）" },
  { id: "crew-b", name: "乙班（04-08 / 16-20）" },
  { id: "crew-c", name: "丙班（08-12 / 20-24）" },
];

export const SHIFT_SLOTS = ["00-04", "04-08", "08-12", "12-16", "16-20", "20-24"] as const;

export const EQUIPMENTS: EquipmentDef[] = [
  { id: "me", name: "主机" },
  { id: "gen", name: "发电机" },
  { id: "pump", name: "泵组" },
  { id: "bilge", name: "舱底水" },
];

export const PARAM_DEFS: ParamDef[] = [
  // —— 第一类：主机转速 ——
  {
    id: "me-rpm",
    name: "主机转速",
    type: "转速",
    unit: "rpm",
    equipmentId: "me",
    min: 70,
    max: 90,
    decimals: 0,
  },
  // —— 第二类：滑油压力 ——
  {
    id: "me-lop",
    name: "滑油压力",
    type: "压力",
    unit: "MPa",
    equipmentId: "me",
    min: 0.35,
    max: 0.5,
    decimals: 2,
  },
  {
    id: "gen-lop",
    name: "滑油压力",
    type: "压力",
    unit: "MPa",
    equipmentId: "gen",
    min: 0.3,
    max: 0.55,
    decimals: 2,
  },
  // —— 第三类：冷却水温 ——
  {
    id: "me-cwt",
    name: "冷却水温",
    type: "温度",
    unit: "℃",
    equipmentId: "me",
    min: 60,
    max: 85,
    decimals: 1,
  },
  {
    id: "gen-cwt",
    name: "冷却水温",
    type: "温度",
    unit: "℃",
    equipmentId: "gen",
    min: 55,
    max: 80,
    decimals: 1,
  },
  // —— 第四类：燃油消耗 ——
  {
    id: "me-fuel",
    name: "燃油消耗",
    type: "流量",
    unit: "L/h",
    equipmentId: "me",
    min: 120,
    max: 210,
    decimals: 1,
  },
];

// 四类参数（用于看板分组与“四类参数”表述）
export const PARAM_TYPES: { type: ParamDef["type"]; unit: string }[] = [
  { type: "转速", unit: "rpm" },
  { type: "压力", unit: "MPa" },
  { type: "温度", unit: "℃" },
  { type: "流量", unit: "L/h" },
];

export const INSPECTION_DEFS: InspectionDef[] = [
  { id: "me-sound", equipmentId: "me", label: "主机运转声音、排烟颜色正常" },
  { id: "me-seal", equipmentId: "me", label: "主机轴封无渗漏" },
  { id: "gen-02", equipmentId: "gen", label: "2#发电机运行参数正常" },
  { id: "pump-sw", equipmentId: "pump", label: "海水泵压力稳定、无异响" },
  { id: "pump-lo", equipmentId: "pump", label: "滑油泵滤网压差正常" },
  { id: "bilge-level", equipmentId: "bilge", label: "舱底水位低于警戒线" },
  { id: "bilge-pump", equipmentId: "bilge", label: "舱底水泵自启试验合格" },
];

export const equipmentName = (id: string): string =>
  EQUIPMENTS.find((e) => e.id === id)?.name ?? id;

export const paramDefById = (id: string): ParamDef | undefined =>
  PARAM_DEFS.find((p) => p.id === id);
