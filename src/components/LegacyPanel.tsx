import { useState } from "react";
import { EQUIPMENTS, equipmentName } from "../domain/definitions";
import type { LegacyItem } from "../domain/types";
import type { WatchStore } from "../state/useWatchStore";
import { formatTime } from "../utils/format";

export function LegacyPanel({ store }: { store: WatchStore }) {
  const { state, isActive, dispatch } = store;
  const [equipmentId, setEquipmentId] = useState(EQUIPMENTS[0].id);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");

  const open = state.legacy.filter((l) => l.status === "open");
  const resolved = state.legacy.filter((l) => l.status === "resolved");

  const addDisabled = !equipmentId || !title.trim();

  return (
    <section className="panel legacy">
      <div className="heading">
        <div>
          <p>遗留登记（跨班）</p>
          <h2>未结事项遗留列表</h2>
        </div>
        <span className={`count-pill ${open.length ? "danger" : ""}`}>{open.length} 未销项</span>
      </div>

      <p className="hint">
        归档班次只能翻阅；本班或任何时刻发现的新异常都可在这里登记并入遗留，开班时自动带入新班次处理。
      </p>

      <div className="legacy-add">
        <select value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)}>
          {EQUIPMENTS.map((eq) => (
            <option key={eq.id} value={eq.id}>
              {eq.name}
            </option>
          ))}
        </select>
        <input
          placeholder="异常标题，如 2#发电机冷却水温偏高"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          placeholder="异常描述（选填）"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
        />
        <button
          className="primary"
          disabled={addDisabled}
          onClick={() => {
            dispatch({ type: "ADD_LEGACY", equipmentId, title, detail });
            setTitle("");
            setDetail("");
          }}
        >
          {isActive ? "并入本班待处理" : "登记新异常"}
        </button>
      </div>

      <ul className="legacy-list">
        {[...open, ...resolved].map((l: LegacyItem) => (
          <li key={l.id} className={l.status === "resolved" ? "is-resolved" : ""}>
            <div className="legacy-row">
              <span className="origin-tag">{equipmentName(l.equipmentId)}</span>
              <b>{l.title}</b>
              <span className={`mini-tag ${l.status === "resolved" ? "tag-ok" : "tag-bad"}`}>
                {l.status === "resolved" ? "已销项" : "未销项"}
              </span>
            </div>
            {l.detail && <p className="muted">{l.detail}</p>}
            <p className="muted small">
              登记于 {formatTime(l.carriedAt)}
              {l.sourceLabel ? ` · ${l.sourceLabel}` : ""}
              {l.handler ? ` · 处理人 ${l.handler}` : ""}
              {l.resolvedAt ? ` · 销项 ${formatTime(l.resolvedAt)}` : ""}
            </p>
            {l.remark && <p className="legacy-remark">备注：{l.remark}</p>}
          </li>
        ))}
      </ul>
      {state.legacy.length === 0 && <p className="empty-line">遗留列表为空。</p>}
    </section>
  );
}
