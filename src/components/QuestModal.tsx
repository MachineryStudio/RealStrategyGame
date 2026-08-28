/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Quest, Achievement } from '../types';
import {
  Award,
  X,
  CheckCircle2,
  Lock,
  Sparkles,
  Gift,
  Coins,
  Hammer,
  Flame,
  Shield,
  Crosshair,
  Box,
  Trees
} from 'lucide-react';

interface QuestModalProps {
  isOpen: boolean;
  quests: Quest[];
  achievements: Achievement[];
  onClose: () => void;
  onClaimReward: (quest: Quest) => void;
}

export const QuestModal: React.FC<QuestModalProps> = ({
  isOpen,
  quests,
  achievements,
  onClose,
  onClaimReward,
}) => {
  const [activeTab, setActiveTab] = useState<'quests' | 'achievements'>('quests');

  if (!isOpen) return null;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Hammer': return <Hammer className="w-4 h-4 text-amber-400" />;
      case 'Flame': return <Flame className="w-4 h-4 text-red-400" />;
      case 'Shield': return <Shield className="w-4 h-4 text-blue-400" />;
      case 'Crosshair': return <Crosshair className="w-4 h-4 text-cyan-400" />;
      case 'Sparkles': return <Sparkles className="w-4 h-4 text-yellow-400" />;
      default: return <Box className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600/30 border border-amber-500/40 text-amber-300 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">City Objectives & Honors</h2>
              <p className="text-xs text-slate-400">Complete milestones to earn grants, resources, and architectural fame</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 px-5 pt-2 bg-slate-900/50">
          <button
            onClick={() => setActiveTab('quests')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'quests'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Active Missions ({quests.filter((q) => !q.claimed).length})
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'achievements'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Badges & Trophies ({achievements.filter((a) => a.unlocked).length}/{achievements.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex flex-col gap-3">
          {activeTab === 'quests' ? (
            quests.map((quest) => {
              const isReadyToClaim = quest.completed && !quest.claimed;
              const pct = Math.min(100, Math.round((quest.progress / quest.target) * 100));

              return (
                <div
                  key={quest.id}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    quest.claimed
                      ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                      : isReadyToClaim
                      ? 'bg-amber-950/30 border-amber-500/50 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-800/60 border-slate-700/80'
                  }`}
                >
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-100">{quest.title}</span>
                      {quest.claimed && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                          Claimed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{quest.description}</p>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-700">
                        <div
                          className={`h-full transition-all duration-300 ${
                            quest.completed ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {quest.progress}/{quest.target}
                      </span>
                    </div>
                  </div>

                  {/* Reward & Claim */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-800/40">
                      <Coins className="w-3.5 h-3.5" />
                      <span>+${quest.rewardMoney}</span>
                    </div>

                    {isReadyToClaim ? (
                      <button
                        onClick={() => onClaimReward(quest)}
                        className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/30 hover:scale-105 transition-all flex items-center gap-1"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>Claim</span>
                      </button>
                    ) : quest.claimed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <div className="text-[11px] text-slate-500 font-medium px-2 py-1">In Progress</div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {achievements.map((ach) => (
                <div
                  key={ach.id}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                    ach.unlocked
                      ? 'bg-amber-950/20 border-amber-500/40 text-slate-100 shadow-md shadow-amber-500/10'
                      : 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-60'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      ach.unlocked
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-600'
                    }`}
                  >
                    {ach.unlocked ? renderIcon(ach.icon) : <Lock className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-200">{ach.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{ach.description}</div>
                    {ach.unlocked && (
                      <span className="text-[10px] text-amber-400 font-mono mt-1 block">🏆 Unlocked</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
