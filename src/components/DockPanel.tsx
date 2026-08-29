/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlacedBuilding, UnitEntity, ThreatEntity, BuildingDefinition, GameResources } from '../types';
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Shield,
  Heart,
  Hammer,
  Dog,
  Cat,
  Bot,
  Activity,
  Maximize2,
  Minimize2,
  Crosshair,
  Sparkles,
  Wrench,
  Stethoscope,
  Plus,
  Compass,
  AlertTriangle,
  Building2,
  Users,
  MapPin,
  Radio,
  Flame,
} from 'lucide-react';
import { soundManager } from '../audio/soundManager';

export type DockPosition = 'bottom' | 'left' | 'right';
export type DockTab = 'vitals' | 'minimap' | 'roster';

export interface DockPanelProps {
  dockPosition?: DockPosition;
  onChangeDockPosition?: (pos: DockPosition) => void;
  buildings?: PlacedBuilding[];
  placedBuildings?: PlacedBuilding[];
  definitions?: BuildingDefinition[];
  units?: UnitEntity[];
  allUnits?: UnitEntity[];
  threats?: ThreatEntity[];
  activeThreats?: ThreatEntity[];
  resources?: GameResources;
  isGodMode?: boolean;
  cameraX?: number;
  cameraZ?: number;
  onFocusCoordinates?: (x: number, z: number) => void;
  onFocusEntity?: (x: number, z: number) => void;
  onSelectUnit?: (id: string) => void;
  onSpawnUnit?: (type: any) => void;
  onQuickRepairBuilding?: (buildingInstanceId: string) => void;
  onOpenCitadel?: () => void;
}

export const DockPanel: React.FC<DockPanelProps> = ({
  dockPosition: initialDockPosition = 'bottom',
  onChangeDockPosition,
  buildings,
  placedBuildings,
  definitions = [],
  units,
  allUnits,
  threats,
  activeThreats,
  resources = { money: 0, wood: 0, steel: 0, concrete: 0 },
  isGodMode = false,
  cameraX = 0,
  cameraZ = 0,
  onFocusCoordinates,
  onFocusEntity,
  onSelectUnit,
  onSpawnUnit,
  onQuickRepairBuilding,
  onOpenCitadel,
}) => {
  const [internalDockPos, setInternalDockPos] = useState<DockPosition>(initialDockPosition);
  const dockPosition = onChangeDockPosition ? initialDockPosition : internalDockPos;
  const setDockPosition = onChangeDockPosition || setInternalDockPos;

  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<DockTab>('vitals');
  const [filterCategory, setFilterCategory] = useState<'all' | 'citadel' | 'workers' | 'pets' | 'buildings'>('all');

  const buildingList = buildings || placedBuildings || [];
  const unitList = units || allUnits || [];
  const threatList = threats || activeThreats || [];

  const handleFocus = (x: number, z: number) => {
    if (onFocusCoordinates) onFocusCoordinates(x, z);
    else if (onFocusEntity) onFocusEntity(x, z);
  };

  const citadel = buildingList.find((b) => b && b.defId === 'mon_kingdom_house');
  const citadelHp = citadel?.hp ?? 6000;
  const citadelMaxHp = citadel?.maxHp ?? 6000;
  const citadelHpPct = Math.round((citadelHp / Math.max(1, citadelMaxHp)) * 100);

  const workers = unitList.filter(
    (u) => u && (u.type === 'worker' || u.type === 'nurse' || u.type === 'veterinarian' || u.type === 'architect' || u.type === 'medic' || u.type === 'engineer')
  );
  const pets = unitList.filter((u) => u && (u.type === 'dog' || u.type === 'cat' || u.type === 'robot'));
  const damagedBuildings = buildingList.filter((b) => b && b.isConstructed && (b.hp ?? 0) < (b.maxHp ?? 1000));

  const getUnitIcon = (type: string) => {
    switch (type) {
      case 'nurse':
        return <Heart className="w-3.5 h-3.5 text-rose-400" />;
      case 'veterinarian':
        return <Stethoscope className="w-3.5 h-3.5 text-teal-400" />;
      case 'architect':
      case 'engineer':
        return <Wrench className="w-3.5 h-3.5 text-blue-400" />;
      case 'worker':
        return <Hammer className="w-3.5 h-3.5 text-amber-400" />;
      case 'dog':
        return <Dog className="w-3.5 h-3.5 text-amber-500" />;
      case 'cat':
        return <Cat className="w-3.5 h-3.5 text-purple-400" />;
      case 'robot':
        return <Bot className="w-3.5 h-3.5 text-cyan-400" />;
      case 'military':
        return <Shield className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  // Position specific container classes
  const getContainerClasses = () => {
    if (dockPosition === 'bottom') {
      return `fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-4xl transition-all duration-300 ${
        isMinimized ? 'translate-y-[calc(100%-42px)]' : 'translate-y-0'
      }`;
    }
    if (dockPosition === 'left') {
      return `fixed top-20 left-4 z-40 w-80 md:w-96 max-h-[82vh] transition-all duration-300 ${
        isMinimized ? '-translate-x-[calc(100%-42px)]' : 'translate-x-0'
      }`;
    }
    // right
    return `fixed top-20 right-4 z-40 w-80 md:w-96 max-h-[82vh] transition-all duration-300 ${
      isMinimized ? 'translate-x-[calc(100%-42px)]' : 'translate-x-0'
    }`;
  };

  return (
    <div
      id="shard_harbor_dock_panel"
      className={`${getContainerClasses()} font-sans text-slate-100 select-none`}
    >
      <div className="bg-slate-950/95 border-2 border-amber-500/50 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden flex flex-col">
        {/* Dock Header & Controller */}
        <div className="flex items-center justify-between px-3.5 py-2 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border-b border-amber-500/30">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">⚓</span>
              <span className="text-xs font-black tracking-wide text-amber-300 uppercase">
                SHARD HARBOR DOCK
              </span>
            </div>

            {/* Quick Citadel Status Pill */}
            {citadel && (
              <button
                onClick={() => handleFocus(citadel.gridX * 2, citadel.gridZ * 2)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold transition hover:scale-105 ${
                  citadelHpPct > 60
                    ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                    : citadelHpPct > 30
                    ? 'bg-amber-950/80 border-amber-500/60 text-amber-300 animate-pulse'
                    : 'bg-red-950/90 border-red-500 text-red-300 animate-bounce'
                }`}
                title="Click to center camera on Citadel"
              >
                <span>🏰 CITADEL:</span>
                <span>{citadelHpPct}% HP</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Dock Position Choosers */}
            <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-0.5 text-[10px]">
              <button
                onClick={() => setDockPosition('left')}
                className={`px-1.5 py-0.5 rounded transition ${
                  dockPosition === 'left' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Dock to Left"
              >
                Left
              </button>
              <button
                onClick={() => setDockPosition('bottom')}
                className={`px-1.5 py-0.5 rounded transition ${
                  dockPosition === 'bottom' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Dock to Bottom"
              >
                Bottom
              </button>
              <button
                onClick={() => setDockPosition('right')}
                className={`px-1.5 py-0.5 rounded transition ${
                  dockPosition === 'right' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Dock to Right"
              >
                Right
              </button>
            </div>

            {/* Minimize / Maximize Button */}
            <button
              onClick={() => {
                setIsMinimized((m) => !m);
                soundManager.playClick();
              }}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title={isMinimized ? 'Expand Dock' : 'Minimize Dock'}
            >
              {dockPosition === 'bottom' ? (
                isMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
              ) : dockPosition === 'left' ? (
                isMinimized ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />
              ) : isMinimized ? (
                <ChevronLeft className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        {!isMinimized && (
          <div className="flex items-center px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 gap-1.5 text-xs">
            <button
              onClick={() => setActiveTab('vitals')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition text-xs ${
                activeTab === 'vitals'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Vitals & Health Status</span>
              {damagedBuildings.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('roster')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition text-xs ${
                activeTab === 'roster'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>Personnel & Pets ({unitList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('minimap')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition text-xs ${
                activeTab === 'minimap'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>Radar Scope</span>
            </button>
          </div>
        )}

        {/* Tab Content */}
        {!isMinimized && (
          <div className="p-3 max-h-72 overflow-y-auto space-y-3">
            {/* 1. VITALS & HEALTH MONITOR TAB */}
            {activeTab === 'vitals' && (
              <div className="space-y-3">
                {/* Category Filters */}
                <div className="flex items-center gap-1 text-[11px] font-mono">
                  <button
                    onClick={() => setFilterCategory('all')}
                    className={`px-2 py-0.5 rounded-md transition ${
                      filterCategory === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({1 + workers.length + pets.length + damagedBuildings.length})
                  </button>
                  <button
                    onClick={() => setFilterCategory('citadel')}
                    className={`px-2 py-0.5 rounded-md transition ${
                      filterCategory === 'citadel' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Citadel
                  </button>
                  <button
                    onClick={() => setFilterCategory('workers')}
                    className={`px-2 py-0.5 rounded-md transition ${
                      filterCategory === 'workers' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Workers ({workers.length})
                  </button>
                  <button
                    onClick={() => setFilterCategory('pets')}
                    className={`px-2 py-0.5 rounded-md transition ${
                      filterCategory === 'pets' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Pets ({pets.length})
                  </button>
                  <button
                    onClick={() => setFilterCategory('buildings')}
                    className={`px-2 py-0.5 rounded-md transition ${
                      filterCategory === 'buildings' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Damaged Structures ({damagedBuildings.length})
                  </button>
                </div>

                {/* Citadel Card */}
                {(filterCategory === 'all' || filterCategory === 'citadel') && citadel && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/40 flex items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-lg flex-shrink-0">
                        🏰
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white truncate">Kingdom Citadel</span>
                          <span className="text-[9px] px-1.5 py-0.2 bg-amber-950 text-amber-300 rounded border border-amber-500/40 font-mono">
                            CORE
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-28 sm:w-44 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                citadelHpPct > 50
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                  : citadelHpPct > 25
                                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                                  : 'bg-gradient-to-r from-red-600 to-rose-500'
                              }`}
                              style={{ width: `${citadelHpPct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-slate-300">
                            {Math.round(citadelHp)} / {citadelMaxHp} HP ({citadelHpPct}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => onFocusCoordinates(citadel.gridX * 2, citadel.gridZ * 2)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs flex items-center gap-1 transition"
                        title="Center Camera on Citadel"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[10px] font-bold">Focus</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Personnel List (Workers, Nurses, Veterinarians, Architects) */}
                {(filterCategory === 'all' || filterCategory === 'workers') && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                      Personnel & Medical Staff
                    </div>
                    {workers.length === 0 ? (
                      <div className="text-xs text-red-300/80 p-2 rounded bg-red-950/30 border border-red-900">
                        ⚠️ No active workers or staff alive! Recruit nurses, architects, or workers immediately.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {workers.map((u) => {
                          if (!u) return null;
                          const hp = u.hp ?? 100;
                          const maxHp = u.maxHp ?? 100;
                          const hpPct = Math.round((hp / Math.max(1, maxHp)) * 100);
                          return (
                            <div
                              key={u.id}
                              className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="p-1.5 rounded-md bg-slate-950 border border-slate-800">
                                  {getUnitIcon(u.type)}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-slate-200 truncate">
                                    {u.name || u.type.toUpperCase()}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full ${
                                          hpPct > 50 ? 'bg-emerald-400' : hpPct > 25 ? 'bg-amber-400' : 'bg-red-500'
                                        }`}
                                        style={{ width: `${hpPct}%` }}
                                      />
                                    </div>
                                    <span className="text-[9px] font-mono text-slate-400">
                                      {Math.round(hp)}/{maxHp} HP
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => {
                                  if (onSelectUnit) onSelectUnit(u.id);
                                  handleFocus(u.x, u.z);
                                }}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[10px] font-mono transition"
                              >
                                Select
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Pets List (Guard Dogs, Sentinel Cats, Bots) */}
                {(filterCategory === 'all' || filterCategory === 'pets') && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                      Vigilant Pets & Guardian Companions
                    </div>
                    {pets.length === 0 ? (
                      <div className="text-xs text-amber-300/80 p-2 rounded bg-amber-950/30 border border-amber-900">
                        No vigilant pets deployed. Train guard dogs, cats, or bots to protect against Godzilla and threats!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {pets.map((u) => {
                          if (!u) return null;
                          const hp = u.hp ?? 100;
                          const maxHp = u.maxHp ?? 100;
                          const hpPct = Math.round((hp / Math.max(1, maxHp)) * 100);
                          return (
                            <div
                              key={u.id}
                              className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="p-1.5 rounded-md bg-slate-950 border border-slate-800">
                                  {getUnitIcon(u.type)}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-slate-200 truncate">
                                    {u.name || u.type.toUpperCase()}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full ${
                                          hpPct > 50 ? 'bg-emerald-400' : hpPct > 25 ? 'bg-amber-400' : 'bg-red-500'
                                        }`}
                                        style={{ width: `${hpPct}%` }}
                                      />
                                    </div>
                                    <span className="text-[9px] font-mono text-slate-400">
                                      {Math.round(hp)}/{maxHp} HP
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => {
                                  if (onSelectUnit) onSelectUnit(u.id);
                                  handleFocus(u.x, u.z);
                                }}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[10px] font-mono transition"
                              >
                                Select
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Damaged Buildings List */}
                {(filterCategory === 'all' || filterCategory === 'buildings') && damagedBuildings.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400 px-1 flex items-center gap-1">
                      <Flame className="w-3 h-3 text-rose-400 animate-pulse" />
                      <span>Damaged Structures Requiring Architect / Fire Repair</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {damagedBuildings.map((b) => {
                        if (!b) return null;
                        const def = (definitions || []).find((d) => d && d.id === b.defId);
                        const hp = b.hp ?? 100;
                        const maxHp = b.maxHp ?? 100;
                        const hpPct = Math.round((hp / Math.max(1, maxHp)) * 100);
                        return (
                          <div
                            key={b.instanceId}
                            className="p-2 rounded-lg bg-red-950/40 border border-red-800/60 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-white truncate">
                                {def?.name || 'Building'}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-red-600 to-rose-500"
                                    style={{ width: `${hpPct}%` }}
                                  />
                                </div>
                                <span className="text-[9px] font-mono text-red-300 font-bold">
                                  {Math.round(hp)}/{maxHp} HP
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleFocus(b.gridX * 2, b.gridZ * 2)}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded text-[10px] font-mono transition"
                              >
                                Center
                              </button>
                              {onQuickRepairBuilding && isGodMode && (
                                <button
                                  onClick={() => onQuickRepairBuilding(b.instanceId)}
                                  className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[10px] font-mono transition"
                                >
                                  Fix
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. RECRUITMENT & ROSTER TAB */}
            {activeTab === 'roster' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-300 flex items-center justify-between">
                  <span>Specialist Recruitment & Emergency Staffing</span>
                  <span className="font-mono text-amber-300 font-bold text-[11px]">${resources?.money ?? 0}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Nurse */}
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-rose-500/40 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-rose-950 border border-rose-500/50">
                        <Heart className="w-4 h-4 text-rose-400" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Nurse (Heals Workers)</div>
                        <div className="text-[10px] text-rose-200/80">Treats injured civil workers & citizens</div>
                      </div>
                    </div>
                    <button
                      onClick={() => onSpawnUnit && onSpawnUnit('nurse')}
                      className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs shadow transition active:scale-95"
                    >
                      +$70
                    </button>
                  </div>

                  {/* Veterinarian */}
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-teal-500/40 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-teal-950 border border-teal-500/50">
                        <Stethoscope className="w-4 h-4 text-teal-400" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Veterinarian (Heals Pets)</div>
                        <div className="text-[10px] text-teal-200/80">Treats dogs, cats & sentinel bots</div>
                      </div>
                    </div>
                    <button
                      onClick={() => onSpawnUnit && onSpawnUnit('veterinarian')}
                      className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow transition active:scale-95"
                    >
                      +$75
                    </button>
                  </div>

                  {/* Architect */}
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-blue-500/40 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-blue-950 border border-blue-500/50">
                        <Wrench className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Architect (Repairs Buildings)</div>
                        <div className="text-[10px] text-blue-200/80">Fixes damaged buildings & Citadel</div>
                      </div>
                    </div>
                    <button
                      onClick={() => onSpawnUnit && onSpawnUnit('architect')}
                      className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow transition active:scale-95"
                    >
                      +$85
                    </button>
                  </div>

                  {/* Builder Worker */}
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/40 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-amber-950 border border-amber-500/50">
                        <Hammer className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Civil Worker / Builder</div>
                        <div className="text-[10px] text-amber-200/80">Builds structures & harvests wild nodes</div>
                      </div>
                    </div>
                    <button
                      onClick={() => onSpawnUnit && onSpawnUnit('worker')}
                      className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-bold text-xs shadow transition active:scale-95"
                    >
                      +$50
                    </button>
                  </div>

                  {/* Guard Dog */}
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-amber-600/40 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-amber-950 border border-amber-500/50">
                        <Dog className="w-4 h-4 text-amber-500" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Guard Dog (Pet)</div>
                        <div className="text-[10px] text-amber-200/80">Vigilant patrol & alerts on monster presence</div>
                      </div>
                    </div>
                    <button
                      onClick={() => onSpawnUnit && onSpawnUnit('dog')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs transition"
                    >
                      +$75
                    </button>
                  </div>

                  {/* Sentinel Cat */}
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-purple-500/40 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-purple-950 border border-purple-500/50">
                        <Cat className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Sentinel Cat (Pet)</div>
                        <div className="text-[10px] text-purple-200/80">Agile scout & high-speed claw pounce</div>
                      </div>
                    </div>
                    <button
                      onClick={() => onSpawnUnit && onSpawnUnit('cat')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-xs transition"
                    >
                      +$80
                    </button>
                  </div>

                  {/* Defense Sentinel Bot */}
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-cyan-500/40 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-500/50">
                        <Bot className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Construct-O-Bot (Pet)</div>
                        <div className="text-[10px] text-cyan-200/80">Hover radar & twin plasma laser cannons</div>
                      </div>
                    </div>
                    <button
                      onClick={() => onSpawnUnit && onSpawnUnit('robot')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs transition"
                    >
                      +$150
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. RADAR MINIMAP TAB */}
            {activeTab === 'minimap' && (
              <div className="space-y-2">
                <div className="text-xs text-slate-400">
                  Click any coordinate on the tactical radar to pivot your camera view:
                </div>
                <div className="relative w-full h-44 bg-slate-950 border border-cyan-500/40 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                  {/* Radar Circles */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                    <div className="w-16 h-16 border border-cyan-500 rounded-full" />
                    <div className="w-32 h-32 border border-cyan-500 rounded-full" />
                    <div className="w-48 h-48 border border-cyan-500 rounded-full" />
                    <div className="w-full h-px bg-cyan-500" />
                    <div className="h-full w-px bg-cyan-500" />
                  </div>

                  {/* Interactive Map Canvas representation */}
                  <div
                    className="absolute inset-0 cursor-crosshair"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const clickY = e.clientY - rect.top;
                      const worldX = ((clickX / rect.width) - 0.5) * 100;
                      const worldZ = ((clickY / rect.height) - 0.5) * 100;
                      handleFocus(worldX, worldZ);
                      soundManager.playClick();
                    }}
                  >
                    {/* Buildings */}
                    {buildingList.map((b) => {
                      if (!b) return null;
                      const screenX = ((b.gridX * 2) / 100 + 0.5) * 100;
                      const screenZ = ((b.gridZ * 2) / 100 + 0.5) * 100;
                      const isCitadel = b.defId === 'mon_kingdom_house';
                      const isDamaged = (b.hp ?? 0) < (b.maxHp ?? 1000);
                      return (
                        <div
                          key={b.instanceId}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-sm ${
                            isCitadel
                              ? 'w-3 h-3 bg-amber-400 border border-amber-200 shadow-md shadow-amber-500/50'
                              : isDamaged
                              ? 'w-2 h-2 bg-red-500 animate-pulse'
                              : 'w-1.5 h-1.5 bg-blue-400'
                          }`}
                          style={{ left: `${screenX}%`, top: `${screenZ}%` }}
                          title={isCitadel ? 'Kingdom Citadel' : 'Building'}
                        />
                      );
                    })}

                    {/* Units */}
                    {unitList.map((u) => {
                      if (!u) return null;
                      const screenX = (u.x / 100 + 0.5) * 100;
                      const screenZ = (u.z / 100 + 0.5) * 100;
                      const isNurse = u.type === 'nurse';
                      const isVet = u.type === 'veterinarian';
                      const isArchitect = u.type === 'architect';
                      const isPet = u.type === 'dog' || u.type === 'cat' || u.type === 'robot';

                      return (
                        <div
                          key={u.id}
                          className={`absolute w-1.5 h-1.5 rounded-full -translate-x-1/2 -translate-y-1/2 ${
                            isNurse
                              ? 'bg-rose-400'
                              : isVet
                              ? 'bg-teal-400'
                              : isArchitect
                              ? 'bg-blue-400'
                              : isPet
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                          style={{ left: `${screenX}%`, top: `${screenZ}%` }}
                        />
                      );
                    })}

                    {/* Threats / Godzilla */}
                    {threatList.map((t) => {
                      const screenX = (t.x / 100 + 0.5) * 100;
                      const screenZ = (t.z / 100 + 0.5) * 100;
                      const isGodzilla = t.type === 'godzilla';

                      return (
                        <div
                          key={t.id}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full animate-ping ${
                            isGodzilla ? 'w-4 h-4 bg-cyan-400 border border-white' : 'w-2.5 h-2.5 bg-red-500'
                          }`}
                          style={{ left: `${screenX}%`, top: `${screenZ}%` }}
                        />
                      );
                    })}

                    {/* Camera View Marker */}
                    <div
                      className="absolute w-3 h-3 border border-yellow-300 rounded-sm -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                      style={{
                        left: `${(cameraX / 100 + 0.5) * 100}%`,
                        top: `${(cameraZ / 100 + 0.5) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
