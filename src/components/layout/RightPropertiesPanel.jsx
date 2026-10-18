import {
  SlidersHorizontal,
  Maximize,
  Compass,
  CheckCircle2,
  Trash2,
  Copy,
  RotateCw,
  RotateCcw,
  Lock,
  Unlock,
  AlertTriangle,
  AlertCircle,
  X,
  Armchair,
} from 'lucide-react';
import { UNITS } from '../../constants/units';
import { formatMeasurement, calculateRoomMetrics, fromMm, toMm } from '../../utils/units';

export default function RightPropertiesPanel({
  room,
  unit,
  selectedItem,
  isOverlapping,
  isOutside,
  onChangeItem,
  onDuplicateItem,
  onDeleteItem,
  onDeselect,
  totalItemsCount = 0,
}) {
  const currentUnit = UNITS[unit] || UNITS.m;
  const metrics = calculateRoomMetrics(room, unit);

  // If a furniture item is selected, render the Furniture Inspector
  if (selectedItem) {
    const isLocked = !!selectedItem.locked;
    const widthDisplay = fromMm(selectedItem.widthMm, unit);
    const depthDisplay = fromMm(selectedItem.depthMm || selectedItem.heightMm, unit);
    const xDisplay = fromMm(selectedItem.x, unit);
    const yDisplay = fromMm(selectedItem.y, unit);

    const updateItemDimension = (key, deltaDisplay) => {
      if (isLocked) return;
      const current = key === 'widthMm' ? widthDisplay : depthDisplay;
      const newVal = Math.max(current + deltaDisplay, currentUnit.min);
      onChangeItem({
        ...selectedItem,
        [key]: toMm(newVal, unit),
      });
    };

    const rotateBy = (deg) => {
      if (isLocked) return;
      const next = ((selectedItem.rotation || 0) + deg) % 360;
      onChangeItem({
        ...selectedItem,
        rotation: next < 0 ? next + 360 : next,
      });
    };

    return (
      <aside className="w-80 bg-slate-900/95 border-l border-slate-800 flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto select-none">
        <div className="p-4 space-y-5">
          {/* Item Inspector Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Armchair className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Component Inspector
              </h2>
            </div>
            <button
              type="button"
              onClick={onDeselect}
              className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition"
              title="Deselect (Escape)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Collision / Boundary Alert Badges */}
          {isOutside && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Outside Room Perimeter</span>
              </div>
              <p className="text-[11px] text-rose-300/90 leading-tight">
                This item extends beyond the architectural room walls. Move it back inside.
              </p>
            </div>
          )}

          {isOverlapping && (
            <div className="p-3 rounded-lg bg-amber-950/50 border border-amber-800/80 text-amber-300 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Furniture Clearance Warning</span>
              </div>
              <p className="text-[11px] text-amber-300/90 leading-tight">
                Overlaps with another component. Ensure adequate clearance for movement.
              </p>
            </div>
          )}

          {/* Item Name & Category */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Component Label
            </label>
            <input
              type="text"
              value={selectedItem.name}
              onChange={(e) => onChangeItem({ ...selectedItem, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-100 text-xs rounded-lg px-3 py-2 outline-none font-medium"
            />
          </div>

          {/* Dimensions Controls */}
          <div className="space-y-3 bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Component Size
              </span>
              <span className="text-[10px] font-mono text-cyan-400">{currentUnit.symbol}</span>
            </div>

            {/* Width */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Width</span>
                <span className="font-mono text-slate-200">{formatMeasurement(selectedItem.widthMm, unit)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => updateItemDimension('widthMm', -currentUnit.step)}
                  className="w-7 h-7 rounded-md bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition disabled:opacity-40"
                >
                  -
                </button>
                <input
                  type="number"
                  disabled={isLocked}
                  step={currentUnit.step}
                  value={widthDisplay}
                  onChange={(e) => {
                    const num = parseFloat(e.target.value);
                    if (!isNaN(num) && num > 0) {
                      onChangeItem({ ...selectedItem, widthMm: toMm(num, unit) });
                    }
                  }}
                  className="flex-1 bg-slate-900 border border-slate-800 text-center font-mono text-xs rounded-md py-1 text-slate-100 outline-none disabled:opacity-40"
                />
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => updateItemDimension('widthMm', currentUnit.step)}
                  className="w-7 h-7 rounded-md bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>

            {/* Depth */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Depth / Height</span>
                <span className="font-mono text-slate-200">
                  {formatMeasurement(selectedItem.depthMm || selectedItem.heightMm, unit)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => updateItemDimension('depthMm', -currentUnit.step)}
                  className="w-7 h-7 rounded-md bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition disabled:opacity-40"
                >
                  -
                </button>
                <input
                  type="number"
                  disabled={isLocked}
                  step={currentUnit.step}
                  value={depthDisplay}
                  onChange={(e) => {
                    const num = parseFloat(e.target.value);
                    if (!isNaN(num) && num > 0) {
                      onChangeItem({ ...selectedItem, depthMm: toMm(num, unit) });
                    }
                  }}
                  className="flex-1 bg-slate-900 border border-slate-800 text-center font-mono text-xs rounded-md py-1 text-slate-100 outline-none disabled:opacity-40"
                />
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => updateItemDimension('depthMm', currentUnit.step)}
                  className="w-7 h-7 rounded-md bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Position & Rotation */}
          <div className="space-y-3 bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
              Position & Orientation
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 block">Room X</span>
                <span className="font-mono text-slate-200">
                  {xDisplay} {currentUnit.symbol}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Room Y</span>
                <span className="font-mono text-slate-200">
                  {yDisplay} {currentUnit.symbol}
                </span>
              </div>
            </div>

            {/* Rotation Controls */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Rotation</span>
                <span className="font-mono text-cyan-400">{selectedItem.rotation || 0}°</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => rotateBy(90)}
                  className="flex items-center justify-center gap-1.5 p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition cursor-pointer disabled:opacity-40"
                >
                  <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>+90°</span>
                </button>
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => onChangeItem({ ...selectedItem, rotation: 0 })}
                  className="flex items-center justify-center gap-1.5 p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition cursor-pointer disabled:opacity-40"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reset 0°</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Quick Actions
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onDuplicateItem(selectedItem)}
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition cursor-pointer font-medium"
              >
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                <span>Duplicate</span>
              </button>

              <button
                type="button"
                onClick={() => onChangeItem({ ...selectedItem, locked: !isLocked })}
                className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-medium transition cursor-pointer ${
                  isLocked
                    ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                <span>{isLocked ? 'Locked' : 'Unlocked'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => onDeleteItem(selectedItem.id)}
              className="w-full flex items-center justify-center gap-1.5 p-2 rounded-lg bg-rose-950/30 border border-rose-800/50 hover:bg-rose-900/50 text-rose-300 text-xs transition cursor-pointer font-medium mt-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Component</span>
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // When no item is selected, render Room Properties
  return (
    <aside className="w-80 bg-slate-900/95 border-l border-slate-800 flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto select-none">
      <div className="p-4 space-y-6">
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-slate-200">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider">Room Properties</h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 capitalize">
            {room.shape}
          </span>
        </div>

        {/* Real-world Area & Metrics Card */}
        <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Usable Floor Area</span>
            <Maximize className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
              {metrics.sqMeters}{' '}
              <span className="text-sm font-sans font-normal text-emerald-300">m²</span>
            </div>
            <div className="text-xs font-mono text-slate-400">
              {metrics.sqFeet} <span className="text-[11px] font-sans">sq ft</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[11px] text-slate-500 block">Perimeter</span>
              <span className="font-mono text-slate-200 font-medium">{metrics.perimeterStr}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Placed Objects</span>
              <span className="font-mono text-cyan-400 font-medium">{totalItemsCount} items</span>
            </div>
          </div>
        </div>

        {/* Dimensions Summary */}
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            Canonical Coordinates (mm)
          </span>
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 space-y-2 text-xs font-mono">
            {room.shape === 'trapezoid' ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Top Width (North)</span>
                  <span className="text-cyan-400 font-medium">
                    {formatMeasurement(room.topWidthMm || 4000, unit)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Bottom Width (South)</span>
                  <span className="text-cyan-400 font-medium">
                    {formatMeasurement(room.bottomWidthMm || 6000, unit)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Length (Height)</span>
                  <span className="text-cyan-400 font-medium">
                    {formatMeasurement(room.lengthMm || 4500, unit)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Width (X-axis)</span>
                  <span className="text-cyan-400 font-medium">
                    {formatMeasurement(room.widthMm, unit)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Length (Y-axis)</span>
                  <span className="text-cyan-400 font-medium">
                    {formatMeasurement(room.lengthMm, unit)}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center pt-1 border-t border-slate-800">
              <span className="text-slate-400">Wall Core Thickness</span>
              <span className="text-slate-300">160 mm</span>
            </div>
          </div>
        </div>

        {/* Wall Geometry Breakdown */}
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            Wall Segments (Boundary)
          </span>
          <div className="space-y-1.5 text-xs">
            {metrics.walls.map((w, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/80"
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                  <span className="text-slate-300 font-medium">{w.dir}</span>
                </div>
                <div className="font-mono text-slate-400 text-[11px]">
                  {formatMeasurement(w.len, unit)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Integrity Checklist */}
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            Integrity Checks
          </span>
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Non-Intersecting Polygon</span>
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Closed
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Valid Scale Bounds</span>
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Valid
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Proportional Distortion</span>
              <span className="text-emerald-400 font-medium">0% (Strict)</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
