import type { R2ExplorerNode } from "./explorer.types";
export declare function ExplorerTable({ nodes, selectedNodeId, onSelect, onOpen }: {
    nodes: R2ExplorerNode[];
    selectedNodeId: string | null;
    onSelect: (id: string) => void;
    onOpen: (id: string) => void;
}): import("react/jsx-runtime").JSX.Element;
