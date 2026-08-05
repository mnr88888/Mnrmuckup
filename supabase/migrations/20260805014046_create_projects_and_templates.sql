/*
# Create projects, templates, and mockup_assets tables

1. New Tables
- `projects` — saved mockup editor projects (one per user's editing session)
  - id (uuid PK)
  - user_id (uuid, defaults to auth.uid(), FK to auth.users)
  - mockup_id (text, references the public mockup folder name e.g. "cup")
  - title (text, project name)
  - thumbnail (text, optional data URL or storage path)
  - layer_state (jsonb, full layer configuration for undo/restore)
  - version (int, auto-incremented on each save for versioning)
  - created_at, updated_at (timestamps)
- `templates` — user-saved reusable templates (layer presets)
  - id (uuid PK)
  - user_id (uuid, defaults to auth.uid())
  - name (text)
  - mockup_id (text)
  - layer_state (jsonb)
  - created_at (timestamp)
- `mockup_assets` — registry of available mockups (metadata cache)
  - id (text PK, e.g. "cup")
  - title (text)
  - category (text)
  - config_path (text)
  - thumb (text)
  - is_public (boolean, default true for marketplace visibility)
  - created_at (timestamp)

2. Security
- Enable RLS on all tables.
- projects: owner-scoped CRUD (authenticated, auth.uid() = user_id)
- templates: owner-scoped CRUD
- mockup_assets: public read (anon + authenticated), authenticated insert
- version column auto-incremented via trigger on projects update
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  mockup_id text NOT NULL,
  title text NOT NULL DEFAULT 'Untitled Project',
  thumbnail text,
  layer_state jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_projects" ON projects;
CREATE POLICY "select_own_projects" ON projects FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_projects" ON projects;
CREATE POLICY "insert_own_projects" ON projects FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_projects" ON projects;
CREATE POLICY "update_own_projects" ON projects FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_projects" ON projects;
CREATE POLICY "delete_own_projects" ON projects FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  mockup_id text NOT NULL,
  layer_state jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_templates" ON templates;
CREATE POLICY "select_own_templates" ON templates FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_templates" ON templates;
CREATE POLICY "insert_own_templates" ON templates FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_templates" ON templates;
CREATE POLICY "update_own_templates" ON templates FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_templates" ON templates;
CREATE POLICY "delete_own_templates" ON templates FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS mockup_assets (
  id text PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'Uncategorized',
  config_path text NOT NULL,
  thumb text NOT NULL,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mockup_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_mockup_assets" ON mockup_assets;
CREATE POLICY "read_mockup_assets" ON mockup_assets FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_mockup_assets" ON mockup_assets;
CREATE POLICY "insert_mockup_assets" ON mockup_assets FOR INSERT
  TO authenticated WITH CHECK (true);

-- Auto-increment version and updated_at on project update
CREATE OR REPLACE FUNCTION bump_project_version()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.version = OLD.version + 1;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS projects_version_bump ON projects;
CREATE TRIGGER projects_version_bump
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION bump_project_version();

-- Insert default cup mockup if not exists
INSERT INTO mockup_assets (id, title, category, config_path, thumb)
VALUES ('cup', 'Paper Cup', 'Drinkware', '/mockups/cup/config.json', '/mockups/cup/base.jpg')
ON CONFLICT (id) DO NOTHING;
