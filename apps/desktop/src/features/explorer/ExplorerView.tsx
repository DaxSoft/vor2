import { useMemo } from "react";
import { Breadcrumb } from "./Breadcrumb";
import { DetailsPanel } from "./DetailsPanel";
import { ExplorerTable } from "./ExplorerTable";
import { FolderTree } from "./FolderTree";
import { useExplorerStore } from "./explorer.store";

export function ExplorerView() {
  const nodes = useExplorerStore((state) => state.nodes);
  const currentPath = useExplorerStore((state) => state.currentPath);
  const selectedNodeId = useExplorerStore((state) => state.selectedNodeId);
  const isLoading = useExplorerStore((state) => state.isLoading);
  const error = useExplorerStore((state) => state.error);
  const loadPath = useExplorerStore((state) => state.loadPath);
  const openNode = useExplorerStore((state) => state.openNode);
  const selectNode = useExplorerStore((state) => state.selectNode);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId),
    [nodes, selectedNodeId]
  );

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[280px_1fr_320px] gap-3">
      <aside className="glass-panel rounded-panel border border-app-border p-3">
        <FolderTree
          nodes={nodes}
          onOpen={(id) => {
            void openNode(id);
          }}
        />
      </aside>

      <section className="glass-panel flex min-h-0 flex-col rounded-panel border border-app-border p-3">
        <div className="mb-3">
          <Breadcrumb currentPath={currentPath} onOpen={(path) => void loadPath(path)} />
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          {isLoading ? <p className="text-xs text-app-muted">Loading...</p> : null}
          {error ? <p className="text-xs text-rose-300">{error}</p> : null}
          {!isLoading && !error ? (
            <ExplorerTable
              nodes={nodes}
              selectedNodeId={selectedNodeId}
              onSelect={selectNode}
              onOpen={(id) => void openNode(id)}
            />
          ) : null}
        </div>
      </section>

      <aside className="glass-panel rounded-panel border border-app-border p-3">
        <DetailsPanel node={selectedNode} />
      </aside>
    </div>
  );
}
