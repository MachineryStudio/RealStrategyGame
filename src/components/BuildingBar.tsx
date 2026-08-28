/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BuildingDefinition, BuildingCategory, GameResources } from '../types';
import {
  Home,
  Store,
  Route,
  Shield,
  Compass,
  Sparkles,
  X,
  Hammer,
  Trash2,
  Lock,
  AlertTriangle,
  Trees,
  Wrench,
  Layers,
  Cpu,
  Coins
} from 'lucide-react';

interface BuildingBarProps {
  definitions: BuildingDefinition[];
  selectedDef: BuildingDefinition | null;
  resources: GameResources;
  isGodMode: boolean;
  isDemolishMode: boolean;
  onSelectBuilding: (def: BuildingDefinition | null) => void;
  onCannotAfford?: (def: BuildingDefinition, reason: string) => void;
  onToggleDemolish: () => void;
  onDeployCounterMeasure: (type: 'fire_truck' | 'police' | 'engineer' | 'military' | 'medic') => void;
}

export const BuildingBar: React.FC<BuildingBarProps> = ({
  definitions,
  selectedDef,
  resources,
  isGodMode,
  isDemolishMode,
  onSelectBuilding,
  onCannotAfford,
  onToggleDemolish,
  onDeployCounterMeasure,
}) => {
  const [activeCategory, setActiveCategory] = useState<BuildingCategory>('workshops');

  const categories: { id: BuildingCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'workshops', label: 'Workshops', icon: <Hammer className="w-4 h-4 text-amber-400" /> },
    { id: 'residential', label: 'Residential', icon: <Home className="w-4 h-4" /> },
    { id: 'commercial', label: 'Commercial', icon: <Store className="w-4 h-4" /> },
    { id: 'infrastructure', label: 'Infrastructure', icon: <Route className="w-4 h-4" /> },
    { id: 'defense', label: 'Defense', icon: <Shield className="w-4 h-4" /> },
    { id: 'monument', label: 'Monuments', icon: <Compass className="w-4 h-4" /> },
    { id: 'custom', label: 'Custom 3D', icon: <Sparkles className="w-4 h-4 text-cyan-400" /> },
  ];

  const filteredBuildings = definitions.filter((b) => b.category === activeCategory);

  const getMissingCostSummary = (def: BuildingDefinition) => {
    if (isGodMode) return { canAfford: true, missingText: '' };
    const missing: string[] = [];
    if (resources.wood < def.cost.wood) missing.push(`🪵 ${Math.floor(resources.wood)}/${def.cost.wood} Wood`);
    if (resources.steel < def.cost.steel) missing.push(`🔩 ${Math.floor(resources.steel)}/${def.cost.steel} Steel`);
    if (resources.concrete < def.cost.concrete) missing.push(`🧱 ${Math.floor(resources.concrete)}/${def.cost.concrete} Concrete`);
    if (resources.glass < def.cost.glass) missing.push(`🪟 ${Math.floor(resources.glass)}/${def.cost.glass} Glass`);
    if (resources.electronics < def.cost.electronics) missing.push(`💻 ${Math.floor(resources.electronics)}/${def.cost.electronics} Electronics`);
    if (resources.money < def.cost.money) missing.push(`💰 $${Math.floor(resources.money)}/$${def.cost.money} Money`);

    return {
      canAfford: missing.length === 0,
      missingText: missing.join(', '),
    };
  };

  const handleCardClick = (def: BuildingDefinition) => {
    const isSelected = selectedDef?.id === def.id;
    if (isSelected) {
      // Deselect
      onSelectBuilding(null);
      return;
    }

    const { canAfford, missingText } = getMissingCostSummary(def);
    if (!canAfford) {
      // CANCEL THE ACTION: Do not select, cancel any existing selection, and trigger warning
      onSelectBuilding(null);
      if (onCannotAfford) {
        onCannotAfford(def, missingText);
      }
      return;
    }

    // Affordable: Select definition
    onSelectBuilding(def);
  };

  return (
    <footer className="absolute bottom-0 left-0 right-0 p-3 pointer-events-none flex flex-col items-center gap-2 z-20">
      {/* Selected Action Status Pill */}
      {selectedDef && (
        <div className="flex items-center gap-3 bg-slate-900/95 backdrop-blur-md px-4 py-2 rounded-xl border border-amber-500/50 shadow-2xl shadow-amber-500/10 pointer-events-auto animate-fade-in">
          <div className="flex items-center gap-2 text-xs">
            <Hammer className="w-4 h-4 text-amber-400 animate-bounce" />
            <span className="text-slate-300">Ready to construct:</span>
            <span className="font-bold text-amber-300">{selectedDef.name}</span>
            <span className="text-slate-400 font-mono text-[11px]">({selectedDef.size[0]}x{selectedDef.size[1]} Grid)</span>
          </div>
          <button
            onClick={() => onSelectBuilding(null)}
            className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Cancel selection (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isDemolishMode && (
        <div className="flex items-center gap-3 bg-red-950/95 backdrop-blur-md px-4 py-2 rounded-xl border border-red-500/50 shadow-2xl shadow-red-500/20 pointer-events-auto">
          <div className="flex items-center gap-2 text-xs text-red-200">
            <Trash2 className="w-4 h-4 text-red-400 animate-pulse" />
            <span className="font-bold">DEMOLISH MODE ACTIVE:</span>
            <span>Click any building on the map to remove it.</span>
          </div>
          <button
            onClick={onToggleDemolish}
            className="px-2 py-0.5 rounded bg-red-800 text-white text-xs font-semibold hover:bg-red-700"
          >
            Done
          </button>
        </div>
      )}

      {/* Main Dock Container */}
      <div className="w-full max-w-4xl bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-800 p-2.5 shadow-2xl pointer-events-auto flex flex-col gap-2">
        {/* Category Tabs & Tool Actions */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          <div className="flex items-center gap-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                id={`tab_${cat.id}`}
                onClick={() => {
                  setActiveCategory(cat.id);
                  if (isDemolishMode) onToggleDemolish();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  activeCategory === cat.id && !isDemolishMode
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Quick Countermeasure Dispatch / Demolish */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              id="btn_demolish"
              onClick={onToggleDemolish}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                isDemolishMode
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-700'
              }`}
              title="Bulldoze / Demolish building"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Demolish</span>
            </button>

            {/* Quick Dispatch Menu */}
            <button
              id="btn_deploy_police"
              onClick={() => onDeployCounterMeasure('police')}
              className="px-2 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-800/40 text-[11px] font-semibold"
              title="Deploy Police Cruiser ($50)"
            >
              + Police
            </button>
            <button
              id="btn_deploy_fire"
              onClick={() => onDeployCounterMeasure('fire_truck')}
              className="px-2 py-1 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/40 text-[11px] font-semibold"
              title="Deploy Fire Engine ($50)"
            >
              + Fire Truck
            </button>
            <button
              id="btn_deploy_military"
              onClick={() => onDeployCounterMeasure('military')}
              className="px-2 py-1 rounded-lg bg-lime-950/60 hover:bg-lime-900/80 text-lime-300 border border-lime-800/40 text-[11px] font-semibold"
              title="Deploy Combat Unit ($100)"
            >
              + Military
            </button>
          </div>
        </div>

        {/* Building Cards Horizontal List */}
        <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1 pt-0.5">
          {filteredBuildings.length === 0 ? (
            <div className="py-4 text-center w-full text-slate-500 text-xs font-mono">
              No blueprints in this category. Upload custom .OBJ / .FBX models to expand!
            </div>
          ) : (
            filteredBuildings.map((def, idx) => {
              const { canAfford, missingText } = getMissingCostSummary(def);
              const isSelected = selectedDef?.id === def.id;

              return (
                <button
                  key={def.id}
                  id={`btn_build_${def.id}`}
                  onClick={() => handleCardClick(def)}
                  title={!canAfford ? `Insufficient resources! Missing: ${missingText}` : `Click to select ${def.name}`}
                  className={`group relative flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all shrink-0 w-44 ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 shadow-lg shadow-amber-500/20 scale-[1.02]'
                      : canAfford
                      ? 'bg-slate-800/80 hover:bg-slate-750 border-slate-700/80 hover:border-slate-600'
                      : 'bg-slate-900/70 border-red-900/40 opacity-70 hover:border-red-500/50 hover:bg-red-950/20 cursor-not-allowed'
                  }`}
                >
                  {/* Quick Select Key Badge or Lock Badge */}
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                    {!canAfford && (
                      <span className="p-0.5 rounded bg-red-950/90 border border-red-500/60 text-red-400 text-[9px] flex items-center justify-center">
                        <Lock className="w-2.5 h-2.5" />
                      </span>
                    )}
                    {idx < 9 && (
                      <div className="w-4 h-4 rounded bg-slate-900/80 border border-slate-700 text-[10px] text-slate-400 font-mono flex items-center justify-center">
                        {idx + 1}
                      </div>
                    )}
                  </div>

                  {/* Header */}
                  <div>
                    <div className="font-bold text-xs text-slate-100 group-hover:text-amber-300 transition-colors truncate pr-8 flex items-center gap-1">
                      <span>{def.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {def.description}
                    </div>
                  </div>

                  {/* Stats Tag */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 font-mono my-1">
                    {def.category === 'workshops' && def.outputResource && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        {def.outputResource.type === 'wood' && `🪵 +${def.outputResource.amount}/cycle`}
                        {def.outputResource.type === 'steel' && `🔩 +${def.outputResource.amount}/cycle`}
                        {def.outputResource.type === 'concrete' && `🧱 +${def.outputResource.amount}/cycle`}
                      </span>
                    )}
                    {def.buildTime >= 60 && (
                      <span className="text-slate-400">⏱️ {Math.round(def.buildTime / 60)}m</span>
                    )}
                    {def.populationProvided && (
                      <span className="text-blue-300">+{def.populationProvided} Pop</span>
                    )}
                    {def.incomeRate && (
                      <span className="text-emerald-300">+${def.incomeRate}/s</span>
                    )}
                    {def.defensePower && (
                      <span className="text-amber-300">{def.defensePower} Def</span>
                    )}
                    {def.happinessBonus && (
                      <span className="text-pink-300">+{def.happinessBonus}% Happy</span>
                    )}
                  </div>

                  {/* Resource Cost Matrix & Affordability Feedback */}
                  <div className="flex flex-col gap-1 border-t border-slate-700/50 pt-1.5">
                    <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono">
                      {def.cost.money > 0 && (
                        <span className={`font-bold ${resources.money >= def.cost.money || isGodMode ? 'text-emerald-400' : 'text-red-400'}`}>
                          ${def.cost.money}
                        </span>
                      )}
                      {def.cost.wood > 0 && (
                        <span className={`${resources.wood >= def.cost.wood || isGodMode ? 'text-amber-300' : 'text-red-400 font-bold'}`}>
                          🪵{def.cost.wood}
                        </span>
                      )}
                      {def.cost.steel > 0 && (
                        <span className={`${resources.steel >= def.cost.steel || isGodMode ? 'text-slate-300' : 'text-red-400 font-bold'}`}>
                          ⚙️{def.cost.steel}
                        </span>
                      )}
                      {def.cost.concrete > 0 && (
                        <span className={`${resources.concrete >= def.cost.concrete || isGodMode ? 'text-stone-300' : 'text-red-400 font-bold'}`}>
                          🧱{def.cost.concrete}
                        </span>
                      )}
                      {def.cost.glass > 0 && (
                        <span className={`${resources.glass >= def.cost.glass || isGodMode ? 'text-cyan-300' : 'text-red-400 font-bold'}`}>
                          🪟{def.cost.glass}
                        </span>
                      )}
                      {def.cost.electronics > 0 && (
                        <span className={`${resources.electronics >= def.cost.electronics || isGodMode ? 'text-purple-300' : 'text-red-400 font-bold'}`}>
                          💻{def.cost.electronics}
                        </span>
                      )}
                    </div>
                    {!canAfford && (
                      <div className="text-[9px] font-mono text-red-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5 shrink-0 text-red-400" />
                        <span className="truncate">Need more resources</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </footer>
  );
};
