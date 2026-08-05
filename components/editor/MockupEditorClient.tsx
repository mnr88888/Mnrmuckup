"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEditorStore } from "@/store/editorStore";
import { createLayer } from "@/types";
import type { MockupMeta, MockupConfig, LayerData } from "@/types";
import { supabase } from "@/lib/supabase";
import { loadProject, type ProjectRecord } from "@/lib/projects";
import UploadPanel from "@/components/editor/UploadPanel";
import LayersPanel from "@/components/editor/LayersPanel";
import LayerProperties from "@/components/editor/LayerProperties";
import Toolbar from "@/components/editor/Toolbar";

const MockupPreview = dynamic(
  () => import("@/components/editor/MockupPreview"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[400px] items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50">
        <p className="text-neutral-400">Loading editor…</p>
      </div>
    ),
  }
);

export default function MockupEditorClient({
  meta,
}: {
  meta: MockupMeta;
}) {
  const [config, setConfig] = useState<MockupConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const store = useEditorStore;
  const addLayer = useEditorStore((s) => s.addLayer);
  const loadLayers = useEditorStore((s) => s.loadLayers);
  const setMockupId = useEditorStore((s) => s.setMockupId);
  const setProjectId = useEditorStore((s) => s.setProjectId);
  const setProjectName = useEditorStore((s) => s.setProjectName);
  const layers = useEditorStore((s) => s.layers);

  const configRef = useRef<MockupConfig | null>(null);

  // Load mockup config
  useEffect(() => {
    setConfig(null);
    setConfigError(null);
    fetch(meta.configPath)
      .then((res) => {
        if (!res.ok) throw new Error("Config not found");
        return res.json();
      })
      .then((data: MockupConfig) => {
        setConfig(data);
        configRef.current = data;
        setMockupId(meta.id);
      })
      .catch(() => setConfigError("Could not load mockup configuration."));
  }, [meta.configPath, meta.id, setMockupId]);

  // Check auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAuthed(!!data.user);
      setAuthChecked(true);
    });
  }, []);

  // Listen for load-project events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ProjectRecord>).detail;
      if (detail) {
        loadLayers(
          detail.layer_state as unknown as LayerData[],
          detail.id,
          detail.title
        );
      }
    };
    window.addEventListener("load-project", handler);
    return () => window.removeEventListener("load-project", handler);
  }, [loadLayers]);

  const handleImageSelect = (file: File) => {
    const url = URL.createObjectURL(file);
    const layer = createLayer({
      type: "image",
      name: file.name.replace(/\.[^/.]+$/, ""),
      src: url,
    });
    addLayer(layer);
  };

  if (configError) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="text-2xl font-bold text-neutral-900">{configError}</h1>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-neutral-900 px-6 py-3 font-medium text-white"
        >
          Back to mockups
        </Link>
      </main>
    );
  }

  if (!config) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="text-neutral-400">Loading mockup…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/"
            className="text-sm font-medium text-neutral-500 hover:text-neutral-900"
          >
            &larr; All mockups
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-neutral-900">{config.title}</h1>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-6">
        {authChecked && !authed && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            You can edit without an account, but you need to{" "}
            <Link href="/auth" className="font-semibold underline">sign in</Link>{" "}
            to save projects to the cloud.
          </div>
        )}
        <Toolbar mockupId={meta.id} />
      </div>

      {/* Main layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left: canvas + upload */}
        <div className="space-y-4">
          <MockupPreview config={config} />
          <div className="grid grid-cols-2 gap-4">
            <UploadPanel onImageSelect={handleImageSelect} />
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-900">Tips</h2>
              <ul className="mt-3 space-y-2 text-sm text-neutral-500">
                <li>Drag on the canvas to move the selected layer</li>
                <li>Pinch with two fingers to zoom and rotate</li>
                <li>Add text layers from the Layers panel</li>
                <li>Export at 2x resolution for print quality</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right: layers + properties */}
        <div className="space-y-4">
          <LayersPanel />
          <LayerProperties />
        </div>
      </div>

      {layers.length === 0 && (
        <p className="mt-6 text-center text-sm text-neutral-400">
          Upload artwork above to start creating your mockup.
        </p>
      )}
    </main>
  );
}
