import { MousePointer, CheckCircle, AlertCircle, AlertTriangle, Armchair, Compass } from 'lucide-react';
import { formatMeasurement } from '../../utils/units';
import { getHeadingDirection } from '../../utils/orientation';

export default function StatusBar({
  room,
  unit,
  cursorCoord,
  validation,
  selectedItem,
  outsideCount = 0,
  overlapCount = 0,
}) {
  const heading = getHeadingDirection(room.rotation || 0);

  return (
    <footer className="h-8 bg-slate-950 border-t border-slate-800 px-4 flex items-center justify-between text-xs text-slate-400 select-none z-30">
      {/* Left: Cursor World Coordinates & Room Summary */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
          <MousePointer className="w-3 h-3 text-cyan-400" />
          <span>
            X: {cursorCoord ? formatMeasurement(cursorCoord.xMm, unit) : '0.00 ' + unit}
          </span>
          <span className="text-slate-600">|</span>
          <span>
            Y: {cursorCoord ? formatMeasurement(cursorCoord.yMm, unit) : '0.00 ' + unit}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 border-l border-slate-800 pl-3 font-mono">
          <span>Room:</span>
          <span className="text-slate-200">
            {room.shape === 'trapezoid'
              ? `Trapezoid ${formatMeasurement(room.topWidthMm || 4000, unit)} / ${formatMeasurement(room.bottomWidthMm || 6000, unit)} × ${formatMeasurement(room.lengthMm, unit)}`
              : `${formatMeasurement(room.widthMm, unit)} × ${formatMeasurement(room.lengthMm, unit)}`}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-400 border-l border-slate-800 pl-3 font-mono">
          <Compass className="w-3 h-3 text-rose-400" />
          <span>Heading:</span>
          <span className="text-slate-200 font-semibold">
            {room.rotation || 0}° {heading.code}
          </span>
        </div>

        {selectedItem && (
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-cyan-300 border-l border-slate-800 pl-3 font-medium">
            <Armchair className="w-3 h-3 text-cyan-400" />
            <span>
              {selectedItem.name} ({formatMeasurement(selectedItem.widthMm, unit)} ×{' '}
              {formatMeasurement(selectedItem.depthMm || selectedItem.heightMm, unit)})
            </span>
          </div>
        )}
      </div>

      {/* Center: System Status & Collisions */}
      <div className="flex items-center gap-2 text-[11px]">
        {outsideCount > 0 ? (
          <span className="flex items-center gap-1 text-rose-400 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{outsideCount} item(s) outside room</span>
          </span>
        ) : overlapCount > 0 ? (
          <span className="flex items-center gap-1 text-amber-400 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{overlapCount} overlapping component(s)</span>
          </span>
        ) : validation.isValid ? (
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Valid 2D Floor Plan</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-rose-400 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{validation.errors[0] || 'Geometry Error'}</span>
          </span>
        )}
      </div>

      {/* Right: Keyboard Shortcuts Hint */}
      <div className="hidden lg:flex items-center gap-3 text-[11px] text-slate-500">
        <span>Esc: Deselect • Del: Delete • Ctrl+D: Duplicate • Arrows: Nudge</span>
        <span className="text-slate-700">•</span>
        <span className="font-mono text-cyan-400/80 uppercase tracking-wider text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
          Phase 2 Active
        </span>
      </div>
    </footer>
  );
}
