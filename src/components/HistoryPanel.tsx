import { useMemo, useState } from "react";
import {
  EQUIPMENTS,
  INSPECTION_DEFS,
  PARAM_DEFS,
  equipmentName,
} from "../domain/definitions";
import type { ShiftRecord } from "../domain/types";
import type { WatchStore } from "../state/useWatchStore";
import { formatTime } from "../utils/format";

function ShiftDetail({ shift, crewName }: { shift: ShiftRecord; crewName: string }) {
  const readOnly = shift.status === "archived";
  return (
    <article className={`shift-detail ${readOnly ? "readonly" : ""}`}>
      <header>
        <div>
          <h3>
            {shift.date} {shift.slot} · {crewName}
          </h3>
          <p className="muted small">
            开班 {formatTime(shift.startedAt)}
            {shift.archivedAt ? ` · 归档 ${formatTime(shift.archivedAt)}` : ""}
            {shift.handoverConfirmed ? " · 已交班确认" : ""}
          </p>
        </div>
        {readOnly && <span className="mini-tag tag-ok">归档只读</span>}
      </header>

      <div className="detail-section">
        <h4>参数读数</h4>
        <table>
          <thead>
            <tr>
              <th>设备</th>
              <th>参数</th>
              <th>读数</th>
              <th>界限</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {PARAM_DEFS.map((def) => {
              const rec = shift.params[def.id];
              return (
                <tr key={def.id} className={rec?.status === "越限" ? "row-alarm" : ""}>
                  <td>{equipmentName(def.equipmentId)}</td>
                  <td>{def.name}</td>
                  <td>
                    {rec?.value === null || rec?.value === undefined
                      ? "—"
                      : `${rec.value} ${def.unit}`}
                  </td>
                  <td>
                    {def.min}~{def.max}
                  </td>
                  <td>{rec?.status ?? "未填"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="detail-section">
        <h4>巡检结果</h4>
        <ul className="detail-inspections">
          {INSPECTION_DEFS.map((def) => {
            const rec = shift.inspections[def.id];
            return (
              <li key={def.id} className={`result-${rec?.result ?? "未检"}`}>
                <span>{equipmentName(def.equipmentId)} · {def.label}</span>
                <b>{rec?.result ?? "未检"}</b>
                {rec?.note ? <em>{rec.note}</em> : null}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="detail-section">
        <h4>事项（{shift.items.length}）</h4>
        {shift.items.length === 0 ? (
          <p className="empty-line">本班无异常事项。</p>
        ) : (
          <ul className="detail-items">
            {shift.items.map((i) => (
              <li key={i.id}>
                <div className="legacy-row">
                  <span className="origin-tag">{i.origin}</span>
                  <b>{i.title}</b>
                  <span className={`mini-tag ${i.status === "resolved" ? "tag-ok" : "tag-bad"}`}>
                    {i.status === "resolved" ? "已完成" : "未结"}
                  </span>
                </div>
                <p className="muted small">{i.detail}</p>
                {i.status === "resolved" && (
                  <p className="muted small">
                    处理人 {i.handler} · 复测 {i.retest} · 备注 {i.remark}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {shift.archivedNote && (
        <div className="detail-section">
          <h4>归档备注</h4>
          <p className="muted">{shift.archivedNote}</p>
        </div>
      )}
    </article>
  );
}

export function HistoryPanel({ store }: { store: WatchStore }) {
  const { state } = store;
  const [equipmentFilter, setEquipmentFilter] = useState<string>("all");

  const crewName = (id: string) => state.crews.find((c) => c.id === id)?.name ?? "—";

  const filtered = useMemo(() => {
    return state.shifts
      .map((s) => {
        if (equipmentFilter === "all") return s;
        const hasParam = PARAM_DEFS.some((d) => d.equipmentId === equipmentFilter && s.params[d.id]?.value !== null);
        const hasInspection = INSPECTION_DEFS.some(
          (d) => d.equipmentId === equipmentFilter && s.inspections[d.id]?.result !== "未检"
        );
        const hasItem = s.items.some((i) => i.equipmentId === equipmentFilter);
        return hasParam || hasInspection || hasItem ? s : null;
      })
      .filter((s): s is ShiftRecord => s !== null);
  }, [state.shifts, equipmentFilter]);

  return (
    <section className="panel history">
      <div className="heading">
        <div>
          <p>历史班次</p>
          <h2>归档翻阅与筛选</h2>
        </div>
        <div className="filter-chips">
          <button
            className={equipmentFilter === "all" ? "chip-on" : ""}
            onClick={() => setEquipmentFilter("all")}
          >
            全部
          </button>
          {EQUIPMENTS.map((eq) => (
            <button
              key={eq.id}
              className={equipmentFilter === eq.id ? "chip-on" : ""}
              onClick={() => setEquipmentFilter(eq.id)}
            >
              {eq.name}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="empty-line">暂无符合条件的班次记录。</p>
      ) : (
        <div className="shift-stack">
          {filtered.map((s) => (
            <ShiftDetail key={s.id} shift={s} crewName={crewName(s.crewId)} />
          ))}
        </div>
      )}
    </section>
  );
}
