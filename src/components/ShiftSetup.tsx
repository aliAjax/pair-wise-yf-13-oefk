import { CREWS, SHIFT_SLOTS } from "../domain/definitions";
import type { WatchStore } from "../state/useWatchStore";
import { useState } from "react";
import { todayStr } from "../utils/format";

export function ShiftSetup({ store }: { store: WatchStore }) {
  const { state, shift, isActive, dispatch } = store;
  const [crewId, setCrewId] = useState(CREWS[0]?.id ?? "");
  const [slot, setSlot] = useState<string>(SHIFT_SLOTS[0]);
  const [date, setDate] = useState(todayStr());

  const crewName = (id: string) => state.crews.find((c) => c.id === id)?.name ?? "—";

  return (
    <section className="panel shift-setup">
      <div className="heading">
        <div>
          <p>第一步 · 选定班组开班</p>
          <h2>{shift ? (isActive ? "值更中" : "当前班次") : "值更工作台"}</h2>
        </div>
        {shift && (
          <span className={`status-badge ${isActive ? "live" : "archived"}`}>
            {isActive ? "● 值更中" : "已归档"}
          </span>
        )}
      </div>

      {!shift ? (
        <div className="setup-grid">
          <label>
            <span>值班班组</span>
            <select value={crewId} onChange={(e) => setCrewId(e.target.value)}>
              {CREWS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>值班日期</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>
            <span>班次时段</span>
            <select value={slot} onChange={(e) => setSlot(e.target.value)}>
              {SHIFT_SLOTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <button
            className="primary"
            disabled={!crewId || !date || !slot}
            onClick={() => dispatch({ type: "NEW_SHIFT", crewId, date, slot })}
          >
            开班值更
          </button>
          <p className="hint">
            开班前遗留登记中的未销项会自动并入本班待处理；同一时间只允许一个值更班次。
          </p>
        </div>
      ) : (
        <div className="shift-meta">
          <div>
            <small>班组</small>
            <strong>{crewName(shift.crewId)}</strong>
          </div>
          <div>
            <small>日期</small>
            <strong>{shift.date}</strong>
          </div>
          <div>
            <small>班次</small>
            <strong>{shift.slot}</strong>
          </div>
          <div>
            <small>参数填报</small>
            <strong>
              {store.progress.paramsFilled}/{store.progress.paramsTotal}
            </strong>
          </div>
          <div>
            <small>巡检完成</small>
            <strong>
              {store.progress.inspectionsDone}/{store.progress.inspectionsTotal}
            </strong>
          </div>
          <div>
            <small>未结事项</small>
            <strong className={store.equipmentGroups.length ? "danger-text" : ""}>
              {store.equipmentGroups.reduce((n, g) => n + g.items.length, 0)} 项
            </strong>
          </div>
        </div>
      )}
    </section>
  );
}
