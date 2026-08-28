/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { PlacedBuilding, ThreatEntity, UnitEntity } from '../types';
import { MapPin, Navigation, Eye } from 'lucide-react';

interface MinimapProps {
  buildings: PlacedBuilding[];
  threats: ThreatEntity[];
  units: UnitEntity[];
  cameraX: number;
  cameraZ: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (x: number, z: number) => void;
}

export const Minimap: React.FC<MinimapProps> = ({
  buildings,
  threats,
  units,
  cameraX,
  cameraZ,
  isOpen,
  onClose,
  onNavigate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const mapRange = 70; // Map covers -70 to +70 world units

    const worldToMap = (wx: number, wz: number) => {
      const mx = ((wx + mapRange) / (mapRange * 2)) * width;
      const my = ((wz + mapRange) / (mapRange * 2)) * height;
      return [mx, my];
    };

    // 1. Clear background
    ctx.fillStyle = '#064e3b'; // Terrain dark green
    ctx.fillRect(0, 0, width, height);

    // 2. Draw River / Water body on East side
    const [waterX] = worldToMap(46, 0);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(waterX - 10, 0, 20, height);

    // 3. Draw Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 4. Draw Buildings
    buildings.forEach((b) => {
      const [bx, by] = worldToMap(b.gridX * 2, b.gridZ * 2);
      if (!b.isConstructed) {
        ctx.fillStyle = '#eab308'; // Under construction
      } else if (b.isOnFire) {
        ctx.fillStyle = '#ef4444'; // Burning
      } else if (b.defId.startsWith('res')) {
        ctx.fillStyle = '#38bdf8'; // Residential
      } else if (b.defId.startsWith('com')) {
        ctx.fillStyle = '#4ade80'; // Commercial
      } else if (b.defId.startsWith('def')) {
        ctx.fillStyle = '#f59e0b'; // Defense
      } else if (b.defId.startsWith('mon')) {
        ctx.fillStyle = '#c084fc'; // Monument
      } else {
        ctx.fillStyle = '#94a3b8'; // Infrastructure
      }
      ctx.fillRect(bx - 3, by - 3, 6, 6);
    });

    // 5. Draw Friendly Units / Workers
    units.forEach((u) => {
      const [ux, uy] = worldToMap(u.x, u.z);
      ctx.fillStyle = u.type === 'worker' ? '#f97316' : '#60a5fa';
      ctx.beginPath();
      ctx.arc(ux, uy, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // 6. Draw Threats (Blinking Red)
    threats.forEach((t) => {
      if (!t.active) return;
      const [tx, ty] = worldToMap(t.x, t.z);
      // Outer radar pulse ring
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(tx, ty, 6, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(tx, ty, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 7. Draw Camera Target / Frustum position
    const [cx, cy] = worldToMap(cameraX, cameraZ);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 8, cy - 8, 16, 16);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }, [buildings, threats, units, cameraX, cameraZ, isOpen]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const mapRange = 70;
    const worldX = (clickX / canvas.width) * (mapRange * 2) - mapRange;
    const worldZ = (clickY / canvas.height) * (mapRange * 2) - mapRange;

    onNavigate(worldX, worldZ);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-24 right-3 z-20 pointer-events-auto bg-slate-900/95 backdrop-blur-md p-2.5 rounded-2xl border border-slate-800 shadow-2xl flex flex-col gap-1.5 animate-fade-in">
      <div className="flex items-center justify-between text-xs px-1 font-bold text-slate-300">
        <div className="flex items-center gap-1.5">
          <Navigation className="w-3.5 h-3.5 text-cyan-400" />
          <span>RADAR MINIMAP</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Press M</span>
      </div>

      <canvas
        ref={canvasRef}
        width={170}
        height={170}
        onClick={handleCanvasClick}
        className="rounded-xl border border-slate-700/80 cursor-crosshair shadow-inner"
        title="Click to jump camera to position"
      />

      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono px-1">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>City</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span>Threat</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-400" />
          <span>Worker</span>
        </div>
      </div>
    </div>
  );
};
