/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  GameResources,
  GameStats,
  WeatherType,
  ViewMode,
  ThreatLevel
} from '../types';
import {
  Trees,
  Wrench,
  Layers,
  Sparkles,
  Cpu,
  Coins,
  Users,
  Smile,
  Sun,
  Moon,
  CloudRain,
  CloudLightning,
  CloudFog,
  Snowflake,
  Play,
  Pause,
  FastForward,
  Compass,
  Volume2,
  VolumeX,
  Upload,
  ShieldAlert,
  Award,
  HelpCircle,
  Camera,
  Flame,
  SlidersHorizontal
} from 'lucide-react';

interface GameHUDProps {
  resources: GameResources;
  stats: GameStats;
  weather: WeatherType;
  threatLevel: ThreatLevel;
  activeThreatCount: number;
  gameSpeed: number;
  viewMode: ViewMode;
  isGodMode: boolean;
  isMuted: boolean;
  unclaimedQuestsCount: number;
  onSetGameSpeed: (spd: number) => void;
  onToggleViewMode: () => void;
  onToggleGodMode: () => void;
  onToggleMute: () => void;
  onOpenUpload: () => void;
  onOpenQuests: () => void;
  onOpenHelp: () => void;
  onOpenAdmin: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  resources,
  stats,
  weather,
  threatLevel,
  activeThreatCount,
  gameSpeed,
  viewMode,
  isGodMode,
  isMuted,
  unclaimedQuestsCount,
  onSetGameSpeed,
  onToggleViewMode,
  onToggleGodMode,
  onToggleMute,
  onOpenUpload,
  onOpenQuests,
  onOpenHelp,
  onOpenAdmin,
}) => {
  const getWeatherIcon = () => {
    switch (weather) {
      case 'rain': return <CloudRain className="w-4 h-4 text-blue-400" />;
      case 'storm': return <CloudLightning className="w-4 h-4 text-amber-400" />;
      case 'fog': return <CloudFog className="w-4 h-4 text-slate-300" />;
      case 'snow': return <Snowflake className="w-4 h-4 text-cyan-200" />;
      default: return <Sun className="w-4 h-4 text-amber-300" />;
    }
  };

  const getThreatBadge = () => {
    switch (threatLevel) {
      case 'critical':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600/90 text-white rounded-md text-xs font-bold animate-pulse shadow-lg shadow-red-500/30">
            <Flame className="w-3.5 h-3.5" />
            <span>CRITICAL ALERT ({activeThreatCount})</span>
          </div>
        );
      case 'high':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-600/90 text-white rounded-md text-xs font-bold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>HIGH THREAT ({activeThreatCount})</span>
          </div>
        );
      case 'medium':
        return (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/30 text-yellow-300 border border-yellow-500/40 rounded-md text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>CAUTION</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md text-xs font-semibold">
            <Compass className="w-3.5 h-3.5" />
            <span>DEFENSES NOMINAL</span>
          </div>
        );
    }
  };

  const formatTime = (h: number) => {
    const hours = Math.floor(h);
    const mins = Math.floor((h - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  return (
    <header className="absolute top-0 left-0 right-0 p-3 pointer-events-none flex flex-col gap-2 z-20">
      {/* Top Banner Row */}
      <div className="flex items-center justify-between gap-2 pointer-events-auto">
        {/* Company & Brand Logo */}
        <div className="flex items-center gap-2.5 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 shadow-xl">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
            橋
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-wider text-sm bg-gradient-to-r from-amber-400 via-amber-200 to-slate-100 bg-clip-text text-transparent">
                LIGHTHOUSE
              </span>
              <span className="text-xs px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-mono">
                CONSTRUCTA
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">3D City Survival Simulator</div>
          </div>
        </div>

        {/* Resource Counter Pill Bar */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 shadow-xl text-xs font-mono">
          {/* Wood */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-950/40 text-amber-300 rounded-lg border border-amber-900/40">
            <Trees className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold">{Math.floor(resources.wood)}</span>
          </div>

          {/* Steel */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/80 text-slate-200 rounded-lg border border-slate-700">
            <Wrench className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-bold">{Math.floor(resources.steel)}</span>
          </div>

          {/* Concrete */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-stone-800/80 text-stone-200 rounded-lg border border-stone-700">
            <Layers className="w-3.5 h-3.5 text-stone-300" />
            <span className="font-bold">{Math.floor(resources.concrete)}</span>
          </div>

          {/* Glass */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-cyan-950/40 text-cyan-300 rounded-lg border border-cyan-800/40">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold">{Math.floor(resources.glass)}</span>
          </div>

          {/* Electronics */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-950/40 text-purple-300 rounded-lg border border-purple-800/40">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-bold">{Math.floor(resources.electronics)}</span>
          </div>

          {/* Money */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/60 text-emerald-300 rounded-lg border border-emerald-700/60">
            <Coins className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-extrabold text-sm">${Math.floor(resources.money).toLocaleString()}</span>
          </div>
        </div>

        {/* City Stats & Threat Level */}
        <div className="flex items-center gap-2">
          {getThreatBadge()}

          {/* Population */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-200">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-bold">{stats.population}</span>
          </div>

          {/* Morale / Happiness */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-200">
            <Smile className="w-3.5 h-3.5 text-pink-400" />
            <span className="font-bold">{Math.round(stats.happiness)}%</span>
          </div>

          {/* Time & Weather */}
          <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-200">
            {stats.timeOfDay >= 6 && stats.timeOfDay <= 18 ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span>{formatTime(stats.timeOfDay)}</span>
            <div className="w-px h-3.5 bg-slate-700" />
            {getWeatherIcon()}
          </div>
        </div>
      </div>

      {/* Action Controls Bar */}
      <div className="flex items-center justify-between gap-2 pointer-events-auto mt-1">
        {/* Speed Controls & Mode */}
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-lg">
          <button
            id="btn_speed_pause"
            onClick={() => onSetGameSpeed(gameSpeed === 0 ? 1 : 0)}
            title="Pause / Resume (Space)"
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
              gameSpeed === 0 ? 'bg-amber-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            {gameSpeed === 0 ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{gameSpeed === 0 ? 'Paused' : 'Playing'}</span>
          </button>

          <button
            id="btn_speed_1x"
            onClick={() => onSetGameSpeed(1)}
            className={`px-2 py-1 rounded-lg text-xs font-mono ${
              gameSpeed === 1 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            1x
          </button>
          <button
            id="btn_speed_2x"
            onClick={() => onSetGameSpeed(2)}
            className={`px-2 py-1 rounded-lg text-xs font-mono ${
              gameSpeed === 2 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            2x
          </button>
          <button
            id="btn_speed_5x"
            onClick={() => onSetGameSpeed(5)}
            className={`px-2 py-1 rounded-lg text-xs font-mono flex items-center gap-0.5 ${
              gameSpeed === 5 ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <FastForward className="w-3 h-3" />
            <span>5x</span>
          </button>
        </div>

        {/* Action Buttons: Quests, Upload, God Mode, View Mode, Help */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-lg">
          {/* Quests & Objectives */}
          <button
            id="btn_quests"
            onClick={onOpenQuests}
            className="relative px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700/60"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Objectives</span>
            {unclaimedQuestsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold animate-bounce">
                {unclaimedQuestsCount}
              </span>
            )}
          </button>

          {/* 3D Model Upload (FBX / OBJ) */}
          <button
            id="btn_model_upload"
            onClick={onOpenUpload}
            className="px-3 py-1.5 rounded-lg bg-indigo-600/30 text-indigo-200 hover:bg-indigo-600/50 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Upload 3D (U)</span>
          </button>

          {/* Camera View Mode */}
          <button
            id="btn_view_mode"
            onClick={onToggleViewMode}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
            title="Toggle View (Orbit / 1st Person / 3rd Person Avatar)"
          >
            <Camera className="w-3.5 h-3.5 text-sky-400" />
            <span className="capitalize">{viewMode.replace('_', ' ')}</span>
          </button>

          {/* God Mode Toggle */}
          <button
            id="btn_god_mode"
            onClick={onToggleGodMode}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
              isGodMode
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/30'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
            title="God Mode: Unlimited resources & Instant build (G)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>GOD MODE {isGodMode ? 'ON' : 'OFF'}</span>
          </button>

          {/* Admin Control Drawer */}
          <button
            id="btn_admin_panel"
            onClick={onOpenAdmin}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            title="Admin Cheats & Threat Spawner"
          >
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Sound Mute */}
          <button
            id="btn_sound_mute"
            onClick={onToggleMute}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            title="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
          </button>

          {/* Help & Tutorial */}
          <button
            id="btn_help_tutorial"
            onClick={onOpenHelp}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            title="Tutorial & Controls (H)"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
