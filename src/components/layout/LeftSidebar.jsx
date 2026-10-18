import { useState } from 'react';
import {
  Square,
  RectangleHorizontal,
  Shapes,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Lock,
  Unlock,
  Plus,
  Minus,
  Sparkles,
} from 'lucide-react';
import { UNITS } from '../../constants/units';
import { fromMm, toMm } from '../../utils/units';
import { ROOM_PRESETS } from '../../constants/presets';

function DimensionControl({
  label,
  valueMm,
  unit,
  currentUnit,
  onChange,
  onAdjust,
}) {
  const displayVal = fromMm(valueMm, unit);
  const [localVal, setLocalVal] = useState(displayVal.toString());
  const [isFocused, setIsFocused] = useState(false);

  const valueToDisplay = isFocused ? localVal : displayVal.toString();

  const handleInputChange = (e) => {
    const nextStr = e.target.value;
    setLocalVal(nextStr);
    const num = parseFloat(nextStr);
    if (!isNaN(num) && num > 0) {
      onChange(toMm(num, unit));
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const num = parseFloat(localVal);
    if (isNaN(num) || num <= 0) {
      setLocalVal(displayVal.toString());
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-mono text-cyan-400 text-[11px]">{currentUnit.symbol}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onAdjust(-1)}
          className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition active:scale-95 cursor-pointer"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <div className="relative flex-1">
          <input
            type="number"
            step={currentUnit.step}
            min={currentUnit.min}
            max={currentUnit.max}
            value={valueToDisplay}
            onFocus={() => {
              setIsFocused(true);
              setLocalVal(displayVal.toString());
            }}
            onBlur={handleBlur}
            onChange={handleInputChange}
            className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-slate-100 font-mono text-sm rounded-lg px-3 py-1.5 outline-none text-center"
          />
        </div>
        <button
          type="button"
          onClick={() => onAdjust(1)}
          className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function LeftSidebar({
  room,
  unit,
  validation,
  onChangeRoom,
  onPresetSelect,
}) {
  const currentUnit = UNITS[unit] || UNITS.m;
  const isSquareLocked = room.shape === 'square';

  const handleWidthChange = (newWidthMm) => {
    if (isSquareLocked) {
      onChangeRoom({
        ...room,
        widthMm: newWidthMm,
        lengthMm: newWidthMm,
      });
    } else {
      onChangeRoom({
        ...room,
        widthMm: newWidthMm,
      });
    }
  };

  const handleLengthChange = (newLengthMm) => {
    if (isSquareLocked) {
      onChangeRoom({
        ...room,
        widthMm: newLengthMm,
        lengthMm: newLengthMm,
      });
    } else {
      onChangeRoom({
        ...room,
        lengthMm: newLengthMm,
      });
    }
  };

  const adjustDimension = (type, direction) => {
    const delta = direction * currentUnit.step;
    const currentVal = fromMm(type === 'width' ? room.widthMm : room.lengthMm, unit);
    const newVal = Math.max(currentVal + delta, currentUnit.min);
    const newMm = toMm(newVal, unit);
    if (type === 'width') {
      handleWidthChange(newMm);
    } else {
      handleLengthChange(newMm);
    }
  };

  const toggleShape = (shape) => {
    if (shape === 'square') {
      const sizeMm = Math.max(room.widthMm, room.lengthMm);
      onChangeRoom({
        ...room,
        shape: 'square',
        widthMm: sizeMm,
        lengthMm: sizeMm,
      });
    } else {
      onChangeRoom({
        ...room,
        shape: 'rectangle',
      });
    }
  };

  return (
    <aside className="w-80 bg-slate-900/95 border-r border-slate-800 flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto select-none">
      <div className="p-4 space-y-6">
        {/* Section 1: Room Geometry & Shape */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Shapes className="w-3.5 h-3.5 text-cyan-400" />
              Room Shape
            </label>
            <span className="text-[11px] text-slate-500 font-mono">Phase 1</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => toggleShape('rectangle')}
              className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition cursor-pointer ${
                room.shape === 'rectangle'
                  ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300 shadow-sm'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <RectangleHorizontal className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <div className="text-xs font-medium">Rectangle</div>
                <div className="text-[10px] text-slate-500">Custom W × L</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => toggleShape('square')}
              className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition cursor-pointer ${
                room.shape === 'square'
                  ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300 shadow-sm'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Square className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <div className="text-xs font-medium">Square</div>
                <div className="text-[10px] text-slate-500">Equal 1:1 ratio</div>
              </div>
            </button>
          </div>

          {/* Coming Soon shapes */}
          <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center justify-between font-medium text-slate-400">
              <span>L-Shaped & Custom Polygons</span>
              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                Phase 4
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Multi-wall geometries and trapezoids will unlock in Phase 4 once Phase 1 scaled geometry is validated.
            </p>
          </div>
        </div>

        {/* Section 2: Room Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Room Label / Name
          </label>
          <input
            type="text"
            value={room.name}
            onChange={(e) => onChangeRoom({ ...room, name: e.target.value })}
            placeholder="e.g. Master Bedroom"
            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none transition"
          />
        </div>

        {/* Section 3: Dimension Inputs */}
        <div className="space-y-4 bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Wall Dimensions
            </span>
            <button
              type="button"
              onClick={() => toggleShape(isSquareLocked ? 'rectangle' : 'square')}
              className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded transition cursor-pointer ${
                isSquareLocked
                  ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/50'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Lock width and length aspect ratio"
            >
              {isSquareLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              <span>{isSquareLocked ? 'Locked 1:1' : 'Unlocked'}</span>
            </button>
          </div>

          <DimensionControl
            label="Room Width (North/South)"
            valueMm={room.widthMm}
            unit={unit}
            currentUnit={currentUnit}
            onChange={handleWidthChange}
            onAdjust={(dir) => adjustDimension('width', dir)}
          />

          <DimensionControl
            label="Room Length (East/West)"
            valueMm={room.lengthMm}
            unit={unit}
            currentUnit={currentUnit}
            onChange={handleLengthChange}
            onAdjust={(dir) => adjustDimension('length', dir)}
          />
        </div>

        {/* Section 4: Validation Alerts Banner */}
        {validation.errors.length > 0 && (
          <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800/80 text-rose-300 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Blocking Geometry Error</span>
            </div>
            {validation.errors.map((err, i) => (
              <p key={i} className="text-[11px] text-rose-300/90 leading-tight">
                {err}
              </p>
            ))}
          </div>
        )}

        {validation.warnings.length > 0 && (
          <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Architectural Advice</span>
            </div>
            {validation.warnings.map((warn, i) => (
              <p key={i} className="text-[11px] text-amber-300/90 leading-tight">
                {warn}
              </p>
            ))}
          </div>
        )}

        {validation.isValid && validation.warnings.length === 0 && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-400 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Geometry valid & proportionally scaled</span>
          </div>
        )}

        {/* Section 5: Quick Starter Presets */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Quick Presets
          </label>
          <div className="grid grid-cols-1 gap-1.5">
            {ROOM_PRESETS.slice(0, 4).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onPresetSelect(p)}
                className={`text-left p-2 rounded-lg border transition text-xs flex items-center justify-between cursor-pointer ${
                  room.presetId === p.id
                    ? 'bg-slate-800 border-cyan-500/50 text-cyan-300'
                    : 'bg-slate-950/50 border-slate-800/70 hover:bg-slate-800/50 text-slate-300'
                }`}
              >
                <span className="font-medium">{p.name}</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {p.description.split('-')[0].trim()}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
