import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Stage, Layer, Rect, Line, Text, Group, Circle } from 'react-konva';
import { Maximize2, RotateCcw, ZoomIn, ZoomOut, Grid as GridIcon, Move } from 'lucide-react';
import { formatMeasurement, calculateArea } from '../../utils/units';

// Base conversion: 0.1 screen pixels per canonical millimeter (100px per meter)
const BASE_PX_PER_MM = 0.1;
const WALL_THICKNESS_MM = 160; // standard 16cm architectural wall
const MIN_SCALE = 0.15;
const MAX_SCALE = 4.0;

export default function RoomCanvas({
  room,
  unit,
  onCursorMove,
  canvasRef,
}) {
  const containerRef = useRef(null);
  const stageRef = useRef(null);

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [showGrid, setShowGrid] = useState(true);

  // Resize canvas to fill container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth || 800,
          height: containerRef.current.offsetHeight || 600,
        });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  // Compute room dimensions in base canvas pixels
  const roomWidthPx = room.widthMm * BASE_PX_PER_MM;
  const roomLengthPx = room.lengthMm * BASE_PX_PER_MM;
  const wallThicknessPx = Math.max(WALL_THICKNESS_MM * BASE_PX_PER_MM, 6);

  // Fit room into view
  const fitToView = useCallback(() => {
    if (dimensions.width === 0 || dimensions.height === 0 || roomWidthPx === 0) return;

    // Available viewport margins
    const padding = 120;
    const availW = Math.max(dimensions.width - padding * 2, 200);
    const availH = Math.max(dimensions.height - padding * 2, 200);

    const scaleX = availW / roomWidthPx;
    const scaleY = availH / roomLengthPx;
    const newScale = Math.min(Math.max(Math.min(scaleX, scaleY), MIN_SCALE), 2.2);

    // Center the room at (0,0) relative to room center
    const newX = dimensions.width / 2;
    const newY = dimensions.height / 2;

    setStageScale(newScale);
    setStagePos({ x: newX, y: newY });
  }, [dimensions, roomWidthPx, roomLengthPx]);

  // Initial fit on mount or preset switch
  const roomId = room.id;
  const hasValidDims = dimensions.width > 0 && dimensions.height > 0;
  useEffect(() => {
    if (!hasValidDims) return;
    const frameId = requestAnimationFrame(() => {
      fitToView();
    });
    return () => cancelAnimationFrame(frameId);
  }, [roomId, hasValidDims, fitToView]);

  // Reset view to 100% centered
  const resetView = useCallback(() => {
    setStageScale(1);
    setStagePos({
      x: dimensions.width / 2,
      y: dimensions.height / 2,
    });
  }, [dimensions]);

  // Zoom handlers
  const zoomBy = useCallback((factor) => {
    setStageScale((prev) => {
      const next = Math.min(Math.max(prev * factor, MIN_SCALE), MAX_SCALE);
      return Number(next.toFixed(3));
    });
  }, []);

  // Mouse wheel zoom centered on cursor
  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stageScale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const zoomFactor = e.evt.deltaY < 0 ? 1.08 : 0.92;
    const newScale = Math.min(Math.max(oldScale * zoomFactor, MIN_SCALE), MAX_SCALE);

    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };

    setStageScale(newScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  // Track cursor position for the status bar in real-world units
  const handlePointerMove = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Convert screen coordinates to world millimeters relative to room top-left
    const worldPxX = (pointer.x - stagePos.x) / stageScale + roomWidthPx / 2;
    const worldPxY = (pointer.y - stagePos.y) / stageScale + roomLengthPx / 2;

    const worldMmX = worldPxX / BASE_PX_PER_MM;
    const worldMmY = worldPxY / BASE_PX_PER_MM;

    if (onCursorMove) {
      onCursorMove({ xMm: worldMmX, yMm: worldMmY });
    }
  };

  // Architectural Grid generation
  const gridLines = useMemo(() => {
    if (!showGrid || dimensions.width === 0) return [];
    const lines = [];

    // Grid step in canonical mm: 500mm minor grid, 1000mm major grid
    const stepMm = 1000;
    const stepPx = stepMm * BASE_PX_PER_MM;

    const totalGridExtent = 20000 * BASE_PX_PER_MM; // 20m extent around room

    for (let x = -totalGridExtent; x <= totalGridExtent; x += stepPx) {
      const isMajor = Math.round(x / stepPx) % 5 === 0;
      lines.push({
        points: [x, -totalGridExtent, x, totalGridExtent],
        stroke: isMajor ? 'rgba(51, 65, 85, 0.45)' : 'rgba(30, 41, 59, 0.35)',
        strokeWidth: isMajor ? 1.2 : 0.8,
      });
    }

    for (let y = -totalGridExtent; y <= totalGridExtent; y += stepPx) {
      const isMajor = Math.round(y / stepPx) % 5 === 0;
      lines.push({
        points: [-totalGridExtent, y, totalGridExtent, y],
        stroke: isMajor ? 'rgba(51, 65, 85, 0.45)' : 'rgba(30, 41, 59, 0.35)',
        strokeWidth: isMajor ? 1.2 : 0.8,
      });
    }

    return lines;
  }, [showGrid, dimensions.width]);

  // Derived calculations
  const roomArea = useMemo(
    () => calculateArea(room.widthMm, room.lengthMm),
    [room.widthMm, room.lengthMm]
  );

  const halfW = roomWidthPx / 2;
  const halfL = roomLengthPx / 2;
  const t = wallThicknessPx;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#030712] overflow-hidden flex items-center justify-center cursor-crosshair select-none"
    >
      {/* Floating Canvas Controls Overlay */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg p-1.5 shadow-xl text-slate-300">
        <button
          type="button"
          onClick={() => zoomBy(1.2)}
          title="Zoom In (Scroll Up)"
          className="p-1.5 hover:bg-slate-800 hover:text-white rounded transition cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono font-medium px-2 text-slate-400 select-none min-w-[50px] text-center">
          {Math.round(stageScale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => zoomBy(0.8)}
          title="Zoom Out (Scroll Down)"
          className="p-1.5 hover:bg-slate-800 hover:text-white rounded transition cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-800 my-auto mx-0.5" />
        <button
          type="button"
          onClick={fitToView}
          title="Fit Room to Screen"
          className="p-1.5 hover:bg-slate-800 hover:text-emerald-400 rounded transition flex items-center gap-1 text-xs cursor-pointer"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={resetView}
          title="Reset Zoom to 100%"
          className="p-1.5 hover:bg-slate-800 hover:text-white rounded transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-800 my-auto mx-0.5" />
        <button
          type="button"
          onClick={() => setShowGrid((v) => !v)}
          title={showGrid ? 'Hide Grid' : 'Show Grid'}
          className={`p-1.5 rounded transition cursor-pointer ${
            showGrid ? 'bg-slate-800 text-cyan-400' : 'hover:bg-slate-800 text-slate-500'
          }`}
        >
          <GridIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Canvas Pan Prompt */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm border border-slate-800/80 rounded-md px-2.5 py-1 text-[11px] font-medium text-slate-400 shadow-sm">
        <Move className="w-3.5 h-3.5 text-slate-500" />
        <span>Click & drag background to pan • Wheel to zoom</span>
      </div>

      {/* Konva Stage */}
      <Stage
        ref={(node) => {
          stageRef.current = node;
          if (canvasRef) canvasRef.current = node;
        }}
        width={dimensions.width}
        height={dimensions.height}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={stageScale}
        scaleY={stageScale}
        draggable
        onDragEnd={(e) => {
          setStagePos({ x: e.target.x(), y: e.target.y() });
        }}
        onWheel={handleWheel}
        onMouseMove={handlePointerMove}
      >
        {/* Background Grid Layer */}
        <Layer listening={false}>
          {gridLines.map((line, idx) => (
            <Line
              key={idx}
              points={line.points}
              stroke={line.stroke}
              strokeWidth={line.strokeWidth / stageScale}
            />
          ))}

          {/* World Origin Crosshair */}
          <Line
            points={[-20, 0, 20, 0]}
            stroke="rgba(244, 63, 94, 0.5)"
            strokeWidth={1.5 / stageScale}
          />
          <Line
            points={[0, -20, 0, 20]}
            stroke="rgba(244, 63, 94, 0.5)"
            strokeWidth={1.5 / stageScale}
          />
        </Layer>

        {/* Room Layer */}
        <Layer>
          <Group>
            {/* Outer Wall Boundary (Thick Solid Wall Core) */}
            <Rect
              x={-halfW - t}
              y={-halfL - t}
              width={roomWidthPx + 2 * t}
              height={roomLengthPx + 2 * t}
              fill="#1e293b" // slate-800 solid masonry core
              stroke="#475569" // slate-600 outer perimeter line
              strokeWidth={2}
              cornerRadius={2}
              shadowColor="#000000"
              shadowBlur={20}
              shadowOpacity={0.4}
              shadowOffset={{ x: 0, y: 10 }}
            />

            {/* Inner Room Floor Cavity */}
            <Rect
              x={-halfW}
              y={-halfL}
              width={roomWidthPx}
              height={roomLengthPx}
              fill="#0f172a" // slate-900 interior floor
              stroke="#38bdf8" // cyan-400 inner room edge highlight
              strokeWidth={1.5}
            />

            {/* Subtle Interior Floor Hatching / Pattern Grid */}
            <Rect
              x={-halfW}
              y={-halfL}
              width={roomWidthPx}
              height={roomLengthPx}
              stroke="rgba(56, 189, 248, 0.08)"
              dash={[10, 10]}
              strokeWidth={1}
            />

            {/* Corner Markers */}
            {[
              [-halfW, -halfL],
              [halfW, -halfL],
              [halfW, halfL],
              [-halfW, halfL],
            ].map(([cx, cy], idx) => (
              <Circle
                key={idx}
                x={cx}
                y={cy}
                radius={3.5}
                fill="#38bdf8"
                stroke="#0f172a"
                strokeWidth={1.5}
              />
            ))}

            {/* Center Room Label & Area Badge */}
            <Group x={0} y={0}>
              <Text
                text={room.name || 'Room'}
                fontSize={15}
                fontStyle="bold"
                fontFamily="Inter, system-ui, sans-serif"
                fill="#f8fafc"
                align="center"
                verticalAlign="middle"
                offsetX={80}
                offsetY={20}
                width={160}
              />
              <Text
                text={`${formatMeasurement(room.widthMm, unit)} × ${formatMeasurement(
                  room.lengthMm,
                  unit
                )}`}
                fontSize={12}
                fontFamily="JetBrains Mono, monospace"
                fill="#94a3b8"
                align="center"
                offsetX={80}
                offsetY={0}
                width={160}
              />
              <Text
                text={`${roomArea.sqMeters} m²  •  ${roomArea.sqFeet} sq ft`}
                fontSize={11}
                fontFamily="JetBrains Mono, monospace"
                fontStyle="500"
                fill="#34d399" // emerald-400
                align="center"
                offsetX={80}
                offsetY={-18}
                width={160}
              />
            </Group>

            {/* ============================================================== */}
            {/* Professional CAD Dimension Line: TOP (Width)                   */}
            {/* ============================================================== */}
            <Group y={-halfL - t - 32}>
              {/* Left & Right Extension Lines */}
              <Line
                points={[-halfW, 26, -halfW, 0]}
                stroke="#64748b"
                strokeWidth={1}
                dash={[2, 2]}
              />
              <Line
                points={[halfW, 26, halfW, 0]}
                stroke="#64748b"
                strokeWidth={1}
                dash={[2, 2]}
              />

              {/* Main Horizontal Dimension Line */}
              <Line
                points={[-halfW, 6, halfW, 6]}
                stroke="#06b6d4" // cyan-500
                strokeWidth={1.5}
              />

              {/* Architectural 45-degree Ticks */}
              <Line
                points={[-halfW - 4, 10, -halfW + 4, 2]}
                stroke="#06b6d4"
                strokeWidth={2}
              />
              <Line
                points={[halfW - 4, 10, halfW + 4, 2]}
                stroke="#06b6d4"
                strokeWidth={2}
              />

              {/* Dimension Text Pill */}
              <Rect
                x={-50}
                y={-8}
                width={100}
                height={20}
                fill="#0f172a"
                stroke="#06b6d4"
                strokeWidth={1}
                cornerRadius={4}
              />
              <Text
                text={formatMeasurement(room.widthMm, unit)}
                x={-50}
                y={-5}
                width={100}
                align="center"
                fontSize={11}
                fontFamily="JetBrains Mono, monospace"
                fontStyle="600"
                fill="#38bdf8"
              />
            </Group>

            {/* ============================================================== */}
            {/* Professional CAD Dimension Line: LEFT (Length/Height)          */}
            {/* ============================================================== */}
            <Group x={-halfW - t - 34}>
              {/* Top & Bottom Extension Lines */}
              <Line
                points={[28, -halfL, 0, -halfL]}
                stroke="#64748b"
                strokeWidth={1}
                dash={[2, 2]}
              />
              <Line
                points={[28, halfL, 0, halfL]}
                stroke="#64748b"
                strokeWidth={1}
                dash={[2, 2]}
              />

              {/* Main Vertical Dimension Line */}
              <Line
                points={[6, -halfL, 6, halfL]}
                stroke="#06b6d4"
                strokeWidth={1.5}
              />

              {/* Architectural 45-degree Ticks */}
              <Line
                points={[2, -halfL - 4, 10, -halfL + 4]}
                stroke="#06b6d4"
                strokeWidth={2}
              />
              <Line
                points={[2, halfL - 4, 10, halfL + 4]}
                stroke="#06b6d4"
                strokeWidth={2}
              />

              {/* Dimension Text Pill (Rotated -90 for architectural readability) */}
              <Group x={6} y={0} rotation={-90}>
                <Rect
                  x={-50}
                  y={-10}
                  width={100}
                  height={20}
                  fill="#0f172a"
                  stroke="#06b6d4"
                  strokeWidth={1}
                  cornerRadius={4}
                />
                <Text
                  text={formatMeasurement(room.lengthMm, unit)}
                  x={-50}
                  y={-7}
                  width={100}
                  align="center"
                  fontSize={11}
                  fontFamily="JetBrains Mono, monospace"
                  fontStyle="600"
                  fill="#38bdf8"
                />
              </Group>
            </Group>
          </Group>
        </Layer>
      </Stage>
    </div>
  );
}
