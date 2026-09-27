import { useState } from "react";
import "./styles.css";
import { ShiftSetup } from "./components/ShiftSetup";
import { ParamBoard } from "./components/ParamBoard";
import { InspectionList } from "./components/InspectionList";
import { OpenItemsPanel } from "./components/OpenItemsPanel";
import { HandoverPanel } from "./components/HandoverPanel";
import { LegacyPanel } from "./components/LegacyPanel";
import { HistoryPanel } from "./components/HistoryPanel";
import { useWatchStore } from "./state/useWatchStore";
import { clearState } from "./services/storage";

type Tab = "watch" | "legacy" | "history";

const TABS: { id: Tab; label: string }[] = [
  { id: "watch", label: "值更工作台" },
  { id: "legacy", label: "遗留登记" },
  { id: "history", label: "历史归档" },
];

export default function App() {
  const store = useWatchStore();
  const [tab, setTab] = useState<Tab>("watch");
  const openCount = store.equipmentGroups.reduce((n, g) => n + g.items.length, 0);

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
          <h1>机舱值更工作台</h1>
          <span className="local-tag">数据仅存本机浏览器（localStorage）</span>
        </div>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? "tab-on" : ""}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.id === "watch" && openCount > 0 && <i className="tab-dot">{openCount}</i>}
              {t.id === "legacy" &&
                store.state.legacy.filter((l) => l.status === "open").length > 0 && (
                  <i className="tab-dot">
                    {store.state.legacy.filter((l) => l.status === "open").length}
                  </i>
                )}
            </button>
          ))}
        </nav>
        <button
          className="ghost-btn"
          title="清空本机全部值班数据"
          onClick={() => {
            if (window.confirm("确定清空本机保存的全部班次、事项与遗留数据？此操作不可恢复。")) {
              clearState();
              window.location.reload();
            }
          }}
        >
          清空本机数据
        </button>
      </header>

      {tab === "watch" && (
        <div className="layout">
          <div className="col-main">
            <ShiftSetup store={store} />
            {store.shift && (
              <>
                <ParamBoard store={store} />
                <InspectionList store={store} />
                <HandoverPanel store={store} />
              </>
            )}
          </div>
          <div className="col-side">{store.shift && <OpenItemsPanel store={store} />}</div>
        </div>
      )}

      {tab === "legacy" && <LegacyPanel store={store} />}
      {tab === "history" && <HistoryPanel store={store} />}

      <footer className="foot-note">
        参数定义（src/domain/definitions.ts）、状态流转（src/domain/engine.ts）、界面（src/components）
        分层维护；调整安全界限无需改动流转与界面。
      </footer>
    </main>
  );
}
