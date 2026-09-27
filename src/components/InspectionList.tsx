// 巡检清单：逐台勾选 正常 / 异常；勾异常即生成未结事项

import { INSPECTIONS } from "../definitions/parameters";
import { CHECK } from "../state/constants";
import { useStore } from "../state/store";
import { checkStatus } from "../state/utils";
import type { Watch } from "../types";

export function InspectionList({ watch, readOnly }: { watch: Watch; readOnly: boolean }) {
  const { dispatch } = useStore();

  return (
    <ul className="check-list">
      {INSPECTIONS.map((def) => {
        const status = checkStatus(watch, def.key);
        return (
          <li key={def.key} className={`check-row check-${status}`}>
            <div className="check-main">
              <b>{def.device}</b>
              <span>{def.point}</span>
            </div>
            <div className="check-actions">
              {readOnly ? (
                <span className="check-readonly">
                  {status === CHECK.NORMAL
                    ? "✓ 正常"
                    : status === CHECK.ABNORMAL
                      ? "✗ 异常"
                      : "— 未勾选"}
                </span>
              ) : (
                <>
                  <button
                    className={status === CHECK.NORMAL ? "seg seg-on seg-ok" : "seg"}
                    onClick={() =>
                      dispatch({
                        type: "SET_CHECK",
                        watchId: watch.id,
                        checkKey: def.key,
                        status: CHECK.NORMAL,
                      })
                    }
                  >
                    正常
                  </button>
                  <button
                    className={status === CHECK.ABNORMAL ? "seg seg-on seg-bad" : "seg"}
                    onClick={() =>
                      dispatch({
                        type: "SET_CHECK",
                        watchId: watch.id,
                        checkKey: def.key,
                        status: CHECK.ABNORMAL,
                      })
                    }
                  >
                    异常
                  </button>
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
