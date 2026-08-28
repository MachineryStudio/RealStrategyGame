/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Quest, Achievement } from '../types';

export const INITIAL_QUESTS: Quest[] = [
  {
    id: 'quest_first_house',
    title: 'First Settlement',
    description: 'Construct a Small House to welcome your first citizens and workers.',
    rewardMoney: 300,
    rewardResources: { wood: 50, steel: 20 },
    progress: 0,
    target: 1,
    completed: false,
    claimed: false,
    type: 'build_specific',
    targetDefId: 'res_small'
  },
  {
    id: 'quest_infrastructure',
    title: 'Power & Utility Grid',
    description: 'Construct a Clean Power Plant and a Water Tower to energize the city.',
    rewardMoney: 500,
    rewardResources: { concrete: 50, glass: 30 },
    progress: 0,
    target: 2,
    completed: false,
    claimed: false,
    type: 'build_count'
  },
  {
    id: 'quest_first_responders',
    title: 'Emergency Readiness',
    description: 'Construct a Fire Department and Police Precinct to safeguard against threats.',
    rewardMoney: 600,
    rewardResources: { steel: 40, electronics: 20 },
    progress: 0,
    target: 2,
    completed: false,
    claimed: false,
    type: 'build_count'
  },
  {
    id: 'quest_defend_city',
    title: 'Defend the Frontier',
    description: 'Defeat 2 hostile threat waves or disaster events.',
    rewardMoney: 800,
    rewardResources: { wood: 100, steel: 100, money: 500 },
    progress: 0,
    target: 2,
    completed: false,
    claimed: false,
    type: 'defeat_threats'
  },
  {
    id: 'quest_population_100',
    title: 'Thriving Metropolis',
    description: 'Grow your city population to 50 citizens.',
    rewardMoney: 1000,
    rewardResources: { concrete: 100, electronics: 50 },
    progress: 0,
    target: 50,
    completed: false,
    claimed: false,
    type: 'population'
  },
  {
    id: 'quest_lighthouse_wonder',
    title: 'LIGHTHOUSE 橋 Wonder',
    description: 'Erect the magnificent LIGHTHOUSE 橋 Monument with its shining beacon.',
    rewardMoney: 2000,
    rewardResources: { money: 2000, wood: 200, steel: 200 },
    progress: 0,
    target: 1,
    completed: false,
    claimed: false,
    type: 'build_specific',
    targetDefId: 'mon_lighthouse'
  }
];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach_first_build',
    title: 'Ground Breaker',
    description: 'Construct your very first building site.',
    icon: 'Hammer',
    unlocked: false
  },
  {
    id: 'ach_fire_fighter',
    title: 'Inferno Tamer',
    description: 'Extinguish a building blaze using Fire Department units.',
    icon: 'Flame',
    unlocked: false
  },
  {
    id: 'ach_mafia_buster',
    title: 'Law & Order',
    description: 'Neutralize a Mafia cartel raid with police security.',
    icon: 'Shield',
    unlocked: false
  },
  {
    id: 'ach_ufo_hunter',
    title: 'Close Encounters',
    description: 'Shoot down an alien UFO invasion ship with laser turrets.',
    icon: 'Crosshair',
    unlocked: false
  },
  {
    id: 'ach_lighthouse_beacon',
    title: 'Beacon of Hope',
    description: 'Complete the LIGHTHOUSE 橋 monument and light up the sky.',
    icon: 'Sparkles',
    unlocked: false
  },
  {
    id: 'ach_custom_creator',
    title: 'Master Architect',
    description: 'Import or construct a Custom 3D Blueprint model in the city.',
    icon: 'Box',
    unlocked: false
  }
];
