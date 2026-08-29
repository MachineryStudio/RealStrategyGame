/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ThreatEntity } from '../types';
import {
  Flame,
  AlertTriangle,
  Waves,
  Zap,
  Wind,
  Skull,
  Crosshair,
  ShieldAlert,
  Car
} from 'lucide-react';

interface ThreatAlertBannerProps {
  threats?: ThreatEntity[];
  onDeploy: (type: 'fire_truck' | 'police' | 'engineer' | 'military' | 'medic' | 'dog' | 'cat' | 'robot') => void;
}

export const ThreatAlertBanner: React.FC<ThreatAlertBannerProps> = ({ threats = [], onDeploy }) => {
  const activeThreats = (threats || []).filter((t) => t && t.active);
  if (activeThreats.length === 0) return null;

  const currentThreat = activeThreats[0];

  const getThreatIcon = (type: string) => {
    switch (type) {
      case 'godzilla': return <Flame className="w-4 h-4 text-cyan-300" />;
      case 'fire': return <Flame className="w-4 h-4 text-orange-400" />;
      case 'flood': return <Waves className="w-4 h-4 text-blue-400" />;
      case 'earthquake': return <Zap className="w-4 h-4 text-amber-400" />;
      case 'tornado': return <Wind className="w-4 h-4 text-slate-300" />;
      case 'zombies': return <Skull className="w-4 h-4 text-lime-400" />;
      case 'aliens': return <Crosshair className="w-4 h-4 text-cyan-400" />;
      case 'mafia': return <Car className="w-4 h-4 text-slate-200" />;
      default: return <ShieldAlert className="w-4 h-4 text-red-400" />;
    }
  };

  const isGodzilla = currentThreat.type === 'godzilla';

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-lg w-full px-4 animate-bounce-short">
      <div className={`backdrop-blur-md border rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-3 text-xs ${
        isGodzilla
          ? 'bg-slate-950/95 border-cyan-500/80 shadow-cyan-500/30'
          : 'bg-red-950/90 border-red-500/60 shadow-red-500/20'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center animate-pulse border ${
            isGodzilla ? 'bg-cyan-950/80 border-cyan-400/80' : 'bg-red-600/30 border-red-500/50'
          }`}>
            {getThreatIcon(currentThreat.type)}
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-slate-100">
              <span className={isGodzilla ? 'text-cyan-400' : 'text-red-300'}>
                {isGodzilla ? '⚠️ KAIJU BOSS THREAT:' : 'EMERGENCY ALERT:'}
              </span>
              <span className={`uppercase tracking-wide font-black ${isGodzilla ? 'text-cyan-200' : 'text-red-300'}`}>
                {currentThreat.name}
              </span>
            </div>
            <div className="text-[11px] text-slate-300/80 font-mono">
              HP: {Math.max(0, Math.round(currentThreat.hp ?? 100))}/{currentThreat.maxHp ?? 100} &bull; Category: {(currentThreat.category || 'Hazard').toUpperCase()}
            </div>
          </div>
        </div>

        {/* Quick Response Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {currentThreat.type === 'fire' ? (
            <button
              onClick={() => onDeploy('fire_truck')}
              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-md text-[11px] transition-colors"
            >
              Dispatch Fire Truck
            </button>
          ) : currentThreat.type === 'mafia' || currentThreat.type === 'corporate_raiders' ? (
            <button
              onClick={() => onDeploy('police')}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md text-[11px] transition-colors"
            >
              Dispatch Police Squad
            </button>
          ) : isGodzilla ? (
            <button
              onClick={() => onDeploy('military')}
              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md text-[11px] transition-colors animate-pulse"
            >
              Deploy Heavy Military
            </button>
          ) : (
            <button
              onClick={() => onDeploy('military')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md text-[11px] transition-colors"
            >
              Deploy Military
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
