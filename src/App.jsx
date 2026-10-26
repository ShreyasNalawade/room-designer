import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import HeaderToolbar from './components/layout/HeaderToolbar';
import LeftSidebar from './components/layout/LeftSidebar';
import RightPropertiesPanel from './components/layout/RightPropertiesPanel';
import StatusBar from './components/layout/StatusBar';
import MobileNavBar from './components/layout/MobileNavBar';
import MobileActionBar from './components/layout/MobileActionBar';
import RoomCanvas from './components/canvas/RoomCanvas';
import ProjectHubModal from './components/modals/ProjectHubModal';
import { validateRoomDimensions } from './utils/validation';
import { analyzeItemCollisions } from './utils/collision';
import {
  getAllProjects,
  getActiveProjectId,
  setActiveProjectId,
  saveProject,
  createNewProject,
  deleteProject,
  duplicateProject,
  renameProject,
  exportProjectFile,
  importProjectFromFile,
  DEFAULT_STARTER_ROOM,
} from './utils/projectStorage';
import { DEFAULT_UNIT } from './constants/units';
import { rotateRoom, setRoomRotation, setCompassHeading, rotatePhysicalLayout, flipPhysicalLayout } from './utils/orientation';
import { useDesignHistory } from './utils/useDesignHistory';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  // 1. Multi-Project State
  const [projects, setProjects] = useState(() => getAllProjects());
  const [activeProjectId, setCurActiveProjectId] = useState(() => getActiveProjectId());

  // Show Project Hub modal on first visit in session, or null if user already visited
  const [showProjectHub, setShowProjectHub] = useState(() => {
    try {
      const hasVisited = sessionStorage.getItem('roomcraft_visited_session');
      return hasVisited ? null : 'welcome';
    } catch {
      return 'welcome';
    }
  });

  // Currently active project object
  const activeProject = useMemo(() => {
    return projects.find((p) => p.id === activeProjectId) || projects[0] || null;
  }, [projects, activeProjectId]);

  // Active Project Working State & History Manager (Undo / Redo)
  const [unit, setUnit] = useState(() => activeProject?.unit || DEFAULT_UNIT);
  const [lastSavedAt, setLastSavedAt] = useState(() => activeProject?.updatedAt || null);

  const {
    items,
    room,
    selectedId,
    canUndo,
    canRedo,
    setItems,
    setItem,
    setRoom,
    setRoomAndItems,
    setSelectedId,
    resetHistory,
    undo: handleUndo,
    redo: handleRedo,
  } = useDesignHistory({
    room: activeProject?.room || DEFAULT_STARTER_ROOM,
    items: activeProject?.items || [],
    selectedId: null,
  });

  const [cursorCoord, setCursorCoord] = useState(null);
  const [activeDrawer, setActiveDrawer] = useState(null); // 'furniture' | 'room' | 'inspector' | null
  const [toast, setToast] = useState(null);
  const canvasRef = useRef(null);
  const activeIdRef = useRef(activeProjectId);

  // Sync workspace state when active project switches
  useEffect(() => {
    if (activeProject && activeProject.id !== activeIdRef.current) {
      activeIdRef.current = activeProject.id;
      setUnit(activeProject.unit || DEFAULT_UNIT);
      resetHistory({
        room: activeProject.room || DEFAULT_STARTER_ROOM,
        items: activeProject.items || [],
        selectedId: null,
      });
      setLastSavedAt(activeProject.updatedAt || null);
    }
  }, [activeProject, resetHistory]);

  // Debounced autosave whenever room, items, or unit change for active project
  useEffect(() => {
    if (!activeProjectId || !activeProject) return;
    const timer = setTimeout(() => {
      const now = new Date().toISOString();
      const updatedProj = {
        ...activeProject,
        unit,
        room,
        items,
        updatedAt: now,
      };
      saveProject(updatedProj);
      setProjects((prev) =>
        prev.map((p) => (p.id === activeProjectId ? updatedProj : p))
      );
      setLastSavedAt(now);
    }, 1500);
    return () => clearTimeout(timer);
  }, [room, items, unit, activeProjectId, activeProject]);

  // Auto-dismiss toast after 3.5 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Compute live validation of current room dimensions
  const validation = useMemo(
    () => validateRoomDimensions(room, unit),
    [room, unit]
  );

  // Analyze collisions & boundaries
  const { outsideIds, overlappingIds } = useMemo(
    () => analyzeItemCollisions(items, room),
    [items, room]
  );

  // Selected item reference
  const selectedItem = useMemo(
    () => items.find((it) => it.id === selectedId) || null,
    [items, selectedId]
  );

  // Open Project Hub modal in given view ('welcome' | 'new' | 'history')
  const handleOpenProjectHub = useCallback((view = 'welcome') => {
    setShowProjectHub(view);
  }, []);

  // Close Project Hub modal and mark session as visited
  const handleCloseProjectHub = useCallback(() => {
    setShowProjectHub(null);
    try {
      sessionStorage.setItem('roomcraft_visited_session', 'true');
    } catch {
      // ignore
    }
  }, []);

  // Create new project
  const handleCreateProject = useCallback(
    (projectParams) => {
      const newProj = createNewProject(projectParams);
      if (newProj) {
        const all = getAllProjects();
        setProjects(all);
        setCurActiveProjectId(newProj.id);
        setActiveProjectId(newProj.id);
        activeIdRef.current = newProj.id;
        setUnit(newProj.unit);
        resetHistory({
          room: newProj.room,
          items: newProj.items,
          selectedId: null,
        });
        setLastSavedAt(newProj.updatedAt);
        handleCloseProjectHub();
        setToast({
          message: `Created project "${newProj.name}"!`,
          type: 'success',
        });
      }
    },
    [handleCloseProjectHub, resetHistory]
  );

  // Select / Switch active project
  const handleSelectProject = useCallback(
    (projectId) => {
      const target = projects.find((p) => p.id === projectId);
      if (target) {
        setCurActiveProjectId(target.id);
        setActiveProjectId(target.id);
        activeIdRef.current = target.id;
        setUnit(target.unit || DEFAULT_UNIT);
        resetHistory({
          room: target.room,
          items: target.items || [],
          selectedId: null,
        });
        setLastSavedAt(target.updatedAt);
        handleCloseProjectHub();
        setToast({
          message: `Switched to project "${target.name}"`,
          type: 'success',
        });
      }
    },
    [projects, handleCloseProjectHub, resetHistory]
  );

  // Import JSON file as a project
  const handleImportProject = useCallback(
    async (file, customName) => {
      const res = await importProjectFromFile(file, customName);
      if (res.success && res.project) {
        const all = getAllProjects();
        setProjects(all);
        setCurActiveProjectId(res.project.id);
        setActiveProjectId(res.project.id);
        activeIdRef.current = res.project.id;
        setUnit(res.project.unit || DEFAULT_UNIT);
        resetHistory({
          room: res.project.room,
          items: res.project.items || [],
          selectedId: null,
        });
        setLastSavedAt(res.project.updatedAt);
        handleCloseProjectHub();
        setToast({
          message: `Successfully imported "${res.project.name}" with ${res.project.items.length} components!`,
          type: 'success',
        });
      } else {
        setToast({ message: `Import error: ${res.error}`, type: 'error' });
      }
    },
    [handleCloseProjectHub, resetHistory]
  );

  // Duplicate a project
  const handleDuplicateProject = useCallback((projectId) => {
    const res = duplicateProject(projectId);
    if (res.success && res.project) {
      setProjects(getAllProjects());
      setToast({
        message: `Project duplicated as "${res.project.name}"!`,
        type: 'success',
      });
    }
  }, []);

  // Delete a project
  const handleDeleteProject = useCallback(
    (projectId) => {
      const res = deleteProject(projectId);
      if (res.success) {
        const remaining = getAllProjects();
        setProjects(remaining);
        const nextActiveId = getActiveProjectId();
        setCurActiveProjectId(nextActiveId);
        setToast({ message: 'Project removed.', type: 'success' });
      }
    },
    []
  );

  // Rename a project
  const handleRenameProject = useCallback(
    (projectId, newName) => {
      const res = renameProject(projectId, newName);
      if (res.success) {
        setProjects(getAllProjects());
        if (projectId === activeProjectId) {
          setRoom((prev) => ({ ...prev, name: newName.trim() }));
        }
        setToast({ message: `Renamed to "${newName.trim()}"`, type: 'success' });
      }
    },
    [activeProjectId, setRoom]
  );

  // Save current project manually
  const handleSaveDesign = useCallback(() => {
    if (!activeProject) return;
    const now = new Date().toISOString();
    const updated = {
      ...activeProject,
      room,
      items,
      unit,
      updatedAt: now,
    };
    saveProject(updated);
    setProjects((prev) => prev.map((p) => (p.id === activeProject.id ? updated : p)));
    setLastSavedAt(now);
    setToast({
      message: `Project "${activeProject.name}" successfully saved!`,
      type: 'success',
    });
  }, [activeProject, room, items, unit]);

  // Export current project to JSON file
  const handleExportDesign = useCallback(() => {
    if (!activeProject) return;
    const currentSnapshot = {
      ...activeProject,
      room,
      items,
      unit,
    };
    const res = exportProjectFile(currentSnapshot);
    if (res.success) {
      setToast({
        message: `Exported design as "${res.fileName}"! You can import this on any device.`,
        type: 'success',
      });
    } else {
      setToast({ message: `Export error: ${res.error}`, type: 'error' });
    }
  }, [activeProject, room, items, unit]);

  // Reset current project to clean room (records to history so reset can be undone if clicked by mistake)
  const handleResetDesign = () => {
    if (window.confirm('Reset this project design and start fresh? All uncommitted edits will be cleared.')) {
      setRoomAndItems(
        {
          ...DEFAULT_STARTER_ROOM,
          id: `room-${Date.now()}`,
          name: activeProject?.name || 'Living Room Design',
        },
        [],
        null
      );
      setToast({ message: 'Reset current project to fresh room.', type: 'success' });
    }
  };

  // Handle room preset selection
  const handlePresetSelect = (preset) => {
    setRoom({
      id: `room-${Date.now()}`,
      presetId: preset.id,
      name: preset.name,
      shape: preset.type || 'rectangle',
      widthMm: preset.widthMm,
      lengthMm: preset.lengthMm,
      topWidthMm: preset.topWidthMm || Math.round(preset.widthMm * 0.75),
      bottomWidthMm: preset.bottomWidthMm || preset.widthMm,
      rotation: 0,
    });
  };

  // Rotate entire room and all its components
  const handleRotateRoom = useCallback((deltaDeg = 90) => {
    setRoom((prev) => rotateRoom(prev, deltaDeg));
  }, [setRoom]);

  // Set entire room rotation to exact degree
  const handleSetRoomRotation = useCallback((targetDeg = 0) => {
    setRoom((prev) => setRoomRotation(prev, targetDeg));
  }, [setRoom]);

  // Set compass direction heading (cardinal orientation of home without turning canvas)
  const handleSetCompassHeading = useCallback((targetDeg = 0) => {
    setRoom((prev) => setCompassHeading(prev, targetDeg));
  }, [setRoom]);

  // Physically rotate entire layout (room geometry + all placed items)
  const handleRotateLayout = useCallback((deltaDeg = 90) => {
    const res = rotatePhysicalLayout(room, items, deltaDeg);
    setRoomAndItems(res.room, res.items);
    setToast({
      message: `Layout physically rotated ${deltaDeg > 0 ? `+${deltaDeg}°` : `${deltaDeg}°`}.`,
      type: 'info',
    });
  }, [room, items, setRoomAndItems]);

  // Physically flip / mirror entire layout across horizontal or vertical axis
  const handleFlipLayout = useCallback((axis = 'horizontal') => {
    const res = flipPhysicalLayout(room, items, axis);
    setRoomAndItems(res.room, res.items);
    setToast({
      message: `Layout flipped ${axis}.`,
      type: 'info',
    });
  }, [room, items, setRoomAndItems]);

  // Add new furniture component from catalog into room
  const handleAddFurnitureItem = (catalogItem) => {
    const count = items.length;
    const offsetMm = (count % 5) * 150;
    const w = catalogItem.widthMm || 800;
    const d = catalogItem.depthMm || 600;

    const newItem = {
      id: `inst_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      catalogId: catalogItem.id,
      name: catalogItem.name,
      category: catalogItem.category,
      symbol: catalogItem.symbol,
      color: catalogItem.color,
      x: -w / 2 + offsetMm,
      y: -d / 2 + offsetMm,
      widthMm: w,
      depthMm: d,
      rotation: 0,
      locked: false,
    };

    setItems((prev) => [...prev, newItem]);
    setSelectedId(newItem.id);
  };

  // Update a single item
  const handleChangeItem = useCallback(
    (updated, options = {}) => {
      setItem(updated, options);
    },
    [setItem]
  );

  // Duplicate an item
  const handleDuplicateItem = useCallback(
    (itemToDup) => {
      const newItem = {
        ...itemToDup,
        id: `inst_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: `${itemToDup.name} (Copy)`,
        x: itemToDup.x + 200,
        y: itemToDup.y + 200,
        locked: false,
      };
      setItems((prev) => [...prev, newItem]);
      setSelectedId(newItem.id);
    },
    [setItems, setSelectedId]
  );

  // Delete an item
  const handleDeleteItem = useCallback(
    (itemId) => {
      setItems((prev) => prev.filter((it) => it.id !== itemId));
      setSelectedId((prev) => (prev === itemId ? null : prev));
    },
    [setItems, setSelectedId]
  );

  // Rotate selected item
  const handleRotate = useCallback(
    (deg) => {
      if (!selectedItem || selectedItem.locked) return;
      const next = ((selectedItem.rotation || 0) + deg) % 360;
      setItem({
        ...selectedItem,
        rotation: next < 0 ? next + 360 : next,
      });
    },
    [selectedItem, setItem]
  );

  // Toggle lock state
  const handleToggleLock = useCallback(
    (item) => {
      setItem({
        ...item,
        locked: !item.locked,
      });
    },
    [setItem]
  );

  // Nudge item position
  const handleNudge = useCallback(
    (dx, dy) => {
      if (!selectedItem || selectedItem.locked) return;
      setItem({
        ...selectedItem,
        x: selectedItem.x + dx,
        y: selectedItem.y + dy,
      });
    },
    [selectedItem, setItem]
  );

  // Fit to screen view
  const handleFitToView = useCallback(() => {
    canvasRef.current?.fitToView?.();
  }, []);

  // Global keyboard shortcuts (Ctrl+Z: Undo, Ctrl+Y/Cmd+Shift+Z: Redo, Esc, Delete, Ctrl+D, Arrow nudge)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Escape') {
        setSelectedId(null);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          handleDeleteItem(selectedId);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (selectedItem) {
          handleDuplicateItem(selectedItem);
        }
      } else if (e.key.startsWith('Arrow') && selectedItem && !selectedItem.locked) {
        e.preventDefault();
        const step = e.shiftKey ? 200 : 50; // 200mm or 50mm
        let dx = 0;
        let dy = 0;
        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;
        if (e.key === 'ArrowUp') dy = -step;
        if (e.key === 'ArrowDown') dy = step;

        setItem({
          ...selectedItem,
          x: selectedItem.x + dx,
          y: selectedItem.y + dy,
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, selectedId, handleDeleteItem, handleDuplicateItem, handleUndo, handleRedo, setSelectedId, setItem]);

  return (
    <div className="flex flex-col h-full h-[100dvh] w-full max-w-full overflow-hidden bg-slate-950 font-sans relative select-none">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md border animate-in fade-in slide-in-from-top-2 duration-200 text-xs font-medium bg-slate-900/95 border-slate-700 text-slate-100 max-w-[90vw]">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="truncate">{toast.message}</span>
        </div>
      )}

      {/* 1. Top Navigation & Toolbar */}
      <HeaderToolbar
        currentProject={activeProject}
        projectsCount={projects.length}
        onOpenProjectHub={handleOpenProjectHub}
        room={room}
        unit={unit}
        onUnitChange={setUnit}
        onPresetSelect={handlePresetSelect}
        onSaveDesign={handleSaveDesign}
        onResetDesign={handleResetDesign}
        onExportDesign={handleExportDesign}
        onImportDesign={handleImportProject}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        lastSavedAt={lastSavedAt}
      />

      {/* 2. Main Workspace Layout */}
      <main className="flex-1 min-h-0 flex flex-row overflow-hidden relative">
        {/* Desktop Left Panel (Hidden on screens < lg) */}
        <LeftSidebar
          room={room}
          unit={unit}
          validation={validation}
          onChangeRoom={setRoom}
          onPresetSelect={handlePresetSelect}
          onAddFurnitureItem={handleAddFurnitureItem}
          placedItemsCount={items.length}
        />

        {/* Central Canvas Viewport: Full 100% width on Mobile! */}
        <section className="flex-1 min-h-0 h-full relative overflow-hidden flex flex-col">
          <RoomCanvas
            room={room}
            unit={unit}
            items={items}
            selectedId={selectedId}
            outsideIds={outsideIds}
            overlappingIds={overlappingIds}
            onSelect={setSelectedId}
            onChangeItem={handleChangeItem}
            onCursorMove={setCursorCoord}
            onRotateRoom={handleRotateRoom}
            onSetRotation={handleSetRoomRotation}
            onSetCompassHeading={handleSetCompassHeading}
            onRotateLayout={handleRotateLayout}
            onFlipLayout={handleFlipLayout}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
            canvasRef={canvasRef}
          />

          {/* Floating Mobile Action Bar (Erase, Rotate, Copy, Size, Nudge, Undo) */}
          {selectedItem && (
            <MobileActionBar
              selectedItem={selectedItem}
              room={room}
              items={items}
              unit={unit}
              onRotate={handleRotate}
              onDuplicate={handleDuplicateItem}
              onDelete={handleDeleteItem}
              onToggleLock={handleToggleLock}
              onNudge={handleNudge}
              onOpenProperties={() => setActiveDrawer('inspector')}
              onDeselect={() => setSelectedId(null)}
              onUndo={handleUndo}
              canUndo={canUndo}
            />
          )}
        </section>

        {/* Desktop Right Inspector Panel (Hidden on screens < lg) */}
        <RightPropertiesPanel
          room={room}
          unit={unit}
          items={items}
          selectedItem={selectedItem}
          isOverlapping={selectedId ? overlappingIds.has(selectedId) : false}
          isOutside={selectedId ? outsideIds.has(selectedId) : false}
          onChangeItem={handleChangeItem}
          onDuplicateItem={handleDuplicateItem}
          onDeleteItem={handleDeleteItem}
          onDeselect={() => setSelectedId(null)}
          onRotateRoom={handleRotateRoom}
          onSetRotation={handleSetRoomRotation}
          onSetCompassHeading={handleSetCompassHeading}
          onRotateLayout={handleRotateLayout}
          onFlipLayout={handleFlipLayout}
          totalItemsCount={items.length}
          onAddFurnitureItem={handleAddFurnitureItem}
        />
      </main>

      {/* 3. Mobile Slide-Over Drawers (< lg screens) */}
      {(activeDrawer === 'furniture' || activeDrawer === 'room') && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setActiveDrawer(null)}
          />
          <div className="relative z-10 w-full h-[82vh] max-h-[85vh] bg-slate-900 rounded-t-3xl border-t border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            <LeftSidebar
              key={activeDrawer}
              room={room}
              unit={unit}
              validation={validation}
              onChangeRoom={setRoom}
              onPresetSelect={(preset) => {
                handlePresetSelect(preset);
                setActiveDrawer(null);
              }}
              onAddFurnitureItem={(catalogItem) => {
                handleAddFurnitureItem(catalogItem);
                setActiveDrawer(null); // Close drawer so user sees item on canvas!
              }}
              placedItemsCount={items.length}
              initialTab={activeDrawer === 'furniture' ? 'library' : 'room'}
              isMobileDrawer={true}
              onClose={() => setActiveDrawer(null)}
            />
          </div>
        </div>
      )}

      {activeDrawer === 'inspector' && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setActiveDrawer(null)}
          />
          <div className="relative z-10 w-full h-[78vh] max-h-[85vh] bg-slate-900 rounded-t-3xl border-t border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            <RightPropertiesPanel
              room={room}
              unit={unit}
              items={items}
              selectedItem={selectedItem}
              isOverlapping={selectedId ? overlappingIds.has(selectedId) : false}
              isOutside={selectedId ? outsideIds.has(selectedId) : false}
              onChangeItem={handleChangeItem}
              onDuplicateItem={handleDuplicateItem}
              onDeleteItem={(id) => {
                handleDeleteItem(id);
                setActiveDrawer(null);
              }}
              onDeselect={() => {
                setSelectedId(null);
                setActiveDrawer(null);
              }}
              totalItemsCount={items.length}
              onRotateRoom={handleRotateRoom}
              onSetRotation={handleSetRoomRotation}
              onSetCompassHeading={handleSetCompassHeading}
              onRotateLayout={handleRotateLayout}
              onFlipLayout={handleFlipLayout}
              isMobileDrawer={true}
              onClose={() => setActiveDrawer(null)}
              onAddFurnitureItem={handleAddFurnitureItem}
            />
          </div>
        </div>
      )}

      {/* 4. Desktop Status Bar (Hidden on Mobile) */}
      <div className="hidden sm:block">
        <StatusBar
          room={room}
          unit={unit}
          cursorCoord={cursorCoord}
          validation={validation}
          selectedItem={selectedItem}
          outsideCount={outsideIds.size}
          overlapCount={overlappingIds.size}
        />
      </div>

      {/* 5. Mobile Bottom Navigation Bar (< lg screens) */}
      <MobileNavBar
        activeDrawer={activeDrawer}
        onToggleDrawer={setActiveDrawer}
        onOpenProjectHub={handleOpenProjectHub}
        onFitToView={handleFitToView}
        placedItemsCount={items.length}
        hasSelection={!!selectedItem}
        projectsCount={projects.length}
      />

      {/* 6. Multi-Project Management & Welcome Modal */}
      <ProjectHubModal
        isOpen={!!showProjectHub}
        initialView={showProjectHub || 'welcome'}
        onClose={handleCloseProjectHub}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onImportProject={handleImportProject}
        onDuplicateProject={handleDuplicateProject}
        onDeleteProject={handleDeleteProject}
        onRenameProject={handleRenameProject}
      />
    </div>
  );
}
