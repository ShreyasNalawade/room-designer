/**
 * Multi-Project Management and Persistence Storage Service for RoomCraft
 */
import { parseAndValidateDesignJSON } from './storage';
import { DEFAULT_UNIT } from '../constants/units';
import { ROOM_PRESETS } from '../constants/presets';

export const PROJECTS_STORAGE_KEY = 'roomcraft_projects_v2';
export const ACTIVE_PROJECT_ID_KEY = 'roomcraft_active_project_id';
export const LEGACY_STORAGE_KEY = 'roomcraft_design_v2';

// Memory store fallback for environments without window.localStorage (e.g. tests, SSR)
let memoryStore = {};

export function getStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      return globalThis.localStorage;
    }
  } catch {
    // Ignore access error
  }
  return {
    getItem: (key) => memoryStore[key] || null,
    setItem: (key, val) => {
      memoryStore[key] = String(val);
    },
    removeItem: (key) => {
      delete memoryStore[key];
    },
    clear: () => {
      memoryStore = {};
    },
  };
}

export function clearAllProjectsStorage() {
  const storage = getStorage();
  storage.removeItem(PROJECTS_STORAGE_KEY);
  storage.removeItem(ACTIVE_PROJECT_ID_KEY);
  storage.removeItem(LEGACY_STORAGE_KEY);
  memoryStore = {};
}

export const DEFAULT_STARTER_ROOM = {
  id: 'room-1',
  presetId: 'living-room',
  name: 'Living Room (Spacious)',
  shape: 'rectangle',
  widthMm: 6000,
  lengthMm: 4500,
  topWidthMm: 4000,
  bottomWidthMm: 6000,
  rotation: 0,
};

/**
 * Generate a new project structure
 */
export function buildNewProject({
  name = 'New Room Design',
  shape = 'rectangle',
  widthMm = 6000,
  lengthMm = 4500,
  topWidthMm = 4000,
  bottomWidthMm = 6000,
  unit = DEFAULT_UNIT,
  presetId = 'living-room',
  items = [],
  rotation = 0,
} = {}) {
  const timestamp = new Date().toISOString();
  const id = `proj_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  return {
    id,
    name: name.trim() || 'Untitled Project',
    createdAt: timestamp,
    updatedAt: timestamp,
    unit: unit || 'm',
    room: {
      id: `room_${Date.now()}`,
      presetId: presetId || null,
      name: name.trim() || 'Untitled Project',
      shape: shape || 'rectangle',
      widthMm: Number(widthMm) || 6000,
      lengthMm: Number(lengthMm) || 4500,
      topWidthMm: shape === 'trapezoid' ? Number(topWidthMm) || 4000 : undefined,
      bottomWidthMm: shape === 'trapezoid' ? Number(bottomWidthMm) || 6000 : undefined,
      rotation: Number(rotation) || 0,
    },
    items: Array.isArray(items) ? items : [],
  };
}

/**
 * Get all saved projects from storage (with legacy migration support)
 */
export function getAllProjects() {
  const storage = getStorage();
  try {
    const raw = storage.getItem(PROJECTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
      }
    }

    // Check for legacy single-project storage to seamlessly migrate user's previous work
    const legacyRaw = storage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      try {
        const legacy = JSON.parse(legacyRaw);
        if (legacy && legacy.room) {
          const migratedProject = {
            id: `proj_migrated_${Date.now()}`,
            name: legacy.room.name || 'Living Room (Restored)',
            createdAt: legacy.savedAt || new Date().toISOString(),
            updatedAt: legacy.savedAt || new Date().toISOString(),
            unit: legacy.unit || 'm',
            room: {
              ...legacy.room,
              rotation: legacy.room.rotation || 0,
            },
            items: Array.isArray(legacy.items) ? legacy.items : [],
          };
          saveAllProjects([migratedProject]);
          setActiveProjectId(migratedProject.id);
          return [migratedProject];
        }
      } catch (err) {
        console.warn('Failed to migrate legacy design:', err);
      }
    }

    // Default starter project if storage is fresh
    const defaultProject = buildNewProject({
      name: 'Living Room Design',
      presetId: 'living-room',
      shape: 'rectangle',
      widthMm: 6000,
      lengthMm: 4500,
      unit: 'm',
    });
    saveAllProjects([defaultProject]);
    setActiveProjectId(defaultProject.id);
    return [defaultProject];
  } catch (err) {
    console.error('Failed to load projects from storage:', err);
    return [];
  }
}

/**
 * Persist an array of projects to storage
 */
export function saveAllProjects(projects) {
  const storage = getStorage();
  try {
    storage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    return true;
  } catch (err) {
    console.error('Failed to save projects to storage:', err);
    return false;
  }
}

/**
 * Get active project ID from storage
 */
export function getActiveProjectId() {
  const storage = getStorage();
  try {
    const id = storage.getItem(ACTIVE_PROJECT_ID_KEY);
    if (id) return id;
    const all = getAllProjects();
    return all[0]?.id || null;
  } catch {
    return null;
  }
}

/**
 * Set active project ID in storage
 */
export function setActiveProjectId(id) {
  const storage = getStorage();
  try {
    if (id) {
      storage.setItem(ACTIVE_PROJECT_ID_KEY, id);
    } else {
      storage.removeItem(ACTIVE_PROJECT_ID_KEY);
    }
  } catch (err) {
    console.error('Failed to set active project id:', err);
  }
}

/**
 * Find project by ID
 */
export function getProjectById(id) {
  const projects = getAllProjects();
  return projects.find((p) => p.id === id) || null;
}

/**
 * Save / Update a single project in storage
 */
export function saveProject(project) {
  if (!project || !project.id) return { success: false, error: 'Invalid project data' };
  try {
    const projects = getAllProjects();
    const now = new Date().toISOString();
    const updatedProject = {
      ...project,
      updatedAt: now,
    };

    const index = projects.findIndex((p) => p.id === project.id);
    if (index >= 0) {
      projects[index] = updatedProject;
    } else {
      projects.unshift(updatedProject);
    }

    saveAllProjects(projects);
    setActiveProjectId(updatedProject.id);
    return { success: true, project: updatedProject };
  } catch (err) {
    console.error('Failed to save project:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Create and persist a new project
 */
export function createNewProject({
  name = 'New Room Design',
  presetId = null,
  shape = 'rectangle',
  widthMm = 6000,
  lengthMm = 4500,
  topWidthMm = 4000,
  bottomWidthMm = 6000,
  unit = 'm',
  items = [],
  rotation = 0,
} = {}) {
  let presetData = null;
  if (presetId) {
    presetData = ROOM_PRESETS.find((p) => p.id === presetId);
  }

  const project = buildNewProject({
    name: name.trim() || presetData?.name || 'New Room Design',
    shape: presetData?.type || shape || 'rectangle',
    widthMm: presetData?.widthMm || widthMm,
    lengthMm: presetData?.lengthMm || lengthMm,
    topWidthMm: presetData?.topWidthMm || topWidthMm,
    bottomWidthMm: presetData?.bottomWidthMm || bottomWidthMm,
    presetId: presetId || null,
    unit: unit || 'm',
    items: items || [],
    rotation: rotation || 0,
  });

  const res = saveProject(project);
  return res.success ? project : null;
}

/**
 * Delete a project by ID
 */
export function deleteProject(id) {
  try {
    const projects = getAllProjects();
    const filtered = projects.filter((p) => p.id !== id);
    saveAllProjects(filtered);

    // If active project was deleted, point active ID to first remaining project
    const activeId = getActiveProjectId();
    if (activeId === id) {
      setActiveProjectId(filtered[0]?.id || null);
    }

    return { success: true, remaining: filtered };
  } catch (err) {
    console.error('Failed to delete project:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Duplicate a project
 */
export function duplicateProject(id) {
  try {
    const original = getProjectById(id);
    if (!original) return { success: false, error: 'Project not found' };

    const timestamp = new Date().toISOString();
    const cloned = {
      ...original,
      id: `proj_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: `${original.name} (Copy)`,
      createdAt: timestamp,
      updatedAt: timestamp,
      room: {
        ...original.room,
        id: `room_${Date.now()}`,
        name: `${original.room.name || original.name} (Copy)`,
      },
      items: original.items.map((it, idx) => ({
        ...it,
        id: `inst_${Date.now()}_${idx}`,
      })),
    };

    saveProject(cloned);
    return { success: true, project: cloned };
  } catch (err) {
    console.error('Failed to duplicate project:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Rename a project
 */
export function renameProject(id, newName) {
  const project = getProjectById(id);
  if (!project) return { success: false, error: 'Project not found' };
  const trimmed = newName?.trim();
  if (!trimmed) return { success: false, error: 'Project name cannot be empty' };

  const updated = {
    ...project,
    name: trimmed,
    room: {
      ...project.room,
      name: trimmed,
    },
  };

  return saveProject(updated);
}

/**
 * Export project as a JSON file download
 */
export function exportProjectFile(project) {
  try {
    const payload = {
      app: 'RoomCraft',
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      project: {
        id: project.id,
        name: project.name,
      },
      room: project.room,
      items: project.items || [],
      unit: project.unit || 'm',
    };

    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const safeName = (project.name || 'roomcraft-design')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `${safeName}-${dateStr}.json`;

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, fileName };
  } catch (err) {
    console.error('Failed to export project file:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Import a design JSON file and create a new project from it
 */
export async function importProjectFromFile(file, customName = null) {
  try {
    const text = await file.text();
    const result = parseAndValidateDesignJSON(text);
    if (!result.valid) {
      return { success: false, error: result.error };
    }

    const { room, items, unit } = result.data;
    const projectName =
      customName?.trim() ||
      room.name ||
      file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') ||
      'Imported Project';

    const newProject = buildNewProject({
      name: projectName,
      shape: room.shape,
      widthMm: room.widthMm,
      lengthMm: room.lengthMm,
      topWidthMm: room.topWidthMm,
      bottomWidthMm: room.bottomWidthMm,
      unit: unit || 'm',
      items: items || [],
      rotation: room.rotation || 0,
      presetId: room.presetId || null,
    });

    // Ensure room name matches project name
    newProject.room.name = projectName;

    saveProject(newProject);

    return {
      success: true,
      project: newProject,
    };
  } catch (err) {
    return { success: false, error: `Failed to import file: ${err.message}` };
  }
}
