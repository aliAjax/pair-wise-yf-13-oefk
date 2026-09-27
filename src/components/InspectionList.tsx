import { EQUIPMENTS, INSPECTION_DEFS } from "../domain/definitions";
import type { WatchStore } from "../state/useWatchStore";

export function InspectionList({ store }: { store: WatchStore }) {
  const { shift, isActive, dispatch } = store;
  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>第三步 · 逐台巡检</p>
          <h2>巡检结果勾选</h2>
        </div>
        <span className="muted">
          已完成 {store.progress.inspectionsDone}/{store.progress.inspectionsTotal}
        </span>
      </div>
      <div className="inspection-groups">
        {EQUIPMENTS.map((eq) => {
          const defs = INSPECTION_DEFS.filter((d) => d.equipmentId === eq.id);
          if (defs.length === 0) return null;
          return (
            <div key={eq.id} className="equipment-block">
              <h3>
                <i className="eq-dot" />
                {eq.name}
              </h3>
              <ul className="inspect-list">
                {defs.map((def) => {
                  const rec = shift?.inspections[def.id];
                  const result = rec?.result ?? "未检";
                  return (
                    <li key={def.id} className={`inspect-row result-${result}`}>
                      <span className="inspect-label">{def.label}</span>
                      <div className="inspect-actions">
                        <label className={`check-pill ${result === "正常" ? "on ok" : ""}`}>
                          <input
                            type="radio"
                            name={def.id}
                            disabled={!isActive}
                            checked={result === "正常"}
                            onChange={() =>
                              dispatch({ type: "SET_INSPECTION", defId: def.id, result: "正常", note: rec?.note ?? "" })
                            }
                          />
                          正常
                        </label>
                        <label className={`check-pill ${result === "异常" ? "on bad" : ""}`}>
                          <input
                            type="radio"
                            name={def.id}
                            disabled={!isActive}
                            checked={result === "异常"}
                            onChange={() =>
                              dispatch({ type: "SET_INSPECTION", defId: def.id, result: "异常", note: rec?.note ?? "" })
                            }
                          />
                          异常
                        </label>
                      </div>
                      {result === "异常" && isActive && (
                        <input
                          className="inspect-note"
                          placeholder="补充异常现象（选填，将生成未结事项）"
                          value={rec?.note ?? ""}
                          onChange={(e) =>
                            dispatch({
                              type: "SET_INSPECTION",
                              defId: def.id,
                              result: "异常",
                              note: e.target.value,
                            })
                          }
                        />
                      )}
                      {result === "异常" && !isActive && rec?.note && (
                        <span className="inspect-note-readonly">{rec.note}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
