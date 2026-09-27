import { useState } from "react";
import { equipmentName } from "../domain/definitions";
import type { WatchStore } from "../state/useWatchStore";

export function HandoverPanel({ store }: { store: WatchStore }) {
  const { shift, isActive, handover, dispatch } = store;
  const [archiveNote, setArchiveNote] = useState("");
  const [archiving, setArchiving] = useState(false);

  if (!shift) return null;

  return (
    <section className="panel handover">
      <div className="heading">
        <div>
          <p>交班确认</p>
          <h2>交接班摘要</h2>
        </div>
        <span className={`status-badge ${shift.handoverConfirmed ? "archived" : "live"}`}>
          {shift.handoverConfirmed ? "已确认交班" : "未确认"}
        </span>
      </div>

      <div className="summary-grid">
        <div>
          <small>参数填报</small>
          <strong>
            {store.progress.paramsFilled}/{store.progress.paramsTotal}
          </strong>
          {store.progress.paramsFilled < store.progress.paramsTotal && <em className="warn-text"> 有漏记</em>}
        </div>
        <div>
          <small>巡检完成</small>
          <strong>
            {store.progress.inspectionsDone}/{store.progress.inspectionsTotal}
          </strong>
          {store.progress.inspectionsDone < store.progress.inspectionsTotal && (
            <em className="warn-text"> 有漏检</em>
          )}
        </div>
        <div>
          <small>未结事项</small>
          <strong className={handover.ok ? "" : "danger-text"}>
            {store.equipmentGroups.reduce((n, g) => n + g.items.length, 0)} 项
          </strong>
        </div>
      </div>

      <div className="equipment-summary">
        <h3>逐台未结提示</h3>
        {store.equipmentGroups.length === 0 ? (
          <p className="empty-line ok-line">各设备均无未结事项，可以交班。</p>
        ) : (
          <ul>
            {store.equipmentGroups.map((g) => (
              <li key={g.equipmentId}>
                <b>{equipmentName(g.equipmentId)}</b>
                <span>
                  {g.items.length} 项：{g.items.map((i) => i.title).join("；")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isActive && !shift.handoverConfirmed && (
        <>
          {!handover.ok && (
            <ul className="block-reasons">
              {handover.reasons.map((r) => (
                <li key={r}>⛔ {r}</li>
              ))}
            </ul>
          )}
          <button
            className="primary big-btn"
            disabled={!handover.ok}
            title={handover.ok ? "" : handover.reasons.join("；")}
            onClick={() => dispatch({ type: "CONFIRM_HANDOVER" })}
          >
            交班确认
          </button>
        </>
      )}

      {isActive && shift.handoverConfirmed && !archiving && (
        <div className="archive-flow">
          <p className="ok-line">交班已确认。补充归档备注后封班，封班后内容只能翻阅。</p>
          <button className="primary" onClick={() => setArchiving(true)}>
            归档封班
          </button>
        </div>
      )}

      {isActive && shift.handoverConfirmed && archiving && (
        <div className="carry-box">
          <input
            placeholder="归档备注（选填，如接班班组、整体工况）"
            value={archiveNote}
            onChange={(e) => setArchiveNote(e.target.value)}
          />
          <button
            className="warn-btn"
            onClick={() => dispatch({ type: "ARCHIVE_SHIFT", note: archiveNote })}
          >
            确认归档（不可再改）
          </button>
        </div>
      )}
    </section>
  );
}
