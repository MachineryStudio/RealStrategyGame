/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlacedBuilding, BuildingDefinition, UnitEntity, GameResources, KingdomDepositoryStats } from '../types';
import {
  X,
  Hammer,
  Shield,
  Bot,
  Dog,
  Cat,
  Sparkles,
  Layers,
  Trees,
  Wrench,
  Users,
  Coins,
  Radio,
  Plus,
  Compass,
} from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface CitadelInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  building: PlacedBuilding | null;
  citadelDef: BuildingDefinition | null;
  units: UnitEntity[];
  resources: GameResources;
  kingdomStats: KingdomDepositoryStats;
  isGodMode: boolean;
  onSpawnUnit: (type: 'worker' | 'dog' | 'cat' | 'robot' | 'military' | 'fire_truck' | 'police') => void;
}

export const CitadelInspectorModal: React.FC<CitadelInspectorModalProps> = ({
  isOpen,
  onClose,
  building,
  citadelDef,
  units,
  resources,
  kingdomStats,
  isGodMode,
  onSpawnUnit,
}) => {
  if (!isOpen || !building) return null;

  const workersCount = units.filter((u) => u.type === 'worker').length;
  const dogsCount = units.filter((u) => u.type === 'dog').length;
  const catsCount = units.filter((u) => u.type === 'cat').length;
  const robotsCount = units.filter((u) => u.type === 'robot').length;

  const recruitOptions = [
    {
      type: 'worker' as const,
      name: 'Civil Engineer / Worker',
      desc: 'Autonomous builder & resource harvester. Gathers lumber, steel & concrete.',
      cost: { money: 50, wood: 10, steel: 0, concrete: 0 },
      icon: <Hammer className="w-5 h-5 text-amber-400" />,
      tag: 'Builder & Harvester',
      tagColor: 'bg-amber-950/60 text-amber-300 border-amber-500/40',
      hp: 120,
      speed: 4.2,
      count: workersCount,
    },
    {
      type: 'dog' as const,
      name: 'Guard Dog (Vigilant Pet)',
      desc: 'Loyal canine sentinel. Patrols near workers, barks alerts on monster approach, and bites attackers.',
      cost: { money: 75, wood: 15, steel: 0, concrete: 0 },
      icon: <Dog className="w-5 h-5 text-amber-500" />,
      tag: 'Vigilant Patrol & Bite',
      tagColor: 'bg-amber-900/60 text-amber-200 border-amber-500/40',
      hp: 220,
      speed: 6.2,
      count: dogsCount,
    },
    {
      type: 'cat' as const,
      name: 'Sentinel Cat (Agile Pet)',
      desc: 'Nimble feline scout. Senses stealth intruders, meows warnings, and executes high-speed claw pounces.',
      cost: { money: 80, wood: 0, steel: 10, concrete: 0 },
      icon: <Cat className="w-5 h-5 text-purple-400" />,
      tag: 'Agile Scout & Claw',
      tagColor: 'bg-purple-950/60 text-purple-300 border-purple-500/40',
      hp: 160,
      speed: 6.8,
      count: catsCount,
    },
    {
      type: 'robot' as const,
      name: 'Defense Sentinel Bot (Construct-O-Bot)',
      desc: 'High-tech hover mech. Continuously scans perimeter with rotating radar and fires twin plasma laser cannons.',
      cost: { money: 150, wood: 0, steel: 20, concrete: 10 },
      icon: <Bot className="w-5 h-5 text-cyan-400" />,
      tag: 'Hover Radar & Laser',
      tagColor: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40',
      hp: 340,
      speed: 5.5,
      count: robotsCount,
    },
  ];

  const canAfford = (cost: { money: number; wood: number; steel: number; concrete: number }) => {
    if (isGodMode) return true;
    return (
      resources.money >= cost.money &&
      resources.wood >= cost.wood &&
      resources.steel >= cost.steel &&
      resources.concrete >= cost.concrete
    );
  };

  const handleTrain = (type: 'worker' | 'dog' | 'cat' | 'robot') => {
    const opt = recruitOptions.find((o) => o.type === type);
    if (!opt) return;
    if (!canAfford(opt.cost)) {
      soundManager.playWarningBuzzer();
      return;
    }
    if (type === 'dog') soundManager.playDogBark();
    else if (type === 'cat') soundManager.playCatMeow();
    else if (type === 'robot') soundManager.playRobotBeep();
    else soundManager.playUnitOrder();

    onSpawnUnit(type);
  };

  return (
    <div
      id="modal_citadel_inspector"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in font-sans text-slate-100"
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-amber-500/60 rounded-3xl shadow-2xl shadow-amber-500/20 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/30">
              🏰
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-wide">
                  KINGDOM CITADEL & HEADQUARTERS
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 font-mono text-[10px] font-bold">
                  LEVEL {kingdomStats.level}
                </span>
              </div>
              <p className="text-xs text-amber-200/80">
                Settlement Core &bull; Unit Recruitment &bull; Resource Depository
              </p>
            </div>
          </div>

          <button
            id="btn_close_citadel_modal"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Depository Status Bar */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-mono text-slate-400">Total Deposited</span>
              <span className="text-sm font-bold text-amber-300">
                {kingdomStats.totalDeposited} Materials
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-mono text-slate-400">Active Workers</span>
              <span className="text-sm font-bold text-emerald-300">
                {workersCount} Builders
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-mono text-slate-400">Vigilant Pets</span>
              <span className="text-sm font-bold text-cyan-300">
                {dogsCount + catsCount + robotsCount} Guardians
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-mono text-slate-400">Citadel Armor</span>
              <span className="text-sm font-bold text-slate-200">
                {building.hp} / {building.maxHp} HP
              </span>
            </div>
          </div>

          {/* Unit Recruitment Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Train Characters & Vigilant Pets
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Available Gold: <strong className="text-amber-300">${resources.money}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recruitOptions.map((opt) => {
                const affordable = canAfford(opt.cost);
                return (
                  <div
                    key={opt.type}
                    id={`card_train_${opt.type}`}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-700 flex-shrink-0">
                            {opt.icon}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">{opt.name}</div>
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-mono border ${opt.tagColor} mt-0.5`}>
                              {opt.tag}
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          Qty: <strong className="text-white">{opt.count}</strong>
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>

                    {/* Cost & Train Button */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-300">
                        <span className="text-amber-400 font-bold">${opt.cost.money}</span>
                        {opt.cost.wood > 0 && <span>🪵 {opt.cost.wood}</span>}
                        {opt.cost.steel > 0 && <span>🔩 {opt.cost.steel}</span>}
                        {opt.cost.concrete > 0 && <span>🧱 {opt.cost.concrete}</span>}
                      </div>

                      <button
                        id={`btn_train_${opt.type}`}
                        onClick={() => handleTrain(opt.type)}
                        disabled={!affordable}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md ${
                          affordable
                            ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 shadow-amber-500/20 active:scale-95'
                            : 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Train
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Pet Instructions Box */}
          <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200/90 leading-relaxed flex items-center gap-3">
            <Radio className="w-5 h-5 text-amber-400 flex-shrink-0 animate-pulse" />
            <div>
              <strong>Vigilance Defense Tip:</strong> Dogs, cats, and robots automatically detect intruders and Godzilla within 20+ meters. They sound alerts and engage threats immediately to protect workers!
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Tip: You can also quick-recruit from the bottom right Army Bar.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
