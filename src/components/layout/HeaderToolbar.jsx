import { useState, useRef } from 'react';
import {
  Home,
  ShieldCheck,
  Ruler,
  Sparkles,
  Save,
  Check,
  RotateCcw,
  Download,
  Upload,
  FolderKanban,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { UNITS } from '../../constants/units';
import { ROOM_PRESETS } from '../../constants/presets';

export default function HeaderToolbar({
  currentProject,
  projectsCount = 1,
  onOpenProjectHub,
  room,
  unit,
  onUnitChange,
  onPresetSelect,
  onSaveDesign,
  onResetDesign,
  onExportDesign,
  onImportDesign,
  lastSavedAt,
}) {
  const [saveAnimation, setSaveAnimation] = useState(false);
  const [exportAnimation, setExportAnimation] = useState(false);
  const fileInputRef = useRef(null);

  const handleSaveClick = () => {
    onSaveDesign();
    setSaveAnimation(true);
    setTimeout(() => setSaveAnimation(false), 2000);
  };

  const handleExportClick = () => {
    onExportDesign();
    setExportAnimation(true);
    setTimeout(() => setExportAnimation(false), 2000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportDesign(file);
      e.target.value = ''; // Reset input so same file can be re-imported if needed
    }
  };

  const projectName = currentProject?.name || room?.name || 'Project';

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-2 sm:px-4 flex items-center justify-between z-30 select-none shrink-0">
      {/* Brand & Projects Navigation */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-950/50">
          <Home className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>

        {/* Project Selector & History Hub Trigger Button */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={() => onOpenProjectHub?.('history')}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-950/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-semibold shadow-sm transition cursor-pointer max-w-[130px] sm:max-w-[190px]"
            title="Open Projects Hub & History"
          >
            <FolderKanban className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate text-[11px] sm:text-xs">{projectName}</span>
            {projectsCount > 1 && (
              <span className="hidden sm:inline-block text-[10px] font-mono px-1 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                {projectsCount}
              </span>
            )}
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 ml-0.5" />
          </button>

          {/* Quick New Project Button */}
          <button
            type="button"
            onClick={() => onOpenProjectHub?.('new')}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold transition cursor-pointer"
            title="Create New Project"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New</span>
          </button>
        </div>
      </div>

      {/* Center Controls: Room Preset Selector (Desktop) */}
      <div className="hidden lg:flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-lg p-1">
        <span className="text-xs text-slate-400 font-medium px-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Templates:
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

      {/* Right Controls: Export, Import, Save, Unit Selector */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Hidden File Input for Import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Import JSON Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 sm:gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-800 bg-slate-950/70 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer"
          title="Import design JSON file"
        >
          <Upload className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">Import</span>
        </button>

        {/* Export JSON Button */}
        <button
          type="button"
          onClick={handleExportClick}
          className={`flex items-center gap-1 sm:gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
            exportAnimation
              ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
              : 'border-slate-800 bg-slate-950/70 hover:bg-slate-800 text-slate-300 hover:text-white'
          }`}
          title="Export design JSON file"
        >
          {exportAnimation ? (
            <Check className="w-3.5 h-3.5 text-cyan-400" />
          ) : (
            <Download className="w-3.5 h-3.5 text-cyan-400" />
          )}
          <span className="hidden md:inline">{exportAnimation ? 'Exported!' : 'Export'}</span>
        </button>

        {/* Save to Local Browser Storage Button */}
        <button
          type="button"
          onClick={handleSaveClick}
          className={`flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-3 rounded-lg text-xs font-semibold transition cursor-pointer shadow-sm active:scale-95 ${
            saveAnimation
              ? 'bg-emerald-600 text-white border border-emerald-500'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-500'
          }`}
          title={
            lastSavedAt
              ? `Saved to browser at ${new Date(lastSavedAt).toLocaleTimeString()}`
              : 'Save edits to browser storage'
          }
        >
          {saveAnimation ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{saveAnimation ? 'Saved!' : 'Save'}</span>
        </button>

        {/* Reset / New Room Button */}
        <button
          type="button"
          onClick={onResetDesign}
          className="flex items-center gap-1 p-1.5 sm:px-2 sm:py-1.5 rounded-lg border border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium transition cursor-pointer"
          title="Reset to fresh empty room"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden lg:inline">Reset</span>
        </button>

        {/* Unit Selector */}
        <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-lg p-0.5 sm:p-1">
          <div className="hidden sm:flex px-1.5 text-slate-400 items-center gap-1">
            <Ruler className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">Unit:</span>
          </div>
          <div className="flex gap-0.5">
            {Object.values(UNITS).map((u) => {
              const active = unit === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => onUnitChange(u.id)}
                  className={`text-[11px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md font-medium transition cursor-pointer ${
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
        <div className="hidden xl:flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 px-2.5 py-1 rounded-lg text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Accurate Scale</span>
        </div>
      </div>
    </header>
  );
}
