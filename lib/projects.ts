import { supabase } from "@/lib/supabase";
import type { LayerData } from "@/types";

export type ProjectRecord = {
  id: string;
  mockup_id: string;
  title: string;
  thumbnail: string | null;
  layer_state: LayerData[];
  version: number;
  created_at: string;
  updated_at: string;
};

export async function saveProject(
  projectId: string | null,
  mockupId: string,
  title: string,
  layers: LayerData[],
  thumbnail: string | null
): Promise<{ id: string; version: number } | { error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (projectId) {
    const { data, error } = await supabase
      .from("projects")
      .update({
        title,
        layer_state: layers as unknown as Record<string, unknown>[],
        thumbnail,
      })
      .eq("id", projectId)
      .select("id, version")
      .single();

    if (error) return { error: error.message };
    return { id: data.id, version: data.version };
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      mockup_id: mockupId,
      title,
      layer_state: layers as unknown as Record<string, unknown>[],
      thumbnail,
    })
    .select("id, version")
    .single();

  if (error) return { error: error.message };
  return { id: data.id, version: data.version };
}

export async function loadProject(
  projectId: string
): Promise<ProjectRecord | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();

  if (error || !data) return null;
  return data as ProjectRecord;
}

export async function listProjects(): Promise<ProjectRecord[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error || !data) return [];
  return data as ProjectRecord[];
}

export async function deleteProject(projectId: string): Promise<boolean> {
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  return !error;
}

export type TemplateRecord = {
  id: string;
  name: string;
  mockup_id: string;
  layer_state: LayerData[];
  created_at: string;
};

export async function saveTemplate(
  mockupId: string,
  name: string,
  layers: LayerData[]
): Promise<{ id: string } | { error: string }> {
  const { data, error } = await supabase
    .from("templates")
    .insert({
      mockup_id: mockupId,
      name,
      layer_state: layers as unknown as Record<string, unknown>[],
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
}

export async function listTemplates(): Promise<TemplateRecord[]> {
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as TemplateRecord[];
}

export async function deleteTemplate(templateId: string): Promise<boolean> {
  const { error } = await supabase
    .from("templates")
    .delete()
    .eq("id", templateId);
  return !error;
}
