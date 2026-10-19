import { useState, useMemo } from 'react';
import { Search, Plus, X, BrickWall, Users, Bed, Sofa, Utensils, Briefcase, CookingPot, Bath, Archive, DoorOpen } from 'lucide-react';
import { CATEGORIES, FURNITURE_CATALOG } from '../../constants/catalog';
import { formatMeasurement } from '../../utils/units';

const CATEGORY_ICONS = {
  walls: BrickWall,
  people: Users,
  bedroom: Bed,
  living: Sofa,
  dining: Utensils,
  office: Briefcase,
  kitchen: CookingPot,
  bathroom: Bath,
  storage: Archive,
  openings: DoorOpen,
};

export default function FurnitureCatalog({ unit, onAddItem }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter catalog by category and search term
  const filteredCatalog = useMemo(() => {
    return FURNITURE_CATALOG.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="flex flex-col h-full space-y-3 p-4 select-none">
      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search people, beds, sofas, desks, sleeping..."
          className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-200 text-xs rounded-lg pl-8 pr-7 py-2 outline-none transition placeholder:text-slate-600"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth">
        {CATEGORIES.map((cat) => {
          const active = selectedCategory === cat.id;
          const Icon = CATEGORY_ICONS[cat.id];
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap transition cursor-pointer font-medium ${
                active
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                  : 'bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {Icon && <Icon className="w-3 h-3" />}
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Catalog Items Grid */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filteredCatalog.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs space-y-1">
            <p>No furniture items match "{searchQuery}"</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="text-cyan-400 hover:underline text-[11px]"
            >
              Reset filters
            </button>
          </div>
        ) : (
          filteredCatalog.map((item) => (
            <div
              key={item.id}
              className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition flex items-center justify-between group"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs font-semibold text-slate-200">{item.name}</span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 pl-4.5">
                  {formatMeasurement(item.widthMm, unit)} × {formatMeasurement(item.depthMm, unit)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onAddItem(item)}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-cyan-950/50 border border-cyan-800/60 text-cyan-300 hover:bg-cyan-600 hover:text-white hover:border-cyan-600 transition shadow-sm cursor-pointer active:scale-95 font-medium"
                title={`Add ${item.name} to room`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
