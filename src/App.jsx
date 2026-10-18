import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import HeaderToolbar from './components/layout/HeaderToolbar';
import LeftSidebar from './components/layout/LeftSidebar';
import RightPropertiesPanel from './components/layout/RightPropertiesPanel';
import StatusBar from './components/layout/StatusBar';
import MobileNavBar from './components/layout/MobileNavBar';
import MobileActionBar from './components/layout/MobileActionBar';
import RoomCanvas from './components/canvas/RoomCanvas';
import { validateRoomDimensions } from './utils/validation';
import { analyzeItemCollisions } from './utils/collision';
import {
  saveDesign,
  loadDesign,
  clearSavedDesign,
  exportDesignFile,
  importDesignFromFile,
} from './utils/storage';
import { DEFAULT_UNIT } from './constants/units';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const DEFAULT_STARTER_ROOM = {
  id: 'room-1',
  presetId: 'living-room',
  name: 'Living Room (Spacious)',
  shape: 'rectangle',
  widthMm: 6000,
  lengthMm: 4500,
  topWidthMm: 4000,
  bottomWidthMm: 6000,
};

export default function App() {
  // Initialize state from localStorage if available
  const [unit, setUnit] = useState(() => {
    const saved = loadDesign();
    return saved?.unit || DEFAULT_UNIT;
  });

  const [room, setRoom] = useState(() => {
    const saved = loadDesign();
    return saved?.room || DEFAULT_STARTER_ROOM;
  });

  const [items, setItems] = useState(() => {
    const saved = loadDesign();
    return saved?.items || [];
  });

  const [selectedId, setSelectedId] = useState(null);
  const [cursorCoord, setCursorCoord] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(() => {
    const saved = loadDesign();
    return saved?.savedAt || null;
  });

  const [activeDrawer, setActiveDrawer] = useState(null); // 'furniture' | 'room' | 'inspector' | null
  const [toast, setToast] = useState(null);
  const canvasRef = useRef(null);

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

  // Save design to browser storage
  const handleSaveDesign = useCallback(() => {
    const res = saveDesign(room, items, unit);
    if (res.success) {
      setLastSavedAt(res.timestamp);
      setToast({ message: 'Design successfully saved to browser storage!', type: 'success' });
    }
  }, [room, items, unit]);

  // Export design to downloadable .json file
  const handleExportDesign = useCallback(() => {
    const res = exportDesignFile(room, items, unit);
    if (res.success) {
      setToast({
        message: `Exported design as "${res.fileName}"! You can import this on any device.`,
        type: 'success',
      });
    } else {
      setToast({ message: `Export error: ${res.error}`, type: 'error' });
    }
  }, [room, items, unit]);

  // Import design from uploaded .json file
  const handleImportDesign = useCallback(async (file) => {
    const res = await importDesignFromFile(file);
    if (res.success) {
      setRoom(res.data.room);
      setItems(res.data.items);
      setUnit(res.data.unit);
      setSelectedId(null);
      setLastSavedAt(res.data.savedAt);
      setToast({
        message: `Successfully loaded "${res.data.room.name}" with ${res.data.items.length} components!`,
        type: 'success',
      });
    } else {
      setToast({ message: `Import error: ${res.error}`, type: 'error' });
    }
  }, []);

  // Debounced autosave whenever edits happen
  useEffect(() => {
    const timer = setTimeout(() => {
      saveDesign(room, items, unit);
    }, 1500);
    return () => clearTimeout(timer);
  }, [room, items, unit]);

  // Reset to new clean room design
  const handleResetDesign = () => {
    if (window.confirm('Reset this design and start fresh? All uncommitted edits will be cleared.')) {
      clearSavedDesign();
      setRoom({
        ...DEFAULT_STARTER_ROOM,
        id: `room-${Date.now()}`,
      });
      setItems([]);
      setSelectedId(null);
      setLastSavedAt(null);
      setToast({ message: 'Started fresh room design.', type: 'success' });
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
    });
  };

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
  const handleChangeItem = (updated) => {
    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
  };

  // Duplicate an item
  const handleDuplicateItem = useCallback((itemToDup) => {
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
  }, []);

  // Delete an item
  const handleDeleteItem = useCallback((itemId) => {
    setItems((prev) => prev.filter((it) => it.id !== itemId));
    setSelectedId((prev) => (prev === itemId ? null : prev));
  }, []);

  // Rotate selected item
  const handleRotate = useCallback(
    (deg) => {
      if (!selectedItem || selectedItem.locked) return;
      const next = ((selectedItem.rotation || 0) + deg) % 360;
      handleChangeItem({
        ...selectedItem,
        rotation: next < 0 ? next + 360 : next,
      });
    },
    [selectedItem]
  );

  // Toggle lock state
  const handleToggleLock = useCallback((item) => {
    handleChangeItem({
      ...item,
      locked: !item.locked,
    });
  }, []);

  // Nudge item position
  const handleNudge = useCallback(
    (dx, dy) => {
      if (!selectedItem || selectedItem.locked) return;
      handleChangeItem({
        ...selectedItem,
        x: selectedItem.x + dx,
        y: selectedItem.y + dy,
      });
    },
    [selectedItem]
  );

  // Fit to screen view
  const handleFitToView = useCallback(() => {
    canvasRef.current?.fitToView?.();
  }, []);

  // Global keyboard shortcuts (Esc, Delete, Ctrl+D, Arrow nudge)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        return;
      }

      if (e.key === 'Escape') {
        setSelectedId(null);
        setActiveDrawer(null);
        return;
      }

      if (!selectedItem) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!selectedItem.locked) {
          e.preventDefault();
          handleDeleteItem(selectedItem.id);
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicateItem(selectedItem);
        return;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (selectedItem.locked) return;
        e.preventDefault();
        const step = e.shiftKey ? 250 : 50;

        let dx = 0;
        let dy = 0;
        if (e.key === 'ArrowUp') dy = -step;
        if (e.key === 'ArrowDown') dy = step;
        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;

        handleChangeItem({
          ...selectedItem,
          x: selectedItem.x + dx,
          y: selectedItem.y + dy,
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, handleDeleteItem, handleDuplicateItem]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans relative">
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
        room={room}
        unit={unit}
        onUnitChange={setUnit}
        onPresetSelect={handlePresetSelect}
        onSaveDesign={handleSaveDesign}
        onResetDesign={handleResetDesign}
        onExportDesign={handleExportDesign}
        onImportDesign={handleImportDesign}
        lastSavedAt={lastSavedAt}
      />

      {/* 2. Main Workspace Layout */}
      <main className="flex-1 flex flex-row overflow-hidden relative">
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
        <section className="flex-1 h-full relative overflow-hidden flex flex-col">
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
            canvasRef={canvasRef}
          />

          {/* Floating Mobile Action Bar (Erase, Rotate, Copy, Size, Nudge) */}
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
          totalItemsCount={items.length}
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
              isMobileDrawer={true}
              onClose={() => setActiveDrawer(null)}
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
        onFitToView={handleFitToView}
        placedItemsCount={items.length}
        hasSelection={!!selectedItem}
      />
    </div>
  );
}
