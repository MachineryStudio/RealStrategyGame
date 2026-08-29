/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BuildingCategory = 'residential' | 'commercial' | 'infrastructure' | 'defense' | 'monument' | 'workshops' | 'custom';

export interface ResourceCost {
  wood: number;
  steel: number;
  concrete: number;
  glass: number;
  electronics: number;
  money: number;
}

export interface BuildingDefinition {
  id: string;
  name: string;
  category: BuildingCategory;
  description: string;
  cost: ResourceCost;
  buildTime: number; // in seconds
  size: [number, number]; // grid width, grid length (e.g. [2, 2])
  height: number;
  populationProvided?: number;
  jobsProvided?: number;
  incomeRate?: number; // money per second
  happinessBonus?: number;
  defensePower?: number;
  range?: number;
  maxHp: number;
  iconName: string;
  customModelData?: string; // For imported models
  customModelType?: 'obj' | 'fbx' | 'procedural';
}

export interface PlacedBuilding {
  instanceId: string;
  defId: string;
  gridX: number;
  gridZ: number;
  rotation: number; // 0, 90, 180, 270 degrees
  progress: number; // 0 to 100
  isConstructed: boolean;
  hp: number;
  maxHp: number;
  isOnFire?: boolean;
  isWebbed?: boolean;
  isFlooded?: boolean;
  customName?: string;
  turretTargetId?: string | null;
  turretCooldown?: number;
  // Workshop Production Fields
  assignedWorkerIds?: string[];
  assignedWorkerCount?: number;
  productionProgress?: number; // 0 to 100%
  totalGathered?: number;
  productionCycleTime?: number; // seconds per batch
}

export interface ResourceGatheringLog {
  id: string;
  resource: 'wood' | 'steel' | 'concrete';
  amount: number;
  sourceBuildingName: string;
  sourceBuildingId: string;
  timestamp: number;
}

export interface WorkshopSummaryStats {
  totalWoodGathered: number;
  totalSteelGathered: number;
  totalConcreteGathered: number;
  woodRatePerMin: number;
  steelRatePerMin: number;
  concreteRatePerMin: number;
  activeWoodWorkshops: number;
  activeSteelWorkshops: number;
  activeConcreteWorkshops: number;
  totalAssignedWorkers: number;
}

export type ThreatType = 
  // Natural
  | 'fire'
  | 'flood'
  | 'earthquake'
  | 'tornado'
  | 'volcano'
  // Human
  | 'mafia'
  | 'corporate_raiders'
  | 'zombies'
  | 'aliens'
  | 'pirates'
  // Animal / Kaiju
  | 'raptors'
  | 'giant_spiders'
  | 'killer_bees'
  | 'godzilla'
  // Custom
  | 'custom_monster';

export type ThreatCategory = 'natural' | 'human' | 'animal';

export type ThreatLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ThreatEntity {
  id: string;
  type: ThreatType;
  category: ThreatCategory;
  name: string;
  x: number;
  y: number;
  z: number;
  targetX?: number;
  targetZ?: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  active: boolean;
  radius: number;
  spawnTime: number;
  duration?: number; // for temporary weather events
  isBoss?: boolean;
  isFiringBreath?: boolean;
  breathTargetX?: number;
  breathTargetZ?: number;
  customMesh?: any;
}

export type PetType = 'dog' | 'cat' | 'robot';

export type CounterMeasureType = 'fire_truck' | 'police' | 'engineer' | 'architect' | 'military' | 'medic' | 'nurse' | 'veterinarian' | PetType;

export type ResourceNodeType = 'wood' | 'steel' | 'concrete';

export interface ResourceNode {
  id: string;
  type: ResourceNodeType;
  name: string;
  x: number;
  z: number;
  remainingAmount: number;
  maxAmount: number;
  respawnTime?: number;
  isDepleted: boolean;
  gatherRatePerSec: number;
  description: string;
  harvestersCount?: number;
}

export interface ResourceCargo {
  wood: number;
  steel: number;
  concrete: number;
  maxCapacity: number;
}

export interface KingdomDepositoryStats {
  level: number;
  totalWoodDeposited: number;
  totalSteelDeposited: number;
  totalConcreteDeposited: number;
  totalDeliveries: number;
  currentTierProgress: number;
  tierTarget: number;
  tierBonusPct: number;
}

export interface UnitEntity {
  id: string;
  type: CounterMeasureType | 'worker' | 'citizen';
  name?: string;
  x: number;
  y: number;
  z: number;
  targetX: number;
  targetZ: number;
  targetBuildingId?: string;
  targetThreatId?: string;
  targetNodeId?: string;
  targetUnitId?: string;
  speed: number;
  state: 'idle' | 'walking' | 'working' | 'fighting' | 'healing' | 'fleeing' | 'delivering' | 'vigilant_patrol';
  hp: number;
  maxHp: number;
  selected?: boolean;
  manualOrder?: boolean;
  orderType?: 'move' | 'attack' | 'build' | 'repair' | 'heal' | 'patrol' | 'idle' | 'work_harvest' | 'gather_node' | 'deliver_kingdom';
  destinationX?: number;
  destinationZ?: number;
  cargo?: ResourceCargo;
  barkAlertCooldown?: number;
  petAction?: 'bark' | 'meow' | 'scan' | 'bite' | 'scratch' | 'laser';
}

export type WeatherType = 'clear' | 'rain' | 'storm' | 'fog' | 'snow';

export type ViewMode = 'orbit' | 'first_person' | 'third_person';

export interface GameResources {
  wood: number;
  steel: number;
  concrete: number;
  glass: number;
  electronics: number;
  money: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  rewardMoney: number;
  rewardResources: Partial<GameResources>;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
  type: 'build_count' | 'population' | 'survive_waves' | 'build_specific' | 'defeat_threats';
  targetDefId?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface CustomModelBlueprint {
  id: string;
  name: string;
  format: 'obj' | 'fbx';
  role: 'building' | 'decoration' | 'enemy' | 'avatar';
  rawContent: string;
  previewUrl?: string;
  scale: number;
  color?: string;
  def?: BuildingDefinition;
}

export interface GameStats {
  population: number;
  happiness: number; // 0 to 100
  waveNumber: number;
  threatsDefeated: number;
  buildingsConstructed: number;
  daysElapsed: number;
  timeOfDay: number; // 0 to 24 hours
}
