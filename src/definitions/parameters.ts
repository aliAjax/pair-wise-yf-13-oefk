// 业务参数定义：四类参数 + 巡检项 + 班组。
// 调整安全界限、设备班组时只改本文件，不影响状态流转与界面代码。

import type { Crew, InspectionDef, ParamDef, ParamKey } from "../types";

export const PARAMETERS: ParamDef[] = [
  {
    key: "rpm",
    name: "主机转速",
    unit: "rpm",
    min: 70,
    max: 95,
    step: 1,
    hint: "允许区间 70–95 rpm",
  },
  {
    key: "lubOil",
    name: "滑油压力",
    unit: "MPa",
    min: 0.35,
    max: 0.5,
    step: 0.01,
    hint: "允许区间 0.35–0.50 MPa",
  },
  {
    key: "cooling",
    name: "冷却水温",
    unit: "℃",
    min: 65,
    max: 82,
    step: 1,
    hint: "允许区间 65–82 ℃",
  },
  {
    key: "fuel",
    name: "燃油消耗",
    unit: "L/h",
    min: 180,
    max: 260,
    step: 1,
    hint: "允许区间 180–260 L/h",
  },
];

export const PARAM_MAP: Record<ParamKey, ParamDef> = PARAMETERS.reduce(
  (acc, item) => {
    acc[item.key] = item;
    return acc;
  },
  {} as Record<ParamKey, ParamDef>,
);

export const CREWS: Crew[] = [
  { id: "w-0812", label: "08–12 班", time: "08:00–12:00", engineer: "李轮机" },
  { id: "w-1216", label: "12–16 班", time: "12:00–16:00", engineer: "王大管" },
  { id: "w-1620", label: "16–20 班", time: "16:00–20:00", engineer: "赵二管" },
];

export const INSPECTIONS: InspectionDef[] = [
  { key: "me-seal", device: "主机", point: "轴封与排烟温度" },
  { key: "gen1", device: "发电机#1", point: "运转声响与电压" },
  { key: "gen2", device: "发电机#2", point: "冷却水管路" },
  { key: "pump", device: "泵组", point: "滑油泵/冷却泵压力" },
  { key: "bilge", device: "舱底水", point: "液位与报警装置" },
];
