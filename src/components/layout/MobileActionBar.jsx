import {
  Trash2,
  RotateCw,
  Copy,
  Lock,
  Unlock,
  X,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Sliders,
  Undo2,
} from 'lucide-react';
import { formatMeasurement } from '../../utils/units';
import { calculateWallClearances, calculateSpaceUtilization } from '../../utils/measurements';

export default function MobileActionBar({
  selectedItem,
  room,
  items = [],
  unit,
  onRotate,
  onDuplicate,
  onDelete,
  onToggleLock,
  onNudge,
  onOpenProperties,
  onDeselect,
  onUndo,
  canUndo = false,
}) {
  if (!selectedItem) return null;

  const isLocked = !!selectedItem.locked;
  const clearances = room ? calculateWallClearances(selectedItem, room, unit) : null;
  const spaceUtil = room ? calculateSpaceUtilization(room, items, unit) : null;

  return (
    <div className="lg:hidden absolute bottom-16 sm:bottom-12 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-md bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-2.5 space-y-2 select-none animate-in fade-in slide-in-from-bottom-3 duration-200">
      {/* Top Header: Selected Item Name, Dimensions & Close */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 overflow-hidden">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: selectedItem.color || '#06b6d4' }}
          />
          <span className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-[200px]">
            {selectedItem.name}
          </span>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-800/60 px-1.5 py-0.5 rounded">
            {formatMeasurement(selectedItem.widthMm, unit)} ×{' '}
            {formatMeasurement(selectedItem.depthMm || selectedItem.heightMm, unit)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {canUndo && (
            <button
              type="button"
              id="mobile-undo-btn"
              data-testid="mobile-undo-btn"
              onClick={onUndo}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-950/80 border border-cyan-700/80 text-cyan-300 hover:text-white hover:bg-cyan-900 active:scale-95 transition text-[10px] font-semibold cursor-pointer shadow-sm"
              title="Undo accidental move or resize"
            >
              <Undo2 className="w-3 h-3 text-cyan-400" />
              <span>Undo</span>
            </button>
          )}
          <button
            type="button"
            onClick={onDeselect}
            className="p-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
            title="Deselect"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Live Wall Clearances & Empty Space Badge */}
      {clearances && spaceUtil && (
        <div className="flex items-center justify-between text-[10px] bg-slate-950/80 border border-slate-800/80 rounded-lg px-2.5 py-1 font-mono text-slate-300">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-cyan-400 font-semibold truncate">
              N: {clearances.northStr}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 truncate">
              S: {clearances.southStr}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 truncate">
              W: {clearances.westStr}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 truncate">
              E: {clearances.eastStr}
            </span>
          </div>
          <span className="text-emerald-400 font-semibold pl-1.5 shrink-0">
            {spaceUtil.freeSpacePercent}% Free
          </span>
        </div>
      )}

      {/* Main Touch Actions Row */}
      <div className="grid grid-cols-5 gap-1.5 pt-1 border-t border-slate-800/80">
        {/* Delete / Erase Button (Prominent Red for easy mobile erasing) */}
        <button
          type="button"
          id="mobile-erase-btn"
          data-testid="mobile-erase-btn"
          onClick={() => onDelete(selectedItem.id)}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-300 hover:bg-rose-900 active:scale-95 transition touch-manipulation cursor-pointer"
          title="Delete / Erase"
        >
          <Trash2 className="w-4 h-4 text-rose-400 mb-0.5" />
          <span className="text-[10px] font-bold">Erase</span>
        </button>

        {/* Rotate 90 Button */}
        <button
          type="button"
          id="mobile-rotate-btn"
          data-testid="mobile-rotate-btn"
          disabled={isLocked}
          onClick={() => onRotate(90)}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 active:scale-95 transition disabled:opacity-40 touch-manipulation cursor-pointer"
          title="Rotate 90°"
        >
          <RotateCw className="w-4 h-4 text-cyan-400 mb-0.5" />
          <span className="text-[10px] font-medium">+90°</span>
        </button>

        {/* Duplicate Button */}
        <button
          type="button"
          id="mobile-copy-btn"
          data-testid="mobile-copy-btn"
          onClick={() => onDuplicate(selectedItem)}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 active:scale-95 transition touch-manipulation cursor-pointer"
          title="Duplicate"
        >
          <Copy className="w-4 h-4 text-cyan-400 mb-0.5" />
          <span className="text-[10px] font-medium">Copy</span>
        </button>

        {/* Lock / Unlock Toggle */}
        <button
          type="button"
          id="mobile-lock-btn"
          data-testid="mobile-lock-btn"
          onClick={() => onToggleLock(selectedItem)}
          className={`flex flex-col items-center justify-center p-2 rounded-xl border active:scale-95 transition touch-manipulation cursor-pointer ${
            isLocked
              ? 'bg-amber-950/70 border-amber-800 text-amber-300'
              : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
          }`}
          title={isLocked ? 'Unlock item' : 'Lock item position'}
        >
          {isLocked ? (
            <Lock className="w-4 h-4 text-amber-400 mb-0.5" />
          ) : (
            <Unlock className="w-4 h-4 text-slate-400 mb-0.5" />
          )}
          <span className="text-[10px] font-medium">{isLocked ? 'Locked' : 'Lock'}</span>
        </button>

        {/* Edit Details Drawer Button */}
        <button
          type="button"
          id="mobile-size-btn"
          data-testid="mobile-size-btn"
          onClick={onOpenProperties}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-cyan-950/60 border border-cyan-800/80 text-cyan-300 hover:bg-cyan-900 active:scale-95 transition touch-manipulation cursor-pointer"
          title="Edit exact size and measurements"
        >
          <Sliders className="w-4 h-4 text-cyan-400 mb-0.5" />
          <span className="text-[10px] font-medium">Size</span>
        </button>
      </div>

      {/* Touch Nudge Pad (Precision Adjustment for Fingers) */}
      {!isLocked && (
        <div className="flex items-center justify-between px-2 pt-1.5 border-t border-slate-800/60">
          <span className="text-[10px] text-slate-400 font-medium">Nudge:</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              id="mobile-nudge-left"
              data-testid="mobile-nudge-left"
              onClick={() => onNudge(-50, 0)}
              className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 active:scale-90 touch-manipulation cursor-pointer"
              title="Move Left 5cm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              id="mobile-nudge-up"
              data-testid="mobile-nudge-up"
              onClick={() => onNudge(0, -50)}
              className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 active:scale-90 touch-manipulation cursor-pointer"
              title="Move Up 5cm"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              id="mobile-nudge-down"
              data-testid="mobile-nudge-down"
              onClick={() => onNudge(0, 50)}
              className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 active:scale-90 touch-manipulation cursor-pointer"
              title="Move Down 5cm"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              id="mobile-nudge-right"
              data-testid="mobile-nudge-right"
              onClick={() => onNudge(50, 0)}
              className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 active:scale-90 touch-manipulation cursor-pointer"
              title="Move Right 5cm"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
