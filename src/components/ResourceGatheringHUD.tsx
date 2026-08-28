/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlacedBuilding, BuildingDefinition, UnitEntity, GameResources, ResourceNode, ResourceCargo, KingdomDepositoryStats } from '../types';
import {
  Hammer,
  Trees,
  Wrench,
  Layers,
  Users,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
  Plus,
  AlertCircle,
  Crosshair,
  Compass,
  Pickaxe,
  Mountain,
  Crown,
  Package,
  ArrowRight,
  Shield,
  Coins
} from 'lucide-react';

interface ResourceGatheringHUDProps {
  buildings: PlacedBuilding[];
  definitions: BuildingDefinition[];
  units: UnitEntity[];
  resources: GameResources;
  resourceNodes?: ResourceNode[];
  avatarCargo?: ResourceCargo;
  kingdomStats?: KingdomDepositoryStats;
  isAutoReturning?: boolean;
  onReturnAvatarToKingdom?: () => void;
  onAssignWorkerToWorkshop: (buildingInstanceId: string) => void;
  onUnassignWorkerFromWorkshop: (buildingInstanceId: string) => void;
  onAssignWorkerToNode?: (nodeId: string) => void;
  onFocusBuilding: (building: PlacedBuilding) => void;
  onFocusKingdomHouse?: () => void;
  onFocusNode?: (node: ResourceNode) => void;
  onOpenWorkshopInspector: (buildingInstanceId: string) => void;
  onOpenCitadelInspector?: () => void;
}

export const ResourceGatheringHUD: React.FC<ResourceGatheringHUDProps> = ({
  buildings,
  definitions,
  units,
  resources,
  resourceNodes = [],
  avatarCargo = { wood: 0, steel: 0, concrete: 0, maxCapacity: 25 },
  kingdomStats = {
    level: 1,
    totalWoodDeposited: 0,
    totalSteelDeposited: 0,
    totalConcreteDeposited: 0,
    totalDeliveries: 0,
    currentTierProgress: 0,
    tierTarget: 150,
    tierBonusPct: 10,
  },
  isAutoReturning = false,
  onReturnAvatarToKingdom,
  onAssignWorkerToWorkshop,
  onUnassignWorkerFromWorkshop,
  onAssignWorkerToNode,
  onFocusBuilding,
  onFocusKingdomHouse,
  onFocusNode,
  onOpenWorkshopInspector,
  onOpenCitadelInspector,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'kingdom' | 'workshops' | 'environment'>('kingdom');

  // Filter kingdom house building & workshop buildings
  const kingdomHouse = buildings.find((b) => b.defId === 'mon_kingdom_house');
  const workshops = buildings.filter((b) => {
    const def = definitions.find((d) => d.id === b.defId);
    return def && def.category === 'workshops';
  });

  // Calculate worker assignments for workshops
  const getAssignedWorkersCount = (bld: PlacedBuilding) => {
    return units.filter(
      (u) =>
        u.type === 'worker' &&
        (u.targetBuildingId === bld.instanceId ||
          (u.orderType === 'work_harvest' &&
            Math.hypot(u.x - bld.gridX * 2, u.z - bld.gridZ * 2) < 3.5))
    ).length;
  };

  // Calculate worker assignments for natural resource nodes
  const getNodeWorkersCount = (nodeId: string) => {
    return units.filter(
      (u) =>
        u.type === 'worker' &&
        (u.targetNodeId === nodeId ||
          (u.orderType === 'gather_node' && u.targetNodeId === nodeId))
    ).length;
  };

  const totalWorkers = units.filter((u) => u.type === 'worker').length;
  const idleWorkers = units.filter(
    (u) =>
      u.type === 'worker' &&
      u.state === 'idle' &&
      !u.targetBuildingId &&
      !u.targetNodeId &&
      u.orderType === 'idle'
  ).length;

  // Calculate real-time gathering rates (per minute) from workshops
  let woodPerMin = 0;
  let steelPerMin = 0;
  let concretePerMin = 0;

  workshops.forEach((bld) => {
    if (!bld.isConstructed) return;
    const def = definitions.find((d) => d.id === bld.defId);
    if (!def || !def.outputResource) return;
    const assigned = getAssignedWorkersCount(bld);
    if (assigned === 0) return;

    const cyclesPerMin = 60 / (def.productionInterval || 12);
    const generated = assigned * def.outputResource.amount * cyclesPerMin;

    if (def.outputResource.type === 'wood') woodPerMin += generated;
    if (def.outputResource.type === 'steel') steelPerMin += generated;
    if (def.outputResource.type === 'concrete') concretePerMin += generated;
  });

  // Count active environment nodes by type
  const activeNodes = resourceNodes.filter((n) => !n.isDepleted);
  const woodNodes = activeNodes.filter((n) => n.type === 'wood');
  const steelNodes = activeNodes.filter((n) => n.type === 'steel');
  const concreteNodes = activeNodes.filter((n) => n.type === 'concrete');

  const totalHeldInCargo = avatarCargo.wood + avatarCargo.steel + avatarCargo.concrete;
  const cargoFillPct = Math.min(100, Math.round((totalHeldInCargo / avatarCargo.maxCapacity) * 100));

  const totalDepositedAll = kingdomStats.totalWoodDeposited + kingdomStats.totalSteelDeposited + kingdomStats.totalConcreteDeposited;
  const tierProgressPct = Math.min(100, Math.round((kingdomStats.currentTierProgress / kingdomStats.tierTarget) * 100));

  return (
    <div
      id="panel_resource_gathering_hud"
      className="absolute top-20 left-3 z-20 pointer-events-auto w-90 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-amber-500/40 shadow-2xl shadow-black/70 overflow-hidden font-sans text-slate-100 transition-all duration-300"
    >
      {/* Header Bar */}
      <div
        className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-amber-950/70 via-slate-900/90 to-slate-900/90 border-b border-amber-500/30"
      >
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 cursor-pointer flex-1"
        >
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm">
            <Crown className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold tracking-wide flex items-center gap-1.5">
              <span className="text-amber-300">KINGDOM HARVEST & HOUSE</span>
              <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[10px] rounded-full font-mono font-semibold">
                Tier {kingdomStats.level}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              {totalDepositedAll} Total Deposited • {activeNodes.length} Wild Nodes
            </div>
          </div>
        </div>

        <button
          id="btn_toggle_gathering_panel"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Collapsed Mini Summary */}
      {!isExpanded && (
        <div className="px-3.5 py-2 flex items-center justify-between text-xs font-mono bg-slate-950/60">
          <div className="flex items-center gap-1 text-amber-300">
            <Trees className="w-3.5 h-3.5 text-amber-400" />
            <span>🪵 {Math.floor(resources.wood)}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-300">
            <Wrench className="w-3.5 h-3.5 text-slate-400" />
            <span>🔩 {Math.floor(resources.steel)}</span>
          </div>
          <div className="flex items-center gap-1 text-stone-300">
            <Layers className="w-3.5 h-3.5 text-stone-400" />
            <span>🧱 {Math.floor(resources.concrete)}</span>
          </div>
          <div className="flex items-center gap-1 text-amber-400">
            <Package className="w-3 h-3 text-amber-300" />
            <span>🎒 {totalHeldInCargo}/{avatarCargo.maxCapacity}</span>
          </div>
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-3 flex flex-col gap-2.5 max-h-[480px] overflow-y-auto">
          {/* Top Stock Summary Cards */}
          <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
            {/* Wood Stock */}
            <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-800/40 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] text-amber-400">
                <span className="font-semibold">WOOD</span>
                <Trees className="w-3 h-3" />
              </div>
              <div className="text-sm font-bold text-amber-200 mt-1">
                {Math.floor(resources.wood)}
                <span className="text-[9px] font-normal text-amber-400/80 ml-1">
                  (+{Math.round(woodPerMin)}/m)
                </span>
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">
                {woodNodes.length} Wild Groves
              </div>
            </div>

            {/* Steel Stock */}
            <div className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] text-slate-300">
                <span className="font-semibold">STEEL</span>
                <Wrench className="w-3 h-3" />
              </div>
              <div className="text-sm font-bold text-slate-200 mt-1">
                {Math.floor(resources.steel)}
                <span className="text-[9px] font-normal text-slate-400 ml-1">
                  (+{Math.round(steelPerMin)}/m)
                </span>
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">
                {steelNodes.length} Wild Veins
              </div>
            </div>

            {/* Concrete Stock */}
            <div className="p-2 rounded-xl bg-stone-800/50 border border-stone-700/60 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] text-stone-300">
                <span className="font-semibold">CONCRETE</span>
                <Layers className="w-3 h-3" />
              </div>
              <div className="text-sm font-bold text-stone-200 mt-1">
                {Math.floor(resources.concrete)}
                <span className="text-[9px] font-normal text-stone-400 ml-1">
                  (+{Math.round(concretePerMin)}/m)
                </span>
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">
                {concreteNodes.length} Wild Quarries
              </div>
            </div>
          </div>

          {/* Tab Switcher: Kingdom Citadel vs Workshops vs Environment Nodes */}
          <div className="grid grid-cols-3 p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] font-semibold">
            <button
              id="tab_gather_kingdom"
              onClick={() => setActiveTab('kingdom')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                activeTab === 'kingdom'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Citadel</span>
            </button>

            <button
              id="tab_gather_environment"
              onClick={() => setActiveTab('environment')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                activeTab === 'environment'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Wild ({activeNodes.length})</span>
            </button>

            <button
              id="tab_gather_workshops"
              onClick={() => setActiveTab('workshops')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                activeTab === 'workshops'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Hammer className="w-3.5 h-3.5" />
              <span>Workshops ({workshops.length})</span>
            </button>
          </div>

          {/* TAB 1: KINGDOM CITADEL & DEPOSITORY PROGRESS */}
          {activeTab === 'kingdom' && (
            <div className="flex flex-col gap-2.5">
              {/* Character Backpack Live Status Card */}
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-950/40 via-slate-800/80 to-slate-900 border border-amber-500/40 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white flex items-center gap-1.5">
                        <span>Character Backpack</span>
                        {isAutoReturning ? (
                          <span className="px-1.5 py-0.2 bg-blue-500/30 text-blue-300 border border-blue-500/40 rounded-full text-[9px] font-mono animate-pulse">
                            Auto-Routing to Citadel...
                          </span>
                        ) : totalHeldInCargo >= avatarCargo.maxCapacity ? (
                          <span className="px-1.5 py-0.2 bg-red-500/30 text-red-300 border border-red-500/40 rounded-full text-[9px] font-mono animate-bounce">
                            Full (Auto-Returns)!
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">
                            Auto-delivers at 25/25
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-amber-300/90 font-mono">
                        Held Cargo: {totalHeldInCargo} / {avatarCargo.maxCapacity} Items
                      </div>
                    </div>
                  </div>

                  {onReturnAvatarToKingdom && (
                    <button
                      id="btn_deliver_to_kingdom"
                      onClick={onReturnAvatarToKingdom}
                      disabled={isAutoReturning || totalHeldInCargo === 0}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-md ${
                        totalHeldInCargo > 0 && !isAutoReturning
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 animate-pulse'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                      title="Deliver backpack cargo to the Kingdom Citadel Depository"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Deliver</span>
                    </button>
                  )}
                </div>

                {/* Backpack Capacity Bar */}
                <div className="mt-2">
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-lime-400 to-cyan-400 rounded-full transition-all duration-300"
                      style={{ width: `${cargoFillPct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1">
                    <span className="text-amber-300">🪵 {avatarCargo.wood} Wood</span>
                    <span className="text-slate-300">🔩 {avatarCargo.steel} Steel</span>
                    <span className="text-stone-300">🧱 {avatarCargo.concrete} Concrete</span>
                    <span className="font-bold text-white">{cargoFillPct}% Full</span>
                  </div>
                </div>
              </div>

              {/* Kingdom Citadel Depository Card */}
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/80 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400">
                      <Crown className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                        <span>Kingdom House (Depository)</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold border ${
                          kingdomHouse && !kingdomHouse.isConstructed
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}>
                          {kingdomHouse && !kingdomHouse.isConstructed ? 'Under Construction' : `Tier ${kingdomStats.level} Citadel`}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {kingdomHouse && !kingdomHouse.isConstructed
                          ? 'Workers building Citadel mesh first'
                          : `${kingdomStats.totalDeliveries} Deliveries Recorded • +${kingdomStats.tierBonusPct}% Economy Boost`}
                      </div>
                    </div>
                  </div>

                  {onFocusKingdomHouse && (
                    <button
                      id="btn_focus_kingdom_house"
                      onClick={onFocusKingdomHouse}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-700 transition-colors"
                      title="Focus Camera on the Kingdom House"
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Construction Site Progress or Tier Progress */}
                {kingdomHouse && !kingdomHouse.isConstructed ? (
                  <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40">
                    <div className="flex items-center justify-between text-[10px] font-mono text-amber-300 mb-1">
                      <span className="flex items-center gap-1 font-semibold">
                        <Hammer className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                        Building Citadel Mesh Structure
                      </span>
                      <span className="font-bold text-amber-200">
                        {Math.round(kingdomHouse.progress)}% Complete
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-amber-700/60">
                      <div
                        className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, kingdomHouse.progress)}%` }}
                      />
                    </div>
                    <div className="text-[9px] text-amber-200/80 mt-1.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Workers build Citadel first, then automatically harvest and deliver wild resources here!</span>
                    </div>
                  </div>
                ) : (
                  /* Tier Progress Bar */
                  <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-300 mb-1">
                      <span className="flex items-center gap-1 text-amber-300 font-semibold">
                        <TrendingUp className="w-3 h-3 text-amber-400" />
                        Next Citadel Tier Progress
                      </span>
                      <span className="font-bold text-white">
                        {kingdomStats.currentTierProgress} / {kingdomStats.tierTarget} ({tierProgressPct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-700">
                      <div
                        className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 rounded-full transition-all duration-300"
                        style={{ width: `${tierProgressPct}%` }}
                      />
                    </div>
                    <div className="text-[9px] text-slate-400 mt-1">
                      Depository is open! Workers autonomously gather wild resources and deposit them here.
                    </div>
                  </div>
                )}

                {/* Depository Lifetime Totals */}
                <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
                  <div className="p-1.5 rounded bg-amber-950/30 border border-amber-900/40 text-center">
                    <div className="text-amber-400">🪵 Wood Deposited</div>
                    <div className="font-bold text-amber-200 text-xs mt-0.5">{kingdomStats.totalWoodDeposited}</div>
                  </div>
                  <div className="p-1.5 rounded bg-slate-900/50 border border-slate-700/60 text-center">
                    <div className="text-slate-300">🔩 Steel Deposited</div>
                    <div className="font-bold text-slate-100 text-xs mt-0.5">{kingdomStats.totalSteelDeposited}</div>
                  </div>
                  <div className="p-1.5 rounded bg-stone-900/50 border border-stone-700/60 text-center">
                    <div className="text-stone-300">🧱 Concrete Deposited</div>
                    <div className="font-bold text-stone-100 text-xs mt-0.5">{kingdomStats.totalConcreteDeposited}</div>
                  </div>
                </div>

                {/* Open Citadel Inspector & Recruitment Hub Button */}
                {onOpenCitadelInspector && (
                  <button
                    id="btn_open_citadel_inspector"
                    onClick={onOpenCitadelInspector}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition active:scale-95"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>Citadel Command & Recruit Hub</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ENVIRONMENT WILD NODES LIST */}
          {activeTab === 'environment' && (
            <div className="flex flex-col gap-2">
              {kingdomHouse && !kingdomHouse.isConstructed && (
                <div className="p-2 rounded-xl bg-amber-950/50 border border-amber-500/40 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-[10px] text-amber-200 leading-tight">
                    <span className="font-bold text-amber-300">Citadel Mesh Being Built First ({Math.round(kingdomHouse.progress)}%):</span> Workers will automatically harvest and deliver from these wild nodes once the Citadel Depository is ready!
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between px-1">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Wild Resource Deposits ({activeNodes.length})
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {idleWorkers} Workers Available
                </div>
              </div>

              {resourceNodes.map((node) => {
                const assignedCount = getNodeWorkersCount(node.id);
                const pct = Math.round((node.remaining / node.maxAmount) * 100);
                const icon =
                  node.type === 'wood' ? (
                    <Trees className="w-3.5 h-3.5 text-lime-400" />
                  ) : node.type === 'steel' ? (
                    <Pickaxe className="w-3.5 h-3.5 text-cyan-300" />
                  ) : (
                    <Mountain className="w-3.5 h-3.5 text-amber-300" />
                  );

                const colorBadge =
                  node.type === 'wood'
                    ? 'border-lime-500/40 bg-lime-950/40 text-lime-300'
                    : node.type === 'steel'
                    ? 'border-cyan-500/40 bg-cyan-950/40 text-cyan-300'
                    : 'border-amber-500/40 bg-amber-950/40 text-amber-300';

                return (
                  <div
                    key={node.id}
                    id={`card_node_${node.id}`}
                    className={`p-2.5 rounded-xl border transition-all flex flex-col gap-1.5 ${
                      node.isDepleted
                        ? 'bg-slate-900/40 border-slate-800 opacity-60'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-slate-950 border border-slate-800">
                          {icon}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                            <span>{node.name}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono border ${colorBadge}`}
                            >
                              {node.type.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Pos: ({Math.round(node.x)}, {Math.round(node.z)}) • {assignedCount} Harvesters
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {onFocusNode && (
                          <button
                            onClick={() => onFocusNode(node)}
                            className="p-1 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-slate-700"
                            title="Focus Camera on Resource Node"
                          >
                            <Crosshair className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!node.isDepleted && onAssignWorkerToNode && (
                          <button
                            id={`btn_gather_node_${node.id}`}
                            onClick={() => onAssignWorkerToNode(node.id)}
                            disabled={idleWorkers <= 0}
                            className="px-2 py-1 rounded bg-emerald-600/90 hover:bg-emerald-600 text-white disabled:opacity-40 text-[10px] font-semibold flex items-center gap-0.5 shadow-sm"
                            title="Dispatch worker to harvest node and haul back to Kingdom House"
                          >
                            <Plus className="w-3 h-3" /> Harvest
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Remaining Capacity Bar */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-300 mb-0.5">
                        <span>
                          {node.isDepleted ? 'Depleted (Regenerating...)' : 'Remaining Reserve'}
                        </span>
                        <span className="font-bold text-white">
                          {node.remaining} / {node.maxAmount} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            node.isDepleted
                              ? 'bg-slate-700'
                              : node.type === 'wood'
                              ? 'bg-lime-500'
                              : node.type === 'steel'
                              ? 'bg-cyan-400'
                              : 'bg-amber-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: WORKSHOPS LIST */}
          {activeTab === 'workshops' && (
            <div className="flex flex-col gap-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                Constructed Workshops ({workshops.length})
              </div>

              {workshops.length === 0 ? (
                <div className="p-3 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-xs text-slate-400 flex flex-col items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>No workshops built yet!</span>
                  <span className="text-[10px] text-slate-500">
                    Place Workshop Wood, Steel, or Concrete from the building bar.
                  </span>
                </div>
              ) : (
                workshops.map((bld) => {
                  const def = definitions.find((d) => d.id === bld.defId);
                  if (!def) return null;

                  const assigned = getAssignedWorkersCount(bld);
                  const isUnderConstruction = !bld.isConstructed;
                  const prodProg = bld.productionProgress || 0;

                  return (
                    <div
                      key={bld.instanceId}
                      id={`card_workshop_${bld.instanceId}`}
                      className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/70 transition-all flex flex-col gap-2"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              isUnderConstruction
                                ? 'bg-amber-500 animate-pulse'
                                : assigned > 0
                                ? 'bg-emerald-500'
                                : 'bg-slate-500'
                            }`}
                          />
                          <div className="font-bold text-xs text-slate-100">
                            {def.name}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onFocusBuilding(bld)}
                            className="p-1 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-slate-700"
                            title="Focus Camera on Workshop"
                          >
                            <Crosshair className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onOpenWorkshopInspector(bld.instanceId)}
                            className="px-2 py-0.5 rounded-md bg-slate-700 text-[10px] font-semibold text-slate-200 hover:bg-slate-600"
                          >
                            Details
                          </button>
                        </div>
                      </div>

                      {/* Progress / Status */}
                      {isUnderConstruction ? (
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-mono text-amber-300 mb-1">
                            <span>Under Construction</span>
                            <span>{Math.round(bld.progress)}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 transition-all duration-300"
                              style={{ width: `${bld.progress}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300 mb-1">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3 text-emerald-400" />
                              Cycle Progress ({assigned} Workers)
                            </span>
                            <span className="text-emerald-300 font-bold">
                              {Math.round(prodProg)}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-700">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-emerald-300 rounded-full transition-all duration-300"
                              style={{ width: `${prodProg}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Workers Controls & Harvest Stats */}
                      {bld.isConstructed && (
                        <div className="flex items-center justify-between pt-1 border-t border-slate-700/40 text-[11px]">
                          <div className="flex items-center gap-1 font-mono text-slate-300">
                            <Users className="w-3 h-3 text-blue-400" />
                            <span>{assigned} / 4 assigned</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              id={`btn_unassign_${bld.instanceId}`}
                              onClick={() => onUnassignWorkerFromWorkshop(bld.instanceId)}
                              disabled={assigned <= 0}
                              className="px-2 py-0.5 rounded bg-slate-700/80 hover:bg-slate-700 text-slate-300 disabled:opacity-40 text-[10px] font-semibold"
                              title="Recall worker from workshop"
                            >
                              - Worker
                            </button>
                            <button
                              id={`btn_assign_${bld.instanceId}`}
                              onClick={() => onAssignWorkerToWorkshop(bld.instanceId)}
                              disabled={idleWorkers <= 0 || assigned >= 4}
                              className="px-2 py-0.5 rounded bg-amber-600/80 hover:bg-amber-600 text-white disabled:opacity-40 text-[10px] font-semibold flex items-center gap-0.5 shadow-sm"
                              title="Assign idle worker to workshop"
                            >
                              <Plus className="w-3 h-3" /> Assign
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
