import { useState, useMemo, useRef } from 'react';
import HeaderToolbar from './components/layout/HeaderToolbar';
import LeftSidebar from './components/layout/LeftSidebar';
import RightPropertiesPanel from './components/layout/RightPropertiesPanel';
import StatusBar from './components/layout/StatusBar';
import RoomCanvas from './components/canvas/RoomCanvas';
import { validateRoomDimensions } from './utils/validation';
import { DEFAULT_UNIT } from './constants/units';

export default function App() {
  const [unit, setUnit] = useState(DEFAULT_UNIT);
  const [room, setRoom] = useState({
    id: 'room-1',
    presetId: 'living-room',
    name: 'Living Room (Spacious)',
    shape: 'rectangle',
    widthMm: 6000,
    lengthMm: 4500,
  });

  const [cursorCoord, setCursorCoord] = useState(null);
  const canvasRef = useRef(null);

  // Compute live validation of current dimensions
  const validation = useMemo(
    () => validateRoomDimensions(room.widthMm, room.lengthMm, unit),
    [room.widthMm, room.lengthMm, unit]
  );

  // Handle starter preset selection
  const handlePresetSelect = (preset) => {
    setRoom({
      id: `room-${Date.now()}`,
      presetId: preset.id,
      name: preset.name,
      shape: preset.type || 'rectangle',
      widthMm: preset.widthMm,
      lengthMm: preset.lengthMm,
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans">
      {/* 1. Top Navigation & Toolbar */}
      <HeaderToolbar
        room={room}
        unit={unit}
        onUnitChange={setUnit}
        onPresetSelect={handlePresetSelect}
      />

      {/* 2. Main Workspace Layout */}
      <main className="flex-1 flex flex-row overflow-hidden relative">
        {/* Left Control Panel: Room Shape, Dimensions, Validation */}
        <LeftSidebar
          room={room}
          unit={unit}
          validation={validation}
          onChangeRoom={setRoom}
          onPresetSelect={handlePresetSelect}
        />

        {/* Central Canvas Viewport: Scaled 2D Konva Floor Plan */}
        <section className="flex-1 h-full relative overflow-hidden flex flex-col">
          <RoomCanvas
            room={room}
            unit={unit}
            onCursorMove={setCursorCoord}
            canvasRef={canvasRef}
          />
        </section>

        {/* Right Inspector Panel: Area, Geometry, Wall breakdown */}
        <RightPropertiesPanel
          room={room}
          unit={unit}
          validation={validation}
        />
      </main>

      {/* 3. Bottom Status Bar */}
      <StatusBar
        room={room}
        unit={unit}
        cursorCoord={cursorCoord}
        validation={validation}
      />
    </div>
  );
}
