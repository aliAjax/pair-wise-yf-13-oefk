// 机舱参数看板：四类参数写入，越限实时标红并联动未结事项

import { PARAMETERS } from "../definitions/parameters";
import { useStore } from "../state/store";
import { describeValue, judgeValue } from "../state/utils";
import { Tag } from "./ui";
import type { Watch } from "../types";

export function ParameterBoard({ watch, readOnly }: { watch: Watch; readOnly: boolean }) {
  const { dispatch } = useStore();

  return (
    <div className="param-grid">
      {PARAMETERS.map((def) => {
        const raw = watch.readings[def.key];
        const valueState = judgeValue(def.key, raw);
        const invalid = raw !== undefined && raw.trim() !== "" && Number.isNaN(Number(raw));
        return (
          <article
            key={def.key}
            className={`param-card state-${valueState}${invalid ? " state-invalid" : ""}`}
          >
            <div className="param-head">
              <span>{def.name}</span>
              {valueState === "normal" ? (
                <Tag tone="ok">正常</Tag>
              ) : valueState === "low" || valueState === "high" ? (
                <Tag tone="bad">{valueState === "low" ? "低于下限" : "高于上限"}</Tag>
              ) : invalid ? (
                <Tag tone="warn">请填数字</Tag>
              ) : (
                <Tag tone="muted">未记录</Tag>
              )}
            </div>
            <div className="param-input-row">
              {readOnly ? (
                <strong className="param-readonly">{raw || "—"}</strong>
              ) : (
                <input
                  type="number"
                  inputMode="decimal"
                  step={def.step}
                  value={raw ?? ""}
                  placeholder="填写读数"
                  onChange={(event) =>
                    dispatch({
                      type: "ENTER_READING",
                      watchId: watch.id,
                      key: def.key,
                      value: event.target.value,
                    })
                  }
                />
              )}
              <em>{def.unit}</em>
            </div>
            <small className="param-hint">
              {invalid ? "读数需为数字" : def.hint}
              {valueState === "low" || valueState === "high"
                ? ` · ${describeValue(valueState, def.key)}，已生成未结事项`
                : ""}
            </small>
          </article>
        );
      })}
    </div>
  );
}
