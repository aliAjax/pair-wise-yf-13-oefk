// 班组选择条：选定班组后开工，自动并入遗留未结事项

import { CREWS } from "../definitions/parameters";
import { useStore } from "../state/store";
import { formatTime } from "../state/utils";

export function CrewBar() {
  const { state, dispatch } = useStore();
  const active = state.watches.find((watch) => watch.id === state.activeWatchId);
  const crew = active ? CREWS.find((item) => item.id === active.crewId) : null;

  if (active && crew) {
    return (
      <div className="crew-bar active">
        <div>
          <span className="crew-label">当前值更班组</span>
          <strong>
            {crew.label} · {crew.engineer}
          </strong>
          <small>
            {crew.time} ｜ {formatTime(active.startedAt)} 开工
          </small>
        </div>
        <span className="live-dot">值更中</span>
      </div>
    );
  }

  return (
    <div className="crew-bar">
      <div className="crew-pick-label">
        <span className="crew-label">接班开工</span>
        <strong>请选定班组后开始记录四类机舱参数</strong>
      </div>
      <div className="crew-buttons">
        {CREWS.map((item) => (
          <button
            key={item.id}
            className="crew-btn"
            onClick={() => dispatch({ type: "START_WATCH", crewId: item.id })}
          >
            <b>{item.label}</b>
            <small>
              {item.time} · {item.engineer}
            </small>
          </button>
        ))}
      </div>
    </div>
  );
}
