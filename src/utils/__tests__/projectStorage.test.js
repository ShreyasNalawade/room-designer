import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAllProjects,
  saveProject,
  createNewProject,
  deleteProject,
  duplicateProject,
  renameProject,
  getActiveProjectId,
  setActiveProjectId,
  buildNewProject,
  clearAllProjectsStorage,
  getStorage,
  LEGACY_STORAGE_KEY,
} from '../projectStorage';

describe('Multi-Project Storage System', () => {
  beforeEach(() => {
    clearAllProjectsStorage();
  });

  it('builds a new project with correct schema and room geometry', () => {
    const proj = buildNewProject({
      name: 'Penthouse Living',
      shape: 'rectangle',
      widthMm: 7000,
      lengthMm: 5000,
      unit: 'm',
    });

    expect(proj.id).toMatch(/^proj_/);
    expect(proj.name).toBe('Penthouse Living');
    expect(proj.room.name).toBe('Penthouse Living');
    expect(proj.room.widthMm).toBe(7000);
    expect(proj.room.lengthMm).toBe(5000);
    expect(proj.room.rotation).toBe(0);
    expect(proj.items).toEqual([]);
    expect(proj.createdAt).toBeDefined();
    expect(proj.updatedAt).toBeDefined();
  });

  it('provides a default starter project if storage is fresh', () => {
    const all = getAllProjects();
    expect(all.length).toBeGreaterThanOrEqual(1);
    expect(all[0].name).toBe('Living Room Design');
    expect(getActiveProjectId()).toBe(all[0].id);
  });

  it('migrates legacy single-project storage seamlessly if present', () => {
    const legacy = {
      savedAt: '2026-10-18T10:00:00.000Z',
      unit: 'ft',
      room: {
        id: 'legacy-room-1',
        name: 'My Custom Alcove',
        shape: 'trapezoid',
        widthMm: 6000,
        lengthMm: 4500,
        topWidthMm: 4000,
        bottomWidthMm: 6000,
        rotation: 90,
      },
      items: [{ id: 'it_1', name: 'Bed', widthMm: 1800, depthMm: 2000 }],
    };
    getStorage().setItem(LEGACY_STORAGE_KEY, JSON.stringify(legacy));

    const projects = getAllProjects();
    expect(projects.length).toBe(1);
    expect(projects[0].name).toBe('My Custom Alcove');
    expect(projects[0].unit).toBe('ft');
    expect(projects[0].room.shape).toBe('trapezoid');
    expect(projects[0].room.rotation).toBe(90);
    expect(projects[0].items.length).toBe(1);
  });

  it('creates, saves, and lists multiple projects', () => {
    createNewProject({ name: 'Project Alpha', widthMm: 5000, lengthMm: 4000 });
    createNewProject({ name: 'Project Beta', shape: 'trapezoid', widthMm: 6000, lengthMm: 5000 });

    const all = getAllProjects();
    expect(all.length).toBeGreaterThanOrEqual(2);
    expect(all.some((p) => p.name === 'Project Alpha')).toBe(true);
    expect(all.some((p) => p.name === 'Project Beta')).toBe(true);
  });

  it('updates an existing project directly with saveProject', () => {
    const p = createNewProject({ name: 'Initial Version' });
    const updated = { ...p, name: 'Directly Updated Version' };
    const res = saveProject(updated);
    expect(res.success).toBe(true);
    expect(getAllProjects().find((x) => x.id === p.id)?.name).toBe('Directly Updated Version');
  });

  it('duplicates an existing project with cloned components and new id', () => {
    const orig = createNewProject({
      name: 'Original Master',
      items: [{ id: 'b1', name: 'King Bed', widthMm: 1800, depthMm: 2000 }],
    });

    const dupRes = duplicateProject(orig.id);
    expect(dupRes.success).toBe(true);
    expect(dupRes.project.id).not.toBe(orig.id);
    expect(dupRes.project.name).toBe('Original Master (Copy)');
    expect(dupRes.project.items.length).toBe(1);
    expect(dupRes.project.items[0].id).not.toBe('b1');
  });

  it('renames an existing project and its room title', () => {
    const p = createNewProject({ name: 'Old Title' });
    const res = renameProject(p.id, 'Renamed Luxury Suite');

    expect(res.success).toBe(true);
    expect(res.project.name).toBe('Renamed Luxury Suite');
    expect(res.project.room.name).toBe('Renamed Luxury Suite');

    const loaded = getAllProjects().find((x) => x.id === p.id);
    expect(loaded.name).toBe('Renamed Luxury Suite');
  });

  it('deletes a project and updates active ID if needed', () => {
    const p1 = createNewProject({ name: 'To Keep' });
    const p2 = createNewProject({ name: 'To Delete' });

    setActiveProjectId(p2.id);
    expect(getActiveProjectId()).toBe(p2.id);

    const delRes = deleteProject(p2.id);
    expect(delRes.success).toBe(true);
    expect(getAllProjects().some((x) => x.id === p2.id)).toBe(false);
    expect(getActiveProjectId()).toBe(p1.id);
  });
});
