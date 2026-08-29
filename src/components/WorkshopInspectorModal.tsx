/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlacedBuilding, BuildingDefinition, UnitEntity, GameResources } from '../types';
import {
  X,
  Hammer,
  Trees,
  Wrench,
  Layers,
  Users,
  Clock,
  Sparkles,
  TrendingUp,
  Shield,
  Activity,
  Plus,
  Minus,
  CheckCircle2,
} from 'lucide-react';

interface WorkshopInspectorModalProps {
  buildingInstanceId: string | null;
  buildings: PlacedBuilding[];
  definitions: BuildingDefinition[];
  units: UnitEntity[];
  resources: GameResources;
  isGodMode: boolean;
  onClose: () => void;
  onAssignWorker: (bldId: string) => void;
  onUnassignWorker: (bldId: string) => void;
  onInstantComplete: (bldId: string) => void;
}

export const WorkshopInspectorModal: React.FC<WorkshopInspectorModalProps> = ({
  buildingInstanceId,
  buildings = [],
  definitions = [],
  units = [],
  resources = { money: 0, wood: 0, steel: 0, concrete: 0, glass: 0, electronics: 0 },
  isGodMode = false,
  onClose,
  onAssignWorker,
  onUnassignWorker,
  onInstantComplete,
}) => {
  if (!buildingInstanceId) return null;

  const buildingList = buildings || [];
  const defList = definitions || [];
  const unitList = units || [];

  const building = buildingList.find((b) => b && b.instanceId === buildingInstanceId);
  if (!building) return null;

  const def = defList.find((d) => d && d.id === building.defId);
  if (!def) return null;

  const assignedWorkers = unitList.filter(
    (u) =>
      u &&
      u.type === 'worker' &&
      (u.targetBuildingId === building.instanceId ||
        (u.orderType === 'work_harvest' &&
          Math.hypot(u.x - building.gridX * 2, u.z - building.gridZ * 2) < 3.5))
  );

  const idleWorkers = unitList.filter(
    (u) => u && u.type === 'worker' && u.state === 'idle' && !u.targetBuildingId
  ).length;

  const cycleTime = def.productionInterval || 12;
  const prodProgress = building.productionProgress || 0;
  const output = def.outputResource || { type: 'wood', amount: 5 };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'wood':
        return <Trees className="w-5 h-5 text-amber-400" />;
      case 'steel':
        return <Wrench className="w-5 h-5 text-slate-300" />;
      case 'concrete':
        return <Layers className="w-5 h-5 text-stone-300" />;
      default:
        return <Hammer className="w-5 h-5 text-amber-400" />;
    }
  };

  const getResourceColor = (type: string) => {
    switch (type) {
      case 'wood':
        return 'text-amber-300 bg-amber-950/50 border-amber-800/60';
      case 'steel':
        return 'text-slate-200 bg-slate-800/60 border-slate-700/60';
      case 'concrete':
        return 'text-stone-200 bg-stone-800/60 border-stone-700/60';
      default:
        return 'text-amber-300 bg-amber-950/50 border-amber-800/60';
    }
  };

  return (
    <div
      id="modal_workshop_inspector"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div className="relative w-full max-w-lg bg-slate-900/95 border border-amber-500/40 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden font-sans text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
              {getResourceIcon(output.type)}
            </div>
            <div>
              <div className="text-base font-extrabold tracking-wide text-white flex items-center gap-2">
                <span>{def.name}</span>
                {building.isConstructed ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                    ACTIVE PRODUCTION
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono animate-pulse">
                    CONSTRUCTING (5 MIN)
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Grid: [{building.gridX}, {building.gridZ}] • ID: {building.instanceId.slice(0, 10)}...
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
          {/* Status & Description */}
          <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800">
            {def.description}
          </div>

          {/* Construction Status or Production Status */}
          {!building.isConstructed ? (
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-mono text-amber-300">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  5-Minute Construction Progress
                </span>
                <span className="font-bold text-sm">{Math.round(building.progress)}%</span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-300"
                  style={{ width: `${building.progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Direct workers near site to speed up construction</span>
                {isGodMode && (
                  <button
                    onClick={() => onInstantComplete(building.instanceId)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400"
                  >
                    ⚡ Instant Complete (God Mode)
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200">
                    Harvest Cycle Progress ({cycleTime}s cycle)
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {Math.round(prodProgress)}%
                </span>
              </div>

              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-emerald-300 rounded-full transition-all duration-300"
                  style={{ width: `${prodProgress}%` }}
                />
              </div>

              {/* Yield Matrix */}
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${getResourceColor(output.type)}`}>
                  <span className="text-[10px] uppercase font-mono opacity-80">Output per Batch</span>
                  <span className="text-base font-extrabold mt-1">
                    +{output.amount * Math.max(1, assignedWorkers.length)} {output.type.toUpperCase()}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Estimated Speed</span>
                  <span className="text-base font-extrabold text-white mt-1">
                    +{Math.round((60 / cycleTime) * output.amount * assignedWorkers.length)} / min
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Assigned Workers Manager */}
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-slate-200">
                  Assigned Artisans & Craftsmen ({assignedWorkers.length} / 4)
                </span>
              </div>
              <span className="text-xs text-amber-400 font-mono">
                {idleWorkers} available
              </span>
            </div>

            {/* Workers List / Slots */}
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((slotIdx) => {
                const worker = assignedWorkers[slotIdx];
                return (
                  <div
                    key={slotIdx}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 min-h-[70px] text-center ${
                      worker
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                        : 'bg-slate-900/50 border-dashed border-slate-800 text-slate-500'
                    }`}
                  >
                    {worker ? (
                      <>
                        <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-300 font-mono text-[10px] font-bold">
                          W{slotIdx + 1}
                        </div>
                        <span className="text-[10px] font-medium truncate w-full">
                          Active
                        </span>
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4 opacity-40" />
                        <span className="text-[10px]">Empty</span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                id="btn_modal_unassign_worker"
                onClick={() => onUnassignWorker(building.instanceId)}
                disabled={assignedWorkers.length === 0}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
                Unassign Worker
              </button>

              <button
                id="btn_modal_assign_worker"
                onClick={() => onAssignWorker(building.instanceId)}
                disabled={idleWorkers === 0 || assignedWorkers.length >= 4}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Assign Idle Worker
              </button>
            </div>
          </div>

          {/* Building Durability / Stats */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-500" />
              Structural Integrity: {building.hp} / {building.maxHp} HP
            </span>
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Efficiency: 100%
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Tip: You can also right-click any Workshop directly in 3D to send selected units to work.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
