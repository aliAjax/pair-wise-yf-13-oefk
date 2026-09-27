// 归档与历史：归档班次只能翻阅，不可编辑；
// 归档期间发现的新异常仍可登记，进入遗留列表待下一班并入。
// 支持按设备筛选历史记录。

import { useState } from "react";
import { CREWS, INSPECTIONS, PARAMETERS } from "../definitions/parameters";
import { CHECK, ISSUE } from "../state/constants";
import { useStore } from "../state/store";
import { formatTime, poolIssues, watchIssues } from "../state/utils";
import { EmptyHint, Tag } from "./ui";
import { IssuePanel, LegacyAdder } from "./IssuePanel";
import type { Watch } from "../types";

const DEVICE_FILTERS = ["全部", "主机", "发电机#1", "发电机#2", "泵组", "舱底水"];

function watchDevices(watch: Watch): string[] {
  return INSPECTIONS.filter(
    (def) =>
      watch.checks[def.key] === CHECK.NORMAL || watch.checks[def.key] === CHECK.ABNORMAL,
  ).map((def) => def.device);
}

function ArchivedWatch({ watch }: { watch: Watch }) {
  const { state } = useStore();
  const crew = CREWS.find((item) => item.id === watch.crewId);
  const issues = watchIssues(state, watch);

  return (
    <article className="archive-card">
      <header className="archive-head">
        <div>
          <b>
            {crew?.label} · {watch.engineer}
          </b>
          <small>
            {formatTime(watch.startedAt)} 开工
            {watch.handedAt ? ` · ${formatTime(watch.handedAt)} 交班归档` : ""}
          </small>
        </div>
        <Tag tone="muted">已归档 · 只读</Tag>
      </header>

      <div className="archive-readings">
        {PARAMETERS.map((def) => (
          <div key={def.key}>
            <span>{def.name}</span>
            <b>
              {watch.readings[def.key] || "—"} <em>{def.unit}</em>
            </b>
          </div>
        ))}
      </div>

      <ul className="archive-checks">
        {INSPECTIONS.map((def) => {
          const status = watch.checks[def.key];
          return (
            <li key={def.key} className={status === CHECK.ABNORMAL ? "abn" : ""}>
              {def.device} · {def.point}：
              {status === CHECK.NORMAL ? "正常" : status === CHECK.ABNORMAL ? "异常" : "未勾选"}
            </li>
          );
        })}
      </ul>

      {issues.length > 0 ? (
        <div className="archive-issues">
          {issues.map((issue) => (
            <div key={issue.id} className="archive-issue-row">
              <Tag tone={issue.status === ISSUE.OPEN ? "bad" : "ok"}>
                {issue.status === ISSUE.OPEN ? "未结" : "已结"}
              </Tag>
              <span>
                {issue.device} · {issue.title}
                {issue.status === ISSUE.RESOLVED
                  ? `（处理人：${issue.handler}；复测：${issue.recheckReading}）`
                  : ""}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function ArchiveView() {
  const { state } = useStore();
  const [device, setDevice] = useState("全部");
  const archived = state.watches.filter((watch) => watch.status === "handed");
  const filtered =
    device === "全部"
      ? archived
      : archived.filter((watch) => {
          const devices = watchDevices(watch);
          if (device === "主机") return devices.includes("主机");
          return devices.includes(device);
        });
  const pool = poolIssues(state);

  return (
    <div className="archive-view">
      <section className="panel">
        <div className="heading">
          <div>
            <p className="kicker">遗留事项</p>
            <h2>待接班并入（{pool.length}）</h2>
          </div>
        </div>
        <p className="sub-note">
          归档只能翻阅，但新发现的异常仍可登记在此，下一班选定班组开工时自动并入。
        </p>
        <LegacyAdder />
        {pool.length > 0 ? (
          <IssuePanel issues={pool} readOnly={false} />
        ) : (
          <EmptyHint>遗留列表为空。</EmptyHint>
        )}
      </section>

      <section className="panel">
        <div className="heading">
          <div>
            <p className="kicker">历史记录</p>
            <h2>交班归档（只读翻阅）</h2>
          </div>
        </div>
        <div className="chips filter-chips">
          {DEVICE_FILTERS.map((item) => (
            <button
              key={item}
              className={item === device ? "chip-on" : ""}
              onClick={() => setDevice(item)}
            >
              {item}
            </button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <EmptyHint>没有符合筛选条件的归档班次。</EmptyHint>
        ) : (
          <div className="archive-list">
            {filtered.map((watch) => (
              <ArchivedWatch key={watch.id} watch={watch} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
