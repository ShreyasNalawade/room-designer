import { Home, ShieldCheck, Ruler, Sparkles } from 'lucide-react';
import { UNITS } from '../../constants/units';
import { ROOM_PRESETS } from '../../constants/presets';

export default function HeaderToolbar({
  room,
  unit,
  onUnitChange,
  onPresetSelect,
}) {
  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-950/50">
          <Home className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-tight text-white">RoomCraft</span>
            <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
              Phase 1 Core
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            2D Architectural Floor Plan & Room Designer
          </p>
        </div>
      </div>

      {/* Center Controls: Room Preset Selector */}
      <div className="hidden md:flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-lg p-1">
        <span className="text-xs text-slate-400 font-medium px-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Starter Presets:
        </span>
        <select
          value={room.presetId || ''}
          onChange={(e) => {
            const found = ROOM_PRESETS.find((p) => p.id === e.target.value);
            if (found) onPresetSelect(found);
          }}
          className="bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-slate-200 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
        >
          <option value="" disabled>
            Choose a preset template...
          </option>
          {ROOM_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.description.split('-')[0].trim()})
            </option>
          ))}
        </select>
      </div>

      {/* Right Controls: Unit Selector & Status */}
      <div className="flex items-center gap-3">
        {/* Unit Selector */}
        <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-lg p-1">
          <div className="px-2 text-slate-400 flex items-center gap-1">
            <Ruler className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Unit:</span>
          </div>
          <div className="flex gap-0.5">
            {Object.values(UNITS).map((u) => {
              const active = unit === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => onUnitChange(u.id)}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition ${
                    active
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title={u.name}
                >
                  {u.symbol}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scaled Geometry Badge */}
        <div className="hidden sm:flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 px-2.5 py-1 rounded-lg text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Accurate Scale</span>
        </div>
      </div>
    </header>
  );
}
