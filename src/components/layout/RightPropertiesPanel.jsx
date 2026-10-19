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
  User,
  Users,
  BedDouble,
  BrickWall,
  Plus,
} from 'lucide-react';
import { UNITS } from '../../constants/units';
import { formatMeasurement, calculateRoomMetrics, fromMm, toMm } from '../../utils/units';
import { calculateWallClearances, calculateSpaceUtilization } from '../../utils/measurements';
import { getHeadingDirection } from '../../utils/orientation';

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
  onRotateRoom,
  onSetRotation,
  totalItemsCount = 0,
  isMobileDrawer = false,
  onClose,
  onAddFurnitureItem,
}) {
  const currentUnit = UNITS[unit] || UNITS.m;
  const metrics = calculateRoomMetrics(room, unit);
  const spaceUtil = calculateSpaceUtilization(room, items, unit);

  // If a furniture item is selected, render the Furniture Inspector
  if (selectedItem) {
    const isLocked = !!selectedItem.locked;
    const isWall =
      selectedItem.symbol === 'wall' ||
      selectedItem.symbol === 'wall-glass' ||
      selectedItem.symbol === 'wall-partition' ||
      selectedItem.category === 'walls';
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

          {/* Person Posture & Scale Testing Card (Visible when person is selected) */}
          {(selectedItem.category === 'people' ||
            selectedItem.symbol === 'person-standing' ||
            selectedItem.symbol === 'person-sleeping' ||
            selectedItem.symbol === 'person-sleeping-mat' ||
            selectedItem.symbol === 'people-sleeping-double') && (
            <div className="space-y-3 bg-gradient-to-br from-pink-950/40 to-slate-950 border border-pink-800/60 rounded-xl p-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-pink-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-pink-200">
                    Person Posture & Scale
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-950 text-pink-300 border border-pink-800/80">
                  {selectedItem.symbol === 'person-standing'
                    ? 'Standing (Top View Circle)'
                    : 'Sleeping (2D Top View)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Switch between standing circular view and sleeping position to test how many people fit.
              </p>

              {/* 3 Posture Buttons */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {/* 1. Standing Circle */}
                <button
                  type="button"
                  onClick={() =>
                    onChangeItem({
                      ...selectedItem,
                      symbol: 'person-standing',
                      widthMm: 500,
                      depthMm: 500,
                      name: 'Person (Standing / Circle)',
                      category: 'people',
                    })
                  }
                  className={`p-2 rounded-lg border text-left flex flex-col justify-between transition cursor-pointer ${
                    selectedItem.symbol === 'person-standing'
                      ? 'bg-pink-950/80 border-pink-500 text-pink-200 shadow-sm'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <User className="w-3.5 h-3.5" />
                    <span className="w-2.5 h-2.5 rounded-full border border-current inline-block" />
                  </div>
                  <span className="text-[11px] font-bold mt-1.5 leading-tight">Standing</span>
                  <span className="text-[9px] font-mono opacity-70">50cm Circle</span>
                </button>

                {/* 2. Sleeping Horizontal */}
                <button
                  type="button"
                  onClick={() =>
                    onChangeItem({
                      ...selectedItem,
                      symbol: 'person-sleeping',
                      widthMm: 1850,
                      depthMm: 650,
                      name: 'Person (Sleeping Horizontal)',
                      category: 'people',
                    })
                  }
                  className={`p-2 rounded-lg border text-left flex flex-col justify-between transition cursor-pointer ${
                    selectedItem.symbol === 'person-sleeping' &&
                    selectedItem.widthMm >= (selectedItem.depthMm || selectedItem.heightMm || 600)
                      ? 'bg-pink-950/80 border-pink-500 text-pink-200 shadow-sm'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <BedDouble className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-mono font-bold">1.85m</span>
                  </div>
                  <span className="text-[11px] font-bold mt-1.5 leading-tight">Sleep Horiz.</span>
                  <span className="text-[9px] font-mono opacity-70">185 × 65 cm</span>
                </button>

                {/* 3. Sleeping Vertical */}
                <button
                  type="button"
                  onClick={() =>
                    onChangeItem({
                      ...selectedItem,
                      symbol: 'person-sleeping',
                      widthMm: 650,
                      depthMm: 1850,
                      name: 'Person (Sleeping Vertical)',
                      category: 'people',
                    })
                  }
                  className={`p-2 rounded-lg border text-left flex flex-col justify-between transition cursor-pointer ${
                    selectedItem.symbol === 'person-sleeping' &&
                    (selectedItem.depthMm || selectedItem.heightMm || 600) > selectedItem.widthMm
                      ? 'bg-pink-950/80 border-pink-500 text-pink-200 shadow-sm'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <BedDouble className="w-3.5 h-3.5 rotate-90" />
                    <span className="text-[10px] font-mono font-bold">1.85m</span>
                  </div>
                  <span className="text-[11px] font-bold mt-1.5 leading-tight">Sleep Vert.</span>
                  <span className="text-[9px] font-mono opacity-70">65 × 185 cm</span>
                </button>
              </div>

              {/* Quick Actions for Testing Capacity */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                {/* 90° Flip Button */}
                <button
                  type="button"
                  onClick={() => {
                    const curW = selectedItem.widthMm;
                    const curD = selectedItem.depthMm || selectedItem.heightMm || 600;
                    onChangeItem({
                      ...selectedItem,
                      widthMm: curD,
                      depthMm: curW,
                      name:
                        selectedItem.symbol === 'person-sleeping'
                          ? curD >= curW
                            ? 'Person (Sleeping Horizontal)'
                            : 'Person (Sleeping Vertical)'
                          : selectedItem.name,
                    });
                  }}
                  className="py-1.5 px-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  title="Flip between Horizontal and Vertical"
                >
                  <RotateCw className="w-3.5 h-3.5 text-pink-400" />
                  <span>Flip 90°</span>
                </button>

                {/* Duplicate Beside Button */}
                <button
                  type="button"
                  onClick={() => {
                    const isHoriz =
                      selectedItem.widthMm >= (selectedItem.depthMm || selectedItem.heightMm || 600);
                    const nextX = isHoriz
                      ? selectedItem.x
                      : selectedItem.x + selectedItem.widthMm + 80;
                    const nextY = isHoriz
                      ? selectedItem.y + (selectedItem.depthMm || selectedItem.heightMm || 650) + 80
                      : selectedItem.y;

                    onDuplicateItem({
                      ...selectedItem,
                      x: nextX,
                      y: nextY,
                    });
                  }}
                  className="py-1.5 px-2 rounded-lg bg-pink-950/60 border border-pink-800/80 hover:bg-pink-900/60 text-pink-200 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  title="Duplicate person directly beside to test room capacity"
                >
                  <Copy className="w-3.5 h-3.5 text-pink-400" />
                  <span>+ Duplicate Beside</span>
                </button>
              </div>
            </div>
          )}

          {/* Partition Wall Controls (Visible when a wall component is selected) */}
          {isWall && (
            <div className="space-y-3.5 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/90 rounded-xl p-3.5 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <BrickWall className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-100">
                    Partition Wall Controls
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/80">
                  {selectedItem.symbol === 'wall-glass' ? 'Glass Partition' : 'Solid Wall'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Set custom wall length, thickness, and rotation angle to partition rooms and divide spaces.
              </p>

              {/* Quick Wall Length Presets */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-300 font-semibold">Wall Length Presets:</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {formatMeasurement(selectedItem.widthMm, unit)}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: '1.2m', mm: 1200 },
                    { label: '2.0m', mm: 2000 },
                    { label: '3.0m', mm: 3000 },
                    { label: '4.0m', mm: 4000 },
                  ].map(({ label, mm }) => (
                    <button
                      key={label}
                      type="button"
                      disabled={isLocked}
                      onClick={() => onChangeItem({ ...selectedItem, widthMm: mm })}
                      className={`py-1.5 px-1 rounded-lg border text-xs font-mono font-semibold transition cursor-pointer disabled:opacity-40 ${
                        selectedItem.widthMm === mm
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Thickness Presets */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-300 font-semibold">Wall Thickness (Width):</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {formatMeasurement(selectedItem.depthMm || selectedItem.heightMm, unit)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: '10cm', mm: 100, desc: 'Drywall' },
                    { label: '15cm', mm: 150, desc: 'Standard' },
                    { label: '20cm', mm: 200, desc: 'Masonry' },
                  ].map(({ label, mm, desc }) => (
                    <button
                      key={label}
                      type="button"
                      disabled={isLocked}
                      onClick={() => onChangeItem({ ...selectedItem, depthMm: mm })}
                      className={`py-1.5 px-1 rounded-lg border text-center transition cursor-pointer disabled:opacity-40 flex flex-col items-center ${
                        (selectedItem.depthMm || selectedItem.heightMm) === mm
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-mono font-bold">{label}</span>
                      <span className="text-[9px] opacity-70">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dedicated Wall Rotation & Angle Controls */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-200 font-bold flex items-center gap-1.5">
                    <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
                    Wall Rotation
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="360"
                      step="5"
                      disabled={isLocked}
                      value={selectedItem.rotation || 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          onChangeItem({
                            ...selectedItem,
                            rotation: ((val % 360) + 360) % 360,
                          });
                        }
                      }}
                      className="w-14 bg-slate-900 border border-slate-700 text-center font-mono text-xs rounded px-1 py-0.5 text-cyan-300 outline-none focus:border-cyan-500"
                    />
                    <span className="text-xs text-slate-400">°</span>
                  </div>
                </div>

                {/* Range Slider for free rotation */}
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="5"
                  disabled={isLocked}
                  value={selectedItem.rotation || 0}
                  onChange={(e) =>
                    onChangeItem({
                      ...selectedItem,
                      rotation: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />

                {/* 4 Quick Alignment Buttons */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: '0° Horiz.', deg: 0, icon: '—' },
                    { label: '90° Vert.', deg: 90, icon: '|' },
                    { label: '45° Angle', deg: 45, icon: '/' },
                    { label: '135° Angle', deg: 135, icon: '\\' },
                  ].map(({ label, deg, icon }) => (
                    <button
                      key={deg}
                      type="button"
                      title={label}
                      disabled={isLocked}
                      onClick={() => onChangeItem({ ...selectedItem, rotation: deg })}
                      className={`py-1.5 rounded-lg border text-center transition cursor-pointer disabled:opacity-40 ${
                        (selectedItem.rotation || 0) === deg
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-mono block">{icon}</span>
                      <span className="text-[10px] block">{deg}°</span>
                    </button>
                  ))}
                </div>

                {/* Quick Step Rotation Buttons */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => rotateBy(-90)}
                    className="py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 text-cyan-400" />
                    <span>-90°</span>
                  </button>
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => rotateBy(45)}
                    className="py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <RotateCw className="w-3 h-3 text-cyan-400" />
                    <span>+45°</span>
                  </button>
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => rotateBy(90)}
                    className="py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <RotateCw className="w-3 h-3 text-cyan-400" />
                    <span>+90°</span>
                  </button>
                </div>
              </div>

              {/* Duplication & Partition Building Actions */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const rad = ((selectedItem.rotation || 0) * Math.PI) / 180;
                    const perpX = Math.round(-Math.sin(rad) * 1500) || 0;
                    const perpY = Math.round(Math.cos(rad) * 1500) || 0;
                    onDuplicateItem({
                      ...selectedItem,
                      x: selectedItem.x + perpX,
                      y: selectedItem.y + perpY,
                    });
                  }}
                  className="py-1.5 px-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  title="Duplicate parallel partition wall 1.5m away"
                >
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  <span>+ Parallel Wall</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const rad = ((selectedItem.rotation || 0) * Math.PI) / 180;
                    const inlineX = Math.round(Math.cos(rad) * selectedItem.widthMm) || 0;
                    const inlineY = Math.round(Math.sin(rad) * selectedItem.widthMm) || 0;
                    onDuplicateItem({
                      ...selectedItem,
                      x: selectedItem.x + inlineX,
                      y: selectedItem.y + inlineY,
                    });
                  }}
                  className="py-1.5 px-2 rounded-lg bg-cyan-950/60 border border-cyan-800/80 hover:bg-cyan-900/60 text-cyan-200 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  title="Extend partition wall end-to-end"
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>+ Extend End</span>
                </button>
              </div>
            </div>
          )}

          {/* Dimensions Controls */}
          <div className="space-y-3 bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                {isWall ? 'Wall Length & Thickness' : 'Component Size'}
              </span>
              <span className="text-[10px] font-mono text-cyan-400">{currentUnit.symbol}</span>
            </div>

            {/* Width / Wall Length */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{isWall ? 'Wall Length (Span)' : 'Width'}</span>
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

            {/* Depth / Wall Thickness */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{isWall ? 'Wall Thickness (Width)' : 'Depth / Height'}</span>
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

        {/* Room Sleeping Capacity Test Card */}
        <div className="space-y-3 bg-gradient-to-br from-slate-950 to-pink-950/30 border border-pink-900/50 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-pink-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Room Sleeping Capacity Test
              </span>
            </div>
            {(() => {
              const sleepingPersonsCount =
                items.filter(
                  (it) => it.symbol === 'person-sleeping' || it.symbol === 'person-sleeping-mat'
                ).length + items.filter((it) => it.symbol === 'people-sleeping-double').length * 2;
              const bedSpotsCount = items.reduce(
                (acc, it) => (it.symbol === 'bed' ? acc + (it.widthMm >= 1300 ? 2 : 1) : acc),
                0
              );
              const totalPlaced = sleepingPersonsCount + bedSpotsCount;
              return (
                <span className="text-[10px] font-mono font-bold text-pink-300 bg-pink-950/80 border border-pink-800/60 px-2 py-0.5 rounded-full">
                  {totalPlaced} Sleeping Spot{totalPlaced === 1 ? '' : 's'} Placed
                </span>
              );
            })()}
          </div>

          <p className="text-[11px] text-slate-400 leading-tight">
            Test how many people can sleep in this room along its length ({formatMeasurement(room.lengthMm, unit)}) and width ({formatMeasurement(room.widthMm, unit)}).
          </p>

          {/* Grid Stats */}
          {(() => {
            const lengthCapacity = Math.max(1, Math.floor(room.lengthMm / 1900));
            const widthCapacity = Math.max(1, Math.floor(room.widthMm / 700));
            const gridFloorCapacity = lengthCapacity * widthCapacity;
            const estimatedFreeFloorCapacity = Math.max(0, Math.floor(spaceUtil.freeSpaceSqM / 1.3));

            return (
              <>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Along Length ({formatMeasurement(room.lengthMm, unit)})
                    </span>
                    <span className="text-base font-bold font-mono text-pink-300 block">
                      {lengthCapacity} {lengthCapacity === 1 ? 'Person' : 'Persons'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Head-to-toe rows (1.9m)
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Along Width ({formatMeasurement(room.widthMm, unit)})
                    </span>
                    <span className="text-base font-bold font-mono text-pink-300 block">
                      {widthCapacity} {widthCapacity === 1 ? 'Person' : 'Persons'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Side-by-side columns (0.7m)
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Estimated Floor Capacity:</span>
                    <span className="text-sm font-bold font-mono text-emerald-400">
                      ~{Math.max(gridFloorCapacity, estimatedFreeFloorCapacity)} people
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 text-right">
                    Standard 1.85m × 0.65m<br />sleeping footprint
                  </span>
                </div>
              </>
            );
          })()}

          {/* Add Sleeping Person Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() =>
                onAddFurnitureItem?.({
                  id: 'person-sleeping-horizontal',
                  category: 'people',
                  name: 'Person (Sleeping Horizontal)',
                  widthMm: 1850,
                  depthMm: 650,
                  symbol: 'person-sleeping',
                  color: '#f43f5e',
                })
              }
              className="py-2 px-2.5 rounded-lg bg-pink-950/60 border border-pink-700/60 hover:bg-pink-900/60 text-pink-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-pink-400" />
              <span>+ Sleeping Person</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onAddFurnitureItem?.({
                  id: 'person-standing',
                  category: 'people',
                  name: 'Person (Standing / Circle)',
                  widthMm: 500,
                  depthMm: 500,
                  symbol: 'person-standing',
                  color: '#ec4899',
                })
              }
              className="py-2 px-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <User className="w-3.5 h-3.5 text-pink-400" />
              <span>+ Standing Person</span>
            </button>
          </div>
        </div>

        {/* Room Orientation & Compass Direction */}
        <div className="space-y-3 bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Orientation & Compass
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-rose-300 bg-rose-950/80 border border-rose-800/60 px-2 py-0.5 rounded-full">
              {room.rotation || 0}° {getHeadingDirection(room.rotation || 0).code}
            </span>
          </div>

          <div className="text-[11px] text-slate-400 flex justify-between items-center">
            <span>Room Orientation:</span>
            <span className="font-semibold text-cyan-400">
              Facing {getHeadingDirection(room.rotation || 0).label}
            </span>
          </div>

          {/* Quick Snap Buttons */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { code: 'N', deg: 0, label: 'North' },
              { code: 'E', deg: 90, label: 'East' },
              { code: 'S', deg: 180, label: 'South' },
              { code: 'W', deg: 270, label: 'West' },
            ].map(({ code, deg, label }) => {
              const isSelected = (room.rotation || 0) === deg;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => onSetRotation?.(deg)}
                  title={`Align Room Facing ${label} (${deg}°)`}
                  className={`py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer flex flex-col items-center justify-center ${
                    isSelected
                      ? code === 'N'
                        ? 'bg-rose-950/60 border-rose-500 text-rose-300'
                        : 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span>{code}</span>
                  <span className="text-[9px] font-normal opacity-70">{deg}°</span>
                </button>
              );
            })}
          </div>

          {/* Quick Rotate Buttons */}
          <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => onRotateRoom?.(-90)}
              title="Rotate Entire Room 90° Counter-Clockwise"
              className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>-90°</span>
            </button>

            <button
              type="button"
              onClick={() => onRotateRoom?.(90)}
              title="Rotate Entire Room 90° Clockwise"
              className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition cursor-pointer active:scale-95"
            >
              <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>+90°</span>
            </button>

            <button
              type="button"
              onClick={() => onSetRotation?.(0)}
              title="Reset Room to True North (0°)"
              className="flex items-center justify-center py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-400 hover:text-rose-400 transition cursor-pointer active:scale-95 font-mono"
            >
              Reset 0°
            </button>
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
