"use client";

import { useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { saveProject, listProjects, deleteProject } from "@/lib/projects";
import type { ProjectRecord } from "@/lib/projects";
import { supabase } from "@/lib/supabase";

type ExportFormat = "png" | "jpeg" | "webp";

export default function Toolbar({
  mockupId,
  onSaved,
}: {
  mockupId: string;
  onSaved?: (projectId: string) => void;
}) {
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useEditorStore((s) => s.historyIndex > 0);
  const canRedo = useEditorStore((s) => s.historyIndex < s.history.length - 1);
  const layers = useEditorStore((s) => s.layers);
  const selectedLayerId = useEditorStore((s) => s.selectedLayerId);
  const updateTransform = useEditorStore((s) => s.updateTransform);
  const projectName = useEditorStore((s) => s.projectName);
  const setProjectName = useEditorStore((s) => s.setProjectName);
  const projectId = useEditorStore((s) => s.projectId);
  const setProjectId = useEditorStore((s) => s.setProjectId);
  const setBackground = useEditorStore((s) => s.setBackground);
  const background = useEditorStore((s) => s.background);

  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [projectList, setProjectList] = useState<ProjectRecord[]>([]);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const autoFit = () => {
    if (!selectedLayerId) return;
    updateTransform(selectedLayerId, {
      offset: { x: 0, y: 0 },
      scale: 1,
      rotation: 0,
    });
  };

  const handleExport = async (format: ExportFormat, scale: number = 2) => {
    setExporting(true);
    setStatusMsg(null);
    try {
      const exportFn = (window as unknown as Record<string, unknown>).__mockupExport as
        | ((format: ExportFormat, scale: number) => Promise<string | null>)
        | undefined;
      if (!exportFn) {
        setStatusMsg("Export not ready yet");
        return;
      }
      const url = await exportFn(format, scale);
      if (!url) {
        setStatusMsg("Export failed");
        return;
      }
      const link = document.createElement("a");
      link.href = url;
      const ext = format === "jpeg" ? "jpg" : format;
      link.download = `${projectName.replace(/\s+/g, "-").toLowerCase()}.${ext}`;
      link.click();
      setStatusMsg("Exported successfully");
    } catch {
      setStatusMsg("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      const thumbFn = (window as unknown as Record<string, unknown>).__mockupThumbnail as
        | (() => Promise<string | null>)
        | undefined;
      const thumbnail = thumbFn ? await thumbFn() : null;

      const result = await saveProject(projectId, mockupId, projectName, layers, thumbnail);
      if ("error" in result) {
        setStatusMsg(result.error);
      } else {
        setProjectId(result.id);
        setStatusMsg(`Saved (v${result.version})`);
        onSaved?.(result.id);
      }
    } catch {
      setStatusMsg("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleLoadProjects = async () => {
    const list = await listProjects();
    setProjectList(list);
    setShowProjects(true);
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id);
    setProjectList(projectList.filter((p) => p.id !== id));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      {/* Undo / Redo */}
      <div className="flex items-center gap-1">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="rounded-lg border border-neutral-300 p-2 text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-30"
          title="Undo"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6.7 3L3 13"/></svg>
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="rounded-lg border border-neutral-300 p-2 text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-30"
          title="Redo"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6.7 3L21 13"/></svg>
        </button>
      </div>

      <div className="h-6 w-px bg-neutral-200" />

      {/* Auto Fit */}
      <button
        onClick={autoFit}
        disabled={!selectedLayerId}
        className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-30"
      >
        Auto Fit
      </button>

      <div className="h-6 w-px bg-neutral-200" />

      {/* Background */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-neutral-400">BG</span>
        <select
          value={background}
          onChange={(e) => setBackground(e.target.value as "transparent" | "white" | "black")}
          className="rounded-lg border border-neutral-300 px-2 py-1.5 text-xs focus:border-neutral-900 focus:outline-none"
        >
          <option value="transparent">Transparent</option>
          <option value="white">White</option>
          <option value="black">Black</option>
        </select>
      </div>

      <div className="h-6 w-px bg-neutral-200" />

      {/* Export */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleExport("png", 2)}
          disabled={exporting || layers.length === 0}
          className="rounded-lg bg-neutral-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-30"
        >
          {exporting ? "Exporting…" : "PNG 2x"}
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleExport("jpeg", 2)}
            disabled={exporting || layers.length === 0}
            className="rounded-lg border border-neutral-300 px-2 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-30"
          >
            JPG
          </button>
          <button
            onClick={() => handleExport("webp", 2)}
            disabled={exporting || layers.length === 0}
            className="rounded-lg border border-neutral-300 px-2 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-30"
          >
            WebP
          </button>
        </div>
      </div>

      <div className="h-6 w-px bg-neutral-200" />

      {/* Project name + save */}
      <input
        type="text"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        className="rounded-lg border border-neutral-300 px-3 py-2 text-xs focus:border-neutral-900 focus:outline-none"
        placeholder="Project name"
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-30"
      >
        {saving ? "Saving…" : "Save"}
      </button>
      <button
        onClick={handleLoadProjects}
        className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100"
      >
        My Projects
      </button>

      {statusMsg && (
        <span className="text-xs text-neutral-500">{statusMsg}</span>
      )}

      {/* Projects modal */}
      {showProjects && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowProjects(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">My Projects</h3>
              <button
                onClick={() => setShowProjects(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {projectList.length === 0 ? (
              <p className="text-sm text-neutral-400">No saved projects yet</p>
            ) : (
              <div className="space-y-3">
                {projectList.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-4 rounded-xl border border-neutral-200 p-3"
                  >
                    {p.thumbnail && (
                      <img
                        src={p.thumbnail}
                        alt={p.title}
                        className="h-14 w-14 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-800">{p.title}</p>
                      <p className="text-xs text-neutral-400">
                        v{p.version} · {new Date(p.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const event = new CustomEvent("load-project", { detail: p });
                        window.dispatchEvent(event);
                        setShowProjects(false);
                      }}
                      className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => handleDeleteProject(p.id)}
                      className="rounded-lg border border-neutral-300 px-2 py-1.5 text-xs text-neutral-400 hover:text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleSignOut}
              className="mt-6 w-full rounded-lg border border-neutral-300 py-2 text-xs font-medium text-neutral-500 hover:bg-neutral-100"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
