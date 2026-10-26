import { useState } from 'react';
import {
  Compass,
  RotateCw,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  FlipHorizontal,
  FlipVertical,
  Utensils,
  Maximize2,
  Check,
} from 'lucide-react';
import {
  getHeadingDirection,
  getRoomWallDirections,
  getRotationForWallDirection,
} from '../../utils/orientation';

/**
 * Architectural Interactive Compass Rose & Room Orientation HUD
 *
 * Allows real-time reorientation of the entire home / room directions:
 * 1. Cardinal Re-orientation: Designate which cardinal direction the kitchen/bottom wall faces (e.g. West, South, East, North).
 * 2. Interactive Compass Dial & 360° Angle Slider.
 * 3. Physical Layout Transformation: Rotate or flip all furniture and room geometry.
 */
export default function CompassRose({
  rotation = 0,
  wallDirs: propWallDirs,
  onRotateRoom,
  onSetRotation,
  onSetCompassHeading,
  onRotateLayout,
  onFlipLayout,
}) {
  const [isExpanded, setIsExpanded] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  });
  const [showLayoutTools, setShowLayoutTools] = useState(false);

  const heading = getHeadingDirection(rotation);
  const wallDirs = propWallDirs || getRoomWallDirections(rotation);

  // Apply cardinal direction to room (without rotating canvas if onSetCompassHeading is provided)
  const handleApplyDirection = (targetDeg) => {
    if (onSetCompassHeading) {
      onSetCompassHeading(targetDeg);
    } else if (onSetRotation) {
      onSetRotation(targetDeg);
    }
  };

  // Pre-calculate target angles for Kitchen / Bottom Wall facing
  const bottomWestRot = getRotationForWallDirection('bottom', 'W'); // 90°
  const bottomSouthRot = getRotationForWallDirection('bottom', 'S'); // 0°
  const bottomEastRot = getRotationForWallDirection('bottom', 'E'); // 270°
  const bottomNorthRot = getRotationForWallDirection('bottom', 'N'); // 180°

  const isBottomWest = wallDirs.bottom.code === 'W';
  const isBottomSouth = wallDirs.bottom.code === 'S';
  const isBottomEast = wallDirs.bottom.code === 'E';
  const isBottomNorth = wallDirs.bottom.code === 'N';

  return (
    <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex flex-col items-start select-none max-w-[280px] sm:max-w-xs">
      <div className="w-full bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-2.5 sm:p-3 text-slate-200 transition-all duration-200 max-h-[85vh] overflow-y-auto">
        {/* Header / Collapse Bar */}
        <div
          className="flex items-center justify-between gap-2 cursor-pointer pb-1"
          onClick={() => setIsExpanded((v) => !v)}
          title="Click to toggle Compass HUD"
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <Compass className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="tracking-wide font-bold">Compass & Direction</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-rose-300">
              {rotation}° {heading.code}
            </span>
            <button
              type="button"
              className="text-slate-400 hover:text-white p-0.5"
              title={isExpanded ? 'Minimize Compass' : 'Expand Compass'}
              aria-label={isExpanded ? 'Minimize Compass' : 'Expand Compass'}
            >
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Mini Status Pill when collapsed or expanded */}
        <div className="pt-0.5 pb-1 flex items-center justify-between text-[10px]">
          <span className="text-slate-400">Kitchen / Bottom Wall:</span>
          <span
            className={`font-mono font-bold px-1.5 py-0.2 rounded ${
              isBottomWest
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                : 'text-slate-300'
            }`}
          >
            {wallDirs.bottom.label} ({wallDirs.bottom.code})
          </span>
        </div>

        {isExpanded && (
          <div className="flex flex-col items-center pt-2 space-y-3 border-t border-slate-800 animate-in fade-in duration-150">
            {/* 1. Quick Presets for Kitchen & Wall Window (Bottom Wall) */}
            <div className="w-full bg-slate-950/80 border border-cyan-900/60 rounded-xl p-2.5 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                  <Utensils className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Kitchen & Window Wall:</span>
                </div>
                <span className="text-[10px] text-cyan-400 font-mono">
                  {wallDirs.bottom.label}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Click <strong className="text-cyan-300">West</strong> to set the kitchen & window to face West in your home:
              </p>

              {/* 4 Direction Presets for Bottom Wall */}
              <div className="grid grid-cols-2 gap-1.5">
                {/* West (90° room rotation) */}
                <button
                  type="button"
                  onClick={() => handleApplyDirection(bottomWestRot)}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-bold transition flex items-center justify-between cursor-pointer active:scale-95 ${
                    isBottomWest
                      ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white border-cyan-400 shadow-md shadow-cyan-600/30'
                      : 'bg-slate-900 border-slate-700/80 text-cyan-300 hover:bg-slate-800 hover:border-cyan-500'
                  }`}
                  title="Orient home so Kitchen & Window are on the WEST wall (90° rotation)"
                >
                  <span className="flex items-center gap-1">
                    ◀ <span>West Wall</span>
                  </span>
                  {isBottomWest ? <Check className="w-3.5 h-3.5" /> : <span className="text-[9px] font-mono opacity-80">90°</span>}
                </button>

                {/* South (0° room rotation) */}
                <button
                  type="button"
                  onClick={() => handleApplyDirection(bottomSouthRot)}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition flex items-center justify-between cursor-pointer active:scale-95 ${
                    isBottomSouth
                      ? 'bg-slate-800 text-white border-slate-500 shadow'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                  title="Orient home so Bottom Wall faces South (0° rotation)"
                >
                  <span className="flex items-center gap-1">
                    ▼ <span>South Wall</span>
                  </span>
                  {isBottomSouth ? <Check className="w-3.5 h-3.5" /> : <span className="text-[9px] font-mono opacity-60">0°</span>}
                </button>

                {/* East (270° room rotation) */}
                <button
                  type="button"
                  onClick={() => handleApplyDirection(bottomEastRot)}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition flex items-center justify-between cursor-pointer active:scale-95 ${
                    isBottomEast
                      ? 'bg-slate-800 text-white border-slate-500 shadow'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                  title="Orient home so Bottom Wall faces East (270° rotation)"
                >
                  <span className="flex items-center gap-1">
                    ▶ <span>East Wall</span>
                  </span>
                  {isBottomEast ? <Check className="w-3.5 h-3.5" /> : <span className="text-[9px] font-mono opacity-60">270°</span>}
                </button>

                {/* North (180° room rotation) */}
                <button
                  type="button"
                  onClick={() => handleApplyDirection(bottomNorthRot)}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition flex items-center justify-between cursor-pointer active:scale-95 ${
                    isBottomNorth
                      ? 'bg-slate-800 text-white border-slate-500 shadow'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                  title="Orient home so Bottom Wall faces North (180° rotation)"
                >
                  <span className="flex items-center gap-1">
                    ▲ <span>North Wall</span>
                  </span>
                  {isBottomNorth ? <Check className="w-3.5 h-3.5" /> : <span className="text-[9px] font-mono opacity-60">180°</span>}
                </button>
              </div>

              {/* Real-time wall alignment summary */}
              <div className="pt-1 border-t border-slate-800/80 grid grid-cols-2 gap-1 text-[10px] font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Top Wall:</span>
                  <span className={wallDirs.top.code === 'N' ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                    {wallDirs.top.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bottom Wall:</span>
                  <span className={wallDirs.bottom.code === 'W' ? 'text-cyan-400 font-bold' : 'text-slate-300'}>
                    {wallDirs.bottom.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Left Wall:</span>
                  <span className={wallDirs.left.code === 'N' ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                    {wallDirs.left.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Right Wall:</span>
                  <span className={wallDirs.right.code === 'N' ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                    {wallDirs.right.label}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Circular Compass Dial */}
            <div className="relative w-24 h-24 sm:w-26 sm:h-26 flex items-center justify-center my-0.5">
              {/* Outer Dial Ring */}
              <div className="absolute inset-0 rounded-full border-2 border-slate-700 bg-slate-950/80 shadow-inner flex items-center justify-center">
                {/* 15-degree Tick Marks */}
                {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                  <div
                    key={deg}
                    className="absolute w-full h-full flex justify-center items-start pointer-events-none"
                    style={{ transform: `rotate(${deg}deg)` }}
                  >
                    <div
                      className={`w-0.5 ${
                        deg % 90 === 0 ? 'h-2 bg-slate-400' : 'h-1.5 bg-slate-600'
                      }`}
                    />
                  </div>
                ))}
              </div>

              {/* Cardinal Clickable Buttons */}
              {/* North (0°) */}
              <button
                type="button"
                onClick={() => handleApplyDirection(0)}
                title="Align Room to True North (0°)"
                className={`absolute top-0.5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded transition cursor-pointer z-10 ${
                  rotation === 0
                    ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/50 scale-105'
                    : 'text-rose-400 hover:bg-slate-800'
                }`}
              >
                N
              </button>

              {/* East (90°) */}
              <button
                type="button"
                onClick={() => handleApplyDirection(90)}
                title="Rotate Room to East (90°)"
                className={`absolute right-0.5 top-1/2 -translate-y-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded transition cursor-pointer z-10 ${
                  rotation === 90
                    ? 'bg-cyan-500 text-white shadow-sm shadow-cyan-500/50 scale-105'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                E
              </button>

              {/* South (180°) */}
              <button
                type="button"
                onClick={() => handleApplyDirection(180)}
                title="Rotate Room to South (180°)"
                className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded transition cursor-pointer z-10 ${
                  rotation === 180
                    ? 'bg-cyan-500 text-white shadow-sm shadow-cyan-500/50 scale-105'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                S
              </button>

              {/* West (270°) */}
              <button
                type="button"
                onClick={() => handleApplyDirection(270)}
                title="Rotate Room to West (270°)"
                className={`absolute left-0.5 top-1/2 -translate-y-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded transition cursor-pointer z-10 ${
                  rotation === 270
                    ? 'bg-cyan-500 text-white shadow-sm shadow-cyan-500/50 scale-105'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                W
              </button>

              {/* Architectural Dual-Color Rotating Needle */}
              <div
                className="relative w-full h-full flex items-center justify-center pointer-events-none transition-transform duration-300 ease-out"
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                {/* North Needle Point (Rose) */}
                <div
                  className="absolute bottom-1/2 left-1/2 -translate-x-1/2 w-0 h-0"
                  style={{
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderBottom: '32px solid #f43f5e',
                    filter: 'drop-shadow(0 2px 4px rgba(244, 63, 94, 0.4))',
                  }}
                />

                {/* South Needle Point (Slate) */}
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 w-0 h-0"
                  style={{
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: '32px solid #64748b',
                  }}
                />

                {/* Center Pivot */}
                <div className="absolute w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-slate-300 shadow flex items-center justify-center z-10">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                </div>
              </div>
            </div>

            {/* 3. Angle Slider & Quick Angle Stepping */}
            <div className="w-full space-y-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Direction Angle:</span>
                <span className="font-mono text-cyan-400 font-bold">{rotation}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="359"
                step="5"
                value={rotation}
                onChange={(e) => handleApplyDirection(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                title="Drag to smoothly change home orientation angle"
              />

              {/* Quick Rotation Buttons */}
              <div className="flex items-center gap-1.5 w-full pt-1">
                <button
                  type="button"
                  onClick={() => onRotateRoom?.(-90)}
                  title="Rotate Room 90° Counter-Clockwise (↺)"
                  className="flex-1 flex items-center justify-center gap-1 py-1 px-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] font-semibold transition active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 text-cyan-400" />
                  <span>-90°</span>
                </button>

                <button
                  type="button"
                  onClick={() => onRotateRoom?.(90)}
                  title="Rotate Room 90° Clockwise (↻)"
                  className="flex-1 flex items-center justify-center gap-1 py-1 px-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] font-semibold transition active:scale-95 cursor-pointer"
                >
                  <RotateCw className="w-3 h-3 text-cyan-400" />
                  <span>+90°</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyDirection(0)}
                  title="Reset Room to True North (0°)"
                  className="py-1 px-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-rose-400 text-[11px] font-mono transition active:scale-95 cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* 4. Physical Layout Turn / Mirror (Optional / Collapsible) */}
            <div className="w-full pt-1.5 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowLayoutTools((v) => !v)}
                className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-200 py-1"
                title="Physically rotate or mirror the floor plan drawing"
              >
                <span className="font-semibold flex items-center gap-1">
                  <Maximize2 className="w-3 h-3 text-indigo-400" />
                  <span>Physical Layout Turn / Flip</span>
                </span>
                <span className="text-[10px] text-slate-500">{showLayoutTools ? 'Hide ▲' : 'Show ▼'}</span>
              </button>

              {showLayoutTools && (
                <div className="pt-2 space-y-2 animate-in fade-in duration-150">
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Physically rotate or mirror the room geometry and all furniture items on canvas:
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => onRotateLayout?.(-90)}
                      className="py-1 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
                      title="Turn entire layout 90° counter-clockwise"
                    >
                      <RotateCcw className="w-3 h-3 text-indigo-400" />
                      <span>Turn -90°</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onRotateLayout?.(90)}
                      className="py-1 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
                      title="Turn entire layout 90° clockwise"
                    >
                      <RotateCw className="w-3 h-3 text-indigo-400" />
                      <span>Turn +90°</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onFlipLayout?.('horizontal')}
                      className="py-1 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
                      title="Mirror layout horizontally (Left ⇄ Right)"
                    >
                      <FlipHorizontal className="w-3 h-3 text-indigo-400" />
                      <span>Flip Horiz</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onFlipLayout?.('vertical')}
                      className="py-1 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
                      title="Mirror layout vertically (Top ⇅ Bottom)"
                    >
                      <FlipVertical className="w-3 h-3 text-indigo-400" />
                      <span>Flip Vert</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
