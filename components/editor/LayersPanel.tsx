"use client";

import { useEditorStore } from "@/store/editorStore";
import { createLayer } from "@/types";
import type { LayerType } from "@/types";

export default function LayersPanel() {
  const layers = useEditorStore((s) => s.layers);
  const selectedLayerId = useEditorStore((s) => s.selectedLayerId);
  const selectLayer = useEditorStore((s) => s.selectLayer);
  const removeLayer = useEditorStore((s) => s.removeLayer);
  const duplicateLayer = useEditorStore((s) => s.duplicateLayer);
  const reorderLayer = useEditorStore((s) => s.reorderLayer);
  const updateLayer = useEditorStore((s) => s.updateLayer);
  const addLayer = useEditorStore((s) => s.addLayer);

  const addTextLayer = () => {
    addLayer(
      createLayer({
        type: "text",
        name: "Text Layer",
        text: "Your Text",
        fontFamily: "Arial",
        fontSize: 48,
        color: "#000000",
      })
    );
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">Layers</h2>
        <div className="flex gap-2">
          <button
            onClick={addTextLayer}
            className="rounded-lg border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100"
            title="Add text layer"
          >
            + Text
          </button>
        </div>
      </div>

      {layers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 px-4 py-8 text-center">
          <p className="text-sm text-neutral-400">No layers yet</p>
          <p className="mt-1 text-xs text-neutral-300">Upload artwork to begin</p>
        </div>
      ) : (
        <div className="space-y-2">
          {[...layers].reverse().map((layer) => (
            <div
              key={layer.id}
              onClick={() => selectLayer(layer.id)}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                selectedLayerId === layer.id
                  ? "border-neutral-900 bg-neutral-50"
                  : "border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-xs font-bold text-neutral-500">
                {layer.type === "text" ? "T" : "I"}
              </div>

              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-neutral-800">
                  {layer.name}
                </p>
                <p className="text-xs text-neutral-400">{layer.blendMode}</p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateLayer(layer.id, { visible: !layer.visible });
                  }}
                  className="rounded p-1 text-neutral-400 hover:text-neutral-700"
                  title={layer.visible ? "Hide" : "Show"}
                >
                  {layer.visible ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  )}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateLayer(layer.id, { locked: !layer.locked });
                  }}
                  className="rounded p-1 text-neutral-400 hover:text-neutral-700"
                  title={layer.locked ? "Unlock" : "Lock"}
                >
                  {layer.locked ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                  )}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    reorderLayer(layer.id, "up");
                  }}
                  className="rounded p-1 text-neutral-400 hover:text-neutral-700"
                  title="Move up"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    reorderLayer(layer.id, "down");
                  }}
                  className="rounded p-1 text-neutral-400 hover:text-neutral-700"
                  title="Move down"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateLayer(layer.id);
                  }}
                  className="rounded p-1 text-neutral-400 hover:text-neutral-700"
                  title="Duplicate"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeLayer(layer.id);
                  }}
                  className="rounded p-1 text-neutral-400 hover:text-red-500"
                  title="Delete"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
