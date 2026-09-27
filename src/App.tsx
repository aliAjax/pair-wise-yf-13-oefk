import { useState } from "react";
import { StoreProvider, useStore } from "./state/store";
import { CrewBar } from "./components/CrewBar";
import { ParameterBoard } from "./components/ParameterBoard";
import { InspectionList } from "./components/InspectionList";
import { IssuePanel } from "./components/IssuePanel";
import { HandoverPanel } from "./components/HandoverPanel";
import { ArchiveView } from "./components/ArchiveView";
import { Panel } from "./components/ui";
import { openIssues, poolIssues, watchIssues } from "./state/utils";
import "./styles.css";

type Tab = "watch" | "archive";

function Workspace() {
  const { state } = useStore();
  const [tab, setTab] = useState<Tab>("watch");
  const active = state.watches.find((watch) => watch.id === state.activeWatchId) ?? null;
  const activeIssues = active ? watchIssues(state, active) : [];
  const openCount = openIssues(activeIssues).length + poolIssues(state).length;

  return (
    <main className="app">
      <header className="topbar">
        <div>
          <p className="kicker">轮机值更工作台</p>
          <h1>机舱读数 · 巡检勾选 · 交班闭环</h1>
        </div>
        <nav className="tabs">
          <button
            className={tab === "watch" ? "tab-on" : ""}
            onClick={() => setTab("watch")}
          >
            值更工作台
          </button>
          <button
            className={tab === "archive" ? "tab-on" : ""}
            onClick={() => setTab("archive")}
          >
            归档与遗留
            {openCount > 0 ? <span className="tab-badge">{openCount}</span> : null}
          </button>
        </nav>
      </header>

      {tab === "watch" ? (
        <>
          <CrewBar />
          {active ? (
            <>
              <Panel title="机舱参数看板" subtitle="四类参数 · 越安全界限自动生成未结事项">
                <ParameterBoard watch={active} readOnly={false} />
              </Panel>

              <div className="two-col">
                <Panel title="巡检清单" subtitle="逐台勾选，勾“异常”即开事项">
                  <InspectionList watch={active} readOnly={false} />
                </Panel>
                <Panel
                  title={`未结事项（${openIssues(activeIssues).length}）`}
                  subtitle="处理人 / 复测读数 / 备注齐套才可完成"
                >
                  <IssuePanel issues={activeIssues} readOnly={false} />
                </Panel>
              </div>

              <HandoverPanel watch={active} onHanded={() => setTab("archive")} />
            </>
          ) : (
            <Panel title="等待接班" subtitle="尚未开始值更">
              <p className="sub-note">
                请在上方选定班组开工。开工后遗留未结事项将自动并入本班，全部闭环后方可交班。
              </p>
            </Panel>
          )}
        </>
      ) : (
        <ArchiveView />
      )}

      <footer className="footnote">
        数据仅保存在本机浏览器（localStorage），不联网上传。参数定义见
        src/definitions，状态流转见 src/state，界面见 src/components。
      </footer>
    </main>
  );
}

function App() {
  return (
    <StoreProvider>
      <Workspace />
    </StoreProvider>
  );
}

export default App;
