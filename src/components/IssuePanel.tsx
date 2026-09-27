// 未结事项 / 遗留事项面板
// open 事项必须填齐 处理人 + 复测读数 + 备注，完成按钮才可用

import { useState } from "react";
import { issueOriginLabel } from "../state/reducer";
import { useStore } from "../state/store";
import { formatTime } from "../state/utils";
import { EmptyHint, Tag } from "./ui";
import type { Issue } from "../types";

function IssueCard({ issue, readOnly }: { issue: Issue; readOnly: boolean }) {
  const { dispatch } = useStore();
  const missing =
    !issue.handler.trim() || !issue.recheckReading.trim() || !issue.note.trim();

  return (
    <article className={`issue-card ${issue.status === "open" ? "is-open" : "is-done"}`}>
      <div className="issue-head">
        <div>
          <b>{issue.title}</b>
          <div className="issue-meta">
            <Tag tone={issue.status === "open" ? "bad" : "ok"}>
              {issue.status === "open" ? "未结" : "已结"}
            </Tag>
            <Tag tone="info">{issueOriginLabel[issue.origin]}</Tag>
            <span className="issue-device">{issue.device}</span>
            <span className="issue-time">{formatTime(issue.createdAt)} 登记</span>
          </div>
        </div>
        {issue.triggerValue ? <span className="trigger">{issue.triggerValue}</span> : null}
      </div>

      {issue.status === "open" ? (
        <div className="issue-form">
          <label>
            <span>
              处理人 <em>*</em>
            </span>
            <input
              value={issue.handler}
              disabled={readOnly}
              placeholder="填写处理人姓名"
              onChange={(event) =>
                dispatch({
                  type: "PATCH_ISSUE",
                  issueId: issue.id,
                  patch: { handler: event.target.value },
                })
              }
            />
          </label>
          <label>
            <span>
              复测读数 <em>*</em>
            </span>
            <input
              value={issue.recheckReading}
              disabled={readOnly}
              placeholder="如：冷却水温 74℃"
              onChange={(event) =>
                dispatch({
                  type: "PATCH_ISSUE",
                  issueId: issue.id,
                  patch: { recheckReading: event.target.value },
                })
              }
            />
          </label>
          <label className="issue-note">
            <span>
              处理备注 <em>*</em>
            </span>
            <textarea
              rows={2}
              value={issue.note}
              disabled={readOnly}
              placeholder="描述处置过程与交班提示"
              onChange={(event) =>
                dispatch({
                  type: "PATCH_ISSUE",
                  issueId: issue.id,
                  patch: { note: event.target.value },
                })
              }
            />
          </label>
          <div className="issue-foot">
            {missing ? (
              <small className="need-hint">处理人、复测读数、备注缺一项不可完成</small>
            ) : (
              <small className="ready-hint">三项已齐，可标记完成</small>
            )}
            <button
              className="primary"
              disabled={missing || readOnly}
              onClick={() => dispatch({ type: "RESOLVE_ISSUE", issueId: issue.id })}
            >
              标记完成
            </button>
          </div>
        </div>
      ) : (
        <dl className="issue-result">
          <div>
            <dt>处理人</dt>
            <dd>{issue.handler}</dd>
          </div>
          <div>
            <dt>复测读数</dt>
            <dd>{issue.recheckReading}</dd>
          </div>
          <div>
            <dt>备注</dt>
            <dd>{issue.note}</dd>
          </div>
          {issue.resolvedAt ? (
            <div>
              <dt>完成时间</dt>
              <dd>{formatTime(issue.resolvedAt)}</dd>
            </div>
          ) : null}
        </dl>
      )}
    </article>
  );
}

/** 手工补登异常（参数/巡检之外发现的新异常，并入遗留列表） */
export function LegacyAdder() {
  const { dispatch } = useStore();
  const [device, setDevice] = useState("");
  const [title, setTitle] = useState("");
  const [saved, setSaved] = useState(false);

  function submit() {
    if (!device.trim() || !title.trim()) return;
    dispatch({ type: "ADD_LEGACY", device, title });
    setDevice("");
    setTitle("");
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="legacy-adder">
      <label>
        <span>设备 / 部位</span>
        <input
          value={device}
          placeholder="如：发电机#2"
          onChange={(event) => setDevice(event.target.value)}
        />
      </label>
      <label>
        <span>异常情况</span>
        <input
          value={title}
          placeholder="如：排烟温度间歇偏高"
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <button className="ghost" disabled={!device.trim() || !title.trim()} onClick={submit}>
        并入遗留列表
      </button>
      {saved ? <small className="ready-hint">已登记，新班开工时自动并入</small> : null}
    </div>
  );
}

export function IssuePanel({
  issues,
  readOnly,
  showAdder,
}: {
  issues: Issue[];
  readOnly: boolean;
  showAdder?: boolean;
}) {
  const open = issues.filter((issue) => issue.status === "open");
  const done = issues.filter((issue) => issue.status === "resolved");

  return (
    <div className="issue-panel">
      {showAdder ? <LegacyAdder /> : null}
      {issues.length === 0 ? (
        <EmptyHint>暂无未结事项。参数越限、巡检勾异常或手工补登后在此处理。</EmptyHint>
      ) : null}
      {open.length > 0 ? (
        <>
          <h4 className="issue-group-title">未结事项（{open.length}）</h4>
          {open.map((issue) => (
            <IssueCard key={issue.id} issue={issue} readOnly={readOnly} />
          ))}
        </>
      ) : null}
      {done.length > 0 ? (
        <>
          <h4 className="issue-group-title">本班已结（{done.length}）</h4>
          {done.map((issue) => (
            <IssueCard key={issue.id} issue={issue} readOnly />
          ))}
        </>
      ) : null}
    </div>
  );
}
