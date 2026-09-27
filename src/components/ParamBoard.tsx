import { EQUIPMENTS, PARAM_DEFS } from "../domain/definitions";
import type { WatchStore } from "../state/useWatchStore";
import type { ParamDef } from "../domain/types";

function ParamInput({ def, store }: { def: ParamDef; store: WatchStore }) {
  const { shift, isActive, dispatch } = store;
  const rec = shift?.params[def.id];
  const status = rec?.status ?? "未填";
  return (
    <div className={`param-cell status-${status}`}>
      <div className="param-head">
        <span className="param-name">{def.name}</span>
        <span className={`param-badge badge-${status}`}>
          {status === "越限" ? "越限" : status === "正常" ? "正常" : "未填"}
        </span>
      </div>
      <div className="param-input-row">
        <input
          type="number"
          inputMode="decimal"
          step="any"
          disabled={!isActive}
          value={rec?.raw ?? ""}
          placeholder="读数"
          onChange={(e) => dispatch({ type: "SET_READING", defId: def.id, raw: e.target.value })}
        />
        <em>{def.unit}</em>
      </div>
      <small className="param-limit">
        安全界限 {def.min} ~ {def.max} {def.unit}
      </small>
    </div>
  );
}

export function ParamBoard({ store }: { store: WatchStore }) {
  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>第二步 · 机舱参数看板</p>
          <h2>四类参数填报</h2>
        </div>
        <span className="muted">转速 · 压力 · 温度 · 流量</span>
      </div>
      <div className="equipment-groups">
        {EQUIPMENTS.map((eq) => {
          const defs = PARAM_DEFS.filter((p) => p.equipmentId === eq.id);
          if (defs.length === 0) return null;
          return (
            <div key={eq.id} className="equipment-block">
              <h3>
                <i className="eq-dot" />
                {eq.name}
              </h3>
              <div className="param-grid">
                {defs.map((def) => (
                  <ParamInput key={def.id} def={def} store={store} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {!store.isActive && (
        <p className="hint">当前班次已归档，参数记录只能翻阅，不能修改。</p>
      )}
    </section>
  );
}
