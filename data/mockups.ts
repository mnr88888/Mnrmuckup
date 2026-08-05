import fs from "fs";
import path from "path";

export type MockupMeta = {
  id: string;
  title: string;
  category: string;
  thumb: string;
  configPath: string;
};

function loadMockups(): MockupMeta[] {
  const mockupsDir = path.join(process.cwd(), "public", "mockups");
  if (!fs.existsSync(mockupsDir)) return [];

  const entries = fs.readdirSync(mockupsDir, { withFileTypes: true });
  const list: MockupMeta[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const id = entry.name;
    const configPath = path.join(mockupsDir, id, "config.json");
    if (!fs.existsSync(configPath)) continue;

    try {
      const raw = fs.readFileSync(configPath, "utf-8");
      const cfg = JSON.parse(raw);
      list.push({
        id,
        title: cfg.title ?? id,
        category: cfg.category ?? "Uncategorized",
        thumb: cfg.base ?? `/mockups/${id}/base.jpg`,
        configPath: `/mockups/${id}/config.json`,
      });
    } catch {
      // skip malformed config
    }
  }

  return list;
}

let cached: MockupMeta[] | null = null;

export function getMockupList(): MockupMeta[] {
  if (!cached) cached = loadMockups();
  return cached;
}

export function getMockupMeta(id: string): MockupMeta | undefined {
  return getMockupList().find((m) => m.id === id);
}
