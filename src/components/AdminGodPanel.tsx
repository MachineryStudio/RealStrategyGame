/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ThreatType, WeatherType } from '../types';
import {
  SlidersHorizontal,
  X,
  Sparkles,
  Flame,
  CloudRain,
  Waves,
  Zap,
  Wind,
  Skull,
  Crosshair,
  Car,
  Trees,
  Wrench,
  Layers,
  Coins,
  Save,
  FolderOpen,
  Download,
  Upload,
  RefreshCw,
  Sun,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

interface AdminGodPanelProps {
  isOpen: boolean;
  isGodMode: boolean;
  timeOfDay: number;
  weather: WeatherType;
  onClose: () => void;
  onToggleGodMode: () => void;
  onSpawnThreat: (type: ThreatType) => void;
  onSetTimeOfDay: (hour: number) => void;
  onSetWeather: (weather: WeatherType) => void;
  onAddResources: (res: { wood?: number; steel?: number; concrete?: number; glass?: number; electronics?: number; money?: number }) => void;
  onRepairAll: () => void;
  onClearThreats: () => void;
  onSaveGame: () => void;
  onLoadGame: () => void;
  onExportCity: () => void;
  onImportCity: (jsonStr: string) => void;
}

export const AdminGodPanel: React.FC<AdminGodPanelProps> = ({
  isOpen,
  isGodMode,
  timeOfDay,
  weather,
  onClose,
  onToggleGodMode,
  onSpawnThreat,
  onSetTimeOfDay,
  onSetWeather,
  onAddResources,
  onRepairAll,
  onClearThreats,
  onSaveGame,
  onLoadGame,
  onExportCity,
  onImportCity,
}) => {
  if (!isOpen) return null;

  const threatsList: { type: ThreatType; label: string; category: string; icon: React.ReactNode }[] = [
    { type: 'godzilla', label: 'Godzilla Kaiju Boss', category: 'Boss', icon: <Flame className="w-3.5 h-3.5 text-cyan-400" /> },
    { type: 'fire', label: 'Spreading Fire', category: 'Natural', icon: <Flame className="w-3.5 h-3.5 text-orange-400" /> },
    { type: 'flood', label: 'Flood Surge', category: 'Natural', icon: <Waves className="w-3.5 h-3.5 text-blue-400" /> },
    { type: 'earthquake', label: 'Violent Earthquake', category: 'Natural', icon: <Zap className="w-3.5 h-3.5 text-amber-400" /> },
    { type: 'tornado', label: 'Twister Tornado', category: 'Natural', icon: <Wind className="w-3.5 h-3.5 text-slate-300" /> },
    { type: 'volcano', label: 'Meteor / Lava Strike', category: 'Natural', icon: <Flame className="w-3.5 h-3.5 text-red-500" /> },
    { type: 'mafia', label: 'Mafia Cartel Raid', category: 'Human', icon: <Car className="w-3.5 h-3.5 text-slate-200" /> },
    { type: 'corporate_raiders', label: 'Corporate Raiders', category: 'Human', icon: <ShieldAlert className="w-3.5 h-3.5 text-indigo-300" /> },
    { type: 'zombies', label: 'Zombie Horde', category: 'Human', icon: <Skull className="w-3.5 h-3.5 text-lime-400" /> },
    { type: 'aliens', label: 'Alien UFO Mothership', category: 'Human', icon: <Crosshair className="w-3.5 h-3.5 text-cyan-300" /> },
    { type: 'pirates', label: 'Naval Pirates', category: 'Human', icon: <Waves className="w-3.5 h-3.5 text-blue-300" /> },
    { type: 'raptors', label: 'Escaped Raptors', category: 'Animal', icon: <Trees className="w-3.5 h-3.5 text-amber-500" /> },
    { type: 'giant_spiders', label: 'Giant Web Spiders', category: 'Animal', icon: <Skull className="w-3.5 h-3.5 text-purple-400" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Admin Controls & God Panel</h2>
              <p className="text-xs text-slate-400">Sandbox tools, threat spawner, weather overrides, and save states</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex flex-col gap-5 text-xs">
          {/* God Mode Big Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
            <div>
              <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>God Mode (Instant Build & Infinite Resources)</span>
              </div>
              <p className="text-slate-400 mt-0.5">Toggle unlimited materials, zero construction timers, and invincibility.</p>
            </div>
            <button
              onClick={onToggleGodMode}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                isGodMode
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {isGodMode ? 'ACTIVE' : 'DISABLED'}
            </button>
          </div>

          {/* Threat Spawner */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">Manual Threat Spawner:</span>
              <button
                onClick={onClearThreats}
                className="px-2.5 py-1 rounded bg-red-950/60 text-red-300 border border-red-800/50 hover:bg-red-900/60 font-semibold"
              >
                Clear All Hostiles
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {threatsList.map((t) => (
                <button
                  key={t.type}
                  onClick={() => {
                    onSpawnThreat(t.type);
                    onClose();
                  }}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left text-slate-200 transition-colors"
                >
                  {t.icon}
                  <span className="truncate">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Environment & Weather Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Time of Day */}
            <div className="flex flex-col gap-2 p-3 bg-slate-800/50 rounded-xl border border-slate-700/60">
              <div className="flex justify-between items-center text-slate-200">
                <span className="font-semibold flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Time of Day</span>
                </span>
                <span className="font-mono text-slate-400">{Math.floor(timeOfDay)}:00</span>
              </div>
              <input
                type="range"
                min="0"
                max="24"
                step="1"
                value={timeOfDay}
                onChange={(e) => onSetTimeOfDay(parseFloat(e.target.value))}
                className="accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>00:00 (Night)</span>
                <span>12:00 (Noon)</span>
                <span>24:00</span>
              </div>
            </div>

            {/* Weather Override */}
            <div className="flex flex-col gap-2 p-3 bg-slate-800/50 rounded-xl border border-slate-700/60">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                <span>Weather State</span>
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(['clear', 'rain', 'storm', 'fog', 'snow'] as WeatherType[]).map((w) => (
                  <button
                    key={w}
                    onClick={() => onSetWeather(w)}
                    className={`px-2 py-1 rounded-lg font-medium capitalize border transition-all ${
                      weather === w
                        ? 'bg-blue-600/40 border-blue-500 text-blue-200'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Resource Injector */}
          <div className="flex flex-col gap-2">
            <span className="font-bold text-slate-200">Instant Resource Injector:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onAddResources({ wood: 500 })}
                className="px-3 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-800/40 font-mono"
              >
                +500 Wood 🪵
              </button>
              <button
                onClick={() => onAddResources({ steel: 500 })}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono"
              >
                +500 Steel ⚙️
              </button>
              <button
                onClick={() => onAddResources({ concrete: 500 })}
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-mono"
              >
                +500 Concrete 🧱
              </button>
              <button
                onClick={() => onAddResources({ glass: 500 })}
                className="px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/40 font-mono"
              >
                +500 Glass 🪟
              </button>
              <button
                onClick={() => onAddResources({ electronics: 500 })}
                className="px-3 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-800/40 font-mono"
              >
                +500 Chips 💻
              </button>
              <button
                onClick={() => onAddResources({ money: 5000 })}
                className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/40 font-mono font-bold"
              >
                +$5,000 Money 💰
              </button>
              <button
                onClick={onRepairAll}
                className="px-3 py-1.5 rounded-lg bg-teal-950/60 hover:bg-teal-900/60 text-teal-300 border border-teal-800/40 font-semibold flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Repair All Buildings</span>
              </button>
            </div>
          </div>

          {/* Save / Load & Export City */}
          <div className="flex flex-col gap-2 border-t border-slate-800 pt-3">
            <span className="font-bold text-slate-200">Persistence & City Export:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={onSaveGame}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 border border-slate-700"
              >
                <Save className="w-3.5 h-3.5 text-blue-400" />
                <span>Save City (LocalStorage)</span>
              </button>
              <button
                onClick={onLoadGame}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 border border-slate-700"
              >
                <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Load City</span>
              </button>
              <button
                onClick={onExportCity}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 border border-slate-700"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export City (.JSON)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};
