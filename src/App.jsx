import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import HeaderToolbar from './components/layout/HeaderToolbar';
import LeftSidebar from './components/layout/LeftSidebar';
import RightPropertiesPanel from './components/layout/RightPropertiesPanel';
import StatusBar from './components/layout/StatusBar';
import RoomCanvas from './components/canvas/RoomCanvas';
import { validateRoomDimensions } from './utils/validation';
import { analyzeItemCollisions } from './utils/collision';
import { saveDesign, loadDesign, clearSavedDesign } from './utils/storage';
import { DEFAULT_UNIT } from './constants/units';

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

  const canvasRef = useRef(null);

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
    }
  }, [room, items, unit]);

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
    // Offset slightly so new items don't stack directly on top of each other
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

  // Global keyboard shortcuts (Esc, Delete, Ctrl+D, Arrow nudge)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing into an input field or textarea
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        return;
      }

      // Escape to deselect
      if (e.key === 'Escape') {
        setSelectedId(null);
        return;
      }

      if (!selectedItem) return;

      // Delete / Backspace to remove item
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!selectedItem.locked) {
          e.preventDefault();
          handleDeleteItem(selectedItem.id);
        }
        return;
      }

      // Ctrl+D or Cmd+D to duplicate
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicateItem(selectedItem);
        return;
      }

      // Arrow keys to nudge selected item position
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (selectedItem.locked) return;
        e.preventDefault();
        const step = e.shiftKey ? 250 : 50; // 50mm or 250mm nudge

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
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans">
      {/* 1. Top Navigation & Toolbar */}
      <HeaderToolbar
        room={room}
        unit={unit}
        onUnitChange={setUnit}
        onPresetSelect={handlePresetSelect}
        onSaveDesign={handleSaveDesign}
        onResetDesign={handleResetDesign}
        lastSavedAt={lastSavedAt}
      />

      {/* 2. Main Workspace Layout */}
      <main className="flex-1 flex flex-row overflow-hidden relative">
        {/* Left Panel: Tabs for Furniture Catalog & Room Shape Builder */}
        <LeftSidebar
          room={room}
          unit={unit}
          validation={validation}
          onChangeRoom={setRoom}
          onPresetSelect={handlePresetSelect}
          onAddFurnitureItem={handleAddFurnitureItem}
          placedItemsCount={items.length}
        />

        {/* Central Canvas Viewport: Scaled 2D Konva Floor Plan */}
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
        </section>

        {/* Right Inspector Panel: Dynamic Component & Room Inspector */}
        <RightPropertiesPanel
          room={room}
          unit={unit}
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

      {/* 3. Bottom Status Bar */}
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
  );
}
