import { useState, useRef } from 'react';
import {
  FolderKanban,
  Plus,
  Clock,
  Sparkles,
  Upload,
  ArrowLeft,
  X,
  Trash2,
  Copy,
  Download,
  Check,
  Search,
  Maximize2,
  Calendar,
  Edit2,
  ChevronRight,
} from 'lucide-react';
import { ROOM_PRESETS } from '../../constants/presets';
import { UNITS } from '../../constants/units';
import { formatMeasurement, calculateRoomMetrics } from '../../utils/units';
import { exportProjectFile } from '../../utils/projectStorage';

export default function ProjectHubModal({
  isOpen,
  onClose,
  projects = [],
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onImportProject,
  onDuplicateProject,
  onDeleteProject,
  onRenameProject,
  initialView = 'welcome', // 'welcome' | 'new' | 'history'
}) {
  const [view, setView] = useState(initialView);
  const [projectName, setProjectName] = useState(() => `Room Design ${projects.length + 1}`);
  const [selectedPresetId, setSelectedPresetId] = useState('living-room');
  const [selectedUnit, setSelectedUnit] = useState('m');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Reset name suggestion when opening 'new' view
  const handleOpenNew = () => {
    setProjectName(`Room Design ${projects.length + 1}`);
    setView('new');
  };

  const handleStartFresh = (e) => {
    e.preventDefault();
    const finalName = projectName.trim() || `Room Design ${projects.length + 1}`;
    const preset = ROOM_PRESETS.find((p) => p.id === selectedPresetId);

    onCreateProject({
      name: finalName,
      presetId: preset?.id || 'living-room',
      shape: preset?.type || 'rectangle',
      widthMm: preset?.widthMm || 6000,
      lengthMm: preset?.lengthMm || 4500,
      topWidthMm: preset?.topWidthMm || 4000,
      bottomWidthMm: preset?.bottomWidthMm || 6000,
      unit: selectedUnit,
    });
    onClose();
  };

  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportProject(file, projectName.trim() || undefined);
      e.target.value = '';
      onClose();
    }
  };

  const handleStartRename = (project, e) => {
    e.stopPropagation();
    setEditingId(project.id);
    setEditingName(project.name);
  };

  const handleSaveRename = (projectId, e) => {
    e.stopPropagation();
    if (editingName.trim()) {
      onRenameProject(projectId, editingName.trim());
    }
    setEditingId(null);
  };

  // Filter projects for history view
  const filteredProjects = projects.filter((p) =>
    (p.name || '').toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Hidden File Input for Import Option */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileImport}
          className="hidden"
        />

        {/* Modal Top Bar */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            {view !== 'welcome' && (
              <button
                type="button"
                onClick={() => setView('welcome')}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition mr-1"
                title="Back to Main Options"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center shadow-md">
              <FolderKanban className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {view === 'welcome' && 'RoomCraft Projects Hub'}
                {view === 'new' && 'Create New Room Project'}
                {view === 'history' && 'Saved Projects & History'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {view === 'welcome' && 'Choose to create a new layout or manage saved designs'}
                {view === 'new' && 'Set project name and start fresh or import a floor plan'}
                {view === 'history' && `${projects.length} project(s) stored in browser storage`}
              </p>
            </div>
          </div>

          {/* Close button if user already has an active project */}
          {activeProjectId && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              title="Close and continue editing"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Body: 3 Views (Welcome, New Project, History) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 select-none">
          {/* ======================================================== */}
          {/* VIEW 1: WELCOME SCREEN (2 MAIN OPTIONS)                   */}
          {/* ======================================================== */}
          {view === 'welcome' && (
            <div className="space-y-6 py-2">
              <div className="text-center max-w-lg mx-auto space-y-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Multi-Project Workspace
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-100">
                  What would you like to design today?
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Create a new floor plan from scratch or continue working on your saved designs.
                </p>
              </div>

              {/* Two Big Main Option Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-2">
                {/* OPTION 1: CREATE NEW PROJECT */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={handleOpenNew}
                  onKeyDown={(e) => e.key === 'Enter' && handleOpenNew()}
                  className="group relative bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700 hover:border-cyan-500 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-cyan-950/30 cursor-pointer text-left active:scale-[0.98]"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors duration-200">
                      <Plus className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                        Create New Project
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Name your project, pick room dimensions, and start fresh or import an existing file.
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 flex items-center justify-between text-xs font-semibold text-cyan-400 group-hover:text-cyan-300">
                    <span>Configure & Start</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* OPTION 2: PROJECT HISTORY */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setView('history')}
                  onKeyDown={(e) => e.key === 'Enter' && setView('history')}
                  className="group relative bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700 hover:border-emerald-500 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-emerald-950/30 cursor-pointer text-left active:scale-[0.98]"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors duration-200">
                        <Clock className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-slate-800 text-emerald-300 border border-emerald-900/60">
                        {projects.length} Saved
                      </span>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                        Project History
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        View, edit, duplicate, or export your saved room layouts and component placements.
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 flex items-center justify-between text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
                    <span>Browse Saved Layouts</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 2: CREATE NEW PROJECT FORM                           */}
          {/* ======================================================== */}
          {view === 'new' && (
            <form onSubmit={handleStartFresh} className="space-y-5">
              {/* Project Name Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Project Name
                </label>
                <input
                  type="text"
                  autoFocus
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Master Bedroom Suite, Luxury Living Room..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 text-slate-100 text-sm rounded-xl px-4 py-2.5 outline-none transition font-medium"
                />
              </div>

              {/* Template / Shape Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Select Room Template & Shape
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ROOM_PRESETS.slice(0, 6).map((preset) => {
                    const isSelected = selectedPresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setSelectedPresetId(preset.id)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-cyan-950/50 border-cyan-500 text-cyan-200 shadow-sm'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-xs font-bold truncate block">{preset.name}</span>
                        <span className="text-[11px] font-mono opacity-70 mt-1 block">
                          {preset.description.split('-')[0].trim()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Measurement Unit */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Default Measurement Unit
                </label>
                <div className="flex gap-2">
                  {Object.values(UNITS).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setSelectedUnit(u.id)}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                        selectedUnit === u.id
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {u.name} ({u.symbol})
                    </button>
                  ))}
                </div>
              </div>

              {/* Two Action Buttons: Start Fresh OR Import File */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* BUTTON 1: START FRESH */}
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold text-sm shadow-lg shadow-cyan-950/50 transition active:scale-[0.98] cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Start Fresh Project</span>
                  </button>

                  {/* BUTTON 2: IMPORT FILE */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-bold text-sm transition active:scale-[0.98] cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span>Import JSON File</span>
                  </button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setView('welcome')}
                    className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
                  >
                    Cancel and go back
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* VIEW 3: PROJECT HISTORY & SAVED DESIGNS                   */}
          {/* ======================================================== */}
          {view === 'history' && (
            <div className="space-y-4">
              {/* Search & New Project Button */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search saved projects by name..."
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl pl-9 pr-4 py-2 outline-none focus:border-cyan-500 transition"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleOpenNew}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-sm cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Project</span>
                </button>
              </div>

              {/* Projects List */}
              {filteredProjects.length === 0 ? (
                <div className="text-center py-12 space-y-3 bg-slate-950/40 border border-slate-800/80 rounded-2xl">
                  <FolderKanban className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm font-medium text-slate-400">
                    {searchQuery ? 'No matching projects found' : 'No saved projects yet'}
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenNew}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                  >
                    Create a new project now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto pr-1">
                  {filteredProjects.map((project) => {
                    const isActive = project.id === activeProjectId;
                    const metrics = calculateRoomMetrics(project.room, project.unit || 'm');
                    const itemsCount = project.items?.length || 0;

                    return (
                      <div
                        key={project.id}
                        className={`rounded-2xl border p-4 flex flex-col justify-between transition-all duration-150 ${
                          isActive
                            ? 'bg-slate-950/90 border-cyan-500/80 shadow-md shadow-cyan-950/20'
                            : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-950/70'
                        }`}
                      >
                        <div className="space-y-2.5">
                          {/* Title & Status */}
                          <div className="flex items-start justify-between gap-2">
                            {editingId === project.id ? (
                              <div
                                className="flex items-center gap-1.5 flex-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="text"
                                  autoFocus
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveRename(project.id, e);
                                    if (e.key === 'Escape') setEditingId(null);
                                  }}
                                  className="bg-slate-900 border border-cyan-500 text-white text-xs rounded px-2 py-1 flex-1 outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => handleSaveRename(project.id, e)}
                                  className="p-1 rounded bg-cyan-600 text-white"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-white truncate">
                                  {project.name}
                                </h4>
                                <button
                                  type="button"
                                  onClick={(e) => handleStartRename(project, e)}
                                  className="text-slate-500 hover:text-slate-300 p-0.5"
                                  title="Rename Project"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                            {isActive && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/80 shrink-0">
                                Active
                              </span>
                            )}
                          </div>

                          {/* Room Geometry Specs */}
                          <div className="text-[11px] text-slate-400 font-mono space-y-1 bg-slate-900/60 rounded-xl p-2.5 border border-slate-800/60">
                            <div className="flex justify-between">
                              <span>Shape:</span>
                              <span className="text-slate-200 capitalize font-medium">
                                {project.room?.shape || 'Rectangle'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Dimensions:</span>
                              <span className="text-cyan-400 font-medium">
                                {formatMeasurement(project.room?.widthMm || 6000, project.unit || 'm')} ×{' '}
                                {formatMeasurement(project.room?.lengthMm || 4500, project.unit || 'm')}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Area / Objects:</span>
                              <span className="text-emerald-400 font-medium">
                                {metrics.sqMeters} m² • {itemsCount} items
                              </span>
                            </div>
                          </div>

                          {/* Last modified date */}
                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              Updated {new Date(project.updatedAt || project.createdAt).toLocaleDateString()} at{' '}
                              {new Date(project.updatedAt || project.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Card Action Buttons */}
                        <div className="pt-3.5 mt-2 border-t border-slate-800/80 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectProject(project.id);
                              onClose();
                            }}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>{isActive ? 'Continue Editing' : 'Open & Edit'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onDuplicateProject(project.id)}
                            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                            title="Duplicate Project"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => exportProjectFile(project)}
                            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                            title="Export Project JSON"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {projects.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Delete project "${project.name}"?`)) {
                                  onDeleteProject(project.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-rose-950/30 border border-rose-900/40 hover:bg-rose-900/50 text-rose-400 transition cursor-pointer"
                              title="Delete Project"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
