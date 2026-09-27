// 初始数据：一条已归档的历史班次（仅用于演示“归档只能翻阅”）

import { CREWS, INSPECTIONS } from "../definitions/parameters";
import { CHECK, ISSUE, WATCH } from "./constants";
import type { AppState } from "../types";

const base = Date.now() - 36 * 60 * 60 * 1000;

export function seedState(): AppState {
  const watchId = "watch-seed-001";
  return {
    activeWatchId: null,
    watches: [
      {
        id: watchId,
        crewId: CREWS[1].id,
        engineer: CREWS[1].engineer,
        startedAt: base,
        handedAt: base + 4 * 60 * 60 * 1000,
        status: WATCH.HANDED,
        readings: {
          rpm: "82",
          lubOil: "0.42",
          cooling: "76",
          fuel: "221",
        },
        checks: Object.fromEntries(
          INSPECTIONS.map((item) => [
            item.key,
            item.key === "gen2" ? CHECK.ABNORMAL : CHECK.NORMAL,
          ]),
        ),
      },
    ],
    issues: [
      {
        id: "iss-seed-001",
        origin: "inspection",
        device: "发电机#2",
        title: "发电机#2巡检异常：冷却水管路",
        status: ISSUE.RESOLVED,
        createdAt: base + 40 * 60 * 1000,
        resolvedAt: base + 2 * 60 * 60 * 1000,
        handler: "王大管",
        recheckReading: "冷却水温 74℃，管路无渗漏",
        note: "已紧固管接头并复测，温度回落，交班跟踪。",
        watchId,
      },
    ],
    seeded: true,
  };
}
