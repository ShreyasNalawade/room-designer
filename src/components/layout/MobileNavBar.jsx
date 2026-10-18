import { Armchair, Shapes, SlidersHorizontal, Maximize2 } from 'lucide-react';

export default function MobileNavBar({
  activeDrawer,
  onToggleDrawer,
  onFitToView,
  placedItemsCount = 0,
  hasSelection = false,
}) {
  return (
    <nav className="lg:hidden h-14 bg-slate-900 border-t border-slate-800 px-2 flex items-center justify-around z-30 select-none shrink-0 shadow-lg">
      {/* 1. Add Furniture Tab */}
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
          <Armchair className="w-5 h-5" />
          {placedItemsCount > 0 && (
            <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-cyan-500 text-slate-950 text-[9px] font-bold flex items-center justify-center">
              {placedItemsCount}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-0.5">Furniture</span>
      </button>

      {/* 2. Room Shape & Dimensions Tab */}
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
        <Shapes className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Room</span>
      </button>

      {/* 3. Component & Room Inspector Tab */}
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
          <SlidersHorizontal className="w-5 h-5" />
          {hasSelection && (
            <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          )}
        </div>
        <span className="text-[10px] mt-0.5">Inspector</span>
      </button>

      {/* 4. Fit to Screen Button */}
      <button
        type="button"
        id="mobile-nav-fit"
        data-testid="mobile-nav-fit"
        onClick={onFitToView}
        className="flex flex-col items-center justify-center flex-1 py-1 rounded-xl text-slate-400 hover:text-emerald-400 active:scale-95 transition touch-manipulation cursor-pointer"
        title="Fit Room to Screen"
      >
        <Maximize2 className="w-5 h-5 text-emerald-400" />
        <span className="text-[10px] mt-0.5 text-slate-300">Fit View</span>
      </button>
    </nav>
  );
}
