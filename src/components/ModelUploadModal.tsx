/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CustomModelBlueprint, BuildingDefinition } from '../types';
import { ModelLoaderService } from '../game/modelLoader';
import {
  Upload,
  X,
  Sparkles,
  Layers,
  ShieldAlert,
  User,
  Trees,
  Check,
  Plus,
  Box,
  Sliders,
  Play
} from 'lucide-react';

interface ModelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBlueprint: (blueprint: CustomModelBlueprint, asBuildingDef?: BuildingDefinition) => void;
  onSpawnCustomEnemy?: (blueprint: CustomModelBlueprint) => void;
}

export const ModelUploadModal: React.FC<ModelUploadModalProps> = ({
  isOpen,
  onClose,
  onAddBlueprint,
  onSpawnCustomEnemy,
}) => {
  const [modelName, setModelName] = useState('Custom Cyber Structure');
  const [role, setRole] = useState<'building' | 'decoration' | 'enemy' | 'avatar'>('building');
  const [scale, setScale] = useState<number>(1.0);
  const [selectedFormat, setSelectedFormat] = useState<'obj' | 'fbx'>('obj');
  const [customColor, setCustomColor] = useState('#06b6d4');
  const [previewGroup, setPreviewGroup] = useState<THREE.Group | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: number }[]>([]);
  const [rawTextContent, setRawTextContent] = useState<string>('');

  const previewCanvasRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Setup mini 3D preview viewport
  useEffect(() => {
    if (!isOpen || !previewCanvasRef.current) return;
    const container = previewCanvasRef.current;
    const width = container.clientWidth || 320;
    const height = container.clientHeight || 240;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(4, 4, 6);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.0;
    controlsRef.current = controls;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(5, 10, 5);
    scene.add(dir);

    // Ground Grid in preview
    const grid = new THREE.GridHelper(10, 10, 0x38bdf8, 0x334155);
    scene.add(grid);

    // Initial preset preview
    const initialPreset = ModelLoaderService.createPresetModel('custom_cyber_spire');
    scene.add(initialPreset);
    setPreviewGroup(initialPreset);

    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      controls.dispose();
      renderer.dispose();
    };
  }, [isOpen]);

  // Update scale or preview mesh
  const setPreviewMesh = (group: THREE.Group) => {
    if (!sceneRef.current) return;
    if (previewGroup) {
      sceneRef.current.remove(previewGroup);
    }
    group.scale.set(scale, scale, scale);
    sceneRef.current.add(group);
    setPreviewGroup(group);
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const isFbx = file.name.toLowerCase().endsWith('.fbx');
    const isObj = file.name.toLowerCase().endsWith('.obj');
    setSelectedFormat(isFbx ? 'fbx' : 'obj');
    setModelName(file.name.replace(/\.[^/.]+$/, ''));

    setUploadedFiles(Array.from(files).map((f) => ({ name: f.name, size: f.size })));

    if (isObj) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setRawTextContent(text);
        const parsed = ModelLoaderService.parseOBJ(text);
        setPreviewMesh(parsed);
      };
      reader.readAsText(file);
    } else if (isFbx) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        const parsed = ModelLoaderService.parseFBX(buffer);
        setPreviewMesh(parsed);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleSelectPreset = (presetId: string, name: string, defaultRole: 'building' | 'enemy' | 'decoration') => {
    setModelName(name);
    setRole(defaultRole);
    const model = ModelLoaderService.createPresetModel(presetId);
    setPreviewMesh(model);
  };

  const handleSaveBlueprint = () => {
    const id = `custom_${Date.now()}`;
    const blueprint: CustomModelBlueprint = {
      id,
      name: modelName,
      format: selectedFormat,
      role,
      rawContent: rawTextContent,
      scale,
      color: customColor,
    };

    let buildingDef: BuildingDefinition | undefined;
    if (role === 'building') {
      buildingDef = {
        id,
        name: modelName,
        category: 'custom',
        description: `Imported ${selectedFormat.toUpperCase()} custom 3D architecture.`,
        cost: {
          wood: 30,
          steel: 60,
          concrete: 50,
          glass: 40,
          electronics: 20,
          money: 500,
        },
        buildTime: 12,
        size: [3, 3],
        height: 10 * scale,
        incomeRate: 15,
        happinessBonus: 10,
        maxHp: 1500,
        iconName: 'Sparkles',
        customModelData: rawTextContent || 'custom_model',
        customModelType: selectedFormat,
      };
    }

    onAddBlueprint(blueprint, buildingDef);

    if (role === 'enemy' && onSpawnCustomEnemy) {
      onSpawnCustomEnemy(blueprint);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">3D Model Importer (FBX & OBJ)</h2>
              <p className="text-xs text-slate-400">
                Import custom 3D models as Buildings, Enemies, Avatars, or Decor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 overflow-y-auto">
          {/* Left: 3D Preview Canvas */}
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Live 3D Viewport (Rotate & Inspect)</span>
            </label>

            <div
              ref={previewCanvasRef}
              className="w-full h-56 rounded-xl border border-slate-700/80 bg-slate-950 overflow-hidden shadow-inner relative"
            />

            {/* Quick Presets Carousel */}
            <div className="flex flex-col gap-1 mt-1">
              <span className="text-[11px] font-mono text-slate-400">Quick Template Blueprints:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectPreset('custom_cyber_spire', 'Neo-Tokyo Cyber Spire', 'building')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 border border-cyan-800/40"
                >
                  Cyber Spire
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('custom_mecha_titan', 'Mecha Defense Titan', 'building')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-amber-300 border border-amber-800/40"
                >
                  Mecha Titan
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('custom_kaiju_dragon', 'Infernal Wyrm (Boss)', 'enemy')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-red-300 border border-red-800/40"
                >
                  Kaiju Monster
                </button>
              </div>
            </div>
          </div>

          {/* Right: Upload & Parameter Settings */}
          <div className="flex flex-col gap-4">
            {/* Drag & Drop File Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                handleFileUpload(e.dataTransfer.files);
              }}
              className={`p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 text-center transition-colors ${
                isDragOver
                  ? 'border-indigo-500 bg-indigo-950/30'
                  : 'border-slate-700 bg-slate-800/40 hover:bg-slate-800/70'
              }`}
            >
              <Box className="w-8 h-8 text-indigo-400" />
              <div>
                <p className="text-xs font-bold text-slate-200">Drag & Drop .FBX or .OBJ files here</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Supports multi-upload & instant conversion</p>
              </div>
              <label className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer shadow-md transition-colors">
                Browse Files
                <input
                  type="file"
                  accept=".obj,.fbx"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
              </label>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-800/40 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Uploaded: {uploadedFiles.map((f) => f.name).join(', ')}</span>
              </div>
            )}

            {/* Name Input */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Model Name</label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            {/* Role Classification */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Use Model As</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'building', label: 'Constructible Building', icon: <Layers className="w-3.5 h-3.5" /> },
                  { id: 'enemy', label: 'Threat / Monster Unit', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
                  { id: 'avatar', label: 'Player Avatar', icon: <User className="w-3.5 h-3.5" /> },
                  { id: 'decoration', label: 'City Prop / Decor', icon: <Trees className="w-3.5 h-3.5" /> },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRole(item.id as any)}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium border transition-all ${
                      role === item.id
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Scale Adjuster */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span className="font-semibold">Model Scale</span>
                <span className="font-mono text-slate-400">{scale.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="3.0"
                step="0.1"
                value={scale}
                onChange={(e) => {
                  const s = parseFloat(e.target.value);
                  setScale(s);
                  if (previewGroup) {
                    previewGroup.scale.set(s, s, s);
                  }
                }}
                className="accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">LIGHTHOUSE 橋 Engine Model Importer</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveBlueprint}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-500/20 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Blueprint Library</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
