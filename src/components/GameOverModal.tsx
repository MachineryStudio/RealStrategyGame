/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameStats, PlacedBuilding } from '../types';
import {
  Skull,
  RotateCcw,
  ShieldAlert,
  Flame,
  Award,
  Calendar,
  Building2,
  Users,
} from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface GameOverModalProps {
  isOpen: boolean;
  stats?: GameStats;
  buildings?: PlacedBuilding[];
  resources?: any;
  reason?: 'citadel_destroyed' | 'all_workers_fallen';
  onRestart?: () => void;
  onRestartKingdom?: () => void;
  onLoadSave?: () => void;
  onLoadLastSave?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  stats = { daysElapsed: 1, threatsDefeated: 0, population: 4, buildingsCount: 0, resourcesGathered: 0 },
  buildings = [],
  reason = 'all_workers_fallen',
  onRestart,
  onRestartKingdom,
  onLoadSave,
  onLoadLastSave,
}) => {
  if (!isOpen) return null;

  const handleRestart = onRestart || onRestartKingdom || (() => {});
  const handleLoadSave = onLoadSave || onLoadLastSave || (() => {});

  const standingBuildings = (buildings || []).filter((b) => b && b.isConstructed && b.hp > 0).length;
  const isCitadelFallen = reason === 'citadel_destroyed';

  return (
    <div
      id="modal_game_over"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in font-sans text-slate-100"
    >
      <div className="relative w-full max-w-lg bg-slate-950 border-2 border-red-600 rounded-3xl shadow-2xl shadow-red-600/30 overflow-hidden flex flex-col p-6 text-center space-y-5">
        {/* Skull & Warning Icon */}
        <div className="mx-auto w-16 h-16 rounded-3xl bg-red-950/80 border-2 border-red-500/80 flex items-center justify-center text-red-400 shadow-xl shadow-red-600/40 animate-pulse">
          {isCitadelFallen ? <Flame className="w-8 h-8 text-amber-400" /> : <Skull className="w-8 h-8" />}
        </div>

        <div>
          <span className="px-3 py-1 rounded-full bg-red-950/80 text-red-400 border border-red-500/50 text-xs font-mono font-bold tracking-widest uppercase">
            {isCitadelFallen ? 'GAME OVER • CITADEL DESTROYED' : 'GAME OVER • CITIZENRY WIPED OUT'}
          </span>
          <h2 className="text-2xl font-black text-white mt-2 tracking-wide uppercase">
            {isCitadelFallen ? 'THE CITADEL OF SHARD HARBOR HAS FALLEN' : 'ALL WORKERS HAVE FALLEN'}
          </h2>
          <p className="text-xs text-red-200/80 mt-1 max-w-sm mx-auto leading-relaxed">
            {isCitadelFallen
              ? 'The Kingdom Citadel at the heart of Shard Harbor was completely demolished by Godzilla & Kaiju attacks. Without the central command & depository, the harbor has crumbled into oblivion.'
              : 'The Kaiju and hostile monsters overwhelmed the settlement defenses. With no surviving workers left to maintain or construct the kingdom, the city has fallen into ruin.'}
          </p>
        </div>

        {/* Historic Survival Stats */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-red-950 grid grid-cols-2 gap-3 text-left">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-mono">Days Survived</div>
              <div className="text-sm font-bold text-white">{stats.daysElapsed} Days</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Award className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-mono">Threats Defeated</div>
              <div className="text-sm font-bold text-white">{stats.threatsDefeated} Foes</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Building2 className="w-4 h-4 text-blue-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-mono">Structures Standing</div>
              <div className="text-sm font-bold text-white">{standingBuildings} Built</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-purple-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-mono">Peak Population</div>
              <div className="text-sm font-bold text-white">{stats.population} Citizens</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            id="btn_restart_kingdom"
            onClick={handleRestart}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Rehire Pioneers & Rebuild</span>
          </button>

          <button
            id="btn_load_last_save"
            onClick={handleLoadSave}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition"
          >
            Load Last Save
          </button>
        </div>
      </div>
    </div>
  );
};
