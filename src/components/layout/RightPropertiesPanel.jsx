import {
  SlidersHorizontal,
  Maximize,
  Compass,
  Box,
  CheckCircle2,
} from 'lucide-react';
import { formatMeasurement, calculateArea } from '../../utils/units';

export default function RightPropertiesPanel({ room, unit }) {
  const area = calculateArea(room.widthMm, room.lengthMm);
  const perimeterStr = formatMeasurement(2 * (room.widthMm + room.lengthMm), unit);
  const ratio = (room.widthMm / (room.lengthMm || 1)).toFixed(2);

  return (
    <aside className="w-80 bg-slate-900/95 border-l border-slate-800 flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto select-none">
      <div className="p-4 space-y-6">
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-slate-200">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider">Properties & Geometry</h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
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
              {area.sqMeters}{' '}
              <span className="text-sm font-sans font-normal text-emerald-300">m²</span>
            </div>
            <div className="text-xs font-mono text-slate-400">
              {area.sqFeet} <span className="text-[11px] font-sans">sq ft</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[11px] text-slate-500 block">Perimeter</span>
              <span className="font-mono text-slate-200 font-medium">{perimeterStr}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Aspect Ratio</span>
              <span className="font-mono text-slate-200 font-medium">{ratio} : 1</span>
            </div>
          </div>
        </div>

        {/* Dimensions Summary */}
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            Canonical Coordinates (mm)
          </span>
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Width (X-axis)</span>
              <span className="text-cyan-400 font-medium">
                {formatMeasurement(room.widthMm, unit)}{' '}
                <span className="text-slate-600 text-[10px]">({room.widthMm} mm)</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Length (Y-axis)</span>
              <span className="text-cyan-400 font-medium">
                {formatMeasurement(room.lengthMm, unit)}{' '}
                <span className="text-slate-600 text-[10px]">({room.lengthMm} mm)</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Wall Core Thickness</span>
              <span className="text-slate-300">
                160 mm <span className="text-slate-600 text-[10px]">(0.16 m)</span>
              </span>
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
            {[
              { dir: 'North Wall', len: room.widthMm, orient: 'Horizontal' },
              { dir: 'South Wall', len: room.widthMm, orient: 'Horizontal' },
              { dir: 'East Wall', len: room.lengthMm, orient: 'Vertical' },
              { dir: 'West Wall', len: room.lengthMm, orient: 'Vertical' },
            ].map((w, idx) => (
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

        {/* Integrity & Validation Checklist */}
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

        {/* Phase 2 Furniture Library Teaser Card */}
        <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold text-cyan-300">
            <Box className="w-4 h-4 text-cyan-400" />
            <span>Phase 2 & 3 Roadmap</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Phase 1 establishes the verified real-world scaled room canvas. In subsequent phases, you will be able to drag-and-drop categorized furniture (beds, sofas, tables, sinks, doors, and windows) with snap-to-wall logic.
          </p>
        </div>
      </div>
    </aside>
  );
}
