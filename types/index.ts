export type Point = { x: number; y: number };

export type Quad = {
  topLeft: Point;
  topRight: Point;
  bottomRight: Point;
  bottomLeft: Point;
};

export type MockupConfig = {
  title: string;
  base: string;
  category?: string;
  printArea: Quad;
  imageWidth: number;
  imageHeight: number;
  lighting?: {
    shadow?: string;
    highlight?: string;
    intensity?: number;
  };
  displacement?: {
    map: string;
    strength: number;
  };
};

export type LayerType = "image" | "text";

export type BlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "color"
  | "add";

export type ColorAdjustment = {
  brightness: number; // -1 to 1
  contrast: number; // -1 to 1
  saturation: number; // -1 to 1
  hue: number; // -180 to 180
};

export type LayerTransform = {
  offset: Point;
  scale: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
};

export type LayerData = {
  id: string;
  type: LayerType;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0 to 1
  blendMode: BlendMode;
  transform: LayerTransform;
  src?: string; // for image layers (object URL or data URL)
  text?: string; // for text layers
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  colorAdjustment: ColorAdjustment;
  crop?: { x: number; y: number; w: number; h: number } | null;
  mask?: string | null; // mask image URL
};

export type ProjectState = {
  mockupId: string;
  layers: LayerData[];
  background: "transparent" | "white" | "black" | string;
};

export type MockupMeta = {
  id: string;
  title: string;
  category: string;
  thumb: string;
  configPath: string;
};

export const DEFAULT_COLOR_ADJUSTMENT: ColorAdjustment = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  hue: 0,
};

export const DEFAULT_TRANSFORM: LayerTransform = {
  offset: { x: 0, y: 0 },
  scale: 1,
  rotation: 0,
  flipX: false,
  flipY: false,
};

export function createLayer(partial: Partial<LayerData>): LayerData {
  return {
    id: crypto.randomUUID(),
    type: "image",
    name: "Layer",
    visible: true,
    locked: false,
    opacity: 1,
    blendMode: "normal",
    transform: { ...DEFAULT_TRANSFORM, offset: { x: 0, y: 0 } },
    colorAdjustment: { ...DEFAULT_COLOR_ADJUSTMENT },
    crop: null,
    mask: null,
    ...partial,
  };
}
