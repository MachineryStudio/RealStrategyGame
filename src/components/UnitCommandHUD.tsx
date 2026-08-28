/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UnitEntity } from '../types';
import {
  Shield,
  Hammer,
  Truck,
  Car,
  User,
  Heart,
  Navigation,
  Crosshair,
  Octagon,
  Users,
  Plus,
  Compass,
  Dog,
  Cat,
  Bot,
} from 'lucide-react';

interface UnitCommandHUDProps {
  selectedUnits: UnitEntity[];
  allUnits: UnitEntity[];
  onSelectUnit: (id: string, multiSelect?: boolean) => void;
  onSelectAllOfType: (type: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onStopUnits: () => void;
  onAttackNearestThreat: () => void;
  onSpawnUnit: (type: 'worker' | 'military' | 'fire_truck' | 'police' | 'medic' | 'dog' | 'cat' | 'robot') => void;
  marqueeRect: { startX: number; startY: number; endX: number; endY: number } | null;
}

export const UnitCommandHUD: React.FC<UnitCommandHUDProps> = ({
  selectedUnits,
  allUnits,
  onSelectUnit,
  onSelectAllOfType,
  onSelectAll,
  onDeselectAll,
  onStopUnits,
  onAttackNearestThreat,
  onSpawnUnit,
  marqueeRect,
}) => {
  const [showRecruitPopover, setShowRecruitPopover] = useState(false);

  const getUnitIcon = (type: string) => {
    switch (type) {
      case 'worker':
        return <Hammer className="w-4 h-4 text-amber-400" />;
      case 'dog':
        return <Dog className="w-4 h-4 text-amber-500" />;
      case 'cat':
        return <Cat className="w-4 h-4 text-purple-400" />;
      case 'robot':
        return <Bot className="w-4 h-4 text-cyan-400" />;
      case 'military':
        return <Shield className="w-4 h-4 text-emerald-400" />;
      case 'fire_truck':
        return <Truck className="w-4 h-4 text-rose-400" />;
      case 'police':
        return <Car className="w-4 h-4 text-blue-400" />;
      case 'medic':
        return <Heart className="w-4 h-4 text-teal-400" />;
      default:
        return <User className="w-4 h-4 text-slate-300" />;
    }
  };

  const getUnitBadgeColor = (type: string) => {
    switch (type) {
      case 'worker':
        return 'border-amber-500/50 bg-amber-950/40 text-amber-200';
      case 'dog':
        return 'border-amber-500/60 bg-amber-900/40 text-amber-200';
      case 'cat':
        return 'border-purple-500/60 bg-purple-950/40 text-purple-200';
      case 'robot':
        return 'border-cyan-500/60 bg-cyan-950/40 text-cyan-200';
      case 'military':
        return 'border-emerald-500/50 bg-emerald-950/40 text-emerald-200';
      case 'fire_truck':
        return 'border-rose-500/50 bg-rose-950/40 text-rose-200';
      case 'police':
        return 'border-blue-500/50 bg-blue-950/40 text-blue-200';
      case 'medic':
        return 'border-teal-500/50 bg-teal-950/40 text-teal-200';
      default:
        return 'border-slate-600 bg-slate-800/80 text-slate-200';
    }
  };

  const primaryUnit = selectedUnits[0];

  return (
    <>
      {/* 1. Marquee Drag Selection Box Visual Overlay */}
      {marqueeRect && (
        <div
          id="rts_marquee_selection_box"
          className="fixed pointer-events-none z-30 border border-cyan-400/90 bg-cyan-500/15 backdrop-blur-[0.5px] rounded-[2px] shadow-[0_0_15px_rgba(6,182,212,0.35)]"
          style={{
            left: `${marqueeRect.startX}px`,
            top: `${marqueeRect.startY}px`,
            width: `${marqueeRect.endX - marqueeRect.startX}px`,
            height: `${marqueeRect.endY - marqueeRect.startY}px`,
          }}
        >
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-300" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyan-300" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyan-300" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-300" />
        </div>
      )}

      {/* 2. RTS Command Bar (Active when units are selected) */}
      {selectedUnits.length > 0 && (
        <div
          id="rts_unit_command_bar"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-3xl bg-slate-950/90 border border-cyan-500/40 rounded-xl p-3 shadow-2xl backdrop-blur-md transition-all duration-200 text-slate-100"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                TACTICAL COMMAND &bull; {selectedUnits.length} {selectedUnits.length === 1 ? 'UNIT' : 'UNITS'} SELECTED
              </span>
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span className="hidden sm:inline-block bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-[11px] text-cyan-300">
                Right-Click Ground: Move | Right-Click Enemy: Attack
              </span>
              <button
                id="btn_rts_deselect"
                onClick={onDeselectAll}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition text-[11px]"
                title="Deselect All (Esc)"
              >
                Clear Selection
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Left: Unit Details / Overview */}
            <div className="md:col-span-5 flex items-center space-x-3 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-cyan-500/30 flex-shrink-0">
                {getUnitIcon(primaryUnit.type)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold truncate text-slate-100">
                    {selectedUnits.length === 1 ? primaryUnit.name : `${selectedUnits.length} Units Group`}
                  </h4>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                    {primaryUnit.state}
                  </span>
                </div>

                {/* HP Bar */}
                <div className="mt-1.5 space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>Integrity</span>
                    <span>
                      {selectedUnits.length === 1
                        ? `${Math.round(primaryUnit.hp)} / ${primaryUnit.maxHp}`
                        : `${selectedUnits.reduce((acc, u) => acc + Math.round(u.hp), 0)} Total HP`}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                      style={{
                        width: `${
                          selectedUnits.length === 1
                            ? (primaryUnit.hp / primaryUnit.maxHp) * 100
                            : (selectedUnits.reduce((a, b) => a + b.hp, 0) /
                                selectedUnits.reduce((a, b) => a + b.maxHp, 0)) *
                              100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Middle: Selection Roster Chips (if multiple units) */}
            <div className="md:col-span-4 flex flex-wrap gap-1.5 max-h-16 overflow-y-auto pr-1">
              {selectedUnits.map((u) => (
                <button
                  key={u.id}
                  id={`btn_unit_chip_${u.id}`}
                  onClick={() => onSelectUnit(u.id, false)}
                  onDoubleClick={() => onSelectAllOfType(u.type)}
                  className={`flex items-center space-x-1.5 px-2 py-1 rounded text-xs border transition ${getUnitBadgeColor(
                    u.type
                  )} hover:scale-105`}
                  title={`Double click to select all ${u.type}s`}
                >
                  {getUnitIcon(u.type)}
                  <span className="font-mono text-[10px] uppercase font-medium">{u.type.replace('_', ' ')}</span>
                </button>
              ))}
            </div>

            {/* Right: Tactical Action Commands */}
            <div className="md:col-span-3 flex flex-wrap items-center justify-end gap-1.5">
              <button
                id="btn_cmd_stop"
                onClick={onStopUnits}
                className="flex items-center space-x-1 px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-700/50 rounded-lg text-rose-200 text-xs font-semibold transition"
                title="Halt all selected units (Key: S)"
              >
                <Octagon className="w-3.5 h-3.5" />
                <span>Halt (S)</span>
              </button>

              <button
                id="btn_cmd_attack_nearest"
                onClick={onAttackNearestThreat}
                className="flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700/50 rounded-lg text-emerald-200 text-xs font-semibold transition"
                title="Engage hostile threats"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Hunt Threats</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. RTS Unit Quick-Bar & Army Deployment (Bottom Right Quick Control) */}
      <div
        id="rts_quick_army_bar"
        className="fixed bottom-4 right-4 z-40 flex items-center space-x-1.5 bg-slate-950/90 border border-slate-800 rounded-2xl p-1.5 shadow-2xl backdrop-blur-md text-xs"
      >
        <button
          id="btn_select_all_workers"
          onClick={() => onSelectAllOfType('worker')}
          className="flex items-center space-x-1 px-2 py-1.5 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 rounded-xl text-amber-200 transition"
          title="Select all construction workers"
        >
          <Hammer className="w-3.5 h-3.5" />
          <span className="font-medium">Workers ({allUnits.filter((u) => u.type === 'worker').length})</span>
        </button>

        <button
          id="btn_select_all_dogs"
          onClick={() => onSelectAllOfType('dog')}
          className="flex items-center space-x-1 px-2 py-1.5 bg-amber-900/40 hover:bg-amber-800/60 border border-amber-500/40 rounded-xl text-amber-200 transition"
          title="Select all guard dogs"
        >
          <Dog className="w-3.5 h-3.5" />
          <span className="font-medium">Dogs ({allUnits.filter((u) => u.type === 'dog').length})</span>
        </button>

        <button
          id="btn_select_all_cats"
          onClick={() => onSelectAllOfType('cat')}
          className="flex items-center space-x-1 px-2 py-1.5 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 rounded-xl text-purple-200 transition"
          title="Select all sentinel cats"
        >
          <Cat className="w-3.5 h-3.5" />
          <span className="font-medium">Cats ({allUnits.filter((u) => u.type === 'cat').length})</span>
        </button>

        <button
          id="btn_select_all_robots"
          onClick={() => onSelectAllOfType('robot')}
          className="flex items-center space-x-1 px-2 py-1.5 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/40 rounded-xl text-cyan-200 transition"
          title="Select all defense sentinel bots"
        >
          <Bot className="w-3.5 h-3.5" />
          <span className="font-medium">Bots ({allUnits.filter((u) => u.type === 'robot').length})</span>
        </button>

        <button
          id="btn_select_all_military"
          onClick={() => onSelectAllOfType('military')}
          className="flex items-center space-x-1 px-2 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 rounded-xl text-emerald-200 transition"
          title="Select all combat tanks"
        >
          <Shield className="w-3.5 h-3.5" />
          <span className="font-medium">Military ({allUnits.filter((u) => u.type === 'military').length})</span>
        </button>

        <button
          id="btn_select_all_units"
          onClick={onSelectAll}
          className="flex items-center space-x-1 px-2 py-1.5 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-600/40 rounded-xl text-slate-200 transition"
          title="Select entire personnel"
        >
          <Users className="w-3.5 h-3.5" />
          <span className="font-medium">All ({allUnits.length})</span>
        </button>

        <div className="h-4 w-px bg-slate-700 mx-0.5" />

        {/* Quick Recruit Menu Toggle */}
        <div className="relative">
          <button
            id="btn_toggle_recruit_menu"
            onClick={() => setShowRecruitPopover((p) => !p)}
            className="px-2.5 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold rounded-xl transition flex items-center gap-1 shadow-md shadow-amber-500/20"
            title="Train Unit / Pet"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Recruit</span>
          </button>

          {showRecruitPopover && (
            <div
              id="popover_quick_recruit"
              className="absolute bottom-full right-0 mb-2 w-48 bg-slate-900 border border-amber-500/40 rounded-2xl p-2 shadow-2xl space-y-1 backdrop-blur-md animate-fade-in"
            >
              <div className="text-[10px] uppercase font-mono text-amber-300 font-bold px-2 py-1 border-b border-slate-800">
                Quick Recruit
              </div>
              <button
                onClick={() => {
                  onSpawnUnit('worker');
                  setShowRecruitPopover(false);
                }}
                className="w-full text-left px-2 py-1.5 hover:bg-slate-800 rounded-xl flex items-center justify-between text-xs text-amber-200 transition"
              >
                <span className="flex items-center gap-1.5">
                  <Hammer className="w-3.5 h-3.5 text-amber-400" />
                  Worker
                </span>
                <span className="font-mono text-[10px] text-slate-400">$50</span>
              </button>

              <button
                onClick={() => {
                  onSpawnUnit('dog');
                  setShowRecruitPopover(false);
                }}
                className="w-full text-left px-2 py-1.5 hover:bg-slate-800 rounded-xl flex items-center justify-between text-xs text-amber-200 transition"
              >
                <span className="flex items-center gap-1.5">
                  <Dog className="w-3.5 h-3.5 text-amber-500" />
                  Guard Dog
                </span>
                <span className="font-mono text-[10px] text-slate-400">$75</span>
              </button>

              <button
                onClick={() => {
                  onSpawnUnit('cat');
                  setShowRecruitPopover(false);
                }}
                className="w-full text-left px-2 py-1.5 hover:bg-slate-800 rounded-xl flex items-center justify-between text-xs text-purple-200 transition"
              >
                <span className="flex items-center gap-1.5">
                  <Cat className="w-3.5 h-3.5 text-purple-400" />
                  Sentinel Cat
                </span>
                <span className="font-mono text-[10px] text-slate-400">$80</span>
              </button>

              <button
                onClick={() => {
                  onSpawnUnit('robot');
                  setShowRecruitPopover(false);
                }}
                className="w-full text-left px-2 py-1.5 hover:bg-slate-800 rounded-xl flex items-center justify-between text-xs text-cyan-200 transition"
              >
                <span className="flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-cyan-400" />
                  Sentinel Bot
                </span>
                <span className="font-mono text-[10px] text-slate-400">$150</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
