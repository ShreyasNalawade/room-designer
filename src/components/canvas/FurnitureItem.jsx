import { useRef, useEffect } from 'react';
import { Group, Rect, Line, Circle, Arc, Text, Transformer } from 'react-konva';

export default function FurnitureItem({
  item,
  pxPerMm,
  isSelected,
  isOverlapping,
  isOutside,
  onSelect,
  onChange,
}) {
  const shapeRef = useRef(null);
  const trRef = useRef(null);

  const w = (item.widthMm || 800) * pxPerMm;
  const d = (item.depthMm || item.heightMm || 600) * pxPerMm;
  const isLocked = !!item.locked;

  // Attach Konva Transformer when selected
  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current && !isLocked) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, isLocked]);

  // Handle drag end in world coordinates
  const handleDragEnd = (e) => {
    const newX_mm = Math.round(e.target.x() / pxPerMm);
    const newY_mm = Math.round(e.target.y() / pxPerMm);
    onChange({
      ...item,
      x: newX_mm,
      y: newY_mm,
    });
  };

  // Handle transform (resize and rotation)
  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset node scale and bake into widthMm and depthMm
    node.scaleX(1);
    node.scaleY(1);

    const newWidthMm = Math.max(Math.round((w * scaleX) / pxPerMm), 200);
    const newDepthMm = Math.max(Math.round((d * scaleY) / pxPerMm), 200);
    const newRotation = Math.round(node.rotation() % 360);
    const newX_mm = Math.round(node.x() / pxPerMm);
    const newY_mm = Math.round(node.y() / pxPerMm);

    onChange({
      ...item,
      x: newX_mm,
      y: newY_mm,
      widthMm: newWidthMm,
      depthMm: newDepthMm,
      rotation: newRotation < 0 ? newRotation + 360 : newRotation,
    });
  };

  // Border & status colors
  let strokeColor = '#475569'; // default slate-600
  let strokeWidth = 1.5;

  if (isOutside) {
    strokeColor = '#f43f5e'; // rose-500 error: outside room
    strokeWidth = 2.5;
  } else if (isOverlapping) {
    strokeColor = '#f59e0b'; // amber-500 warning: overlap
    strokeWidth = 2;
  } else if (isSelected) {
    strokeColor = '#38bdf8'; // cyan-400
    strokeWidth = 2;
  }

  // Render top-down architectural vector symbol
  const renderSymbol = () => {
    const symbol = item.symbol || 'generic';

    switch (symbol) {
      case 'bed': {
        const headH = Math.min(d * 0.18, 20);
        const pillowW = Math.min(w * 0.38, 50);
        const pillowH = Math.min(d * 0.22, 24);
        return (
          <>
            {/* Mattress Base */}
            <Rect
              width={w}
              height={d}
              fill="#1e1b4b" // indigo-950
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              cornerRadius={4}
            />
            {/* Headboard */}
            <Rect width={w} height={headH} fill="#312e81" cornerRadius={[4, 4, 0, 0]} />
            {/* Pillows */}
            {w > 120 * pxPerMm ? (
              // Double / King pillows
              <>
                <Rect
                  x={w * 0.08}
                  y={headH + 4}
                  width={pillowW}
                  height={pillowH}
                  fill="#4338ca"
                  stroke="#6366f1"
                  strokeWidth={1}
                  cornerRadius={3}
                />
                <Rect
                  x={w - w * 0.08 - pillowW}
                  y={headH + 4}
                  width={pillowW}
                  height={pillowH}
                  fill="#4338ca"
                  stroke="#6366f1"
                  strokeWidth={1}
                  cornerRadius={3}
                />
              </>
            ) : (
              // Single pillow
              <Rect
                x={(w - pillowW) / 2}
                y={headH + 4}
                width={pillowW}
                height={pillowH}
                fill="#4338ca"
                stroke="#6366f1"
                strokeWidth={1}
                cornerRadius={3}
              />
            )}
            {/* Duvet fold line */}
            <Line
              points={[0, d * 0.45, w, d * 0.45]}
              stroke="#6366f1"
              strokeWidth={1.5}
              dash={[4, 3]}
            />
          </>
        );
      }

      case 'sofa': {
        const armW = Math.min(w * 0.12, 18);
        const backD = Math.min(d * 0.22, 22);
        return (
          <>
            {/* Main sofa base */}
            <Rect
              width={w}
              height={d}
              fill="#083344" // cyan-950
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              cornerRadius={5}
            />
            {/* Backrest */}
            <Rect width={w} height={backD} fill="#0e7490" cornerRadius={[5, 5, 0, 0]} />
            {/* Left & Right Armrests */}
            <Rect width={armW} height={d} fill="#0e7490" cornerRadius={[5, 0, 0, 5]} />
            <Rect
              x={w - armW}
              width={armW}
              height={d}
              fill="#0e7490"
              cornerRadius={[0, 5, 5, 0]}
            />
            {/* Cushion divider lines */}
            <Line
              points={[w / 3, backD, w / 3, d]}
              stroke="#0891b2"
              strokeWidth={1}
              dash={[3, 3]}
            />
            <Line
              points={[(2 * w) / 3, backD, (2 * w) / 3, d]}
              stroke="#0891b2"
              strokeWidth={1}
              dash={[3, 3]}
            />
          </>
        );
      }

      case 'armchair': {
        const armW = Math.min(w * 0.16, 16);
        const backD = Math.min(d * 0.25, 20);
        return (
          <>
            <Rect
              width={w}
              height={d}
              fill="#083344"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              cornerRadius={4}
            />
            <Rect width={w} height={backD} fill="#0e7490" cornerRadius={[4, 4, 0, 0]} />
            <Rect width={armW} height={d} fill="#0e7490" cornerRadius={[4, 0, 0, 4]} />
            <Rect
              x={w - armW}
              width={armW}
              height={d}
              fill="#0e7490"
              cornerRadius={[0, 4, 4, 0]}
            />
          </>
        );
      }

      case 'table':
      case 'coffee-table':
      case 'desk': {
        return (
          <>
            <Rect
              width={w}
              height={d}
              fill="#1e293b" // slate-800
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              cornerRadius={3}
            />
            {/* Surface inner bevel */}
            <Rect
              x={3}
              y={3}
              width={Math.max(w - 6, 2)}
              height={Math.max(d - 6, 2)}
              stroke="rgba(148, 163, 184, 0.2)"
              strokeWidth={1}
            />
            {symbol === 'desk' && (
              <Rect
                x={(w - Math.min(w * 0.5, 60)) / 2}
                y={d - 12}
                width={Math.min(w * 0.5, 60)}
                height={8}
                fill="#334155"
                cornerRadius={2}
              />
            )}
          </>
        );
      }

      case 'chair': {
        return (
          <>
            <Rect
              width={w}
              height={d}
              fill="#334155"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              cornerRadius={w * 0.2}
            />
            <Line
              points={[w * 0.15, d * 0.25, w * 0.85, d * 0.25]}
              stroke="#94a3b8"
              strokeWidth={2}
            />
          </>
        );
      }

      case 'wardrobe':
      case 'cabinet':
      case 'shelves': {
        return (
          <>
            <Rect
              width={w}
              height={d}
              fill="#1e293b"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Architectural diagonal X for storage */}
            <Line points={[0, 0, w, d]} stroke="rgba(148, 163, 184, 0.25)" strokeWidth={1} />
            <Line points={[w, 0, 0, d]} stroke="rgba(148, 163, 184, 0.25)" strokeWidth={1} />
          </>
        );
      }

      case 'stove': {
        const burnerR = Math.min(w, d) * 0.16;
        return (
          <>
            <Rect
              width={w}
              height={d}
              fill="#18181b"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              cornerRadius={2}
            />
            {/* 4 Cooktop Burners */}
            <Circle x={w * 0.3} y={d * 0.3} radius={burnerR} stroke="#ef4444" strokeWidth={1.5} />
            <Circle x={w * 0.7} y={d * 0.3} radius={burnerR * 0.8} stroke="#ef4444" strokeWidth={1.5} />
            <Circle x={w * 0.3} y={d * 0.7} radius={burnerR * 0.8} stroke="#ef4444" strokeWidth={1.5} />
            <Circle x={w * 0.7} y={d * 0.7} radius={burnerR} stroke="#ef4444" strokeWidth={1.5} />
          </>
        );
      }

      case 'sink': {
        const margin = Math.min(w * 0.12, 10);
        return (
          <>
            <Rect
              width={w}
              height={d}
              fill="#1e293b"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              cornerRadius={2}
            />
            {/* Basins */}
            {w > 65 * pxPerMm ? (
              <>
                <Rect
                  x={margin}
                  y={margin}
                  width={(w - margin * 3) / 2}
                  height={d - margin * 2}
                  fill="#0f172a"
                  stroke="#38bdf8"
                  strokeWidth={1}
                  cornerRadius={4}
                />
                <Rect
                  x={margin * 2 + (w - margin * 3) / 2}
                  y={margin}
                  width={(w - margin * 3) / 2}
                  height={d - margin * 2}
                  fill="#0f172a"
                  stroke="#38bdf8"
                  strokeWidth={1}
                  cornerRadius={4}
                />
              </>
            ) : (
              <Rect
                x={margin}
                y={margin}
                width={w - margin * 2}
                height={d - margin * 2}
                fill="#0f172a"
                stroke="#38bdf8"
                strokeWidth={1}
                cornerRadius={4}
              />
            )}
            {/* Chrome Faucet */}
            <Circle x={w / 2} y={margin / 2} radius={3} fill="#cbd5e1" />
          </>
        );
      }

      case 'toilet': {
        const tankD = d * 0.28;
        return (
          <>
            {/* Tank */}
            <Rect
              width={w}
              height={tankD}
              fill="#334155"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              cornerRadius={2}
            />
            {/* Porcelain Bowl */}
            <Rect
              x={w * 0.12}
              y={tankD}
              width={w * 0.76}
              height={d - tankD}
              fill="#1e293b"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              cornerRadius={[0, 0, w * 0.38, w * 0.38]}
            />
            {/* Inner Basin */}
            <Circle
              x={w / 2}
              y={tankD + (d - tankD) * 0.55}
              radius={Math.min(w * 0.25, (d - tankD) * 0.35)}
              stroke="#06b6d4"
              strokeWidth={1}
            />
          </>
        );
      }

      case 'bathtub': {
        return (
          <>
            <Rect
              width={w}
              height={d}
              fill="#1e293b"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              cornerRadius={4}
            />
            <Rect
              x={6}
              y={6}
              width={Math.max(w - 12, 4)}
              height={Math.max(d - 12, 4)}
              fill="#0f172a"
              stroke="#0284c7"
              strokeWidth={1.5}
              cornerRadius={Math.min(w, d) * 0.35}
            />
            <Circle x={16} y={d / 2} radius={3.5} fill="#0284c7" />
          </>
        );
      }

      case 'shower': {
        return (
          <>
            <Rect
              width={w}
              height={d}
              fill="#082f49"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              cornerRadius={2}
            />
            <Circle x={w / 2} y={d / 2} radius={5} stroke="#38bdf8" strokeWidth={1} />
            <Line points={[0, 0, w, d]} stroke="rgba(56, 189, 248, 0.2)" strokeWidth={1} />
          </>
        );
      }

      case 'door': {
        return (
          <>
            {/* Wall Jamb */}
            <Rect width={w} height={8} fill="#f97316" cornerRadius={1} />
            {/* Open Door Leaf Panel */}
            <Line points={[0, 0, 0, w]} stroke="#ea580c" strokeWidth={3} />
            {/* 90-degree Clearance Swing Arc */}
            <Arc
              x={0}
              y={0}
              innerRadius={0}
              outerRadius={w}
              angle={90}
              rotation={0}
              stroke="#ea580c"
              strokeWidth={1}
              dash={[4, 4]}
            />
          </>
        );
      }

      case 'window': {
        return (
          <>
            <Rect
              width={w}
              height={d}
              fill="#0284c7"
              stroke="#38bdf8"
              strokeWidth={1.5}
              cornerRadius={1}
            />
            <Line points={[0, d / 2, w, d / 2]} stroke="#e0f2fe" strokeWidth={1.5} />
            <Line points={[w / 2, 0, w / 2, d]} stroke="#e0f2fe" strokeWidth={1.5} />
          </>
        );
      }

      default: {
        return (
          <Rect
            width={w}
            height={d}
            fill="#1e293b"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            cornerRadius={2}
          />
        );
      }
    }
  };

  return (
    <>
      <Group
        ref={shapeRef}
        x={item.x * pxPerMm}
        y={item.y * pxPerMm}
        rotation={item.rotation || 0}
        draggable={!isLocked}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelect(item.id);
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          onSelect(item.id);
        }}
        onTouchStart={(e) => {
          e.cancelBubble = true;
          onSelect(item.id);
        }}
        onDragStart={(e) => {
          e.cancelBubble = true;
          onSelect(item.id);
        }}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      >
        {renderSymbol()}

        {/* Item Label */}
        {w >= 30 && d >= 20 && (
          <Text
            text={item.name}
            x={2}
            y={d / 2 - 6}
            width={w - 4}
            align="center"
            fontSize={Math.max(Math.min(w * 0.13, 10), 8)}
            fontFamily="Inter, sans-serif"
            fontStyle="600"
            fill="#f8fafc"
            listening={false}
          />
        )}

        {/* Lock indicator */}
        {isLocked && (
          <Circle x={w - 6} y={6} radius={3.5} fill="#f43f5e" listening={false} />
        )}
      </Group>

      {/* Transformer for selected item */}
      {isSelected && !isLocked && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Enforce minimum dimension of 200mm (~20px)
            if (newBox.width < 20 || newBox.height < 20) {
              return oldBox;
            }
            return newBox;
          }}
          rotateEnabled={true}
          rotateAnchorOffset={typeof window !== 'undefined' && window.innerWidth < 768 ? 24 : 16}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          anchorSize={typeof window !== 'undefined' && window.innerWidth < 768 ? 13 : 8}
          anchorCornerRadius={2}
          anchorStroke="#38bdf8"
          anchorFill="#0f172a"
          borderStroke="#38bdf8"
          borderDash={[3, 3]}
        />
      )}
    </>
  );
}
