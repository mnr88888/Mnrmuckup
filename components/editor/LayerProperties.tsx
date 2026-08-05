"use client";

import { useEditorStore } from "@/store/editorStore";
import type { BlendMode, ColorAdjustment } from "@/types";

const BLEND_MODES: BlendMode[] = [
  "normal",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "add",
  "color",
];

export default function LayerProperties() {
  const layers = useEditorStore((s) => s.layers);
  const selectedLayerId = useEditorStore((s) => s.selectedLayerId);
  const updateLayer = useEditorStore((s) => s.updateLayer);
  const updateTransform = useEditorStore((s) => s.updateTransform);

  const layer = layers.find((l) => l.id === selectedLayerId);

  if (!layer) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Properties</h2>
        <p className="text-sm text-neutral-400">Select a layer to edit</p>
      </div>
    );
  }

  const setCA = (patch: Partial<ColorAdjustment>) => {
    updateLayer(layer.id, {
      colorAdjustment: { ...layer.colorAdjustment, ...patch },
    });
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-neutral-900">Properties</h2>

      {/* Name */}
      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium text-neutral-500">Name</label>
        <input
          type="text"
          value={layer.name}
          onChange={(e) => updateLayer(layer.id, { name: e.target.value })}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
        />
      </div>

      {/* Text properties */}
      {layer.type === "text" && (
        <div className="mb-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">Text</label>
            <input
              type="text"
              value={layer.text ?? ""}
              onChange={(e) => updateLayer(layer.id, { text: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">Font</label>
              <select
                value={layer.fontFamily ?? "Arial"}
                onChange={(e) => updateLayer(layer.id, { fontFamily: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 px-2 py-2 text-sm focus:border-neutral-900 focus:outline-none"
              >
                <option>Arial</option>
                <option>Helvetica</option>
                <option>Georgia</option>
                <option>Times New Roman</option>
                <option>Courier New</option>
                <option>Verdana</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">Size</label>
              <input
                type="number"
                value={layer.fontSize ?? 48}
                onChange={(e) =>
                  updateLayer(layer.id, { fontSize: parseInt(e.target.value) || 48 })
                }
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">Color</label>
            <input
              type="color"
              value={layer.color ?? "#000000"}
              onChange={(e) => updateLayer(layer.id, { color: e.target.value })}
              className="h-10 w-full rounded-lg border border-neutral-300"
            />
          </div>
        </div>
      )}

      {/* Opacity */}
      <div className="mb-4">
        <label className="mb-1 flex items-center justify-between text-xs font-medium text-neutral-500">
          <span>Opacity</span>
          <span>{Math.round(layer.opacity * 100)}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={layer.opacity}
          onChange={(e) => updateLayer(layer.id, { opacity: parseFloat(e.target.value) })}
          className="w-full accent-neutral-900"
        />
      </div>

      {/* Blend Mode */}
      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium text-neutral-500">Blend Mode</label>
        <select
          value={layer.blendMode}
          onChange={(e) => updateLayer(layer.id, { blendMode: e.target.value as BlendMode })}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
        >
          {BLEND_MODES.map((m) => (
            <option key={m} value={m}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Transform */}
      <div className="mb-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Transform</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-neutral-500">Flip H</label>
            <button
              onClick={() => updateTransform(layer.id, { flipX: !layer.transform.flipX })}
              className={`w-full rounded-lg border py-2 text-sm font-medium transition ${
                layer.transform.flipX
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              Flip Horizontal
            </button>
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-500">Flip V</label>
            <button
              onClick={() => updateTransform(layer.id, { flipY: !layer.transform.flipY })}
              className={`w-full rounded-lg border py-2 text-sm font-medium transition ${
                layer.transform.flipY
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              Flip Vertical
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1 flex items-center justify-between text-xs text-neutral-500">
            <span>Scale</span>
            <span>{layer.transform.scale.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.01"
            value={layer.transform.scale}
            onChange={(e) =>
              updateTransform(layer.id, { scale: parseFloat(e.target.value) })
            }
            className="w-full accent-neutral-900"
          />
        </div>

        <div>
          <label className="mb-1 flex items-center justify-between text-xs text-neutral-500">
            <span>Rotation</span>
            <span>{Math.round((layer.transform.rotation * 180) / Math.PI)}deg</span>
          </label>
          <input
            type="range"
            min={-Math.PI}
            max={Math.PI}
            step="0.01"
            value={layer.transform.rotation}
            onChange={(e) =>
              updateTransform(layer.id, { rotation: parseFloat(e.target.value) })
            }
            className="w-full accent-neutral-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-neutral-500">Offset X</label>
            <input
              type="number"
              value={Math.round(layer.transform.offset.x)}
              onChange={(e) =>
                updateTransform(layer.id, {
                  offset: { ...layer.transform.offset, x: parseFloat(e.target.value) || 0 },
                })
              }
              className="w-full rounded-lg border border-neutral-300 px-2 py-2 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-500">Offset Y</label>
            <input
              type="number"
              value={Math.round(layer.transform.offset.y)}
              onChange={(e) =>
                updateTransform(layer.id, {
                  offset: { ...layer.transform.offset, y: parseFloat(e.target.value) || 0 },
                })
              }
              className="w-full rounded-lg border border-neutral-300 px-2 py-2 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Color Adjustment */}
      <div className="mb-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Color</h3>
        {(
          [
            { key: "brightness", label: "Brightness", min: -1, max: 1 },
            { key: "contrast", label: "Contrast", min: -1, max: 1 },
            { key: "saturation", label: "Saturation", min: -1, max: 1 },
            { key: "hue", label: "Hue", min: -180, max: 180 },
          ] as const
        ).map((ctrl) => (
          <div key={ctrl.key}>
            <label className="mb-1 flex items-center justify-between text-xs text-neutral-500">
              <span>{ctrl.label}</span>
              <span>{layer.colorAdjustment[ctrl.key].toFixed(0)}</span>
            </label>
            <input
              type="range"
              min={ctrl.min}
              max={ctrl.max}
              step="1"
              value={layer.colorAdjustment[ctrl.key]}
              onChange={(e) =>
                setCA({ [ctrl.key]: parseFloat(e.target.value) } as Partial<ColorAdjustment>)
              }
              className="w-full accent-neutral-900"
            />
          </div>
        ))}
        <button
          onClick={() =>
            updateLayer(layer.id, {
              colorAdjustment: {
                brightness: 0,
                contrast: 0,
                saturation: 0,
                hue: 0,
              },
            })
          }
          className="w-full rounded-lg border border-neutral-300 py-2 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100"
        >
          Reset Color
        </button>
      </div>

      {/* Crop */}
      {layer.type === "image" && (
        <div className="mb-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Crop</h3>
          {layer.crop ? (
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2">
                {(["x", "y", "w", "h"] as const).map((k) => (
                  <div key={k}>
                    <label className="block text-xs text-neutral-400">{k}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={layer.crop![k]}
                      onChange={(e) =>
                        updateLayer(layer.id, {
                          crop: { ...layer.crop!, [k]: parseFloat(e.target.value) || 0 },
                        })
                      }
                      className="w-full rounded border border-neutral-300 px-1 py-1 text-xs"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => updateLayer(layer.id, { crop: null })}
                className="w-full rounded-lg border border-neutral-300 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
              >
                Remove Crop
              </button>
            </div>
          ) : (
            <button
              onClick={() => updateLayer(layer.id, { crop: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 } })}
              className="w-full rounded-lg border border-neutral-300 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
            >
              Enable Crop
            </button>
          )}
        </div>
      )}
    </div>
  );
}
