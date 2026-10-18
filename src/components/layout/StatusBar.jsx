import { MousePointer, CheckCircle, AlertCircle } from 'lucide-react';
import { formatMeasurement } from '../../utils/units';

export default function StatusBar({
  room,
  unit,
  cursorCoord,
  validation,
}) {
  return (
    <footer className="h-8 bg-slate-950 border-t border-slate-800 px-4 flex items-center justify-between text-xs text-slate-400 select-none z-30">
      {/* Left: Cursor World Coordinates */}
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
            {formatMeasurement(room.widthMm, unit)} × {formatMeasurement(room.lengthMm, unit)}
          </span>
        </div>
      </div>

      {/* Center: System Status */}
      <div className="flex items-center gap-1.5 text-[11px]">
        {validation.isValid ? (
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Valid 2D Scaled Geometry</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-rose-400 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{validation.errors[0] || 'Geometry Error'}</span>
          </span>
        )}
      </div>

      {/* Right: Mode & Hints */}
      <div className="hidden md:flex items-center gap-3 text-[11px] text-slate-500">
        <span>Drag canvas to pan • Wheel to zoom</span>
        <span className="text-slate-700">•</span>
        <span className="font-mono text-cyan-400/80 uppercase tracking-wider text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
          Phase 1 Active
        </span>
      </div>
    </footer>
  );
}
