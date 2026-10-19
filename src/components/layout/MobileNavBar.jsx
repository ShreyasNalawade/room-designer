import { Armchair, Shapes, SlidersHorizontal, Maximize2, FolderKanban } from 'lucide-react';

export default function MobileNavBar({
  activeDrawer,
  onToggleDrawer,
  onOpenProjectHub,
  onFitToView,
  placedItemsCount = 0,
  hasSelection = false,
  projectsCount = 1,
}) {
  return (
    <nav className="lg:hidden h-14 bg-slate-900 border-t border-slate-800 px-1.5 flex items-center justify-around z-40 select-none shrink-0 shadow-lg pb-[env(safe-area-inset-bottom)]">
      {/* 1. Projects Hub Tab */}
      <button
        type="button"
        id="mobile-nav-projects"
        data-testid="mobile-nav-projects"
        onClick={() => onOpenProjectHub?.('history')}
        className="flex flex-col items-center justify-center flex-1 py-1 rounded-xl text-slate-400 hover:text-cyan-300 transition touch-manipulation cursor-pointer"
        title="View Projects & History"
      >
        <div className="relative">
          <FolderKanban className="w-4 h-4 text-cyan-400" />
          {projectsCount > 0 && (
            <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-slate-800 border border-cyan-500 text-cyan-300 text-[8px] font-bold flex items-center justify-center">
              {projectsCount}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-0.5">Projects</span>
      </button>

      {/* 2. Add Furniture Tab */}
      <button
        type="button"
        id="mobile-nav-furniture"
        data-testid="mobile-nav-furniture"
        onClick={() => onToggleDrawer(activeDrawer === 'furniture' ? null : 'furniture')}
        className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition touch-manipulation cursor-pointer ${
          activeDrawer === 'furniture'
            ? 'text-cyan-400 bg-cyan-950/60 font-semibold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <Armchair className="w-4 h-4" />
          {placedItemsCount > 0 && (
            <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-cyan-500 text-slate-950 text-[8px] font-bold flex items-center justify-center">
              {placedItemsCount}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-0.5">Furniture</span>
      </button>

      {/* 3. Room Shape & Dimensions Tab */}
      <button
        type="button"
        id="mobile-nav-room"
        data-testid="mobile-nav-room"
        onClick={() => onToggleDrawer(activeDrawer === 'room' ? null : 'room')}
        className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition touch-manipulation cursor-pointer ${
          activeDrawer === 'room'
            ? 'text-cyan-400 bg-cyan-950/60 font-semibold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Shapes className="w-4 h-4" />
        <span className="text-[10px] mt-0.5">Room</span>
      </button>

      {/* 4. Component & Room Inspector Tab */}
      <button
        type="button"
        id="mobile-nav-inspector"
        data-testid="mobile-nav-inspector"
        onClick={() => onToggleDrawer(activeDrawer === 'inspector' ? null : 'inspector')}
        className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition relative touch-manipulation cursor-pointer ${
          activeDrawer === 'inspector'
            ? 'text-cyan-400 bg-cyan-950/60 font-semibold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <SlidersHorizontal className="w-4 h-4" />
          {hasSelection && (
            <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          )}
        </div>
        <span className="text-[10px] mt-0.5">Inspector</span>
      </button>

      {/* 5. Fit to Screen Button */}
      <button
        type="button"
        id="mobile-nav-fit"
        data-testid="mobile-nav-fit"
        onClick={onFitToView}
        className="flex flex-col items-center justify-center flex-1 py-1 rounded-xl text-slate-400 hover:text-emerald-400 active:scale-95 transition touch-manipulation cursor-pointer"
        title="Fit Room to Screen"
      >
        <Maximize2 className="w-4 h-4 text-emerald-400" />
        <span className="text-[10px] mt-0.5 text-slate-300">Fit</span>
      </button>
    </nav>
  );
}
