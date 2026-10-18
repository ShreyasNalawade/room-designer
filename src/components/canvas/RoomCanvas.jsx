import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Stage, Layer, Rect, Line, Text, Group, Circle } from 'react-konva';
import { Maximize2, RotateCcw, ZoomIn, ZoomOut, Grid as GridIcon, Move } from 'lucide-react';
import FurnitureItem from './FurnitureItem';
import { formatMeasurement, calculateRoomMetrics } from '../../utils/units';

// Base conversion: 0.1 screen pixels per canonical millimeter (100px per meter)
const BASE_PX_PER_MM = 0.1;
const WALL_THICKNESS_MM = 160; // 16cm solid wall core
const MIN_SCALE = 0.15;
const MAX_SCALE = 4.0;

export default function RoomCanvas({
  room,
  unit,
  items = [],
  selectedId,
  outsideIds = new Set(),
  overlappingIds = new Set(),
  onSelect,
  onChangeItem,
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

  const isTrapezoid = room.shape === 'trapezoid';

  // Room geometry in pixels
  const topWPx = (isTrapezoid ? room.topWidthMm || 4000 : room.widthMm) * BASE_PX_PER_MM;
  const bottomWPx = (isTrapezoid ? room.bottomWidthMm || 6000 : room.widthMm) * BASE_PX_PER_MM;
  const maxWPx = Math.max(topWPx, bottomWPx);
  const lengthPx = room.lengthMm * BASE_PX_PER_MM;
  const t = Math.max(WALL_THICKNESS_MM * BASE_PX_PER_MM, 6);

  const halfTopW = topWPx / 2;
  const halfBottomW = bottomWPx / 2;
  const halfL = lengthPx / 2;

  // Fit room into view
  const fitToView = useCallback(() => {
    if (dimensions.width === 0 || dimensions.height === 0 || maxWPx === 0) return;

    const padding = 130;
    const availW = Math.max(dimensions.width - padding * 2, 200);
    const availH = Math.max(dimensions.height - padding * 2, 200);

    const scaleX = availW / maxWPx;
    const scaleY = availH / lengthPx;
    const newScale = Math.min(Math.max(Math.min(scaleX, scaleY), MIN_SCALE), 2.2);

    setStageScale(newScale);
    setStagePos({
      x: dimensions.width / 2,
      y: dimensions.height / 2,
    });
  }, [dimensions, maxWPx, lengthPx]);

  // Initial fit on mount or major preset change
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

  // Touch Pinch-to-Zoom & Multi-touch gestures
  const lastDistRef = useRef(0);
  const lastCenterRef = useRef(null);

  const handleTouchMove = (e) => {
    const touches = e.evt.touches;
    if (touches && touches.length === 2) {
      e.evt.preventDefault();
      const touch1 = touches[0];
      const touch2 = touches[1];

      const dist = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );

      const center = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };

      if (!lastDistRef.current) {
        lastDistRef.current = dist;
        lastCenterRef.current = center;
        return;
      }

      const pointTo = {
        x: (center.x - stagePos.x) / stageScale,
        y: (center.y - stagePos.y) / stageScale,
      };

      const scaleBy = dist / lastDistRef.current;
      const newScale = Math.min(Math.max(stageScale * scaleBy, MIN_SCALE), MAX_SCALE);

      setStageScale(newScale);
      setStagePos({
        x: center.x - pointTo.x * newScale,
        y: center.y - pointTo.y * newScale,
      });

      lastDistRef.current = dist;
      lastCenterRef.current = center;
    }
  };

  const handleTouchEnd = () => {
    lastDistRef.current = 0;
    lastCenterRef.current = null;
  };

  // Expose methods to parent ref
  useEffect(() => {
    if (canvasRef) {
      canvasRef.current = {
        fitToView,
        resetView,
        zoomBy,
        stage: stageRef.current,
      };
    }
  }, [canvasRef, fitToView, resetView, zoomBy]);

  // Track cursor position for the status bar in real-world units
  const handlePointerMove = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const worldPxX = (pointer.x - stagePos.x) / stageScale;
    const worldPxY = (pointer.y - stagePos.y) / stageScale;

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
    const stepMm = 1000;
    const stepPx = stepMm * BASE_PX_PER_MM;
    const totalGridExtent = 20000 * BASE_PX_PER_MM;

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

  // Derived room calculations
  const roomMetrics = useMemo(() => calculateRoomMetrics(room, unit), [room, unit]);

  // Trapezoid wall polygon points (inner and outer)
  const trapezoidInnerPoints = useMemo(() => {
    return [
      -halfTopW, -halfL,
      halfTopW, -halfL,
      halfBottomW, halfL,
      -halfBottomW, halfL,
    ];
  }, [halfTopW, halfBottomW, halfL]);

  const trapezoidOuterPoints = useMemo(() => {
    return [
      -halfTopW - t, -halfL - t,
      halfTopW + t, -halfL - t,
      halfBottomW + t * 1.2, halfL + t,
      -halfBottomW - t * 1.2, halfL + t,
    ];
  }, [halfTopW, halfBottomW, halfL, t]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#030712] overflow-hidden flex items-center justify-center cursor-crosshair select-none"
    >
      {/* Floating Canvas Controls Overlay */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1 sm:gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg p-1 sm:p-1.5 shadow-xl text-slate-300">
        <button
          type="button"
          onClick={() => zoomBy(1.2)}
          title="Zoom In"
          aria-label="Zoom In"
          className="p-1.5 sm:p-2 hover:bg-slate-800 hover:text-white rounded transition cursor-pointer touch-manipulation"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-[11px] sm:text-xs font-mono font-medium px-1 sm:px-2 text-slate-400 select-none min-w-[42px] sm:min-w-[50px] text-center">
          {Math.round(stageScale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => zoomBy(0.8)}
          title="Zoom Out"
          aria-label="Zoom Out"
          className="p-1.5 sm:p-2 hover:bg-slate-800 hover:text-white rounded transition cursor-pointer touch-manipulation"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-800 my-auto mx-0.5" />
        <button
          type="button"
          onClick={fitToView}
          title="Fit Room to Screen"
          aria-label="Fit Room to Screen"
          className="p-1.5 sm:p-2 hover:bg-slate-800 hover:text-emerald-400 rounded transition flex items-center gap-1 text-xs cursor-pointer touch-manipulation"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={resetView}
          title="Reset Zoom to 100%"
          aria-label="Reset Zoom to 100%"
          className="p-1.5 sm:p-2 hover:bg-slate-800 hover:text-white rounded transition cursor-pointer touch-manipulation"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-800 my-auto mx-0.5" />
        <button
          type="button"
          onClick={() => setShowGrid((v) => !v)}
          title={showGrid ? 'Hide Grid' : 'Show Grid'}
          aria-label={showGrid ? 'Hide Grid' : 'Show Grid'}
          className={`p-1.5 sm:p-2 rounded transition cursor-pointer touch-manipulation ${
            showGrid ? 'bg-slate-800 text-cyan-400' : 'hover:bg-slate-800 text-slate-500'
          }`}
        >
          <GridIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Canvas Pan Prompt (Desktop only to prevent mobile clutter) */}
      <div className="hidden md:flex absolute top-4 left-4 z-20 pointer-events-none items-center gap-2 bg-slate-900/80 backdrop-blur-sm border border-slate-800/80 rounded-md px-2.5 py-1 text-[11px] font-medium text-slate-400 shadow-sm">
        <Move className="w-3.5 h-3.5 text-slate-500" />
        <span>Drag background to pan • Wheel or Pinch to zoom • Tap items to edit</span>
      </div>

      {/* Konva Stage */}
      <Stage
        ref={(node) => {
          stageRef.current = node;
        }}
        width={dimensions.width}
        height={dimensions.height}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={stageScale}
        scaleY={stageScale}
        draggable
        onClick={(e) => {
          // Deselect if clicked on empty stage
          if (e.target === e.target.getStage() && onSelect) {
            onSelect(null);
          }
        }}
        onTap={(e) => {
          // Deselect on mobile tap on empty stage
          if (e.target === e.target.getStage() && onSelect) {
            onSelect(null);
          }
        }}
        onDragEnd={(e) => {
          if (e.target === stageRef.current) {
            setStagePos({ x: e.target.x(), y: e.target.y() });
          }
        }}
        onWheel={handleWheel}
        onMouseMove={handlePointerMove}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {/* Layer 1: Background Grid */}
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
          <Line points={[-20, 0, 20, 0]} stroke="rgba(244, 63, 94, 0.5)" strokeWidth={1.5 / stageScale} />
          <Line points={[0, -20, 0, 20]} stroke="rgba(244, 63, 94, 0.5)" strokeWidth={1.5 / stageScale} />
        </Layer>

        {/* Layer 2: Room Walls & Floor */}
        <Layer>
          <Group>
            {isTrapezoid ? (
              <>
                {/* Outer Wall Boundary Polygon */}
                <Line
                  points={trapezoidOuterPoints}
                  closed={true}
                  fill="#1e293b"
                  stroke="#475569"
                  strokeWidth={2}
                  shadowColor="#000000"
                  shadowBlur={20}
                  shadowOpacity={0.4}
                />
                {/* Inner Room Floor Cavity */}
                <Line
                  points={trapezoidInnerPoints}
                  closed={true}
                  fill="#0f172a"
                  stroke="#38bdf8"
                  strokeWidth={1.5}
                />
                {/* Corner Markers */}
                {[
                  [-halfTopW, -halfL],
                  [halfTopW, -halfL],
                  [halfBottomW, halfL],
                  [-halfBottomW, halfL],
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
              </>
            ) : (
              <>
                {/* Outer Wall Boundary Rectangle */}
                <Rect
                  x={-halfTopW - t}
                  y={-halfL - t}
                  width={topWPx + 2 * t}
                  height={lengthPx + 2 * t}
                  fill="#1e293b"
                  stroke="#475569"
                  strokeWidth={2}
                  cornerRadius={2}
                  shadowColor="#000000"
                  shadowBlur={20}
                  shadowOpacity={0.4}
                />
                {/* Inner Room Floor Cavity */}
                <Rect
                  x={-halfTopW}
                  y={-halfL}
                  width={topWPx}
                  height={lengthPx}
                  fill="#0f172a"
                  stroke="#38bdf8"
                  strokeWidth={1.5}
                />
                {/* Interior Grid Pattern */}
                <Rect
                  x={-halfTopW}
                  y={-halfL}
                  width={topWPx}
                  height={lengthPx}
                  stroke="rgba(56, 189, 248, 0.08)"
                  dash={[10, 10]}
                  strokeWidth={1}
                />
                {/* Corner Markers */}
                {[
                  [-halfTopW, -halfL],
                  [halfTopW, -halfL],
                  [halfTopW, halfL],
                  [-halfTopW, halfL],
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
              </>
            )}

            {/* Center Room Label & Area Badge */}
            <Group x={0} y={0}>
              <Text
                text={room.name || 'Room'}
                fontSize={15}
                fontStyle="bold"
                fontFamily="Inter, system-ui, sans-serif"
                fill="#f8fafc"
                align="center"
                offsetX={80}
                offsetY={22}
                width={160}
              />
              <Text
                text={
                  isTrapezoid
                    ? `Top: ${formatMeasurement(room.topWidthMm || 4000, unit)} | Btm: ${formatMeasurement(room.bottomWidthMm || 6000, unit)}`
                    : `${formatMeasurement(room.widthMm, unit)} × ${formatMeasurement(room.lengthMm, unit)}`
                }
                fontSize={11}
                fontFamily="JetBrains Mono, monospace"
                fill="#94a3b8"
                align="center"
                offsetX={80}
                offsetY={-1}
                width={160}
              />
              <Text
                text={`${roomMetrics.sqMeters} m²  •  ${roomMetrics.sqFeet} sq ft`}
                fontSize={11}
                fontFamily="JetBrains Mono, monospace"
                fontStyle="500"
                fill="#34d399"
                align="center"
                offsetX={80}
                offsetY={-20}
                width={160}
              />
            </Group>

            {/* CAD Dimension Line: TOP */}
            <Group y={-halfL - t - 32}>
              <Line points={[-halfTopW, 26, -halfTopW, 0]} stroke="#64748b" strokeWidth={1} dash={[2, 2]} />
              <Line points={[halfTopW, 26, halfTopW, 0]} stroke="#64748b" strokeWidth={1} dash={[2, 2]} />
              <Line points={[-halfTopW, 6, halfTopW, 6]} stroke="#06b6d4" strokeWidth={1.5} />
              <Line points={[-halfTopW - 4, 10, -halfTopW + 4, 2]} stroke="#06b6d4" strokeWidth={2} />
              <Line points={[halfTopW - 4, 10, halfTopW + 4, 2]} stroke="#06b6d4" strokeWidth={2} />
              <Rect x={-50} y={-8} width={100} height={20} fill="#0f172a" stroke="#06b6d4" strokeWidth={1} cornerRadius={4} />
              <Text
                text={formatMeasurement(isTrapezoid ? room.topWidthMm || 4000 : room.widthMm, unit)}
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

            {/* CAD Dimension Line: BOTTOM (Trapezoid) */}
            {isTrapezoid && (
              <Group y={halfL + t + 20}>
                <Line points={[-halfBottomW, -14, -halfBottomW, 10]} stroke="#64748b" strokeWidth={1} dash={[2, 2]} />
                <Line points={[halfBottomW, -14, halfBottomW, 10]} stroke="#64748b" strokeWidth={1} dash={[2, 2]} />
                <Line points={[-halfBottomW, 6, halfBottomW, 6]} stroke="#06b6d4" strokeWidth={1.5} />
                <Line points={[-halfBottomW - 4, 10, -halfBottomW + 4, 2]} stroke="#06b6d4" strokeWidth={2} />
                <Line points={[halfBottomW - 4, 10, halfBottomW + 4, 2]} stroke="#06b6d4" strokeWidth={2} />
                <Rect x={-50} y={-4} width={100} height={20} fill="#0f172a" stroke="#06b6d4" strokeWidth={1} cornerRadius={4} />
                <Text
                  text={formatMeasurement(room.bottomWidthMm || 6000, unit)}
                  x={-50}
                  y={-1}
                  width={100}
                  align="center"
                  fontSize={11}
                  fontFamily="JetBrains Mono, monospace"
                  fontStyle="600"
                  fill="#38bdf8"
                />
              </Group>
            )}

            {/* CAD Dimension Line: LEFT (Length/Height) */}
            <Group x={-maxWPx / 2 - t - 34}>
              <Line points={[28, -halfL, 0, -halfL]} stroke="#64748b" strokeWidth={1} dash={[2, 2]} />
              <Line points={[28, halfL, 0, halfL]} stroke="#64748b" strokeWidth={1} dash={[2, 2]} />
              <Line points={[6, -halfL, 6, halfL]} stroke="#06b6d4" strokeWidth={1.5} />
              <Line points={[2, -halfL - 4, 10, -halfL + 4]} stroke="#06b6d4" strokeWidth={2} />
              <Line points={[2, halfL - 4, 10, halfL + 4]} stroke="#06b6d4" strokeWidth={2} />
              <Group x={6} y={0} rotation={-90}>
                <Rect x={-50} y={-10} width={100} height={20} fill="#0f172a" stroke="#06b6d4" strokeWidth={1} cornerRadius={4} />
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

        {/* Layer 3: Placed Furniture Objects */}
        <Layer>
          {items.map((item) => (
            <FurnitureItem
              key={item.id}
              item={item}
              pxPerMm={BASE_PX_PER_MM}
              isSelected={selectedId === item.id}
              isOverlapping={overlappingIds.has(item.id)}
              isOutside={outsideIds.has(item.id)}
              onSelect={onSelect}
              onChange={onChangeItem}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
