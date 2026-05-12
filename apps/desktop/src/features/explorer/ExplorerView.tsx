import { useMemo } from "react";
import { Breadcrumb } from "./Breadcrumb";
import { DetailsPanel } from "./DetailsPanel";
import { ExplorerTable } from "./ExplorerTable";
import { useExplorerStore } from "./explorer.store";

export function ExplorerView() {
  const nodes = useExplorerStore((state) => state.nodes);
  const currentPath = useExplorerStore((state) => state.currentPath);
  const selectedNodeId = useExplorerStore((state) => state.selectedNodeId);
  const isLoading = useExplorerStore((state) => state.isLoading);
  const error = useExplorerStore((state) => state.error);
  const searchQuery = useExplorerStore((state) => state.searchQuery);
  const deleteNode = useExplorerStore((state) => state.deleteNode);
  const loadPath = useExplorerStore((state) => state.loadPath);
  const openNode = useExplorerStore((state) => state.openNode);
  const selectNode = useExplorerStore((state) => state.selectNode);

  const visibleNodes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return nodes;
    }
    return nodes.filter((node) => node.name.toLowerCase().includes(query) || node.key.toLowerCase().includes(query));
  }, [nodes, searchQuery]);

  const selectedNode = useMemo(
    () => visibleNodes.find((node) => node.id === selectedNodeId),
    [visibleNodes, selectedNodeId]
  );

  const selectedFile = selectedNode?.kind === "file" ? selectedNode : null;

  return (
    <div className={`grid min-h-0 flex-1 gap-3 ${selectedFile ? "grid-cols-[1fr_320px]" : "grid-cols-1"}`}>
      <section className="glass-panel flex min-h-0 flex-col rounded-panel border border-app-border p-3">
        <div className="mb-3">
          <Breadcrumb currentPath={currentPath} onOpen={(path) => void loadPath(path)} />
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          {isLoading ? <p className="text-xs text-app-muted">Loading...</p> : null}
          {error ? <p className="text-xs text-rose-300">{error}</p> : null}
          {!isLoading && !error ? (
            <ExplorerTable nodes={visibleNodes} selectedNodeId={selectedNodeId} onSelect={selectNode} onOpen={(id) => void openNode(id)} />
          ) : null}
        </div>
      </section>

      {selectedFile ? (
        <aside className="glass-panel rounded-panel border border-app-border p-3">
          <DetailsPanel
            node={selectedFile}
            onDelete={async (key) => {
              await deleteNode(key);
            }}
          />
        </aside>
      ) : null}
    </div>
  );
}
