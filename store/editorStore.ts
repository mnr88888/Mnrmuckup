"use client";

import { create } from "zustand";
import type { LayerData, ProjectState, LayerTransform } from "@/types";
import { createLayer, DEFAULT_COLOR_ADJUSTMENT, DEFAULT_TRANSFORM } from "@/types";

type EditorStore = {
  layers: LayerData[];
  selectedLayerId: string | null;
  mockupId: string;
  background: "transparent" | "white" | "black";
  history: LayerData[][];
  historyIndex: number;
  projectId: string | null;
  projectName: string;

  setMockupId: (id: string) => void;
  setProjectId: (id: string | null) => void;
  setProjectName: (name: string) => void;
  setBackground: (bg: "transparent" | "white" | "black") => void;

  addLayer: (layer: LayerData) => void;
  removeLayer: (id: string) => void;
  duplicateLayer: (id: string) => void;
  updateLayer: (id: string, patch: Partial<LayerData>) => void;
  updateTransform: (id: string, patch: Partial<LayerTransform>) => void;
  selectLayer: (id: string | null) => void;
  reorderLayer: (id: string, direction: "up" | "down") => void;
  moveLayerTo: (id: string, toIndex: number) => void;

  loadLayers: (layers: LayerData[], projectId?: string | null, name?: string) => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  getSelectedLayer: () => LayerData | null;
};

function snapshot(layers: LayerData[]): LayerData[] {
  return layers.map((l) => ({
    ...l,
    transform: { ...l.transform, offset: { ...l.transform.offset } },
    colorAdjustment: { ...l.colorAdjustment },
  }));
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  layers: [],
  selectedLayerId: null,
  mockupId: "",
  background: "transparent",
  history: [[]],
  historyIndex: 0,
  projectId: null,
  projectName: "Untitled Project",

  setMockupId: (id) => set({ mockupId: id }),
  setProjectId: (id) => set({ projectId: id }),
  setProjectName: (name) => set({ projectName: name }),
  setBackground: (bg) => set({ background: bg }),

  addLayer: (layer) => {
    const layers = [...get().layers, layer];
    pushHistory(set, get, layers);
    set({ layers, selectedLayerId: layer.id });
  },

  removeLayer: (id) => {
    const layers = get().layers.filter((l) => l.id !== id);
    pushHistory(set, get, layers);
    set({
      layers,
      selectedLayerId: get().selectedLayerId === id ? null : get().selectedLayerId,
    });
  },

  duplicateLayer: (id) => {
    const layer = get().layers.find((l) => l.id === id);
    if (!layer) return;
    const copy = createLayer({
      ...layer,
      id: crypto.randomUUID(),
      name: layer.name + " copy",
      transform: {
        ...layer.transform,
        offset: { ...layer.transform.offset, x: layer.transform.offset.x + 20 },
      },
      colorAdjustment: { ...layer.colorAdjustment },
    });
    const layers = [...get().layers, copy];
    pushHistory(set, get, layers);
    set({ layers, selectedLayerId: copy.id });
  },

  updateLayer: (id, patch) => {
    const layers = get().layers.map((l) =>
      l.id === id ? { ...l, ...patch } : l
    );
    set({ layers });
  },

  updateTransform: (id, patch) => {
    const layers = get().layers.map((l) =>
      l.id === id
        ? { ...l, transform: { ...l.transform, ...patch } }
        : l
    );
    set({ layers });
  },

  selectLayer: (id) => set({ selectedLayerId: id }),

  reorderLayer: (id, direction) => {
    const layers = [...get().layers];
    const idx = layers.findIndex((l) => l.id === id);
    if (idx === -1) return;
    const swap = direction === "up" ? idx + 1 : idx - 1;
    if (swap < 0 || swap >= layers.length) return;
    [layers[idx], layers[swap]] = [layers[swap], layers[idx]];
    pushHistory(set, get, layers);
    set({ layers });
  },

  moveLayerTo: (id, toIndex) => {
    const layers = [...get().layers];
    const fromIdx = layers.findIndex((l) => l.id === id);
    if (fromIdx === -1 || toIndex < 0 || toIndex >= layers.length) return;
    const [item] = layers.splice(fromIdx, 1);
    layers.splice(toIndex, 0, item);
    pushHistory(set, get, layers);
    set({ layers });
  },

  loadLayers: (layers, projectId, name) => {
    const snap = snapshot(layers);
    set({
      layers: snap,
      history: [snap],
      historyIndex: 0,
      projectId: projectId ?? null,
      projectName: name ?? get().projectName,
      selectedLayerId: snap.length > 0 ? snap[0].id : null,
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    set({
      layers: snapshot(history[newIndex]),
      historyIndex: newIndex,
    });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    set({
      layers: snapshot(history[newIndex]),
      historyIndex: newIndex,
    });
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  getSelectedLayer: () => {
    const { layers, selectedLayerId } = get();
    return layers.find((l) => l.id === selectedLayerId) ?? null;
  },
}));

function pushHistory(
  set: (partial: Partial<EditorStore>) => void,
  get: () => EditorStore,
  layers: LayerData[]
) {
  const { history, historyIndex } = get();
  const newHistory = history.slice(0, historyIndex + 1);
  newHistory.push(snapshot(layers));
  if (newHistory.length > 50) newHistory.shift();
  set({ history: newHistory, historyIndex: newHistory.length - 1 });
}

export { createLayer, DEFAULT_COLOR_ADJUSTMENT, DEFAULT_TRANSFORM };
