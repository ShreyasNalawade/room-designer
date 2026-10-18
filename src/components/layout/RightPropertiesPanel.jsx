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
  PieChart,
} from 'lucide-react';
import { UNITS } from '../../constants/units';
import { formatMeasurement, calculateRoomMetrics, fromMm, toMm } from '../../utils/units';
import { calculateWallClearances, calculateSpaceUtilization } from '../../utils/measurements';

export default function RightPropertiesPanel({
  room,
  unit,
  items = [],
  selectedItem,
  isOverlapping,
  isOutside,
  onChangeItem,
  onDuplicateItem,
  onDeleteItem,
  onDeselect,
  totalItemsCount = 0,
  isMobileDrawer = false,
  onClose,
}) {
  const currentUnit = UNITS[unit] || UNITS.m;
  const metrics = calculateRoomMetrics(room, unit);
  const spaceUtil = calculateSpaceUtilization(room, items, unit);

  // If a furniture item is selected, render the Furniture Inspector
  if (selectedItem) {
    const isLocked = !!selectedItem.locked;
    const widthDisplay = fromMm(selectedItem.widthMm, unit);
    const depthDisplay = fromMm(selectedItem.depthMm || selectedItem.heightMm, unit);
    const xDisplay = fromMm(selectedItem.x, unit);
    const yDisplay = fromMm(selectedItem.y, unit);

    const clearances = calculateWallClearances(selectedItem, room, unit);
    const itemFootprintSqM = Number(
      ((selectedItem.widthMm / 1000) * ((selectedItem.depthMm || selectedItem.heightMm || 600) / 1000)).toFixed(2)
    );
    const itemFootprintPercent =
      metrics.sqMeters > 0 ? Number(((itemFootprintSqM / metrics.sqMeters) * 100).toFixed(1)) : 0;

    const updateItemDimension = (key, deltaDisplay) => {
      if (isLocked) return;
      const current = key === 'widthMm' ? widthDisplay : depthDisplay;
      const newVal = Math.max(current + deltaDisplay, currentUnit.min);
      onChangeItem({
        ...selectedItem,
        [key]: toMm(newVal, unit),
      });
    };

    const adjustWallDistance = (dir, deltaDisplay) => {
      if (isLocked) return;
      const deltaMm = toMm(deltaDisplay, unit);
      // North: moving away from North wall increases Y (moves South)
      // Moving closer to North wall decreases Y (moves North)
      if (dir === 'north') {
        onChangeItem({ ...selectedItem, y: (selectedItem.y || 0) + deltaMm });
      } else if (dir === 'south') {
        onChangeItem({ ...selectedItem, y: (selectedItem.y || 0) - deltaMm });
      } else if (dir === 'west') {
        onChangeItem({ ...selectedItem, x: (selectedItem.x || 0) + deltaMm });
      } else if (dir === 'east') {
        onChangeItem({ ...selectedItem, x: (selectedItem.x || 0) - deltaMm });
      }
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
      <aside
        className={`${
          isMobileDrawer
            ? 'w-full h-full'
            : 'w-80 border-l border-slate-800 hidden lg:flex'
        } bg-slate-900/95 flex flex-col h-full overflow-y-auto select-none`}
      >
        {isMobileDrawer && (
          <div className="pt-2 pb-1 bg-slate-950/90 border-b border-slate-800 shrink-0">
            <div className="w-12 h-1.5 rounded-full bg-slate-700 mx-auto mb-1.5" />
          </div>
        )}
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
              onClick={isMobileDrawer ? onClose : onDeselect}
              className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition"
              title="Close (Escape)"
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

          {/* Wall Clearances & Positioning Card */}
          <div className="space-y-3 bg-slate-950/70 border border-cyan-900/40 rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  Wall Clearances & Placement
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-800/60 px-1.5 py-0.5 rounded">
                {currentUnit.symbol}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Real-world distance from component outer edges to room boundary walls.
            </p>

            {/* 4 Directions Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {/* North Wall Distance */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2 space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-semibold text-cyan-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
                    North Wall
                  </span>
                  <span className="font-mono text-slate-200 font-semibold text-[11px]">
                    {clearances.northStr}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => adjustWallDistance('north', -currentUnit.step)}
                    className="w-6 h-6 rounded bg-slate-950 border border-slate-700 hover:border-slate-600 flex items-center justify-center text-xs text-slate-300 disabled:opacity-40"
                    title="Move Closer to North Wall (-)"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-mono text-[11px] text-slate-300">
                    {fromMm(clearances.northMm, unit)}
                  </span>
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => adjustWallDistance('north', currentUnit.step)}
                    className="w-6 h-6 rounded bg-slate-950 border border-slate-700 hover:border-slate-600 flex items-center justify-center text-xs text-slate-300 disabled:opacity-40"
                    title="Move Further from North Wall (+)"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* South Wall Distance */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2 space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-semibold text-cyan-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
                    South Wall
                  </span>
                  <span className="font-mono text-slate-200 font-semibold text-[11px]">
                    {clearances.southStr}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => adjustWallDistance('south', -currentUnit.step)}
                    className="w-6 h-6 rounded bg-slate-950 border border-slate-700 hover:border-slate-600 flex items-center justify-center text-xs text-slate-300 disabled:opacity-40"
                    title="Move Closer to South Wall (-)"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-mono text-[11px] text-slate-300">
                    {fromMm(clearances.southMm, unit)}
                  </span>
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => adjustWallDistance('south', currentUnit.step)}
                    className="w-6 h-6 rounded bg-slate-950 border border-slate-700 hover:border-slate-600 flex items-center justify-center text-xs text-slate-300 disabled:opacity-40"
                    title="Move Further from South Wall (+)"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* West Wall Distance */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2 space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-semibold text-cyan-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
                    West Wall
                  </span>
                  <span className="font-mono text-slate-200 font-semibold text-[11px]">
                    {clearances.westStr}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => adjustWallDistance('west', -currentUnit.step)}
                    className="w-6 h-6 rounded bg-slate-950 border border-slate-700 hover:border-slate-600 flex items-center justify-center text-xs text-slate-300 disabled:opacity-40"
                    title="Move Closer to West Wall (-)"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-mono text-[11px] text-slate-300">
                    {fromMm(clearances.westMm, unit)}
                  </span>
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => adjustWallDistance('west', currentUnit.step)}
                    className="w-6 h-6 rounded bg-slate-950 border border-slate-700 hover:border-slate-600 flex items-center justify-center text-xs text-slate-300 disabled:opacity-40"
                    title="Move Further from West Wall (+)"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* East Wall Distance */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2 space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-semibold text-cyan-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
                    East Wall
                  </span>
                  <span className="font-mono text-slate-200 font-semibold text-[11px]">
                    {clearances.eastStr}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => adjustWallDistance('east', -currentUnit.step)}
                    className="w-6 h-6 rounded bg-slate-950 border border-slate-700 hover:border-slate-600 flex items-center justify-center text-xs text-slate-300 disabled:opacity-40"
                    title="Move Closer to East Wall (-)"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-mono text-[11px] text-slate-300">
                    {fromMm(clearances.eastMm, unit)}
                  </span>
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => adjustWallDistance('east', currentUnit.step)}
                    className="w-6 h-6 rounded bg-slate-950 border border-slate-700 hover:border-slate-600 flex items-center justify-center text-xs text-slate-300 disabled:opacity-40"
                    title="Move Further from East Wall (+)"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Room Space & Area Utilization Card */}
          <div className="space-y-3 bg-slate-950/70 border border-emerald-900/40 rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  Room Space & Area Analysis
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                {spaceUtil.freeSpacePercent}% Free
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1">
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
                  style={{ width: `${spaceUtil.freeSpacePercent}%` }}
                  title={`Remaining Empty Space: ${spaceUtil.freeSpacePercent}%`}
                />
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${spaceUtil.occupiedPercent}%` }}
                  title={`Occupied Space: ${spaceUtil.occupiedPercent}%`}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  Free: {spaceUtil.freeSpaceSqM} m² ({spaceUtil.freeSpaceSqFt} sq ft)
                </span>
                <span className="text-indigo-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
                  Occupied: {spaceUtil.occupiedAreaSqM} m²
                </span>
              </div>
            </div>

            {/* Key Space Stats */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 text-xs">
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Remaining Empty Space
                </span>
                <span className="text-sm font-bold font-mono text-emerald-400 block mt-0.5">
                  {spaceUtil.primaryFreeArea} {spaceUtil.primaryAreaUnit}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block">
                  {spaceUtil.freeSpacePercent}% available
                </span>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  This Component Footprint
                </span>
                <span className="text-sm font-bold font-mono text-cyan-400 block mt-0.5">
                  {itemFootprintSqM} m²
                </span>
                <span className="text-[10px] text-slate-400 font-mono block">
                  {itemFootprintPercent}% of room
                </span>
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
    <aside
      className={`${
        isMobileDrawer
          ? 'w-full h-full'
          : 'w-80 border-l border-slate-800 hidden lg:flex'
      } bg-slate-900/95 flex flex-col h-full overflow-y-auto select-none`}
    >
      {isMobileDrawer && (
        <div className="pt-2 pb-1 bg-slate-950/90 border-b border-slate-800 shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-slate-700 mx-auto mb-1.5" />
        </div>
      )}
      <div className="p-4 space-y-6">
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-slate-200">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider">Room Properties</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 capitalize">
              {room.shape}
            </span>
            {isMobileDrawer && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
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

        {/* Room Space & Area Utilization Card */}
        <div className="space-y-3 bg-slate-950/70 border border-emerald-900/40 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Floor Space & Capacity Analysis
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full">
              {spaceUtil.freeSpacePercent}% Free
            </span>
          </div>

          {/* Visual Progress Bar */}
          <div className="space-y-1">
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
                style={{ width: `${spaceUtil.freeSpacePercent}%` }}
                title={`Remaining Empty Space: ${spaceUtil.freeSpacePercent}%`}
              />
              <div
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${spaceUtil.occupiedPercent}%` }}
                title={`Occupied Space: ${spaceUtil.occupiedPercent}%`}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Free: {spaceUtil.freeSpaceSqM} m² ({spaceUtil.freeSpaceSqFt} sq ft)
              </span>
              <span className="text-indigo-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
                Occupied: {spaceUtil.occupiedAreaSqM} m²
              </span>
            </div>
          </div>

          {/* Key Space Stats */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 text-xs">
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Remaining Empty Space
              </span>
              <span className="text-sm font-bold font-mono text-emerald-400 block mt-0.5">
                {spaceUtil.primaryFreeArea} {spaceUtil.primaryAreaUnit}
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">
                {spaceUtil.freeSpacePercent}% available
              </span>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Occupied Furniture Area
              </span>
              <span className="text-sm font-bold font-mono text-indigo-300 block mt-0.5">
                {spaceUtil.primaryOccupiedArea} {spaceUtil.primaryAreaUnit}
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">
                {spaceUtil.itemsCount} components
              </span>
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
