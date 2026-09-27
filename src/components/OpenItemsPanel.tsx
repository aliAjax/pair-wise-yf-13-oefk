import { useState } from "react";
import { equipmentName, paramDefById } from "../domain/definitions";
import type { OpenItem } from "../domain/types";
import type { WatchStore } from "../state/useWatchStore";
import { formatTime } from "../utils/format";

const ORIGIN_TAG: Record<OpenItem["origin"], string> = {
  参数越限: "参数越限",
  巡检异常: "巡检异常",
  遗留并入: "遗留并入",
};

function ItemCard({ item, store }: { item: OpenItem; store: WatchStore }) {
  const { isActive, dispatch } = store;
  const [carryOpen, setCarryOpen] = useState(false);
  const [carryNote, setCarryNote] = useState("");
  const blockers = store.completeBlockers(item);
  const def = item.origin === "参数越限" ? paramDefById(item.sourceRef) : undefined;

  return (
    <article className={`item-card origin-${item.origin === "参数越限" ? "alarm" : item.origin === "巡检异常" ? "warn" : "legacy"}`}>
      <header>
        <div className="item-title-row">
          <span className="origin-tag">{ORIGIN_TAG[item.origin]}</span>
          <h4>{item.title}</h4>
        </div>
        <span className="muted">{equipmentName(item.equipmentId)} · {formatTime(item.createdAt)}</span>
      </header>
      <p className="item-detail">{item.detail}</p>

      {item.status === "open" ? (
        <>
          <div className="item-fields">
            <label className={item.handler.trim() ? "" : "missing"}>
              <span>处理人 *</span>
              <input
                disabled={!isActive}
                value={item.handler}
                placeholder="填写处理人"
                onChange={(e) => dispatch({ type: "PATCH_ITEM", id: item.id, field: "handler", value: e.target.value })}
              />
            </label>
            <label className={item.retest.trim() ? "" : "missing"}>
              <span>复测读数 {def ? `(${def.min}~${def.max} ${def.unit})` : ""}*</span>
              <input
                disabled={!isActive}
                value={item.retest}
                placeholder={def ? `复测值，须回到界限内` : "填写复测情况"}
                onChange={(e) => dispatch({ type: "PATCH_ITEM", id: item.id, field: "retest", value: e.target.value })}
              />
            </label>
            <label className={item.remark.trim() ? "" : "missing"}>
              <span>处理备注 *</span>
              <input
                disabled={!isActive}
                value={item.remark}
                placeholder="处理过程与结论"
                onChange={(e) => dispatch({ type: "PATCH_ITEM", id: item.id, field: "remark", value: e.target.value })}
              />
            </label>
          </div>

          {isActive && blockers.length > 0 && (
            <p className="blockers">完成前还缺：{blockers.join("、")}</p>
          )}

          {isActive && (
            <div className="item-actions">
              <button
                className="primary"
                disabled={blockers.length > 0}
                title={blockers.join("、")}
                onClick={() => dispatch({ type: "COMPLETE_ITEM", id: item.id })}
              >
                完成
              </button>
              <button onClick={() => setCarryOpen((v) => !v)}>移交遗留</button>
            </div>
          )}

          {isActive && carryOpen && (
            <div className="carry-box">
              <input
                placeholder="交接说明（必填），将进入遗留登记"
                value={carryNote}
                onChange={(e) => setCarryNote(e.target.value)}
              />
              <button
                className="warn-btn"
                disabled={!carryNote.trim()}
                onClick={() => {
                  dispatch({ type: "CARRY_ITEM", id: item.id, handoverNote: carryNote });
                  setCarryOpen(false);
                  setCarryNote("");
                }}
              >
                确认移交
              </button>
            </div>
          )}
        </>
      ) : (
        <footer className="item-resolved">
          <span className="resolved-tag">已完成 {formatTime(item.resolvedAt)}</span>
          <span>处理人：{item.handler}</span>
          <span>复测：{item.retest}</span>
          <span>备注：{item.remark}</span>
        </footer>
      )}
    </article>
  );
}

export function OpenItemsPanel({ store }: { store: WatchStore }) {
  const { shift } = store;
  const items = shift?.items ?? [];
  const open = items.filter((i) => i.status === "open");
  const resolved = items.filter((i) => i.status === "resolved");

  return (
    <section className="panel open-items">
      <div className="heading">
        <div>
          <p>未结事项</p>
          <h2>异常处置台</h2>
        </div>
        <span className={`count-pill ${open.length ? "danger" : ""}`}>{open.length} 未结 / {resolved.length} 已结</span>
      </div>

      {items.length === 0 ? (
        <p className="empty-line">暂无事项：参数越限或勾选巡检异常时会自动在此生成。</p>
      ) : (
        <div className="item-stack">
          {open.map((item) => (
            <ItemCard key={item.id} item={item} store={store} />
          ))}
          {resolved.length > 0 && (
            <details className="resolved-fold">
              <summary>本班已完成（{resolved.length}）</summary>
              {resolved.map((item) => (
                <ItemCard key={item.id} item={item} store={store} />
              ))}
            </details>
          )}
        </div>
      )}
    </section>
  );
}
