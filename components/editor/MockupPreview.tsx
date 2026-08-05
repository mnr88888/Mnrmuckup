"use client";

import { useEffect, useRef, useCallback } from "react";
import * as PIXI from "pixi.js";
import "pixi.js/advanced-blend-modes";
import type { MockupConfig, LayerData, BlendMode } from "@/types";
import { BLEND_MODES } from "pixi.js";
import { useEditorStore } from "@/store/editorStore";

const MESH_SEGMENTS = 16;

const BLEND_MODE_MAP: Record<BlendMode, BLEND_MODES> = {
  normal: "normal",
  multiply: "multiply",
  screen: "screen",
  overlay: "overlay",
  darken: "darken",
  lighten: "lighten",
  color: "color",
  add: "add",
};

type LayerRenderState = {
  layerId: string;
  sprite: PIXI.Sprite | PIXI.Container | null;
  mesh: PIXI.Mesh | null;
  meshGeom: PIXI.MeshGeometry | null;
  texture: PIXI.Texture | null;
  textTexture: PIXI.Texture | null;
  lastSrc?: string;
  lastTextKey?: string;
};

export default function MockupPreview({
  config,
}: {
  config: MockupConfig;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const baseSpriteRef = useRef<PIXI.Sprite | null>(null);
  const lightingOverlayRef = useRef<PIXI.Sprite | null>(null);
  const layerRenderMapRef = useRef<Map<string, LayerRenderState>>(new Map());
  const stageSizeRef = useRef({ width: 800, height: 1200, scaleFactor: 1 });

  const layers = useEditorStore((s) => s.layers);
  const selectedLayerId = useEditorStore((s) => s.selectedLayerId);
  const background = useEditorStore((s) => s.background);
  const updateTransform = useEditorStore((s) => s.updateTransform);

  const gestureRef = useRef<{
    mode: "none" | "pan" | "pinch";
    startDist: number;
    startScale: number;
    startAngle: number;
    startRotation: number;
    last: { x: number; y: number } | null;
    layerId: string | null;
  }>({
    mode: "none",
    startDist: 0,
    startScale: 1,
    startAngle: 0,
    startRotation: 0,
    last: null,
    layerId: null,
  });

  const pointerMapRef = useRef<Map<number, { clientX: number; clientY: number }>>(
    new Map()
  );

  const computeStageSize = useCallback(() => {
    if (!containerRef.current) return;
    const avail = containerRef.current.clientWidth;
    const maxH = typeof window !== "undefined" ? window.innerHeight - 200 : 1000;
    const ratio = config.imageHeight / config.imageWidth;
    let w = avail;
    let h = w * ratio;
    if (h > maxH) {
      h = maxH;
      w = h / ratio;
    }
    const scaleFactor = w / config.imageWidth;
    stageSizeRef.current = {
      width: Math.round(w),
      height: Math.round(h),
      scaleFactor,
    };
    if (appRef.current) {
      appRef.current.renderer.resize(Math.round(w), Math.round(h));
      const base = baseSpriteRef.current;
      if (base) base.scale.set(scaleFactor);
      const light = lightingOverlayRef.current;
      if (light) light.scale.set(scaleFactor);
      layerRenderMapRef.current.forEach((lrs) => {
        if (lrs.mesh) lrs.mesh.scale.set(scaleFactor);
      });
    }
  }, [config.imageHeight, config.imageWidth]);

  useEffect(() => {
    computeStageSize();
    const onResize = () => computeStageSize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [computeStageSize]);

  // Initialize Pixi app
  useEffect(() => {
    if (!containerRef.current) return;
    let destroyed = false;

    const app = new PIXI.Application();
    appRef.current = app;

    const { width, height, scaleFactor } = stageSizeRef.current;

    app
      .init({
        width,
        height,
        backgroundAlpha: 0,
        antialias: true,
        resolution: typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
        autoDensity: true,
      })
      .then(async () => {
        if (destroyed) {
          app.destroy(true);
          return;
        }
        if (!containerRef.current) return;
        containerRef.current.appendChild(app.canvas);
        app.canvas.style.touchAction = "none";

        // Background
        const bgGraphics = new PIXI.Graphics();
        bgGraphics.rect(0, 0, config.imageWidth, config.imageHeight);
        if (background === "white") bgGraphics.fill(0xffffff);
        else if (background === "black") bgGraphics.fill(0x000000);
        else bgGraphics.fill(0xffffff, 0);
        bgGraphics.scale.set(scaleFactor);
        app.stage.addChild(bgGraphics);

        // Base mockup image
        const baseTex = await PIXI.Assets.load(config.base);
        if (destroyed) return;
        const baseSprite = new PIXI.Sprite(baseTex);
        baseSprite.scale.set(scaleFactor);
        app.stage.addChild(baseSprite);
        baseSpriteRef.current = baseSprite;

        // Lighting overlay (shadow/highlight)
        if (config.lighting?.shadow) {
          try {
            const lightTex = await PIXI.Assets.load(config.lighting.shadow);
            if (destroyed) return;
            const lightSprite = new PIXI.Sprite(lightTex);
            lightSprite.scale.set(scaleFactor);
            lightSprite.alpha = config.lighting.intensity ?? 0.5;
            lightSprite.blendMode = "multiply" as BLEND_MODES;
            app.stage.addChild(lightSprite);
            lightingOverlayRef.current = lightSprite;
          } catch {
            // lighting texture optional
          }
        }
      })
      .catch((e) => console.error("Pixi init failed", e));

    const container = containerRef.current;
    return () => {
      destroyed = true;
      if (container && app.canvas?.parentNode === container) {
        container.removeChild(app.canvas);
      }
      app.destroy(true);
      appRef.current = null;
      baseSpriteRef.current = null;
      lightingOverlayRef.current = null;
      layerRenderMapRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.base]);

  // Update background
  useEffect(() => {
    const app = appRef.current;
    if (!app) return;
    // Redraw background by removing & re-adding first child
    const stage = app.stage;
    if (stage.children.length > 0) {
      const firstChild = stage.children[0] as PIXI.Graphics;
      firstChild.clear();
      firstChild.rect(0, 0, config.imageWidth, config.imageHeight);
      if (background === "white") firstChild.fill(0xffffff);
      else if (background === "black") firstChild.fill(0x000000);
      else firstChild.fill(0xffffff, 0);
    }
  }, [background, config.imageWidth, config.imageHeight]);

  // Build mesh geometry for a quad
  const buildMeshGeom = useCallback(() => {
    const seg = MESH_SEGMENTS;
    const indices: number[] = [];
    for (let iy = 0; iy < seg; iy++) {
      for (let ix = 0; ix < seg; ix++) {
        const a = iy * (seg + 1) + ix;
        const b = a + 1;
        const c = a + (seg + 1);
        const d = c + 1;
        indices.push(a, b, c, b, d, c);
      }
    }
    return new PIXI.MeshGeometry({
      positions: new Float32Array((seg + 1) * (seg + 1) * 2),
      uvs: new Float32Array((seg + 1) * (seg + 1) * 2),
      indices: new Uint32Array(indices),
    });
  }, []);

  // Compute quad positions for a layer
  const computeQuad = useCallback(
    (layer: LayerData) => {
      const q = config.printArea;
      const tr = layer.transform;
      const tex = layer.type === "image" ? layer.src : null;
      const dW = layer.type === "text" ? layer.fontSize! * 5 : 400;
      const dH = layer.type === "text" ? layer.fontSize! : 200;

      const paW = Math.hypot(q.topRight.x - q.topLeft.x, q.topRight.y - q.topLeft.y);
      const paH = Math.hypot(q.bottomLeft.x - q.topLeft.x, q.bottomLeft.y - q.topLeft.y);

      const fitScale = Math.min(paW / dW, paH / dH);
      const effScale = fitScale * tr.scale;
      const desW = dW * effScale;
      const desH = dH * effScale;

      const cx = (q.topLeft.x + q.topRight.x + q.bottomRight.x + q.bottomLeft.x) / 4;
      const cy = (q.topLeft.y + q.topRight.y + q.bottomRight.y + q.bottomLeft.y) / 4;

      const flipX = tr.flipX ? -1 : 1;
      const flipY = tr.flipY ? -1 : 1;

      const cornersBase = [
        { x: (-desW / 2) * flipX, y: (-desH / 2) * flipY },
        { x: (desW / 2) * flipX, y: (-desH / 2) * flipY },
        { x: (desW / 2) * flipX, y: (desH / 2) * flipY },
        { x: (-desW / 2) * flipX, y: (desH / 2) * flipY },
      ].map((p) => {
        const cos = Math.cos(tr.rotation);
        const sin = Math.sin(tr.rotation);
        const rx = p.x * cos - p.y * sin;
        const ry = p.x * sin + p.y * cos;
        return {
          x: cx + rx + tr.offset.x,
          y: cy + ry + tr.offset.y,
        };
      });

      return { cornersBase, texW: dW, texH: dH };
    },
    [config.printArea]
  );

  // Update a single layer's mesh
  const updateLayerMesh = useCallback(
    (layer: LayerData, lrs: LayerRenderState) => {
      if (!lrs.meshGeom) return;
      const { cornersBase } = computeQuad(layer);

      const mapPoint = (u: number, v: number) => {
        const top = {
          x: cornersBase[0].x * (1 - u) + cornersBase[1].x * u,
          y: cornersBase[0].y * (1 - u) + cornersBase[1].y * u,
        };
        const bot = {
          x: cornersBase[3].x * (1 - u) + cornersBase[2].x * u,
          y: cornersBase[3].y * (1 - u) + cornersBase[2].y * u,
        };
        return {
          x: top.x * (1 - v) + bot.x * v,
          y: top.y * (1 - v) + bot.y * v,
        };
      };

      const seg = MESH_SEGMENTS;
      const positions = new Float32Array((seg + 1) * (seg + 1) * 2);
      const uvs = new Float32Array((seg + 1) * (seg + 1) * 2);
      let pi = 0;
      let ui = 0;

      const crop = layer.crop;
      for (let iy = 0; iy <= seg; iy++) {
        for (let ix = 0; ix <= seg; ix++) {
          const u = ix / seg;
          const v = iy / seg;
          const p = mapPoint(u, v);
          positions[pi++] = p.x;
          positions[pi++] = p.y;
          if (crop) {
            uvs[ui++] = crop.x + u * crop.w;
            uvs[ui++] = crop.y + v * crop.h;
          } else {
            uvs[ui++] = u;
            uvs[ui++] = v;
          }
        }
      }
      lrs.meshGeom.positions = positions;
      lrs.meshGeom.uvs = uvs;
    },
    [computeQuad]
  );

  // Sync layers with Pixi stage
  useEffect(() => {
    const app = appRef.current;
    if (!app) return;
    const stage = app.stage;
    const scaleFactor = stageSizeRef.current.scaleFactor;
    const map = layerRenderMapRef.current;

    // Remove layers that no longer exist
    const layerIds = new Set(layers.map((l) => l.id));
    for (const [id, lrs] of map.entries()) {
      if (!layerIds.has(id)) {
        if (lrs.mesh) {
          stage.removeChild(lrs.mesh);
          lrs.mesh.destroy({ children: true });
        }
        if (lrs.texture) lrs.texture.destroy(true);
        map.delete(id);
      }
    }

    // Add or update layers
    layers.forEach((layer) => {
      let lrs = map.get(layer.id);
      if (!lrs) {
        lrs = {
          layerId: layer.id,
          sprite: null,
          mesh: null,
          meshGeom: null,
          texture: null,
          textTexture: null,
        };
        map.set(layer.id, lrs);
      }

      // Create mesh if not exists
      if (!lrs.mesh) {
        const geom = buildMeshGeom();
        lrs.meshGeom = geom;
        const mesh = new PIXI.Mesh({
          geometry: geom,
          texture: PIXI.Texture.EMPTY,
        });
        mesh.scale.set(scaleFactor);
        stage.addChild(mesh);
        lrs.mesh = mesh;
      }

      // Load texture for image layers
      if (layer.type === "image" && layer.src && layer.src !== lrs.lastSrc) {
        lrs.lastSrc = layer.src;
        if (lrs.texture) lrs.texture.destroy(true);
        PIXI.Assets.load(layer.src)
          .then((tex: PIXI.Texture) => {
            lrs!.texture = tex;
            if (lrs!.mesh) lrs!.mesh.texture = tex;
            updateLayerMesh(layer, lrs!);
          })
          .catch(() => {});
      }

      // Generate text texture
      if (layer.type === "text" && layer.text) {
        const textKey = layer.text + layer.fontFamily + layer.fontSize + layer.color;
        if (textKey !== lrs.lastTextKey) {
          lrs.lastTextKey = textKey;
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d")!;
          const fontSize = layer.fontSize ?? 48;
          const fontFamily = layer.fontFamily ?? "Arial";
          ctx.font = `${fontSize}px ${fontFamily}`;
          const metrics = ctx.measureText(layer.text);
          canvas.width = Math.ceil(metrics.width) + 20;
          canvas.height = Math.ceil(fontSize * 1.5);
          ctx.font = `${fontSize}px ${fontFamily}`;
          ctx.fillStyle = layer.color ?? "#000000";
          ctx.textBaseline = "top";
          ctx.fillText(layer.text, 10, fontSize * 0.2);
          const tex = PIXI.Texture.from(canvas);
          if (lrs.textTexture) lrs.textTexture.destroy(true);
          lrs.textTexture = tex;
          lrs.texture = tex;
          if (lrs.mesh) lrs.mesh.texture = tex;
        }
      }

      // Update mesh geometry
      if (lrs.texture) {
        updateLayerMesh(layer, lrs);
      }

      // Update visual properties
      if (lrs.mesh) {
        lrs.mesh.visible = layer.visible;
        lrs.mesh.alpha = layer.opacity;
        lrs.mesh.blendMode = BLEND_MODE_MAP[layer.blendMode] ?? "normal";

        // Color adjustment filters
        const ca = layer.colorAdjustment;
        const hasAdjust =
          ca.brightness !== 0 ||
          ca.contrast !== 0 ||
          ca.saturation !== 0 ||
          ca.hue !== 0;
        if (hasAdjust && lrs.mesh) {
          const filters: PIXI.Filter[] = [];
          const cmf = new PIXI.ColorMatrixFilter();
          if (ca.brightness !== 0) cmf.brightness(1 + ca.brightness, false);
          if (ca.contrast !== 0) cmf.contrast(1 + ca.contrast, false);
          if (ca.saturation !== 0) cmf.saturate(ca.saturation * 100, true);
          if (ca.hue !== 0) cmf.hue(ca.hue, false);
          filters.push(cmf);
          lrs.mesh.filters = filters;
        } else if (lrs.mesh) {
          lrs.mesh.filters = [];
        }
      }
    });

    // Z-order: layers array order = render order (first = bottom)
    let zIndex = 2; // 0 = bg, 1 = base sprite, 2+ = layers, last = lighting
    layers.forEach((layer) => {
      const lrs = map.get(layer.id);
      if (lrs?.mesh) {
        stage.setChildIndex(lrs.mesh, zIndex);
        zIndex++;
      }
    });

    // Move lighting overlay to top
    if (lightingOverlayRef.current && stage.children.includes(lightingOverlayRef.current)) {
      stage.setChildIndex(lightingOverlayRef.current, stage.children.length - 1);
    }
  }, [layers, buildMeshGeom, updateLayerMesh]);

  // Pointer interaction for selected layer
  useEffect(() => {
    const canvas = appRef.current?.canvas;
    if (!canvas) return;
    const { scaleFactor } = stageSizeRef.current;

    const toBaseCoords = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (clientX - rect.left) / scaleFactor,
        y: (clientY - rect.top) / scaleFactor,
      };
    };

    const onPointerDown = (e: PointerEvent) => {
      const selId = useEditorStore.getState().selectedLayerId;
      if (!selId) return;
      const layer = useEditorStore.getState().layers.find((l) => l.id === selId);
      if (!layer || layer.locked) return;

      pointerMapRef.current.set(e.pointerId, {
        clientX: e.clientX,
        clientY: e.clientY,
      });

      if (pointerMapRef.current.size === 2) {
        const pts: { x: number; y: number }[] = [];
        pointerMapRef.current.forEach((p) =>
          pts.push(toBaseCoords(p.clientX, p.clientY))
        );
        const [a, b] = pts;
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const angle = Math.atan2(b.y - a.y, b.x - a.x);
        gestureRef.current = {
          mode: "pinch",
          startDist: dist,
          startScale: layer.transform.scale,
          startAngle: angle,
          startRotation: layer.transform.rotation,
          last: null,
          layerId: selId,
        };
      } else {
        gestureRef.current = {
          ...gestureRef.current,
          mode: "pan",
          last: toBaseCoords(e.clientX, e.clientY),
          layerId: selId,
        };
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      pointerMapRef.current.set(e.pointerId, {
        clientX: e.clientX,
        clientY: e.clientY,
      });
      const g = gestureRef.current;
      if (g.mode === "none" || !g.layerId) return;

      if (g.mode === "pan" && g.last) {
        const cur = toBaseCoords(e.clientX, e.clientY);
        const dx = cur.x - g.last.x;
        const dy = cur.y - g.last.y;
        const layer = useEditorStore.getState().layers.find((l) => l.id === g.layerId);
        if (layer) {
          updateTransform(g.layerId, {
            offset: {
              x: layer.transform.offset.x + dx,
              y: layer.transform.offset.y + dy,
            },
          });
        }
        g.last = cur;
      } else if (g.mode === "pinch") {
        if (pointerMapRef.current.size !== 2) return;
        const pts: { x: number; y: number }[] = [];
        pointerMapRef.current.forEach((p) =>
          pts.push(toBaseCoords(p.clientX, p.clientY))
        );
        const [a, b] = pts;
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const angle = Math.atan2(b.y - a.y, b.x - a.x);
        const scaleDelta = dist / g.startDist;
        updateTransform(g.layerId, {
          scale: Math.max(0.1, Math.min(10, g.startScale * scaleDelta)),
          rotation: g.startRotation + (angle - g.startAngle),
        });
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      pointerMapRef.current.delete(e.pointerId);
      if (pointerMapRef.current.size === 0) {
        gestureRef.current.mode = "none";
        gestureRef.current.last = null;
        gestureRef.current.layerId = null;
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerUp);
    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerUp);
    };
  }, [updateTransform]);

  // Expose export function via ref/store
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__mockupExport = async (
      format: "png" | "jpeg" | "webp",
      scale: number
    ): Promise<string | null> => {
      const app = appRef.current;
      const base = baseSpriteRef.current;
      if (!app || !base) return null;

      const renderTexture = PIXI.RenderTexture.create({
        width: config.imageWidth * scale,
        height: config.imageHeight * scale,
      });

      const oldScales: Record<string, number> = {};
      if (baseSpriteRef.current) {
        oldScales.base = baseSpriteRef.current.scale.x;
        baseSpriteRef.current.scale.set(scale);
      }
      const light = lightingOverlayRef.current;
      if (light) {
        oldScales.light = light.scale.x;
        light.scale.set(scale);
      }
      layerRenderMapRef.current.forEach((lrs) => {
        if (lrs.mesh) {
          oldScales[lrs.layerId] = lrs.mesh.scale.x;
          lrs.mesh.scale.set(scale);
        }
      });

      app.renderer.render({ container: app.stage, target: renderTexture });

      const source = app.renderer.extract.canvas({
        target: renderTexture,
      }) as HTMLCanvasElement;

      const mime =
        format === "png" ? "image/png" : format === "jpeg" ? "image/jpeg" : "image/webp";
      const url = source.toDataURL(mime, 0.95);

      // Restore scales
      if (baseSpriteRef.current) baseSpriteRef.current.scale.set(oldScales.base);
      if (light) light.scale.set(oldScales.light);
      layerRenderMapRef.current.forEach((lrs) => {
        if (lrs.mesh && oldScales[lrs.layerId] !== undefined) {
          lrs.mesh.scale.set(oldScales[lrs.layerId]);
        }
      });

      renderTexture.destroy(true);
      return url;
    };

    (window as unknown as Record<string, unknown>).__mockupThumbnail = async (): Promise<string | null> => {
      const app = appRef.current;
      if (!app) return null;
      const source = app.renderer.extract.canvas({
        target: app.stage,
      }) as HTMLCanvasElement;
      const small = document.createElement("canvas");
      small.width = 200;
      small.height = Math.round(200 * (config.imageHeight / config.imageWidth));
      const ctx = small.getContext("2d")!;
      ctx.drawImage(source, 0, 0, small.width, small.height);
      return small.toDataURL("image/jpeg", 0.7);
    };
  }, [config.imageWidth, config.imageHeight]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50"
      style={{ minHeight: 300 }}
    />
  );
}
