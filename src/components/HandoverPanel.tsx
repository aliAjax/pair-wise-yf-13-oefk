// 交班确认：有未结事项时按钮保持不可用；摘要逐台提示阻塞项

import { CREWS, INSPECTIONS, PARAMETERS } from "../definitions/parameters";
import { useStore } from "../state/store";
import { handoverBlockers, canHandOver } from "../state/utils";
import { Tag } from "./ui";
import type { Watch } from "../types";

export function HandoverPanel({
  watch,
  onHanded,
}: {
  watch: Watch;
  onHanded: () => void;
}) {
  const { state, dispatch } = useStore();
  const blockers = handoverBlockers(state, watch);
  const ready = canHandOver(blockers);
  const crew = CREWS.find((item) => item.id === watch.crewId);

  return (
    <section className="panel handover-panel">
      <div className="heading">
        <div>
          <p className="kicker">交接班摘要</p>
          <h2>交班确认 · {crew?.label}</h2>
        </div>
        <button
          className="primary handover-btn"
          disabled={!ready}
          onClick={() => {
            dispatch({ type: "HAND_OVER", watchId: watch.id });
            onHanded();
          }}
        >
          确认交班并归档
        </button>
      </div>

      <div className="summary-grid">
        <div className="summary-box">
          <span>四类参数</span>
          {blockers.readings.length === 0 ? (
            <Tag tone="ok">全部已记录</Tag>
          ) : (
            <Tag tone="warn">缺 {blockers.readings.length} 项</Tag>
          )}
          <ul>
            {PARAMETERS.map((def) => {
              const raw = watch.readings[def.key];
              const missing = blockers.readings.includes(def.name);
              return (
                <li key={def.key} className={missing ? "block" : ""}>
                  {def.name}：{missing ? "未填写" : `${raw} ${def.unit}`}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="summary-box">
          <span>巡检勾选</span>
          {blockers.checks.length === 0 ? (
            <Tag tone="ok">逐台已勾选</Tag>
          ) : (
            <Tag tone="warn">{blockers.checks.length} 台未勾</Tag>
          )}
          <ul>
            {INSPECTIONS.map((def) => {
              const status = watch.checks[def.key];
              const done = status === "normal" || status === "abnormal";
              return (
                <li key={def.key} className={done ? "" : "block"}>
                  {def.device}：
                  {status === "normal"
                    ? "正常"
                    : status === "abnormal"
                      ? "异常（见未结事项）"
                      : "未勾选"}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="summary-box issue-summary">
        <span>未结事项（逐台提示）</span>
        {blockers.issues.length === 0 ? (
          <Tag tone="ok">全部处理闭环，可交班</Tag>
        ) : (
          <Tag tone="bad">{blockers.issues.length} 项未结，交班不可用</Tag>
        )}
        {blockers.issues.length > 0 ? (
          <ul>
            {blockers.issues.map((issue) => (
              <li key={issue.id} className="block">
                <b>{issue.device}</b>
                <span>
                  {issue.title}
                  {issue.triggerValue ? `（${issue.triggerValue}）` : ""}
                  {!issue.handler.trim() || !issue.recheckReading.trim() || !issue.note.trim()
                    ? " —— 待补 处理人/复测读数/备注"
                    : " —— 待标记完成"}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {!ready ? (
        <p className="handover-note">
          提示：四项参数填齐、巡检逐台勾选、未结事项全部完成后，才能确认交班。
        </p>
      ) : (
        <p className="handover-note ready">本班记录齐备，交班后将归档为只读。</p>
      )}
    </section>
  );
}
