import { useState } from 'react';
import { Compass, RotateCw, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { getHeadingDirection } from '../../utils/orientation';

/**
 * Architectural Interactive Compass Rose & Room Orientation HUD
 */
export default function CompassRose({
  rotation = 0,
  onRotateRoom,
  onSetRotation,
}) {
  const [isExpanded, setIsExpanded] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  });
  const heading = getHeadingDirection(rotation);

  return (
    <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex flex-col items-start select-none">
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-2.5 sm:p-3 text-slate-200 transition-all duration-200">
        {/* Header / Collapse Bar */}
        <div className="flex items-center justify-between gap-2 mb-1 cursor-pointer" onClick={() => setIsExpanded((v) => !v)}>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <Compass className="w-4 h-4 text-rose-400" />
            <span className="tracking-wide hidden sm:inline">Compass</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-rose-300">
              {rotation}° {heading.code}
            </span>
            <button
              type="button"
              className="text-slate-400 hover:text-white p-0.5"
              title={isExpanded ? 'Minimize Compass' : 'Expand Compass'}
            >
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="flex flex-col items-center pt-1 space-y-2.5 animate-in fade-in duration-150">
            {/* Circular Compass Dial */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
              {/* Outer Dial Ring */}
              <div className="absolute inset-0 rounded-full border-2 border-slate-700 bg-slate-950/70 shadow-inner flex items-center justify-center">
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
                onClick={() => onSetRotation?.(0)}
                title="Align Room to True North (0°)"
                className={`absolute top-0.5 left-1/2 -translate-x-1/2 text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded transition cursor-pointer z-10 ${
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
                onClick={() => onSetRotation?.(90)}
                title="Rotate Room to East (90°)"
                className={`absolute right-0.5 top-1/2 -translate-y-1/2 text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded transition cursor-pointer z-10 ${
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
                onClick={() => onSetRotation?.(180)}
                title="Rotate Room to South (180°)"
                className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded transition cursor-pointer z-10 ${
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
                onClick={() => onSetRotation?.(270)}
                title="Rotate Room to West (270°)"
                className={`absolute left-0.5 top-1/2 -translate-y-1/2 text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded transition cursor-pointer z-10 ${
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
                    borderBottom: '34px solid #f43f5e',
                    filter: 'drop-shadow(0 2px 4px rgba(244, 63, 94, 0.4))',
                  }}
                />

                {/* South Needle Point (Slate) */}
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 w-0 h-0"
                  style={{
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: '34px solid #64748b',
                  }}
                />

                {/* Center Pivot Pivot */}
                <div className="absolute w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-slate-300 shadow flex items-center justify-center z-10">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                </div>
              </div>
            </div>

            {/* Heading Description Badge */}
            <div className="text-center">
              <span className="text-[11px] font-medium text-slate-300">
                Facing: <strong className="text-cyan-400">{heading.label}</strong>
              </span>
            </div>

            {/* Quick Rotate Action Buttons */}
            <div className="flex items-center gap-1.5 w-full pt-1 border-t border-slate-800">
              <button
                type="button"
                onClick={() => onRotateRoom?.(-90)}
                title="Rotate Room 90° Counter-Clockwise (↺)"
                className="flex-1 flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] font-semibold transition active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-cyan-400" />
                <span>-90°</span>
              </button>

              <button
                type="button"
                onClick={() => onRotateRoom?.(90)}
                title="Rotate Room 90° Clockwise (↻)"
                className="flex-1 flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] font-semibold transition active:scale-95 cursor-pointer"
              >
                <RotateCw className="w-3 h-3 text-cyan-400" />
                <span>+90°</span>
              </button>

              <button
                type="button"
                onClick={() => onSetRotation?.(0)}
                title="Reset Room to True North (0°)"
                className="py-1 px-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-rose-400 text-[11px] font-mono transition active:scale-95 cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
