/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  HelpCircle,
  X,
  Keyboard,
  MousePointer,
  ShieldAlert,
  Flame,
  Upload,
  Compass,
  Hammer
} from 'lucide-react';

interface HelpTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpTutorialModal: React.FC<HelpTutorialModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">LIGHTHOUSE 橋 - Constructa Guide</h2>
              <p className="text-xs text-slate-400">Controls, survival tactics, and construction guide</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex flex-col gap-5 text-xs">
          {/* Key Controls Matrix */}
          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-amber-400" />
              <span>Keyboard & Mouse Controls</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { key: 'Left Click', desc: 'Place building / Target' },
                { key: 'Right Click + Drag', desc: 'Rotate 3D camera' },
                { key: 'Scroll Wheel', desc: 'Zoom in / out' },
                { key: 'WASD / Arrows', desc: 'Move camera or Avatar' },
                { key: '1 - 9 Keys', desc: 'Quick-select blueprints' },
                { key: 'Spacebar', desc: 'Pause / Resume time' },
                { key: 'G Key', desc: 'Toggle God Mode (Cheats)' },
                { key: 'U Key', desc: 'Open 3D Model Upload' },
                { key: 'M Key', desc: 'Toggle Radar Minimap' },
                { key: 'H Key', desc: 'Open this Help guide' },
                { key: 'Esc', desc: 'Cancel selection / Close' },
              ].map((item) => (
                <div
                  key={item.key}
                  className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col gap-0.5"
                >
                  <span className="font-mono font-bold text-amber-300 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700 w-fit">
                    {item.key}
                  </span>
                  <span className="text-slate-400 text-[11px] mt-1">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Gameplay Core Guide */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col gap-1.5">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Hammer className="w-4 h-4 text-blue-400" />
                <span>Construction Lifecycle</span>
              </span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Selecting a blueprint places a foundation site. Animated NPC workers swarm the site with cranes and scaffolding. Commercial structures generate revenue, while residential homes expand population.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col gap-1.5">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-red-400" />
                <span>Threats & Disasters</span>
              </span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Periodic waves bring fires, earthquakes, tornadoes, mafia cartels, zombie hordes, and alien UFOs. Build Fire Stations, Police Precincts, and Auto-Laser Turrets to defend your citizens.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col gap-1.5">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-indigo-400" />
                <span>Custom FBX/OBJ 3D Upload</span>
              </span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Import your own 3D assets via drag-and-drop. Classify models as custom skyscrapers, boss monsters, decorative props, or player avatars.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col gap-1.5">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-yellow-400" />
                <span>LIGHTHOUSE 橋 Monument</span>
              </span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                The crowning wonder of the city. Constructs a majestic lighthouse with a rotating searchlight beam, granting +50% morale and revenue.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors"
          >
            Got It, Let's Build!
          </button>
        </div>
      </div>
    </div>
  );
};
