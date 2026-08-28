/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { ThreeEngine } from './game/threeEngine';
import { INITIAL_BUILDINGS } from './game/buildingData';
import { INITIAL_QUESTS, INITIAL_ACHIEVEMENTS } from './game/questData';
import { ModelLoaderService } from './game/modelLoader';
import {
  BuildingDefinition,
  PlacedBuilding,
  GameResources,
  GameStats,
  WeatherType,
  ViewMode,
  ThreatLevel,
  ThreatType,
  Quest,
  Achievement,
  CustomModelBlueprint,
  UnitEntity,
  ResourceNode,
  ResourceCargo,
  KingdomDepositoryStats,
} from './types';
import { soundManager } from './audio/soundManager';
import confetti from 'canvas-confetti';

// Components
import { GameHUD } from './components/GameHUD';
import { BuildingBar } from './components/BuildingBar';
import { Minimap } from './components/Minimap';
import { ModelUploadModal } from './components/ModelUploadModal';
import { AdminGodPanel } from './components/AdminGodPanel';
import { QuestModal } from './components/QuestModal';
import { HelpTutorialModal } from './components/HelpTutorialModal';
import { ThreatAlertBanner } from './components/ThreatAlertModal';
import { UnitCommandHUD } from './components/UnitCommandHUD';
import { ResourceGatheringHUD } from './components/ResourceGatheringHUD';
import { WorkshopInspectorModal } from './components/WorkshopInspectorModal';
import { CitadelInspectorModal } from './components/CitadelInspectorModal';
import { GameOverModal } from './components/GameOverModal';

const SAVE_KEY = 'lighthouse_constructa_save_v1';

// Initial Kingdom House standing proudly at the heart of the settlement
const INITIAL_STARTER_BUILDINGS: PlacedBuilding[] = [
  {
    instanceId: 'kingdom_house_main',
    defId: 'mon_kingdom_house',
    gridX: 0,
    gridZ: -1,
    rotation: 0,
    progress: 100,
    isConstructed: true,
    hp: 2000,
    maxHp: 2000,
    productionProgress: 0,
  }
];

export default function App() {
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<ThreeEngine | null>(null);

  // --- Game State ---
  const [resources, setResources] = useState<GameResources>({
    wood: 100,
    steel: 50,
    concrete: 20,
    glass: 5,
    electronics: 0,
    money: 1000,
  });

  const [stats, setStats] = useState<GameStats>({
    population: 0,
    happiness: 85,
    waveNumber: 1,
    threatsDefeated: 0,
    buildingsConstructed: 0,
    daysElapsed: 1,
    timeOfDay: 9.0, // 9:00 AM
  });

  const [weather, setWeather] = useState<WeatherType>('clear');
  const [gameSpeed, setGameSpeed] = useState<number>(1);
  const [viewMode, setViewMode] = useState<ViewMode>('orbit');
  const [isGodMode, setIsGodMode] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isDemolishMode, setIsDemolishMode] = useState<boolean>(false);

  // Buildings & Blueprints
  const [definitions, setDefinitions] = useState<BuildingDefinition[]>(INITIAL_BUILDINGS);
  const [placedBuildings, setPlacedBuildings] = useState<PlacedBuilding[]>(INITIAL_STARTER_BUILDINGS);
  const [selectedDef, setSelectedDef] = useState<BuildingDefinition | null>(null);
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | null>(null);
  const [placementWarning, setPlacementWarning] = useState<string | null>(null);

  // Quests & Achievements
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);

  // Warning timer ref
  const warningTimeoutRef = useRef<number | null>(null);

  const showPlacementWarning = (msg: string) => {
    setPlacementWarning(msg);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    warningTimeoutRef.current = window.setTimeout(() => setPlacementWarning(null), 3500);
  };

  const checkBuildingAffordability = (
    def: BuildingDefinition,
    res: GameResources,
    isGod: boolean
  ): { canAfford: boolean; missingSummary: string } => {
    if (isGod) return { canAfford: true, missingSummary: '' };
    const missing: string[] = [];
    if (res.wood < def.cost.wood) missing.push(`🪵 ${Math.floor(res.wood)}/${def.cost.wood} Wood`);
    if (res.steel < def.cost.steel) missing.push(`🔩 ${Math.floor(res.steel)}/${def.cost.steel} Steel`);
    if (res.concrete < def.cost.concrete) missing.push(`🧱 ${Math.floor(res.concrete)}/${def.cost.concrete} Concrete`);
    if (res.glass < def.cost.glass) missing.push(`🪟 ${Math.floor(res.glass)}/${def.cost.glass} Glass`);
    if (res.electronics < def.cost.electronics) missing.push(`💻 ${Math.floor(res.electronics)}/${def.cost.electronics} Electronics`);
    if (res.money < def.cost.money) missing.push(`💰 $${Math.floor(res.money)}/$${def.cost.money} Money`);

    return {
      canAfford: missing.length === 0,
      missingSummary: missing.join(', '),
    };
  };

  const handleSelectBuilding = (def: BuildingDefinition | null) => {
    if (!def) {
      setSelectedDef(null);
      if (engineRef.current) engineRef.current.setSelectedDefinition(null);
      return;
    }

    const { canAfford, missingSummary } = checkBuildingAffordability(def, resources, isGodMode);
    if (!canAfford) {
      // CANCEL THE ACTION: Deselect and notify
      setSelectedDef(null);
      if (engineRef.current) engineRef.current.setSelectedDefinition(null);
      soundManager.playWarningBuzzer();
      showPlacementWarning(`⚠️ Cannot select ${def.name}: Insufficient resources! Missing: ${missingSummary}`);
      return;
    }

    // Affordable
    setSelectedDef(def);
    if (isDemolishMode) setIsDemolishMode(false);
    setPlacementWarning(null);
    soundManager.playClick();
  };

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isQuestsOpen, setIsQuestsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMinimapOpen, setIsMinimapOpen] = useState(true);
  const [isCitadelOpen, setIsCitadelOpen] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  // Threats & Timers
  const [threatLevel, setThreatLevel] = useState<ThreatLevel>('low');
  const [activeThreatCount, setActiveThreatCount] = useState<number>(0);
  const [nextWaveTimer, setNextWaveTimer] = useState<number>(240); // 4 minutes
  const [godzillaWaveTimer, setGodzillaWaveTimer] = useState<number>(180); // 3 minutes periodic boss invasion

  const gameStartedRef = useRef(false);
  const isGameOverRef = useRef(false);

  // RTS Unit Selection & Command State
  const [selectedUnits, setSelectedUnits] = useState<UnitEntity[]>([]);
  const [allUnits, setAllUnits] = useState<UnitEntity[]>([]);
  const [marqueeRect, setMarqueeRect] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);

  // Environment Resource Nodes & Kingdom Depository Cargo State
  const [resourceNodes, setResourceNodes] = useState<ResourceNode[]>([]);
  const [nearbyResourceNode, setNearbyResourceNode] = useState<ResourceNode | null>(null);
  const [avatarCargo, setAvatarCargo] = useState<ResourceCargo>({
    wood: 0,
    steel: 0,
    concrete: 0,
    maxCapacity: 25,
  });
  const [isAutoReturning, setIsAutoReturning] = useState<boolean>(false);
  const [kingdomStats, setKingdomStats] = useState<KingdomDepositoryStats>({
    level: 1,
    totalWoodDeposited: 0,
    totalSteelDeposited: 0,
    totalConcreteDeposited: 0,
    totalDeliveries: 0,
    currentTierProgress: 0,
    tierTarget: 150,
    tierBonusPct: 10,
  });

  // Refs for access in callbacks and animation loop
  const stateRef = useRef({
    resources,
    stats,
    placedBuildings,
    definitions,
    isGodMode,
    gameSpeed,
    quests,
    achievements,
    isDemolishMode,
    selectedDef,
  });

  useEffect(() => {
    stateRef.current = {
      resources,
      stats,
      placedBuildings,
      definitions,
      isGodMode,
      gameSpeed,
      quests,
      achievements,
      isDemolishMode,
      selectedDef,
    };
  }, [
    resources,
    stats,
    placedBuildings,
    definitions,
    isGodMode,
    gameSpeed,
    quests,
    achievements,
    isDemolishMode,
    selectedDef,
  ]);

  // --- Initialize 3D Engine ---
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const engine = new ThreeEngine(canvasContainerRef.current);
    engineRef.current = engine;

    // Load initial custom blueprint presets
    const customPresets = ModelLoaderService.getDefaultCustomBlueprints();
    customPresets.forEach((bp) => {
      if (bp.def) {
        setDefinitions((prev) => (prev.some((d) => d.id === bp.def!.id) ? prev : [...prev, bp.def!]));
      }
    });

    // Spawn 3 starting construction workers and 1 faithful vigilant guard dog
    for (let i = 0; i < 3; i++) {
      engine.workerManager.spawnWorker((i - 1) * 3, 2);
    }
    engine.workerManager.spawnUnit('dog', 2, 4);
    setAllUnits([...engine.workerManager.units]);
    setTimeout(() => {
      gameStartedRef.current = true;
    }, 2000);

    // RTS Unit Selection & Marquee Box Callbacks
    engine.onSelectionChange = (units) => {
      setSelectedUnits([...units]);
      if (engineRef.current) {
        setAllUnits([...engineRef.current.workerManager.units]);
      }
    };

    engine.onMarqueeBoxChange = (rect) => {
      setMarqueeRect(rect);
    };

    // Building Click Handler (Inspect Workshops / Citadel / Buildings)
    engine.onBuildingClick = (bldId, defId) => {
      if (defId === 'mon_kingdom_house') {
        setIsCitadelOpen(true);
      } else if (defId && defId.startsWith('workshop_')) {
        setSelectedWorkshopId(bldId);
      }
    };

    // Environment Resource Node Click Handler (Dispatch Selected Workers / Camera Focus)
    engine.onResourceNodeClick = (node) => {
      const selectedWorkerIds = engine.workerManager.getSelectedUnitIds().filter((id) => {
        const u = engine.workerManager.units.find((unit) => unit.id === id);
        return u && u.type === 'worker';
      });

      if (selectedWorkerIds.length > 0) {
        // Check if Citadel structure is under construction
        const citadelUnderConstruction = stateRef.current.placedBuildings.find(
          (b) => b.defId === 'mon_kingdom_house' && !b.isConstructed
        );

        if (citadelUnderConstruction) {
          engine.workerManager.orderConstruct(
            selectedWorkerIds,
            citadelUnderConstruction.instanceId,
            citadelUnderConstruction.gridX * 2,
            citadelUnderConstruction.gridZ * 2,
            true
          );
          engine.spawnFloatingResourcePopup(
            node.x,
            2.5,
            node.z,
            '⚠️ Build Citadel First! Workers routed to Citadel foundation... 🏰',
            '#f59e0b'
          );
          showPlacementWarning('⚠️ Workers must complete Citadel construction first before gathering wild resources!');
          soundManager.playUnitOrder();
          setAllUnits([...engine.workerManager.units]);
          return;
        }

        engine.workerManager.orderGatherResourceNode(selectedWorkerIds, node.id, node.x, node.z);
        engine.spawnFloatingResourcePopup(
          node.x,
          2.5,
          node.z,
          `${selectedWorkerIds.length} Workers Gathering! ⛏️`,
          '#38bdf8'
        );
        soundManager.playUnitOrder();
        setAllUnits([...engine.workerManager.units]);
      } else {
        // Focus camera on node
        engine.controls.target.set(node.x, 0, node.z);
      }
    };

    // Avatar Proximity Callback for Natural Harvesting
    engine.onAvatarProximityNode = (node) => {
      setNearbyResourceNode(node);
    };

    // Helper to process deposited resources into global storage & update Kingdom stats
    const handleProcessDeposit = (
      deposited: { wood: number; steel: number; concrete: number },
      _source: 'avatar' | 'worker'
    ) => {
      const sum = (deposited.wood || 0) + (deposited.steel || 0) + (deposited.concrete || 0);
      if (sum <= 0) return;

      // Add deposited resources to global inventory
      setResources((prev) => ({
        ...prev,
        wood: prev.wood + (deposited.wood || 0),
        steel: prev.steel + (deposited.steel || 0),
        concrete: prev.concrete + (deposited.concrete || 0),
      }));

      // Update Kingdom Depository Progression
      setKingdomStats((prev) => {
        const newTierProg = prev.currentTierProgress + sum;
        let newLevel = prev.level;
        let newTarget = prev.tierTarget;
        let newBonus = prev.tierBonusPct;
        let remainingProg = newTierProg;

        if (newTierProg >= prev.tierTarget) {
          newLevel += 1;
          remainingProg = newTierProg - prev.tierTarget;
          newTarget = Math.round(prev.tierTarget * 1.5);
          newBonus += 5;
          soundManager.playVictoryFanfare();
          try {
            confetti({
              particleCount: 75,
              spread: 90,
              origin: { y: 0.5 },
            });
          } catch {}
        }

        return {
          level: newLevel,
          totalWoodDeposited: prev.totalWoodDeposited + (deposited.wood || 0),
          totalSteelDeposited: prev.totalSteelDeposited + (deposited.steel || 0),
          totalConcreteDeposited: prev.totalConcreteDeposited + (deposited.concrete || 0),
          totalDeliveries: prev.totalDeliveries + 1,
          currentTierProgress: remainingProg,
          tierTarget: newTarget,
          tierBonusPct: newBonus,
        };
      });
    };

    // Avatar Cargo & Kingdom House Event Listeners
    engine.onAvatarCargoChange = (cargo) => {
      setAvatarCargo({ ...cargo });
    };

    engine.onAutoReturnTriggered = (isReturning) => {
      setIsAutoReturning(isReturning);
    };

    engine.onKingdomDeposit = (deposited) => {
      handleProcessDeposit(deposited, 'avatar');
    };

    if (engine.workerManager) {
      engine.workerManager.onWorkerDeliveredToKingdom = (deposited, _workerId) => {
        handleProcessDeposit(deposited, 'worker');
        const parts: string[] = [];
        if (deposited.wood) parts.push(`+${deposited.wood} 🪵`);
        if (deposited.steel) parts.push(`+${deposited.steel} 🔩`);
        if (deposited.concrete) parts.push(`+${deposited.concrete} 🧱`);
        if (parts.length > 0) {
          engine.spawnFloatingResourcePopup(
            0,
            3.8,
            2.2,
            `Worker Deposited: ${parts.join(' ')} 🏰`,
            '#38bdf8'
          );
        }
      };
    }

    // Initial Resource Nodes sync and gather event
    if (engine.envResourceManager) {
      setResourceNodes([...engine.envResourceManager.nodes]);
      engine.envResourceManager.onResourceGathered = (type, amount, _nx, _nz, source) => {
        if (source === 'worker') {
          soundManager.playResourceGathered();
        }
      };
    }

    // Tile Click Handler
    engine.onTileClick = (gridX, gridZ) => {
      const cur = stateRef.current;

      if (cur.isDemolishMode) {
        // Demolish building at tile
        const target = cur.placedBuildings.find((b) => b.gridX === gridX && b.gridZ === gridZ);
        if (target) {
          soundManager.playExplosion();
          setPlacedBuildings((prev) => prev.filter((b) => b.instanceId !== target.instanceId));
        }
        return;
      }

      if (!cur.selectedDef) return;

      const def = cur.selectedDef;

      // Validate geometric & environmental placement (river / rock boulders / bounds / building collisions)
      if (engineRef.current && !engineRef.current.checkPlacementValidity(gridX, gridZ, def)) {
        soundManager.playWarningBuzzer();
        setPlacementWarning(
          `⚠️ Invalid location for ${def.name}: Cannot place on river waters or stone boulders!`
        );
        setTimeout(() => setPlacementWarning(null), 3500);
        return;
      }

      // Check resources
      if (!cur.isGodMode) {
        if (
          cur.resources.wood < def.cost.wood ||
          cur.resources.steel < def.cost.steel ||
          cur.resources.concrete < def.cost.concrete ||
          cur.resources.glass < def.cost.glass ||
          cur.resources.electronics < def.cost.electronics ||
          cur.resources.money < def.cost.money
        ) {
          soundManager.playWarningBuzzer();
          setPlacementWarning(`⚠️ Insufficient resources to construct ${def.name}!`);
          setTimeout(() => setPlacementWarning(null), 3000);
          return;
        }

        // Deduct resources
        setResources((prev) => ({
          wood: prev.wood - def.cost.wood,
          steel: prev.steel - def.cost.steel,
          concrete: prev.concrete - def.cost.concrete,
          glass: prev.glass - def.cost.glass,
          electronics: prev.electronics - def.cost.electronics,
          money: prev.money - def.cost.money,
        }));
      }

      soundManager.playPlaceBuilding();
      setPlacementWarning(null);

      // Create new building instance
      const newBuilding: PlacedBuilding = {
        instanceId: `inst_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        defId: def.id,
        gridX,
        gridZ,
        rotation: 0,
        progress: cur.isGodMode ? 100 : 0,
        isConstructed: cur.isGodMode,
        hp: def.maxHp,
        maxHp: def.maxHp,
        productionProgress: 0,
        totalGathered: 0,
      };

      setPlacedBuildings((prev) => [...prev, newBuilding]);

      // Unlock Achievement: First Build
      unlockAchievement('ach_first_build');
    };

    // Auto-load saved state if present
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.resources) setResources(parsed.resources);
        if (parsed.stats) setStats(parsed.stats);
        if (parsed.placedBuildings) {
          const loadedBuildings: PlacedBuilding[] = (parsed.placedBuildings as PlacedBuilding[]).map((b) => {
            if (b.defId === 'mon_kingdom_house') {
              return { ...b, isConstructed: true, progress: 100 };
            }
            return b;
          });
          const hasKingdom = loadedBuildings.some((b) => b.defId === 'mon_kingdom_house');
          setPlacedBuildings(hasKingdom ? loadedBuildings : [INITIAL_STARTER_BUILDINGS[0], ...loadedBuildings]);
        }
      } catch (e) {
        console.warn('Failed to parse save', e);
      }
    }

    return () => {
      engine.destroy();
    };
  }, []);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const code = e.code;
      if (code === 'Space') {
        e.preventDefault();
        setGameSpeed((prev) => (prev === 0 ? 1 : 0));
      } else if (code === 'KeyG') {
        setIsGodMode((prev) => !prev);
      } else if (code === 'KeyU') {
        setIsUploadOpen(true);
      } else if (code === 'KeyM') {
        setIsMinimapOpen((prev) => !prev);
      } else if (code === 'KeyH') {
        setIsHelpOpen(true);
      } else if (code === 'Escape') {
        setSelectedDef(null);
        setIsDemolishMode(false);
        setIsUploadOpen(false);
        setIsAdminOpen(false);
        setIsQuestsOpen(false);
        setIsHelpOpen(false);
      } else if (code.startsWith('Digit') || code.startsWith('Numpad')) {
        const num = parseInt(code.replace('Digit', '').replace('Numpad', ''));
        if (num >= 1 && num <= definitions.length) {
          const targetDef = definitions[num - 1];
          handleSelectBuilding(targetDef);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [definitions, resources, isGodMode, isDemolishMode]);

  // Auto-cancel active building/workshop selection if resources drop below requirement
  useEffect(() => {
    if (selectedDef && !isGodMode) {
      const { canAfford, missingSummary } = checkBuildingAffordability(selectedDef, resources, isGodMode);
      if (!canAfford) {
        setSelectedDef(null);
        if (engineRef.current) {
          engineRef.current.setSelectedDefinition(null);
        }
        soundManager.playWarningBuzzer();
        showPlacementWarning(`⚠️ Action cancelled: Insufficient resources to build ${selectedDef.name}! (${missingSummary})`);
      }
    }
  }, [resources, isGodMode, selectedDef]);

  // Sync selected blueprint with 3D engine ghost
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setSelectedDefinition(selectedDef);
    }
  }, [selectedDef]);

  // Sync buildings with 3D meshes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.syncBuildings(placedBuildings, definitions);
    }
  }, [placedBuildings, definitions]);

  // --- Main Simulation Loop (1-second tick scaled by gameSpeed) ---
  useEffect(() => {
    if (gameSpeed === 0) return;

    const interval = setInterval(() => {
      const speed = stateRef.current.gameSpeed;
      if (speed === 0) return;

      // 1. Advance Time of Day
      setStats((prev) => {
        const newTime = (prev.timeOfDay + (0.1 * speed)) % 24;
        const newDays = newTime < prev.timeOfDay ? prev.daysElapsed + 1 : prev.daysElapsed;
        if (engineRef.current) {
          engineRef.current.updateTimeOfDay(newTime);
        }
        return {
          ...prev,
          timeOfDay: newTime,
          daysElapsed: newDays,
        };
      });

      // 2. Process Construction Progress, Workshops Harvesting, & Economy
      let totalIncome = 0;
      let totalPopulation = 0;
      let totalHappinessBonus = 0;
      let newlyCompleted = false;
      let gatheredWood = 0;
      let gatheredSteel = 0;
      let gatheredConcrete = 0;

      const currentUnits = engineRef.current ? engineRef.current.workerManager.units : [];

      setPlacedBuildings((prev) =>
        prev.map((b) => {
          const def = stateRef.current.definitions.find((d) => d.id === b.defId);
          if (!def) return b;

          if (!b.isConstructed) {
            // Check active workers hammering the building site
            const activeWorkers = currentUnits.filter(
              (u) =>
                u.type === 'worker' &&
                (u.targetBuildingId === b.instanceId ||
                  Math.hypot(u.x - b.gridX * 2, u.z - b.gridZ * 2) < (b.defId === 'mon_kingdom_house' ? 6.0 : 3.5))
            );
            const workerBoost = Math.max(1, activeWorkers.length * 1.5);
            const baseRate = (100 / def.buildTime) * speed;
            const buildRate = stateRef.current.isGodMode ? 100 : baseRate * workerBoost;
            const newProg = Math.min(100, b.progress + buildRate);
            const isDone = newProg >= 100;

            if (isDone && !b.isConstructed) {
              newlyCompleted = true;
              if (def.id === 'mon_kingdom_house') {
                confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
                soundManager.playVictoryFanfare();
                engineRef.current?.spawnFloatingResourcePopup(
                  b.gridX * 2,
                  6.5,
                  b.gridZ * 2,
                  '🏰 CITADEL MESH CONSTRUCTED! Depository Open! Workers harvesting wild nodes...',
                  '#fbbf24'
                );
              }
              if (def.id === 'mon_lighthouse') {
                unlockAchievement('ach_lighthouse_beacon');
              }
              if (def.category === 'custom') {
                unlockAchievement('ach_custom_creator');
              }
            }

            return {
              ...b,
              progress: newProg,
              isConstructed: isDone,
            };
          } else {
            // Active building economy
            if (def.incomeRate) totalIncome += def.incomeRate * speed;
            if (def.populationProvided) totalPopulation += def.populationProvided;
            if (def.happinessBonus) totalHappinessBonus += def.happinessBonus;

            // Workshop Production & Harvesting Cycle
            if (def.category === 'workshops' && def.outputResource) {
              const assignedWorkers = currentUnits.filter(
                (u) =>
                  u.type === 'worker' &&
                  (u.targetBuildingId === b.instanceId ||
                    (u.orderType === 'work_harvest' &&
                      Math.hypot(u.x - b.gridX * 2, u.z - b.gridZ * 2) < 3.5))
              );

              const workerCount = assignedWorkers.length;
              if (workerCount > 0) {
                const interval = def.productionInterval || 12;
                const cycleRate = (100 / interval) * speed;
                const currentProd = b.productionProgress || 0;
                const nextProd = currentProd + cycleRate;

                if (nextProd >= 100) {
                  const outputAmount = def.outputResource.amount * workerCount;

                  if (def.outputResource.type === 'wood') {
                    gatheredWood += outputAmount;
                    engineRef.current?.spawnFloatingResourcePopup(
                      b.gridX * 2,
                      2.4,
                      b.gridZ * 2,
                      `+${outputAmount} Wood 🪵`,
                      '#a3e635'
                    );
                  } else if (def.outputResource.type === 'steel') {
                    gatheredSteel += outputAmount;
                    engineRef.current?.spawnFloatingResourcePopup(
                      b.gridX * 2,
                      2.4,
                      b.gridZ * 2,
                      `+${outputAmount} Steel 🔩`,
                      '#cbd5e1'
                    );
                  } else if (def.outputResource.type === 'concrete') {
                    gatheredConcrete += outputAmount;
                    engineRef.current?.spawnFloatingResourcePopup(
                      b.gridX * 2,
                      2.4,
                      b.gridZ * 2,
                      `+${outputAmount} Concrete 🧱`,
                      '#fbbf24'
                    );
                  }

                  soundManager.playResourceGathered();

                  return {
                    ...b,
                    productionProgress: nextProd - 100,
                    totalGathered: (b.totalGathered || 0) + outputAmount,
                  };
                } else {
                  return {
                    ...b,
                    productionProgress: nextProd,
                  };
                }
              }
            }

            return b;
          }
        })
      );

      if (newlyCompleted && engineRef.current) {
        engineRef.current.triggerCelebration();
      }

      // Add gathered resources & revenue to bank
      if (totalIncome > 0 || gatheredWood > 0 || gatheredSteel > 0 || gatheredConcrete > 0) {
        setResources((prev) => ({
          ...prev,
          money: prev.money + totalIncome,
          wood: prev.wood + gatheredWood,
          steel: prev.steel + gatheredSteel,
          concrete: prev.concrete + gatheredConcrete,
        }));
      }

      // Update City Population & Morale
      setStats((prev) => ({
        ...prev,
        population: totalPopulation,
        happiness: Math.min(100, Math.max(20, 75 + totalHappinessBonus - (stateRef.current.stats.threatsDefeated > 0 ? 0 : 5))),
      }));

      // Update Quests progress
      updateQuestsProgress();

      // 3. Threat Spawning Wave Timer
      setNextWaveTimer((prev) => {
        const next = prev - speed;
        if (next <= 0) {
          // Trigger automated threat wave
          triggerRandomThreat();
          return 260; // 4.3 minutes
        }
        return next;
      });

      // Periodic Godzilla Kaiju Boss Invasion Timer (every ~3 minutes)
      setGodzillaWaveTimer((prev) => {
        const next = prev - speed;
        if (next <= 0) {
          if (engineRef.current) {
            engineRef.current.threatManager.spawnThreat('godzilla');
            soundManager.playGodzillaRoar();
            engineRef.current.spawnFloatingResourcePopup(
              0,
              12,
              0,
              '⚠️ KAIJU ALERT: GODZILLA HAS RISEN TO CRUSH THE SETTLEMENT!',
              '#06b6d4'
            );
          }
          return 210; // next Godzilla in 3.5 minutes
        }
        return next;
      });

      // 4. Update Threats & Turret Defenses
      if (engineRef.current) {
        const threats = engineRef.current.threatManager.threats;
        setActiveThreatCount(threats.filter((t) => t.active).length);

        if (threats.length === 0) {
          setThreatLevel('low');
        } else if (threats.length === 1) {
          setThreatLevel('medium');
        } else if (threats.length < 3) {
          setThreatLevel('high');
        } else {
          setThreatLevel('critical');
        }

        // Turret auto-firing against threats in range
        stateRef.current.placedBuildings.forEach((b) => {
          const def = stateRef.current.definitions.find((d) => d.id === b.defId);
          if (!def || !def.defensePower || !b.isConstructed) return;

          const bx = b.gridX * 2;
          const bz = b.gridZ * 2;
          const range = def.range || 20;

          // Find threat in range
          const target = threats.find((t) => t.active && Math.hypot(t.x - bx, t.z - bz) <= range);
          if (target) {
            engineRef.current?.threatManager.damageThreat(target.id, def.defensePower * speed);
            if (Math.random() < 0.25) {
              soundManager.playLaserZap();
            }
          }
        });

        // Step Threat & Worker Physics
        engineRef.current.threatManager.update(
          1.0 * speed,
          stateRef.current.placedBuildings,
          engineRef.current.workerManager.units,
          (bld, dmg) => {
            // Damage building
            setPlacedBuildings((prev) =>
              prev.map((b) => (b.instanceId === bld.instanceId ? { ...b, hp: Math.max(0, b.hp - dmg) } : b))
            );
          },
          (defeatedThreat) => {
            // Threat Defeated celebration
            setStats((prev) => ({ ...prev, threatsDefeated: prev.threatsDefeated + 1 }));
            setResources((prev) => ({ ...prev, money: prev.money + 250 }));
            if (defeatedThreat.type === 'aliens') unlockAchievement('ach_ufo_hunter');
            if (defeatedThreat.type === 'mafia') unlockAchievement('ach_mafia_buster');
            if (defeatedThreat.type === 'fire') unlockAchievement('ach_fire_fighter');
            if (defeatedThreat.type === 'godzilla') unlockAchievement('ach_godzilla_slayer');
          }
        );

        if (engineRef.current.envResourceManager) {
          setResourceNodes([...engineRef.current.envResourceManager.nodes]);
        }
        
        const currentUnits = engineRef.current.workerManager.units;
        setAllUnits([...currentUnits]);

        // Check for Game Over: If all workers are eliminated
        const remainingWorkers = currentUnits.filter((u) => u.type === 'worker').length;
        if (gameStartedRef.current && !stateRef.current.isGodMode && !isGameOverRef.current) {
          if (remainingWorkers === 0) {
            setIsGameOver(true);
            isGameOverRef.current = true;
            soundManager.playGameOver();
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameSpeed]);

  // --- Auto-Save Every 5 Minutes ---
  useEffect(() => {
    const saveInterval = setInterval(() => {
      handleSaveCity();
    }, 300000);
    return () => clearInterval(saveInterval);
  }, [resources, stats, placedBuildings]);

  const handleSaveCity = () => {
    const data = {
      resources: stateRef.current.resources,
      stats: stateRef.current.stats,
      placedBuildings: stateRef.current.placedBuildings,
      timestamp: Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  };

  const handleLoadCity = () => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (parsed.resources) setResources(parsed.resources);
      if (parsed.stats) setStats(parsed.stats);
      if (parsed.placedBuildings) {
        const loadedBuildings: PlacedBuilding[] = (parsed.placedBuildings as PlacedBuilding[]).map((b) => {
          if (b.defId === 'mon_kingdom_house') {
            return { ...b, isConstructed: true, progress: 100 };
          }
          return b;
        });
        const hasKingdom = loadedBuildings.some((b) => b.defId === 'mon_kingdom_house');
        setPlacedBuildings(hasKingdom ? loadedBuildings : [INITIAL_STARTER_BUILDINGS[0], ...loadedBuildings]);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleExportCity = () => {
    const data = {
      game: 'LIGHTHOUSE 橋 - Constructa',
      version: '1.0',
      resources,
      stats,
      placedBuildings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `constructa_city_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCity = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.resources) setResources(parsed.resources);
      if (parsed.stats) setStats(parsed.stats);
      if (parsed.placedBuildings) setPlacedBuildings(parsed.placedBuildings);
    } catch (e) {
      alert('Invalid city JSON format');
    }
  };

  const triggerRandomThreat = () => {
    if (!engineRef.current) return;
    const types: ThreatType[] = [
      'fire',
      'earthquake',
      'tornado',
      'mafia',
      'zombies',
      'aliens',
      'raptors',
      'giant_spiders',
    ];
    const picked = types[Math.floor(Math.random() * types.length)];
    engineRef.current.threatManager.spawnThreat(picked);
  };

  const handleDeployUnit = (type: 'fire_truck' | 'police' | 'engineer' | 'military' | 'medic' | 'worker' | 'dog' | 'cat' | 'robot') => {
    if (!engineRef.current) return;
    
    // Resource costs
    let moneyCost = 50;
    let woodCost = 0;
    let steelCost = 0;
    let concreteCost = 0;

    if (type === 'military') moneyCost = 100;
    else if (type === 'worker') { moneyCost = 50; woodCost = 10; }
    else if (type === 'dog') { moneyCost = 75; woodCost = 15; }
    else if (type === 'cat') { moneyCost = 80; steelCost = 10; }
    else if (type === 'robot') { moneyCost = 150; steelCost = 20; concreteCost = 10; }

    if (!isGodMode) {
      if (
        resources.money < moneyCost ||
        resources.wood < woodCost ||
        resources.steel < steelCost ||
        resources.concrete < concreteCost
      ) {
        soundManager.playWarningBuzzer();
        showPlacementWarning(`⚠️ Cannot recruit ${type.toUpperCase()}: Insufficient resources!`);
        return;
      }

      setResources((prev) => ({
        ...prev,
        money: prev.money - moneyCost,
        wood: prev.wood - woodCost,
        steel: prev.steel - steelCost,
        concrete: prev.concrete - concreteCost,
      }));
    }

    if (type === 'dog') soundManager.playDogBark();
    else if (type === 'cat') soundManager.playCatMeow();
    else if (type === 'robot') soundManager.playRobotBeep();
    else soundManager.playClick();

    if (type === 'worker') {
      engineRef.current.workerManager.spawnWorker((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
    } else {
      engineRef.current.workerManager.spawnUnit(type as any, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
    }
    setAllUnits([...engineRef.current.workerManager.units]);
  };

  const handleRestartKingdom = () => {
    if (!engineRef.current) return;
    
    // 1. Clear active threats
    engineRef.current.threatManager.clearAll();
    setActiveThreatCount(0);
    setThreatLevel('low');
    
    // 2. Clear & rebuild starter workers and guard pet
    engineRef.current.workerManager.units = [];
    for (let i = 0; i < 3; i++) {
      engineRef.current.workerManager.spawnWorker((i - 1) * 3, 2);
    }
    engineRef.current.workerManager.spawnUnit('dog', 2, 4);
    setAllUnits([...engineRef.current.workerManager.units]);

    // 3. Restore Citadel & starter buildings health
    setPlacedBuildings((prev) =>
      prev.map((b) => ({
        ...b,
        hp: b.maxHp,
        isConstructed: true,
        progress: 100,
      }))
    );

    // 4. Grant emergency relief aid
    setResources((prev) => ({
      ...prev,
      money: Math.max(prev.money, 600),
      wood: Math.max(prev.wood, 120),
      steel: Math.max(prev.steel, 60),
      concrete: Math.max(prev.concrete, 40),
    }));

    // 5. Reset Game Over state
    setIsGameOver(false);
    isGameOverRef.current = false;
    soundManager.playVictoryFanfare();
    engineRef.current.spawnFloatingResourcePopup(
      0,
      6,
      0,
      '🏰 The Citadel Stands! Pioneers Re-established!',
      '#38bdf8'
    );
  };

  // --- RTS Selection & Command Actions ---
  const handleSelectUnit = (id: string, multiSelect: boolean = false) => {
    if (!engineRef.current) return;
    engineRef.current.workerManager.selectUnit(id, multiSelect);
    engineRef.current.notifySelectionChange();
  };

  const handleSelectAllOfType = (type: string) => {
    if (!engineRef.current) return;
    const matching = engineRef.current.workerManager.units.filter((u) => u.type === type).map((u) => u.id);
    engineRef.current.workerManager.selectUnits(matching);
    engineRef.current.notifySelectionChange();
  };

  const handleSelectAllUnits = () => {
    if (!engineRef.current) return;
    const all = engineRef.current.workerManager.units.map((u) => u.id);
    engineRef.current.workerManager.selectUnits(all);
    engineRef.current.notifySelectionChange();
  };

  const handleDeselectAllUnits = () => {
    if (!engineRef.current) return;
    engineRef.current.workerManager.deselectAll();
    engineRef.current.notifySelectionChange();
  };

  const handleStopSelectedUnits = () => {
    if (!engineRef.current) return;
    const selectedIds = engineRef.current.workerManager.getSelectedUnitIds();
    engineRef.current.workerManager.stopUnits(selectedIds);
    engineRef.current.notifySelectionChange();
  };

  const handleAttackNearestThreat = () => {
    if (!engineRef.current) return;
    const selectedUnitsList = engineRef.current.workerManager.getSelectedUnits();
    const threats = engineRef.current.threatManager.threats;
    if (selectedUnitsList.length === 0 || threats.length === 0) return;

    // Pick closest threat to the first selected unit
    const u = selectedUnitsList[0];
    let closestThreat = threats[0];
    let minDist = Infinity;
    for (const t of threats) {
      const d = Math.hypot(t.x - u.x, t.z - u.z);
      if (d < minDist) {
        minDist = d;
        closestThreat = t;
      }
    }

    const ids = selectedUnitsList.map((unit) => unit.id);
    engineRef.current.workerManager.orderAttack(ids, closestThreat.id, closestThreat.x, closestThreat.z);
    engineRef.current.spawnWaypointPing(closestThreat.x, closestThreat.z, 'attack');
    engineRef.current.notifySelectionChange();
  };

  const updateQuestsProgress = () => {
    setQuests((prev) =>
      prev.map((q) => {
        if (q.completed) return q;

        let prog = q.progress;
        if (q.id === 'quest_first_house') {
          prog = stateRef.current.placedBuildings.filter((b) => b.defId === 'res_small' && b.isConstructed).length;
        } else if (q.id === 'quest_infrastructure') {
          prog = stateRef.current.placedBuildings.filter(
            (b) => (b.defId === 'infra_power' || b.defId === 'infra_water') && b.isConstructed
          ).length;
        } else if (q.id === 'quest_first_responders') {
          prog = stateRef.current.placedBuildings.filter(
            (b) => (b.defId === 'infra_hospital' || b.defId === 'infra_police' || b.defId === 'infra_fire') && b.isConstructed
          ).length;
        } else if (q.id === 'quest_defend_city') {
          prog = stateRef.current.stats.threatsDefeated;
        } else if (q.id === 'quest_population_100') {
          prog = stateRef.current.stats.population;
        } else if (q.id === 'quest_lighthouse_wonder') {
          prog = stateRef.current.placedBuildings.filter((b) => b.defId === 'mon_lighthouse' && b.isConstructed).length;
        }

        const isDone = prog >= q.target;
        return {
          ...q,
          progress: Math.min(q.target, prog),
          completed: isDone,
        };
      })
    );
  };

  const unlockAchievement = (id: string) => {
    setAchievements((prev) =>
      prev.map((a) => (a.id === id && !a.unlocked ? { ...a, unlocked: true, unlockedAt: new Date().toLocaleTimeString() } : a))
    );
  };

  const handleClaimQuest = (quest: Quest) => {
    soundManager.playCelebration();
    if (engineRef.current) engineRef.current.triggerCelebration();

    setResources((prev) => ({
      ...prev,
      money: prev.money + quest.rewardMoney,
      wood: prev.wood + (quest.rewardResources.wood || 0),
      steel: prev.steel + (quest.rewardResources.steel || 0),
      concrete: prev.concrete + (quest.rewardResources.concrete || 0),
      glass: prev.glass + (quest.rewardResources.glass || 0),
      electronics: prev.electronics + (quest.rewardResources.electronics || 0),
    }));

    setQuests((prev) => prev.map((q) => (q.id === quest.id ? { ...q, claimed: true } : q)));
  };

  const handleAddBlueprint = (bp: CustomModelBlueprint, def?: BuildingDefinition) => {
    soundManager.playCelebration();
    if (def) {
      setDefinitions((prev) => [...prev, def]);
      setSelectedDef(def);
    }
  };

  const handleToggleViewMode = () => {
    const nextMode: ViewMode =
      viewMode === 'orbit' ? 'third_person' : viewMode === 'third_person' ? 'first_person' : 'orbit';
    setViewMode(nextMode);
    if (engineRef.current) {
      engineRef.current.setViewMode(nextMode);
    }
  };

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const handleAssignWorkerToWorkshop = (buildingInstanceId: string) => {
    if (!engineRef.current) return;
    const bld = placedBuildings.find((b) => b.instanceId === buildingInstanceId);
    if (!bld) return;

    // Find an idle worker or any worker not currently assigned
    const idleWorker = engineRef.current.workerManager.units.find(
      (u) => u.type === 'worker' && u.state === 'idle' && !u.targetBuildingId
    );

    if (idleWorker) {
      engineRef.current.workerManager.orderWorkAtWorkshop(
        [idleWorker.id],
        buildingInstanceId,
        bld.gridX * 2,
        bld.gridZ * 2
      );
      engineRef.current.spawnWaypointPing(bld.gridX * 2, bld.gridZ * 2, 'build');
      soundManager.playUnitOrder();
      setAllUnits([...engineRef.current.workerManager.units]);
    }
  };

  const handleUnassignWorkerFromWorkshop = (buildingInstanceId: string) => {
    if (!engineRef.current) return;
    const assignedWorker = engineRef.current.workerManager.units.find(
      (u) => u.type === 'worker' && u.targetBuildingId === buildingInstanceId
    );

    if (assignedWorker) {
      engineRef.current.workerManager.stopUnits([assignedWorker.id]);
      soundManager.playUnitOrder();
      setAllUnits([...engineRef.current.workerManager.units]);
    }
  };

  const handleFocusBuilding = (building: PlacedBuilding) => {
    if (engineRef.current) {
      const bx = building.gridX * 2;
      const bz = building.gridZ * 2;
      engineRef.current.controls.target.set(bx, 0, bz);
      engineRef.current.camera.position.set(bx + 16, 18, bz + 20);
      soundManager.playClick();
    }
  };

  const handleAssignWorkerToNode = (nodeId: string) => {
    if (!engineRef.current) return;
    const node = engineRef.current.envResourceManager.nodes.find((n) => n.id === nodeId);
    if (!node || node.isDepleted) return;

    // Try to find selected worker, or idle worker
    const selectedUnits = engineRef.current.workerManager.getSelectedUnits().filter((u) => u.type === 'worker');
    let targetWorkerId: string | null = null;

    if (selectedUnits.length > 0) {
      targetWorkerId = selectedUnits[0].id;
    } else {
      const idleWorker = engineRef.current.workerManager.units.find(
        (u) => u.type === 'worker' && (u.state === 'idle' || u.orderType === 'idle')
      );
      if (idleWorker) {
        targetWorkerId = idleWorker.id;
      }
    }

    if (targetWorkerId) {
      engineRef.current.workerManager.orderGatherResourceNode([targetWorkerId], node.id, node.x, node.z);
      engineRef.current.spawnFloatingResourcePopup(
        node.x,
        2.5,
        node.z,
        `Worker Dispatched! ⛏️`,
        '#38bdf8'
      );
      soundManager.playUnitOrder();
      setAllUnits([...engineRef.current.workerManager.units]);
    } else {
      soundManager.playWarningBuzzer();
      setPlacementWarning('⚠️ No idle workers available! Deploy more workers from the Unit HUD.');
      setTimeout(() => setPlacementWarning(null), 3000);
    }
  };

  const handleFocusNode = (node: ResourceNode) => {
    if (engineRef.current) {
      engineRef.current.controls.target.set(node.x, 0, node.z);
      engineRef.current.camera.position.set(node.x + 16, 20, node.z + 18);
      soundManager.playClick();
    }
  };

  const handleInstantCompleteBuilding = (buildingInstanceId: string) => {
    setPlacedBuildings((prev) =>
      prev.map((b) =>
        b.instanceId === buildingInstanceId
          ? { ...b, progress: 100, isConstructed: true }
          : b
      )
    );
    soundManager.playCelebration();
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={canvasContainerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Status & Controls HUD */}
      <GameHUD
        resources={resources}
        stats={stats}
        weather={weather}
        threatLevel={threatLevel}
        activeThreatCount={activeThreatCount}
        gameSpeed={gameSpeed}
        viewMode={viewMode}
        isGodMode={isGodMode}
        isMuted={isMuted}
        unclaimedQuestsCount={quests.filter((q) => q.completed && !q.claimed).length}
        onSetGameSpeed={setGameSpeed}
        onToggleViewMode={handleToggleViewMode}
        onToggleGodMode={() => setIsGodMode((p) => !p)}
        onToggleMute={handleToggleMute}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenQuests={() => setIsQuestsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Real-Time Resource Gathering HUD (Citadel Depository, Workshops & Environment Nodes) */}
      <ResourceGatheringHUD
        buildings={placedBuildings}
        definitions={definitions}
        units={allUnits}
        resources={resources}
        resourceNodes={resourceNodes}
        avatarCargo={avatarCargo}
        kingdomStats={kingdomStats}
        onAssignWorkerToWorkshop={handleAssignWorkerToWorkshop}
        onUnassignWorkerFromWorkshop={handleUnassignWorkerFromWorkshop}
        onAssignWorkerToNode={handleAssignWorkerToNode}
        onFocusBuilding={handleFocusBuilding}
        onFocusNode={handleFocusNode}
        onOpenWorkshopInspector={(id) => setSelectedWorkshopId(id)}
        onOpenCitadelInspector={() => setIsCitadelOpen(true)}
        onFocusKingdomHouse={() => {
          if (engineRef.current) {
            engineRef.current.controls.target.set(0, 0, -2);
            engineRef.current.camera.position.set(18, 22, 22);
          }
        }}
        onReturnToKingdomHouse={() => {
          if (engineRef.current) {
            engineRef.current.returnAvatarToKingdom();
          }
        }}
      />

      {/* Auto-Return Active Notification */}
      {isAutoReturning && (
        <div
          id="banner_auto_returning_kingdom"
          className="absolute top-20 left-1/2 -translate-x-1/2 z-40 px-5 py-2.5 rounded-2xl bg-amber-950/90 border-2 border-amber-400 text-white font-sans text-xs font-bold shadow-2xl flex items-center gap-3 backdrop-blur-md animate-pulse pointer-events-auto"
        >
          <span className="text-xl animate-bounce">🏰</span>
          <div>
            <div className="text-amber-200">Backpack Full! Auto-Returning to Kingdom House...</div>
            <div className="text-[10px] text-amber-300/80 font-mono">
              Depositing cargo to expand global storage & level up the Citadel!
            </div>
          </div>
        </div>
      )}

      {/* Avatar Proximity Resource Node Prompt */}
      {nearbyResourceNode && !nearbyResourceNode.isDepleted && (
        <div
          id="prompt_avatar_harvest"
          className="absolute bottom-28 left-1/2 -translate-x-1/2 z-30 px-4 py-2.5 rounded-2xl bg-slate-900/95 border-2 border-emerald-500/80 text-white font-sans text-xs font-bold shadow-2xl flex items-center gap-3 backdrop-blur-md animate-pulse pointer-events-auto"
        >
          <span className="text-xl">
            {nearbyResourceNode.type === 'wood' ? '🌲' : nearbyResourceNode.type === 'steel' ? '⛏️' : '🧱'}
          </span>
          <div className="flex flex-col">
            <span className="text-emerald-300">
              Near {nearbyResourceNode.name} ({nearbyResourceNode.remaining}/{nearbyResourceNode.maxAmount} remaining)
            </span>
            <span className="text-[10px] text-slate-300 font-mono">
              Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-600 text-amber-300 font-bold">E</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-600 text-amber-300 font-bold">Space</kbd> to Harvest (+5 {nearbyResourceNode.type.toUpperCase()})
            </span>
          </div>
          <button
            id="btn_manual_harvest_now"
            onClick={() => {
              if (engineRef.current && nearbyResourceNode) {
                const harvestRes = engineRef.current.envResourceManager.harvestNode(nearbyResourceNode.id, 5, 'avatar');
                if (harvestRes) {
                  soundManager.playResourceGathered();
                  const icon = harvestRes.type === 'wood' ? '🪵' : harvestRes.type === 'steel' ? '🔩' : '🧱';
                  engineRef.current.spawnFloatingResourcePopup(
                    nearbyResourceNode.x,
                    2.6,
                    nearbyResourceNode.z,
                    `+${harvestRes.gathered} ${harvestRes.type.toUpperCase()} ${icon}`,
                    '#a3e635'
                  );

                  // Update avatar cargo
                  const resType = harvestRes.type as 'wood' | 'steel' | 'concrete';
                  engineRef.current.avatarCargo[resType] += harvestRes.gathered;
                  const totalCargo =
                    engineRef.current.avatarCargo.wood +
                    engineRef.current.avatarCargo.steel +
                    engineRef.current.avatarCargo.concrete;

                  setAvatarCargo({ ...engineRef.current.avatarCargo });

                  if (totalCargo >= engineRef.current.avatarCargo.maxCapacity) {
                    engineRef.current.returnAvatarToKingdom();
                  }
                }
              }
            }}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all"
          >
            Harvest (+5)
          </button>
        </div>
      )}

      {/* Placement Warning Banner */}
      {placementWarning && (
        <div
          id="banner_placement_warning"
          className="absolute top-20 left-1/2 -translate-x-1/2 z-40 px-5 py-2.5 rounded-2xl bg-red-950/95 border-2 border-red-500/80 text-white font-sans text-xs font-bold shadow-2xl shadow-red-500/30 flex items-center gap-2.5 animate-bounce pointer-events-none backdrop-blur-md"
        >
          <span className="text-red-400 text-sm">⛔</span>
          <span>{placementWarning}</span>
        </div>
      )}

      {/* Workshop Details Inspector Modal */}
      <WorkshopInspectorModal
        buildingInstanceId={selectedWorkshopId}
        buildings={placedBuildings}
        definitions={definitions}
        units={allUnits}
        resources={resources}
        isGodMode={isGodMode}
        onClose={() => setSelectedWorkshopId(null)}
        onAssignWorker={handleAssignWorkerToWorkshop}
        onUnassignWorker={handleUnassignWorkerFromWorkshop}
        onInstantComplete={handleInstantCompleteBuilding}
      />

      {/* Active Threat Warning Banner */}
      <ThreatAlertBanner
        threats={engineRef.current?.threatManager.threats || []}
        onDeploy={handleDeployUnit}
      />

      {/* Interactive Radar Minimap */}
      <Minimap
        buildings={placedBuildings}
        threats={engineRef.current?.threatManager.threats || []}
        units={engineRef.current?.workerManager.units || []}
        cameraX={engineRef.current?.camera.position.x || 0}
        cameraZ={engineRef.current?.camera.position.z || 0}
        isOpen={isMinimapOpen}
        onClose={() => setIsMinimapOpen(false)}
        onNavigate={(x, z) => {
          if (engineRef.current) {
            engineRef.current.controls.target.set(x, 0, z);
            engineRef.current.camera.position.set(x + 25, 30, z + 35);
          }
        }}
      />

      {/* Bottom Building Palette & Quick Dock */}
      <BuildingBar
        definitions={definitions}
        selectedDef={selectedDef}
        resources={resources}
        isGodMode={isGodMode}
        isDemolishMode={isDemolishMode}
        onSelectBuilding={handleSelectBuilding}
        onCannotAfford={(def, reason) => {
          setSelectedDef(null);
          if (engineRef.current) engineRef.current.setSelectedDefinition(null);
          soundManager.playWarningBuzzer();
          showPlacementWarning(`⚠️ Cannot select ${def.name}: Insufficient resources! Missing: ${reason}`);
        }}
        onToggleDemolish={() => {
          setIsDemolishMode((p) => !p);
          if (selectedDef) setSelectedDef(null);
        }}
        onDeployCounterMeasure={handleDeployUnit}
      />

      {/* RTS Unit Command HUD & Drag Selection Box */}
      <UnitCommandHUD
        selectedUnits={selectedUnits}
        allUnits={allUnits}
        onSelectUnit={handleSelectUnit}
        onSelectAllOfType={handleSelectAllOfType}
        onSelectAll={handleSelectAllUnits}
        onDeselectAll={handleDeselectAllUnits}
        onStopUnits={handleStopSelectedUnits}
        onAttackNearestThreat={handleAttackNearestThreat}
        onSpawnUnit={handleDeployUnit}
        marqueeRect={marqueeRect}
      />

      {/* 3D Model Importer (FBX / OBJ) Modal */}
      <ModelUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onAddBlueprint={handleAddBlueprint}
        onSpawnCustomEnemy={(bp) => {
          if (engineRef.current) {
            engineRef.current.threatManager.spawnThreat('custom_monster', bp.name);
          }
        }}
      />

      {/* Admin God Mode & Threat Spawner Panel */}
      <AdminGodPanel
        isOpen={isAdminOpen}
        isGodMode={isGodMode}
        timeOfDay={stats.timeOfDay}
        weather={weather}
        onClose={() => setIsAdminOpen(false)}
        onToggleGodMode={() => setIsGodMode((p) => !p)}
        onSpawnThreat={(t) => {
          if (engineRef.current) engineRef.current.threatManager.spawnThreat(t);
        }}
        onSetTimeOfDay={(h) => {
          setStats((p) => ({ ...p, timeOfDay: h }));
          if (engineRef.current) engineRef.current.updateTimeOfDay(h);
        }}
        onSetWeather={(w) => {
          setWeather(w);
          if (engineRef.current) engineRef.current.updateWeather(w);
        }}
        onAddResources={(res) => {
          setResources((p) => ({
            wood: p.wood + (res.wood || 0),
            steel: p.steel + (res.steel || 0),
            concrete: p.concrete + (res.concrete || 0),
            glass: p.glass + (res.glass || 0),
            electronics: p.electronics + (res.electronics || 0),
            money: p.money + (res.money || 0),
          }));
        }}
        onRepairAll={() => {
          soundManager.playCelebration();
          setPlacedBuildings((prev) => prev.map((b) => ({ ...b, hp: b.maxHp })));
        }}
        onClearThreats={() => {
          if (engineRef.current) engineRef.current.threatManager.clearAll();
          setActiveThreatCount(0);
          setThreatLevel('low');
        }}
        onSaveGame={handleSaveCity}
        onLoadGame={handleLoadCity}
        onExportCity={handleExportCity}
        onImportCity={handleImportCity}
      />

      {/* Quests & Achievements Modal */}
      <QuestModal
        isOpen={isQuestsOpen}
        quests={quests}
        achievements={achievements}
        onClose={() => setIsQuestsOpen(false)}
        onClaimReward={handleClaimQuest}
      />

      {/* Help & Tutorial Modal */}
      <HelpTutorialModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* Citadel Command & Unit Recruitment Hub Modal */}
      <CitadelInspectorModal
        isOpen={isCitadelOpen}
        onClose={() => setIsCitadelOpen(false)}
        kingdomStats={kingdomStats}
        resources={resources}
        units={allUnits}
        isGodMode={isGodMode}
        onSpawnUnit={(unitType) => {
          handleDeployUnit(unitType);
        }}
        onUpgradeDepositoryTier={() => {
          setKingdomStats((prev) => ({
            ...prev,
            level: prev.level + 1,
            tierBonusPct: prev.tierBonusPct + 5,
            tierTarget: Math.round(prev.tierTarget * 1.5),
            currentTierProgress: 0,
          }));
          soundManager.playVictoryFanfare();
          try {
            confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });
          } catch {}
        }}
        onFocusCitadel={() => {
          if (engineRef.current) {
            engineRef.current.controls.target.set(0, 0, -2);
            engineRef.current.camera.position.set(18, 22, 22);
          }
        }}
      />

      {/* Game Over Modal when all workers fall */}
      <GameOverModal
        isOpen={isGameOver}
        stats={stats}
        resources={resources}
        onRestartKingdom={handleRestartKingdom}
        onLoadLastSave={handleLoadCity}
      />
    </div>
  );
}
