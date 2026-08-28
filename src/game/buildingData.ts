/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BuildingDefinition } from '../types';

export const INITIAL_BUILDINGS: BuildingDefinition[] = [
  // --- RESIDENTIAL ---
  {
    id: 'res_small',
    name: 'Small House',
    category: 'residential',
    description: 'Cozy 1-2 floor dwelling for early citizens and workers.',
    cost: { wood: 30, steel: 10, concrete: 15, glass: 5, electronics: 0, money: 100 },
    buildTime: 6,
    size: [2, 2],
    height: 3,
    populationProvided: 4,
    happinessBonus: 2,
    maxHp: 250,
    iconName: 'Home'
  },
  {
    id: 'res_medium',
    name: 'Medium Apartment',
    category: 'residential',
    description: 'Multi-story urban apartment complex (3-4 floors).',
    cost: { wood: 40, steel: 35, concrete: 40, glass: 20, electronics: 5, money: 280 },
    buildTime: 12,
    size: [3, 3],
    height: 7,
    populationProvided: 16,
    happinessBonus: 5,
    maxHp: 550,
    iconName: 'Building'
  },
  {
    id: 'res_luxury',
    name: 'Luxury Skyscraper',
    category: 'residential',
    description: 'Ultra-modern 6+ floor residential high-rise with rooftop pool.',
    cost: { wood: 20, steel: 80, concrete: 70, glass: 50, electronics: 20, money: 650 },
    buildTime: 20,
    size: [3, 3],
    height: 14,
    populationProvided: 40,
    happinessBonus: 15,
    maxHp: 1000,
    iconName: 'Building2'
  },

  // --- COMMERCIAL ---
  {
    id: 'com_shop',
    name: 'Corner Market',
    category: 'commercial',
    description: 'Local neighborhood grocery and convenience store.',
    cost: { wood: 25, steel: 15, concrete: 20, glass: 10, electronics: 5, money: 150 },
    buildTime: 8,
    size: [2, 2],
    height: 3.5,
    jobsProvided: 4,
    incomeRate: 5,
    happinessBonus: 4,
    maxHp: 300,
    iconName: 'Store'
  },
  {
    id: 'com_mall',
    name: 'Shopping Plaza',
    category: 'commercial',
    description: 'Large commercial plaza with multiple boutiques and food courts.',
    cost: { wood: 30, steel: 50, concrete: 60, glass: 30, electronics: 15, money: 420 },
    buildTime: 16,
    size: [4, 4],
    height: 5,
    jobsProvided: 18,
    incomeRate: 18,
    happinessBonus: 10,
    maxHp: 750,
    iconName: 'ShoppingBag'
  },
  {
    id: 'com_office',
    name: 'Corporate HQ Tower',
    category: 'commercial',
    description: 'Glass-curtain office skyscraper generating high revenue.',
    cost: { wood: 10, steel: 90, concrete: 80, glass: 60, electronics: 35, money: 800 },
    buildTime: 24,
    size: [4, 4],
    height: 18,
    jobsProvided: 45,
    incomeRate: 40,
    happinessBonus: 12,
    maxHp: 1200,
    iconName: 'Briefcase'
  },

  // --- INFRASTRUCTURE ---
  {
    id: 'infra_road',
    name: 'Asphalt Road',
    category: 'infrastructure',
    description: 'Smooth road network enabling vehicle traffic and fast NPC transit.',
    cost: { wood: 0, steel: 2, concrete: 5, glass: 0, electronics: 0, money: 20 },
    buildTime: 2,
    size: [1, 1],
    height: 0.15,
    maxHp: 150,
    iconName: 'Route'
  },
  {
    id: 'infra_bridge',
    name: 'Suspension Bridge',
    category: 'infrastructure',
    description: 'Engineered bridge structure to cross water and channels seamlessly.',
    cost: { wood: 10, steel: 30, concrete: 25, glass: 0, electronics: 0, money: 90 },
    buildTime: 6,
    size: [2, 4],
    height: 4,
    maxHp: 600,
    iconName: 'GitCommit'
  },
  {
    id: 'infra_power',
    name: 'Clean Power Plant',
    category: 'infrastructure',
    description: 'Supplies electric grid power to city structures and defenses.',
    cost: { wood: 10, steel: 60, concrete: 40, glass: 15, electronics: 25, money: 380 },
    buildTime: 14,
    size: [3, 3],
    height: 8,
    happinessBonus: 5,
    maxHp: 800,
    iconName: 'Zap'
  },
  {
    id: 'infra_water',
    name: 'Water Tower Reservoir',
    category: 'infrastructure',
    description: 'Essential municipal water utility and fire-fighting supply reservoir.',
    cost: { wood: 5, steel: 40, concrete: 30, glass: 0, electronics: 5, money: 220 },
    buildTime: 10,
    size: [2, 2],
    height: 9,
    happinessBonus: 5,
    maxHp: 600,
    iconName: 'Droplets'
  },
  {
    id: 'infra_hospital',
    name: 'Emergency Hospital',
    category: 'infrastructure',
    description: 'Medical center that dispatches Medics to heal injured workers.',
    cost: { wood: 15, steel: 50, concrete: 55, glass: 30, electronics: 25, money: 450 },
    buildTime: 16,
    size: [3, 3],
    height: 6,
    happinessBonus: 15,
    maxHp: 700,
    iconName: 'HeartPulse'
  },
  {
    id: 'infra_police',
    name: 'Police Precinct',
    category: 'infrastructure',
    description: 'Deploys patrol cruisers and security squads against Mafia and crime.',
    cost: { wood: 10, steel: 45, concrete: 40, glass: 15, electronics: 20, money: 320 },
    buildTime: 12,
    size: [3, 3],
    height: 5,
    happinessBonus: 10,
    defensePower: 25,
    range: 18,
    maxHp: 650,
    iconName: 'ShieldAlert'
  },
  {
    id: 'infra_fire',
    name: 'Fire Department',
    category: 'infrastructure',
    description: 'Dispatches emergency fire engines to douse building blazes.',
    cost: { wood: 15, steel: 40, concrete: 35, glass: 10, electronics: 10, money: 300 },
    buildTime: 12,
    size: [3, 3],
    height: 5.5,
    happinessBonus: 10,
    maxHp: 650,
    iconName: 'Flame'
  },

  // --- DEFENSE ---
  {
    id: 'def_wall',
    name: 'Reinforced Wall',
    category: 'defense',
    description: 'Heavy concrete barrier to block hostiles and disaster shockwaves.',
    cost: { wood: 0, steel: 15, concrete: 30, glass: 0, electronics: 0, money: 50 },
    buildTime: 3,
    size: [1, 2],
    height: 3,
    defensePower: 10,
    maxHp: 900,
    iconName: 'Shield'
  },
  {
    id: 'def_bunker',
    name: 'Hardened Bunker',
    category: 'defense',
    description: 'Underground reinforced shelter offering protection from disasters.',
    cost: { wood: 5, steel: 50, concrete: 60, glass: 0, electronics: 10, money: 260 },
    buildTime: 12,
    size: [2, 2],
    height: 2.5,
    defensePower: 30,
    maxHp: 1500,
    iconName: 'ShieldCheck'
  },
  {
    id: 'def_turret',
    name: 'Auto-Laser Turret',
    category: 'defense',
    description: 'Automated rapid-fire plasma cannon targeting incoming threats.',
    cost: { wood: 0, steel: 60, concrete: 30, glass: 15, electronics: 30, money: 380 },
    buildTime: 10,
    size: [2, 2],
    height: 4.5,
    defensePower: 45,
    range: 22,
    maxHp: 600,
    iconName: 'Crosshair'
  },
  {
    id: 'def_barrier',
    name: 'Forcefield Generator',
    category: 'defense',
    description: 'Projected electromagnetic dome absorbing extraterrestrial attacks.',
    cost: { wood: 0, steel: 40, concrete: 30, glass: 40, electronics: 45, money: 520 },
    buildTime: 15,
    size: [2, 2],
    height: 6,
    defensePower: 70,
    range: 15,
    maxHp: 800,
    iconName: 'Radio'
  },

  // --- MONUMENTS ---
  {
    id: 'mon_kingdom_house',
    name: 'Kingdom Citadel (Central Depository)',
    category: 'monument',
    description: 'The Sovereign Kingdom Citadel & Central Resource Depository. Harvesters deliver gathered wood, steel, and concrete here to stockpile resources, increase gathering stats, and advance kingdom tiers.',
    cost: { wood: 80, steel: 60, concrete: 80, glass: 30, electronics: 15, money: 450 },
    buildTime: 20,
    size: [4, 4],
    height: 24,
    happinessBonus: 45,
    incomeRate: 30,
    maxHp: 6000,
    iconName: 'Compass'
  },
  {
    id: 'mon_lighthouse',
    name: 'LIGHTHOUSE 橋 Monument',
    category: 'monument',
    description: 'The crowning architectural wonder with a sweeping beam of light, inspiring the city.',
    cost: { wood: 50, steel: 120, concrete: 100, glass: 80, electronics: 50, money: 1200 },
    buildTime: 30,
    size: [4, 4],
    height: 22,
    happinessBonus: 50,
    incomeRate: 30,
    maxHp: 3000,
    iconName: 'Compass'
  },
  {
    id: 'mon_statue',
    name: 'Golden Titan Statue',
    category: 'monument',
    description: 'Gleaming golden monument honoring the city builders and innovators.',
    cost: { wood: 10, steel: 60, concrete: 40, glass: 10, electronics: 10, money: 500 },
    buildTime: 18,
    size: [2, 2],
    height: 8,
    happinessBonus: 20,
    maxHp: 1200,
    iconName: 'Award'
  },
  {
    id: 'mon_park',
    name: 'Zen Botanical Park',
    category: 'monument',
    description: 'Lush park with cherry blossoms, reflecting pool, and serene walkways.',
    cost: { wood: 40, steel: 5, concrete: 15, glass: 5, electronics: 0, money: 250 },
    buildTime: 10,
    size: [3, 3],
    height: 1.5,
    happinessBonus: 22,
    maxHp: 400,
    iconName: 'Trees'
  },

  // --- WORKSHOPS & RESOURCE PRODUCTION ---
  {
    id: 'workshop_wood',
    name: 'Workshop Wood',
    category: 'workshops',
    description: 'Timber & Lumber Sawmill. Station workers here to cut wood planks and gather Wood in real-time.',
    cost: { wood: 10, steel: 10, concrete: 15, glass: 0, electronics: 0, money: 60 },
    buildTime: 300, // 5 minutes!
    size: [3, 3],
    height: 4.5,
    jobsProvided: 4,
    happinessBonus: 4,
    maxHp: 750,
    iconName: 'Trees'
  },
  {
    id: 'workshop_steel',
    name: 'Workshop Steel',
    category: 'workshops',
    description: 'Iron Smeltery & Steel Foundry. Station workers here to smelt ore and forge heavy Steel beams.',
    cost: { wood: 20, steel: 5, concrete: 25, glass: 5, electronics: 5, money: 90 },
    buildTime: 300, // 5 minutes!
    size: [3, 3],
    height: 5.5,
    jobsProvided: 4,
    happinessBonus: 2,
    maxHp: 900,
    iconName: 'Wrench'
  },
  {
    id: 'workshop_concrete',
    name: 'Workshop Reinforce Concrete',
    category: 'workshops',
    description: 'Reinforced Concrete Mixer Depot. Station workers here to mix aggregate, cement, and rebar into Reinforced Concrete.',
    cost: { wood: 15, steel: 15, concrete: 5, glass: 5, electronics: 10, money: 110 },
    buildTime: 300, // 5 minutes!
    size: [3, 3],
    height: 6.0,
    jobsProvided: 4,
    happinessBonus: 3,
    maxHp: 1100,
    iconName: 'Layers'
  }
];
