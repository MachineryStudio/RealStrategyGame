/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { UnitEntity, CounterMeasureType, PlacedBuilding, ThreatEntity, ResourceCargo } from '../types';
import { soundManager } from '../audio/soundManager';
import { EnvironmentResourceManager } from './environmentResourceManager';

export class WorkerManager {
  private scene: THREE.Scene;
  public units: UnitEntity[] = [];
  public unitMeshes: Map<string, THREE.Group> = new Map();
  private lastHammerSoundTime: number = 0;
  public kingdomHouseCoords = { x: 0, z: -2 };
  public envResourceManager?: EnvironmentResourceManager;
  public onWorkerDeliveredToKingdom?: (deposited: { wood: number; steel: number; concrete: number }, workerId: string) => void;
  private workerLastHarvestMap: Map<string, number> = new Map();

  // Internal animation state trackers per unit
  private walkPhaseMap: Map<string, number> = new Map();
  private animSeedMap: Map<string, number> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public spawnWorker(x: number = 0, z: number = 0): UnitEntity {
    return this.spawnUnit('worker', x, z);
  }

  public spawnUnit(type: CounterMeasureType | 'worker' | 'citizen', x: number = 0, z: number = 0): UnitEntity {
    const id = `unit_${type}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    let speed = 4.5;
    let hp = 100;
    let name = 'Worker';

    if (type === 'worker') {
      name = 'Civil Engineer / Worker';
      hp = 120;
      speed = 4.2;
    } else if (type === 'nurse') {
      name = 'Field Response Nurse';
      speed = 4.8;
      hp = 160;
    } else if (type === 'veterinarian') {
      name = 'Harbor Veterinarian';
      speed = 5.0;
      hp = 170;
    } else if (type === 'architect') {
      name = 'Master Architect';
      speed = 4.6;
      hp = 180;
    } else if (type === 'dog') {
      name = 'Guard Dog (Vigilant Pet)';
      speed = 6.2;
      hp = 220;
    } else if (type === 'cat') {
      name = 'Sentinel Cat (Agile Pet)';
      speed = 6.8;
      hp = 160;
    } else if (type === 'robot') {
      name = 'Defense Sentinel Bot (Construct-O-Bot)';
      speed = 5.5;
      hp = 340;
    } else if (type === 'fire_truck') {
      name = 'Emergency Fire Engine';
      speed = 7.5;
      hp = 350;
    } else if (type === 'police') {
      name = 'City Police Cruiser';
      speed = 7.0;
      hp = 300;
    } else if (type === 'military') {
      name = 'Heavy Combat Tank';
      speed = 5.2;
      hp = 500;
    } else if (type === 'engineer') {
      name = 'Structural Architect';
      speed = 4.5;
      hp = 150;
    } else if (type === 'medic') {
      name = 'Field Response Medic';
      speed = 4.8;
      hp = 140;
    } else {
      name = 'Resident Citizen';
      speed = 3.2;
      hp = 80;
    }

    const unit: UnitEntity = {
      id,
      type,
      name,
      x,
      y: 0,
      z,
      targetX: x,
      targetZ: z,
      speed,
      state: 'idle',
      hp,
      maxHp: hp,
      selected: false,
      manualOrder: false,
      orderType: 'idle',
    };

    this.units.push(unit);
    this.walkPhaseMap.set(id, Math.random() * Math.PI * 2);
    this.animSeedMap.set(id, Math.random() * 100);

    const mesh = this.createUnitMesh(unit);
    this.unitMeshes.set(id, mesh);
    this.scene.add(mesh);

    return unit;
  }

  private createUnitMesh(unit: UnitEntity): THREE.Group {
    const rootGroup = new THREE.Group();
    rootGroup.position.set(unit.x, 0, unit.z);
    rootGroup.name = `unit_group_${unit.id}`;
    rootGroup.userData = {
      unitId: unit.id,
      type: 'unit',
      unitType: unit.type,
    };

    // 1. Raycast Hitbox (Invisible, generous hit area for easy clicking)
    const isPet = unit.type === 'dog' || unit.type === 'cat' || unit.type === 'robot';
    const isVehicle = unit.type === 'military' || unit.type === 'fire_truck' || unit.type === 'police';
    const hitBoxRadius = unit.type === 'military' ? 2.0 : unit.type === 'fire_truck' ? 1.8 : unit.type === 'police' ? 1.5 : isPet ? 0.9 : 1.0;
    const hitBoxHeight = isVehicle ? 2.4 : isPet ? 1.4 : 2.2;
    const hitBoxGeom = new THREE.CylinderGeometry(hitBoxRadius, hitBoxRadius, hitBoxHeight, 8);
    const hitBoxMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitBox = new THREE.Mesh(hitBoxGeom, hitBoxMat);
    hitBox.position.y = hitBoxHeight / 2;
    hitBox.name = 'unit_hitbox';
    hitBox.userData = { unitId: unit.id, type: 'unit' };
    rootGroup.add(hitBox);

    // 2. RTS Selection Indicator Ring (Base decal)
    const ringGroup = new THREE.Group();
    ringGroup.name = 'selection_ring';
    ringGroup.position.y = 0.04;
    ringGroup.visible = false;

    const ringRadius = hitBoxRadius + 0.2;
    const ringGeom = new THREE.RingGeometry(ringRadius - 0.15, ringRadius, 32);
    const ringColor = unit.type === 'military' ? 0x22c55e : unit.type === 'fire_truck' ? 0xef4444 : unit.type === 'police' ? 0x3b82f6 : unit.type === 'dog' ? 0xf59e0b : unit.type === 'cat' ? 0xa855f7 : unit.type === 'robot' ? 0x06b6d4 : 0x38bdf8;
    const ringMat = new THREE.MeshBasicMaterial({
      color: ringColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringGroup.add(ringMesh);

    // Corner brackets / tactical ticks
    const tickMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
      const tick = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.12), tickMat);
      tick.rotation.x = -Math.PI / 2;
      tick.rotation.z = angle;
      tick.position.x = Math.cos(angle) * ringRadius;
      tick.position.z = Math.sin(angle) * ringRadius;
      ringGroup.add(tick);
    }
    rootGroup.add(ringGroup);

    // 3. Articulated Character Models (With Hierarchical Limb Skeletons for Walk/Idle Animations)
    if (unit.type === 'dog') {
      // --- GUARD DOG 3D MODEL ---
      const dogBodyGroup = new THREE.Group();
      dogBodyGroup.name = 'dog_body_group';
      dogBodyGroup.position.y = 0.45;
      rootGroup.add(dogBodyGroup);

      const furMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 });
      const darkFurMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });

      // Torso
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.42, 0.85), furMat);
      body.castShadow = true;
      dogBodyGroup.add(body);

      // Collar
      const collar = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.1, 0.5),
        new THREE.MeshStandardMaterial({ color: 0xef4444 })
      );
      collar.position.set(0, 0.15, 0.35);
      dogBodyGroup.add(collar);

      // Head & Snout
      const headGroup = new THREE.Group();
      headGroup.name = 'dog_head';
      headGroup.position.set(0, 0.35, 0.45);
      dogBodyGroup.add(headGroup);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.35, 0.38), furMat);
      head.castShadow = true;
      headGroup.add(head);

      const snout = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.2, 0.28), darkFurMat);
      snout.position.set(0, -0.06, 0.26);
      headGroup.add(snout);

      const nose = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 4, 4),
        new THREE.MeshBasicMaterial({ color: 0x0f172a })
      );
      nose.position.set(0, 0.02, 0.41);
      headGroup.add(nose);

      // Ears
      const earLeft = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 4), darkFurMat);
      earLeft.position.set(-0.16, 0.22, -0.02);
      earLeft.rotation.z = -0.2;
      headGroup.add(earLeft);

      const earRight = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 4), darkFurMat);
      earRight.position.set(0.16, 0.22, -0.02);
      earRight.rotation.z = 0.2;
      headGroup.add(earRight);

      // Tail
      const tailGroup = new THREE.Group();
      tailGroup.name = 'dog_tail';
      tailGroup.position.set(0, 0.15, -0.42);
      dogBodyGroup.add(tailGroup);

      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.45, 6), furMat);
      tail.position.set(0, 0.15, -0.15);
      tail.rotation.x = -0.8;
      tailGroup.add(tail);

      // 4 Legs
      const legMat = furMat;
      const createDogLeg = (name: string, x: number, z: number) => {
        const leg = new THREE.Group();
        leg.name = name;
        leg.position.set(x, 0.3, z);
        const legMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.35, 0.14), legMat);
        legMesh.position.y = -0.16;
        legMesh.castShadow = true;
        leg.add(legMesh);
        rootGroup.add(leg);
      };

      createDogLeg('dog_leg_fl', -0.18, 0.3);
      createDogLeg('dog_leg_fr', 0.18, 0.3);
      createDogLeg('dog_leg_rl', -0.18, -0.3);
      createDogLeg('dog_leg_rr', 0.18, -0.3);
    } else if (unit.type === 'cat') {
      // --- SENTINEL CAT 3D MODEL ---
      const catBodyGroup = new THREE.Group();
      catBodyGroup.name = 'cat_body_group';
      catBodyGroup.position.y = 0.35;
      rootGroup.add(catBodyGroup);

      const catFurMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
      const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.8 });

      // Torso
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.32, 0.7), catFurMat);
      body.castShadow = true;
      catBodyGroup.add(body);

      // Head
      const headGroup = new THREE.Group();
      headGroup.name = 'cat_head';
      headGroup.position.set(0, 0.26, 0.36);
      catBodyGroup.add(headGroup);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), catFurMat);
      headGroup.add(head);

      // Pointy Ears
      const earMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
      const earL = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 4), earMat);
      earL.position.set(-0.12, 0.16, 0);
      earL.rotation.z = -0.3;
      headGroup.add(earL);

      const earR = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 4), earMat);
      earR.position.set(0.12, 0.16, 0);
      earR.rotation.z = 0.3;
      headGroup.add(earR);

      // Emerald Eyes
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 4, 4), eyeMat);
      eyeL.position.set(-0.07, 0.04, 0.15);
      headGroup.add(eyeL);

      const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.035, 4, 4), eyeMat);
      eyeR.position.set(0.07, 0.04, 0.15);
      headGroup.add(eyeR);

      // Tail
      const tailGroup = new THREE.Group();
      tailGroup.name = 'cat_tail';
      tailGroup.position.set(0, 0.12, -0.35);
      catBodyGroup.add(tailGroup);

      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.45, 6), catFurMat);
      tail.position.set(0, 0.18, -0.1);
      tail.rotation.x = -1.2;
      tailGroup.add(tail);

      // 4 Paws
      const createCatLeg = (name: string, x: number, z: number) => {
        const leg = new THREE.Group();
        leg.name = name;
        leg.position.set(x, 0.22, z);
        const legMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.1), whiteMat);
        legMesh.position.y = -0.12;
        leg.add(legMesh);
        rootGroup.add(leg);
      };

      createCatLeg('cat_leg_fl', -0.14, 0.25);
      createCatLeg('cat_leg_fr', 0.14, 0.25);
      createCatLeg('cat_leg_rl', -0.14, -0.25);
      createCatLeg('cat_leg_rr', 0.14, -0.25);
    } else if (unit.type === 'robot') {
      // --- DEFENSE SENTINEL ROBOT 3D MODEL ---
      const botChassis = new THREE.Group();
      botChassis.name = 'robot_chassis';
      botChassis.position.y = 0.85;
      rootGroup.add(botChassis);

      const metalMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        metalness: 0.8,
        roughness: 0.25,
      });
      const glowCyanMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

      // Core Chassis
      const core = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.65, 0.6), metalMat);
      core.castShadow = true;
      botChassis.add(core);

      // Cyan Visor Eye Bar
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.14, 0.08), glowCyanMat);
      visor.position.set(0, 0.1, 0.31);
      botChassis.add(visor);

      // Rotating Radar Dome & Dish on top
      const radarGroup = new THREE.Group();
      radarGroup.name = 'robot_radar';
      radarGroup.position.set(0, 0.45, 0);
      botChassis.add(radarGroup);

      const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.05, 0.08, 8), metalMat);
      dish.rotation.x = 0.4;
      radarGroup.add(dish);

      const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 4), glowCyanMat);
      antenna.position.set(0, 0.2, 0);
      radarGroup.add(antenna);

      // Twin Plasma Blasters
      const leftBlaster = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.6, 6), metalMat);
      leftBlaster.rotation.x = Math.PI / 2;
      leftBlaster.position.set(-0.48, 0.05, 0.2);
      botChassis.add(leftBlaster);

      const rightBlaster = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.6, 6), metalMat);
      rightBlaster.rotation.x = Math.PI / 2;
      rightBlaster.position.set(0.48, 0.05, 0.2);
      botChassis.add(rightBlaster);

      // Bottom Anti-Gravity Thruster Glow Ring
      const thruster = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.35, 0.15, 12),
        glowCyanMat
      );
      thruster.position.y = -0.4;
      botChassis.add(thruster);
    } else if (!isVehicle) {
      // --- HUMANOID BIPED (Worker, Citizen, Engineer, Medic) ---
      const pelvis = new THREE.Group();
      pelvis.name = 'pelvis';
      pelvis.position.y = 0.75; // Hip height
      rootGroup.add(pelvis);

      let outfitColor = 0xf97316; // Worker orange vest
      let hatColor = 0xfacc15; // Yellow hard hat
      let hasHat = true;
      let hasTool = true;
      let toolColor = 0x78716c;

      if (unit.type === 'nurse') {
        outfitColor = 0xf43f5e; // Rose / White Nurse uniform
        hatColor = 0xffffff; // White Nurse Cap with red cross
        hasHat = true;
        hasTool = true;
        toolColor = 0x10b981; // Medical kit / injector
      } else if (unit.type === 'veterinarian') {
        outfitColor = 0x0d9488; // Teal Clinical Veterinarian coat
        hatColor = 0x14b8a6;
        hasHat = true;
        hasTool = true;
        toolColor = 0x06b6d4; // Stethoscope & scanner
      } else if (unit.type === 'architect' || unit.type === 'engineer') {
        outfitColor = 0x0284c7; // Deep Blue Architect attire
        hatColor = 0xffffff;
        hasHat = true;
        hasTool = true;
        toolColor = 0xf59e0b; // Laser welding torch & blueprint
      } else if (unit.type === 'medic') {
        outfitColor = 0x10b981; // Green medic
        hatColor = 0xffffff;
        hasHat = true;
        hasTool = true;
        toolColor = 0xef4444;
      } else if (unit.type === 'citizen') {
        const citizenColors = [0x3b82f6, 0xec4899, 0x8b5cf6, 0x10b981, 0xf59e0b, 0x6366f1];
        outfitColor = citizenColors[Math.floor(Math.random() * citizenColors.length)];
        hasHat = false;
        hasTool = false;
      }

      // Torso / Body Group (attached to pelvis)
      const torso = new THREE.Group();
      torso.name = 'torso';
      torso.position.y = 0;
      pelvis.add(torso);

      const bodyMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.65, 0.35),
        new THREE.MeshStandardMaterial({ color: outfitColor, roughness: 0.4 })
      );
      bodyMesh.position.y = 0.32;
      bodyMesh.castShadow = true;
      torso.add(bodyMesh);

      // Belt / Waist
      const beltMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.52, 0.12, 0.37),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 })
      );
      beltMesh.position.y = 0.04;
      beltMesh.castShadow = true;
      torso.add(beltMesh);

      // Head Group (attached to torso top)
      const headGroup = new THREE.Group();
      headGroup.name = 'head_group';
      headGroup.position.set(0, 0.72, 0);
      torso.add(headGroup);

      const headMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 12, 10),
        new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.5 })
      );
      headMesh.castShadow = true;
      headGroup.add(headMesh);

      // Eyes
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
      const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyeMat);
      leftEye.position.set(-0.08, 0.04, 0.2);
      headGroup.add(leftEye);

      const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyeMat);
      rightEye.position.set(0.08, 0.04, 0.2);
      headGroup.add(rightEye);

      if (hasHat) {
        const hatMesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.28, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.52),
          new THREE.MeshStandardMaterial({ color: hatColor, roughness: 0.3 })
        );
        hatMesh.position.y = 0.08;
        hatMesh.castShadow = true;
        headGroup.add(hatMesh);

        // Hat Brim
        const brim = new THREE.Mesh(
          new THREE.CylinderGeometry(0.32, 0.32, 0.04, 12),
          new THREE.MeshStandardMaterial({ color: hatColor, roughness: 0.3 })
        );
        brim.position.y = 0.07;
        headGroup.add(brim);
      }

      // Left Arm Joint (pivot at shoulder)
      const leftArm = new THREE.Group();
      leftArm.name = 'left_arm';
      leftArm.position.set(-0.35, 0.58, 0);
      torso.add(leftArm);

      const leftArmMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.52, 0.16),
        new THREE.MeshStandardMaterial({ color: outfitColor, roughness: 0.5 })
      );
      leftArmMesh.position.y = -0.22;
      leftArmMesh.castShadow = true;
      leftArm.add(leftArmMesh);

      const leftHandMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 6, 6),
        new THREE.MeshStandardMaterial({ color: 0xfbcfe8 })
      );
      leftHandMesh.position.y = -0.48;
      leftArm.add(leftHandMesh);

      // Right Arm Joint (pivot at shoulder)
      const rightArm = new THREE.Group();
      rightArm.name = 'right_arm';
      rightArm.position.set(0.35, 0.58, 0);
      torso.add(rightArm);

      const rightArmMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.52, 0.16),
        new THREE.MeshStandardMaterial({ color: outfitColor, roughness: 0.5 })
      );
      rightArmMesh.position.y = -0.22;
      rightArmMesh.castShadow = true;
      rightArm.add(rightArmMesh);

      const rightHandMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 6, 6),
        new THREE.MeshStandardMaterial({ color: 0xfbcfe8 })
      );
      rightHandMesh.position.y = -0.48;
      rightArm.add(rightHandMesh);

      if (hasTool) {
        const toolGroup = new THREE.Group();
        toolGroup.name = 'worker_tool';
        toolGroup.position.set(0, -0.48, 0.12);

        // Tool Handle
        const handle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 0.45, 6),
          new THREE.MeshStandardMaterial({ color: 0x475569 })
        );
        handle.rotation.x = Math.PI / 2.5;
        toolGroup.add(handle);

        // Tool Head
        const toolHead = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, 0.12, 0.14),
          new THREE.MeshStandardMaterial({ color: toolColor, metalness: 0.4 })
        );
        toolHead.position.set(0, 0.08, 0.22);
        toolGroup.add(toolHead);

        rightArm.add(toolGroup);
      }

      // Left Leg Joint (pivot at hip)
      const leftLeg = new THREE.Group();
      leftLeg.name = 'left_leg';
      leftLeg.position.set(-0.16, 0, 0);
      pelvis.add(leftLeg);

      const leftPants = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.55, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 }) // Jeans/pants
      );
      leftPants.position.y = -0.28;
      leftPants.castShadow = true;
      leftLeg.add(leftPants);

      const leftBoot = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.16, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
      );
      leftBoot.position.set(0, -0.62, 0.05);
      leftBoot.castShadow = true;
      leftLeg.add(leftBoot);

      // Right Leg Joint (pivot at hip)
      const rightLeg = new THREE.Group();
      rightLeg.name = 'right_leg';
      rightLeg.position.set(0.16, 0, 0);
      pelvis.add(rightLeg);

      const rightPants = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.55, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 })
      );
      rightPants.position.y = -0.28;
      rightPants.castShadow = true;
      rightLeg.add(rightPants);

      const rightBoot = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.16, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
      );
      rightBoot.position.set(0, -0.62, 0.05);
      rightBoot.castShadow = true;
      rightLeg.add(rightBoot);
    } else if (unit.type === 'fire_truck') {
      // --- EMERGENCY FIRE ENGINE TRUCK ---
      const chassis = new THREE.Group();
      chassis.name = 'chassis';
      chassis.position.y = 0.5;
      rootGroup.add(chassis);

      // Main Truck Body
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 1.1, 3.2),
        new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3, metalness: 0.1 })
      );
      body.position.y = 0.55;
      body.castShadow = true;
      chassis.add(body);

      // Cabin / Windshield
      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.8, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.6, transparent: true, opacity: 0.85 })
      );
      cabin.position.set(0, 0.95, 0.8);
      chassis.add(cabin);

      // Water Cannon on roof
      const cannon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.14, 1.0, 8),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8 })
      );
      cannon.rotation.x = Math.PI / 2.5;
      cannon.position.set(0, 1.4, -0.5);
      chassis.add(cannon);

      // Emergency Light Bar
      const light = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.2, 0.3),
        new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xff0000, emissiveIntensity: 1.5 })
      );
      light.name = 'siren_light';
      light.position.set(0, 1.45, 0.8);
      chassis.add(light);

      // 4 Wheels
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
      const wheelGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.35, 12);
      wheelGeom.rotateZ(Math.PI / 2);

      const createWheel = (name: string, x: number, z: number) => {
        const wheel = new THREE.Mesh(wheelGeom, wheelMat);
        wheel.name = name;
        wheel.position.set(x, 0.4, z);
        wheel.castShadow = true;
        rootGroup.add(wheel);
        return wheel;
      };

      createWheel('wheel_fl', -0.9, 1.0);
      createWheel('wheel_fr', 0.9, 1.0);
      createWheel('wheel_rl', -0.9, -1.0);
      createWheel('wheel_rr', 0.9, -1.0);
    } else if (unit.type === 'police') {
      // --- CITY POLICE CRUISER ---
      const chassis = new THREE.Group();
      chassis.name = 'chassis';
      chassis.position.y = 0.35;
      rootGroup.add(chassis);

      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.75, 2.8),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 })
      );
      body.position.y = 0.4;
      body.castShadow = true;
      chassis.add(body);

      // Roof / Glass
      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.6, 1.4),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
      );
      roof.position.set(0, 0.95, -0.1);
      chassis.add(roof);

      // Blue / Red Siren
      const siren = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.18, 0.25),
        new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x60a5fa, emissiveIntensity: 1.5 })
      );
      siren.name = 'siren_light';
      siren.position.set(0, 1.3, -0.1);
      chassis.add(siren);

      // 4 Wheels
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
      const wheelGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.28, 12);
      wheelGeom.rotateZ(Math.PI / 2);

      const createWheel = (name: string, x: number, z: number) => {
        const wheel = new THREE.Mesh(wheelGeom, wheelMat);
        wheel.name = name;
        wheel.position.set(x, 0.35, z);
        wheel.castShadow = true;
        rootGroup.add(wheel);
        return wheel;
      };

      createWheel('wheel_fl', -0.8, 0.85);
      createWheel('wheel_fr', 0.8, 0.85);
      createWheel('wheel_rl', -0.8, -0.85);
      createWheel('wheel_rr', 0.8, -0.85);
    } else if (unit.type === 'military') {
      // --- HEAVY COMBAT TANK ---
      const chassis = new THREE.Group();
      chassis.name = 'chassis';
      chassis.position.y = 0.45;
      rootGroup.add(chassis);

      // Tank Hull
      const hull = new THREE.Mesh(
        new THREE.BoxGeometry(2.1, 0.8, 3.2),
        new THREE.MeshStandardMaterial({ color: 0x365314, roughness: 0.7 })
      );
      hull.position.y = 0.4;
      hull.castShadow = true;
      chassis.add(hull);

      // Rotating Turret
      const turretGroup = new THREE.Group();
      turretGroup.name = 'turret';
      turretGroup.position.set(0, 0.9, 0);
      chassis.add(turretGroup);

      const turretMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.9, 0.6, 8),
        new THREE.MeshStandardMaterial({ color: 0x3f6212, roughness: 0.6 })
      );
      turretMesh.position.y = 0.3;
      turretMesh.castShadow = true;
      turretGroup.add(turretMesh);

      // Tank Cannon
      const cannon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 2.2, 8),
        new THREE.MeshStandardMaterial({ color: 0x14532d, metalness: 0.6 })
      );
      cannon.rotation.x = Math.PI / 2;
      cannon.position.set(0, 0.35, 1.4);
      cannon.castShadow = true;
      turretGroup.add(cannon);

      // Left & Right Treads / Road Wheels
      const treadMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9 });
      const wheelGeom = new THREE.CylinderGeometry(0.38, 0.38, 0.4, 10);
      wheelGeom.rotateZ(Math.PI / 2);

      for (let w = -1.2; w <= 1.2; w += 0.8) {
        const leftW = new THREE.Mesh(wheelGeom, treadMat);
        leftW.name = `tank_wheel_l_${w}`;
        leftW.position.set(-1.15, 0.38, w);
        rootGroup.add(leftW);

        const rightW = new THREE.Mesh(wheelGeom, treadMat);
        rightW.name = `tank_wheel_r_${w}`;
        rightW.position.set(1.15, 0.38, w);
        rootGroup.add(rightW);
      }
    }

    // 4. Overhead In-World Billboard Health Bar
    const hbGroup = new THREE.Group();
    hbGroup.name = 'unit_health_bar';
    hbGroup.position.y = isVehicle ? 2.8 : isPet ? 1.4 : 2.3;

    const bgBar = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 0.22),
      new THREE.MeshBasicMaterial({ color: 0x090d16, side: THREE.DoubleSide })
    );
    hbGroup.add(bgBar);

    const fgBar = new THREE.Mesh(
      new THREE.PlaneGeometry(1.52, 0.16),
      new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide })
    );
    fgBar.name = 'fg_unit_health';
    fgBar.position.z = 0.01;
    hbGroup.add(fgBar);

    rootGroup.add(hbGroup);

    return rootGroup;
  }

  // --- Selection Management ---

  public selectUnit(id: string, multiSelect: boolean = false): UnitEntity | null {
    let found: UnitEntity | null = null;

    this.units.forEach((u) => {
      if (u.id === id) {
        u.selected = multiSelect ? !u.selected : true;
        if (u.selected) found = u;
      } else if (!multiSelect) {
        u.selected = false;
      }
      this.updateUnitSelectionVisual(u);
    });

    if (found) {
      soundManager.playUnitSelect();
    }
    return found;
  }

  public selectUnits(ids: string[]): UnitEntity[] {
    const idSet = new Set(ids);
    const selected: UnitEntity[] = [];

    this.units.forEach((u) => {
      u.selected = idSet.has(u.id);
      this.updateUnitSelectionVisual(u);
      if (u.selected) selected.push(u);
    });

    if (selected.length > 0) {
      soundManager.playUnitSelect();
    }
    return selected;
  }

  public selectAll(): UnitEntity[] {
    this.units.forEach((u) => {
      u.selected = true;
      this.updateUnitSelectionVisual(u);
    });
    if (this.units.length > 0) {
      soundManager.playUnitSelect();
    }
    return this.units;
  }

  public selectAllOfType(type: string): UnitEntity[] {
    const selected: UnitEntity[] = [];
    this.units.forEach((u) => {
      u.selected = u.type === type;
      this.updateUnitSelectionVisual(u);
      if (u.selected) selected.push(u);
    });
    if (selected.length > 0) {
      soundManager.playUnitSelect();
    }
    return selected;
  }

  public deselectAll() {
    this.units.forEach((u) => {
      u.selected = false;
      this.updateUnitSelectionVisual(u);
    });
  }

  public getSelectedUnits(): UnitEntity[] {
    return this.units.filter((u) => u.selected);
  }

  public getSelectedUnitIds(): string[] {
    return this.units.filter((u) => u.selected).map((u) => u.id);
  }

  private updateUnitSelectionVisual(unit: UnitEntity) {
    const mesh = this.unitMeshes.get(unit.id);
    if (!mesh) return;
    const ring = mesh.getObjectByName('selection_ring');
    if (ring) {
      ring.visible = !!unit.selected;
    }
  }

  // --- RTS Order / Command Issuing ---

  public orderMove(unitIds: string[], targetX: number, targetZ: number) {
    const targets = this.units.filter((u) => unitIds.includes(u.id));
    if (targets.length === 0) return;

    soundManager.playUnitOrder();

    const count = targets.length;
    targets.forEach((unit, index) => {
      let offsetX = 0;
      let offsetZ = 0;

      if (count > 1) {
        const angle = (index / count) * Math.PI * 2;
        const radius = Math.min(6, 1.4 * Math.sqrt(index + 1));
        offsetX = Math.cos(angle) * radius;
        offsetZ = Math.sin(angle) * radius;
      }

      unit.targetX = targetX + offsetX;
      unit.targetZ = targetZ + offsetZ;
      unit.destinationX = targetX + offsetX;
      unit.destinationZ = targetZ + offsetZ;
      unit.manualOrder = true;
      unit.orderType = 'move';
      unit.state = 'walking';
      unit.targetBuildingId = undefined;
      unit.targetThreatId = undefined;
    });
  }

  public orderAttack(unitIds: string[], targetThreatId: string, threatX: number, threatZ: number) {
    const targets = this.units.filter((u) => unitIds.includes(u.id));
    if (targets.length === 0) return;

    soundManager.playUnitAttackOrder();

    targets.forEach((unit, index) => {
      const angle = (index / Math.max(1, targets.length)) * Math.PI * 2;
      const radius = unit.type === 'military' ? 5.0 : 3.0;
      unit.targetX = threatX + Math.cos(angle) * radius;
      unit.targetZ = threatZ + Math.sin(angle) * radius;
      unit.manualOrder = true;
      unit.orderType = 'attack';
      unit.targetThreatId = targetThreatId;
      unit.state = 'fighting';
      unit.targetBuildingId = undefined;
    });
  }

  public orderConstruct(unitIds: string[], buildingInstanceId: string, buildingX: number, buildingZ: number, isCitadel: boolean = false) {
    const targets = this.units.filter((u) => unitIds.includes(u.id));
    if (targets.length === 0) return;

    soundManager.playUnitOrder();

    const radius = isCitadel || buildingInstanceId.includes('kingdom_house') ? 4.4 : 1.8;

    targets.forEach((unit, index) => {
      const angle = (index / Math.max(1, targets.length)) * Math.PI * 2;
      unit.targetX = buildingX + Math.cos(angle) * radius;
      unit.targetZ = buildingZ + Math.sin(angle) * radius;
      unit.manualOrder = true;
      unit.orderType = 'build';
      unit.targetBuildingId = buildingInstanceId;
      unit.state = 'working';
      unit.targetThreatId = undefined;
    });
  }

  public orderWorkAtWorkshop(unitIds: string[], buildingInstanceId: string, workshopX: number, workshopZ: number) {
    const targets = this.units.filter((u) => unitIds.includes(u.id));
    if (targets.length === 0) return;

    soundManager.playUnitOrder();

    targets.forEach((unit, index) => {
      const angle = (index / Math.max(1, targets.length)) * Math.PI * 2;
      const radius = 1.4 + (index % 2) * 0.4;
      unit.targetX = workshopX + Math.cos(angle) * radius;
      unit.targetZ = workshopZ + Math.sin(angle) * radius;
      unit.manualOrder = true;
      unit.orderType = 'work_harvest';
      unit.targetBuildingId = buildingInstanceId;
      unit.targetNodeId = undefined;
      unit.state = 'working';
      unit.targetThreatId = undefined;
    });
  }

  public orderGatherResourceNode(unitIds: string[], nodeId: string, nodeX: number, nodeZ: number) {
    const targets = this.units.filter((u) => unitIds.includes(u.id));
    if (targets.length === 0) return;

    soundManager.playUnitOrder();

    targets.forEach((unit, index) => {
      const angle = (index / Math.max(1, targets.length)) * Math.PI * 2;
      const radius = 1.6 + (index % 2) * 0.35;
      unit.targetX = nodeX + Math.cos(angle) * radius;
      unit.targetZ = nodeZ + Math.sin(angle) * radius;
      unit.manualOrder = true;
      unit.orderType = 'gather_node';
      unit.targetNodeId = nodeId;
      unit.targetBuildingId = undefined;
      unit.state = 'working';
      unit.targetThreatId = undefined;
    });
  }

  public stopUnits(unitIds: string[]) {
    this.units.forEach((u) => {
      if (unitIds.includes(u.id)) {
        u.targetX = u.x;
        u.targetZ = u.z;
        u.manualOrder = false;
        u.orderType = 'idle';
        u.state = 'idle';
        u.targetBuildingId = undefined;
        u.targetThreatId = undefined;
        u.targetNodeId = undefined;
      }
    });
  }

  // --- Main Simulation & Two-State Animation Update ---

  public update(
    delta: number,
    underConstructionBuildings: PlacedBuilding[],
    threats: ThreatEntity[],
    onThreatDamaged: (threatId: string, dmg: number) => void,
    allBuildings: PlacedBuilding[] = underConstructionBuildings
  ) {
    const now = Date.now();
    const timeSec = now * 0.001;

    for (let i = this.units.length - 1; i >= 0; i--) {
      const unit = this.units[i];
      const mesh = this.unitMeshes.get(unit.id);
      if (!mesh) continue;

      const seed = this.animSeedMap.get(unit.id) || 0;
      let walkPhase = this.walkPhaseMap.get(unit.id) || 0;

      // Animate selection ring rotation
      if (unit.selected) {
        const ring = mesh.getObjectByName('selection_ring');
        if (ring) {
          ring.rotation.y += delta * 1.5;
        }
      }

      // 1. Autonomous AI behavior (Only if NOT in manual order)
      if (!unit.manualOrder) {
        if (unit.type === 'nurse' || unit.type === 'medic') {
          // --- FIELD NURSE AI: HEALS INJURED WORKERS & CITIZENS ---
          let mostInjuredWorker: UnitEntity | null = null;
          let lowestHpPct = 0.99;

          for (const other of this.units) {
            if (other.id === unit.id) continue;
            if (other.type === 'worker' || other.type === 'nurse' || other.type === 'veterinarian' || other.type === 'architect' || other.type === 'citizen' || other.type === 'medic' || other.type === 'engineer') {
              const pct = other.hp / other.maxHp;
              if (pct < lowestHpPct) {
                lowestHpPct = pct;
                mostInjuredWorker = other;
              }
            }
          }

          if (mostInjuredWorker) {
            unit.targetX = mostInjuredWorker.x;
            unit.targetZ = mostInjuredWorker.z;
            const dist = Math.hypot(mostInjuredWorker.x - unit.x, mostInjuredWorker.z - unit.z);
            if (dist <= 2.2) {
              unit.state = 'healing';
              mostInjuredWorker.hp = Math.min(mostInjuredWorker.maxHp, mostInjuredWorker.hp + 35 * delta);
              if (now % 1600 < 50 && Math.random() < 0.3) {
                soundManager.playHealSound();
              }
            } else {
              unit.state = 'walking';
            }
          } else {
            // Patrol near Citadel
            const patrolAngle = timeSec * 0.5 + seed;
            unit.targetX = this.kingdomHouseCoords.x + Math.cos(patrolAngle) * 4.0;
            unit.targetZ = this.kingdomHouseCoords.z + Math.sin(patrolAngle) * 4.0;
          }
        } else if (unit.type === 'veterinarian') {
          // --- VETERINARIAN AI: HEALS INJURED PETS (DOGS, CATS, ROBOTS) ---
          let mostInjuredPet: UnitEntity | null = null;
          let lowestPetHpPct = 0.99;

          for (const other of this.units) {
            if (other.id === unit.id) continue;
            if (other.type === 'dog' || other.type === 'cat' || other.type === 'robot') {
              const pct = other.hp / other.maxHp;
              if (pct < lowestPetHpPct) {
                lowestPetHpPct = pct;
                mostInjuredPet = other;
              }
            }
          }

          if (mostInjuredPet) {
            unit.targetX = mostInjuredPet.x;
            unit.targetZ = mostInjuredPet.z;
            const dist = Math.hypot(mostInjuredPet.x - unit.x, mostInjuredPet.z - unit.z);
            if (dist <= 2.2) {
              unit.state = 'healing';
              mostInjuredPet.hp = Math.min(mostInjuredPet.maxHp, mostInjuredPet.hp + 45 * delta);
              if (now % 1600 < 50 && Math.random() < 0.3) {
                soundManager.playHealSound();
              }
            } else {
              unit.state = 'walking';
            }
          } else {
            // Patrol near Citadel
            const patrolAngle = timeSec * 0.5 + seed * 2;
            unit.targetX = this.kingdomHouseCoords.x + Math.cos(patrolAngle) * 5.0;
            unit.targetZ = this.kingdomHouseCoords.z + Math.sin(patrolAngle) * 5.0;
          }
        } else if (unit.type === 'architect' || unit.type === 'engineer') {
          // --- ARCHITECT AI: REPAIRS DAMAGED BUILDINGS & CITADEL ---
          let damagedBld: PlacedBuilding | null = null;
          let lowestBldPct = 0.99;

          for (const b of allBuildings) {
            if (!b.isConstructed) continue;
            const pct = b.hp / b.maxHp;
            if (pct < lowestBldPct) {
              lowestBldPct = pct;
              damagedBld = b;
            }
          }

          if (damagedBld) {
            const bldX = damagedBld.gridX * 2;
            const bldZ = damagedBld.gridZ * 2;
            unit.targetX = bldX + Math.cos(seed) * 2.0;
            unit.targetZ = bldZ + Math.sin(seed) * 2.0;
            const isCitadel = damagedBld.defId === 'mon_kingdom_house';
            const distThreshold = isCitadel ? 5.2 : 3.2;
            const dist = Math.hypot(bldX - unit.x, bldZ - unit.z);

            if (dist <= distThreshold) {
              unit.state = 'working';
              damagedBld.hp = Math.min(damagedBld.maxHp, damagedBld.hp + 50 * delta);
              damagedBld.isOnFire = false;
              if (now % 1500 < 50 && Math.random() < 0.3) {
                soundManager.playRepairSound();
              }
            } else {
              unit.state = 'walking';
            }
          } else if (underConstructionBuildings.length > 0) {
            // Assist with construction
            const target = underConstructionBuildings[i % underConstructionBuildings.length];
            unit.orderType = 'build';
            unit.targetBuildingId = target.instanceId;
            unit.targetX = target.gridX * 2 + Math.cos(seed) * 2.0;
            unit.targetZ = target.gridZ * 2 + Math.sin(seed) * 2.0;
          } else {
            // Rest near Citadel
            const patrolAngle = timeSec * 0.4 + seed;
            unit.targetX = this.kingdomHouseCoords.x + Math.cos(patrolAngle) * 3.5;
            unit.targetZ = this.kingdomHouseCoords.z + Math.sin(patrolAngle) * 3.5;
          }
        } else if (unit.type === 'worker') {
          // Check if the Citadel structure is under construction
          const citadelUnderConstruction = underConstructionBuildings.find(
            (b) => b.defId === 'mon_kingdom_house' && !b.isConstructed
          );

          if (citadelUnderConstruction) {
            // STEP 1: PRIORITIZE BUILDING THE CITADEL STRUCTURE FIRST!
            unit.orderType = 'build';
            unit.targetBuildingId = citadelUnderConstruction.instanceId;
            unit.targetNodeId = undefined;

            // Distribute workers neatly around the 8x8 Citadel perimeter (4.4 units radius)
            const citadelX = citadelUnderConstruction.gridX * 2;
            const citadelZ = citadelUnderConstruction.gridZ * 2;
            const totalWorkers = Math.max(1, this.units.filter((u) => u.type === 'worker').length);
            const workerAngle = (i / totalWorkers) * Math.PI * 2 + ((seed % 100) / 100) * 0.4;
            unit.targetX = citadelX + Math.cos(workerAngle) * 4.4;
            unit.targetZ = citadelZ + Math.sin(workerAngle) * 4.4;
          } else if (underConstructionBuildings.length > 0) {
            // STEP 2: Build other queued construction projects
            const target = underConstructionBuildings[i % underConstructionBuildings.length];
            unit.orderType = 'build';
            unit.targetBuildingId = target.instanceId;
            unit.targetNodeId = undefined;
            const targetX = target.gridX * 2;
            const targetZ = target.gridZ * 2;
            const angle = (i * 1.5 + (seed % 10)) % (Math.PI * 2);
            unit.targetX = targetX + Math.cos(angle) * 2.2;
            unit.targetZ = targetZ + Math.sin(angle) * 2.2;
          } else {
            // STEP 3: CITADEL IS BUILT & NO CONSTRUCTION SITES!
            // AUTOMATICALLY HARVEST WILD RESOURCES AND DELIVER TO CITADEL DEPOSITORY!
            if (!unit.cargo) {
              unit.cargo = { wood: 0, steel: 0, concrete: 0, maxCapacity: 10 };
            }
            const totalCargo = unit.cargo.wood + unit.cargo.steel + unit.cargo.concrete;

            if (totalCargo >= unit.cargo.maxCapacity || unit.orderType === 'deliver_kingdom') {
              // Full Cargo: Head directly to the Citadel Central Depository
              unit.orderType = 'deliver_kingdom';
              unit.targetX = this.kingdomHouseCoords.x + ((i % 3) - 1) * 0.9;
              unit.targetZ = this.kingdomHouseCoords.z + 3.5;
            } else {
              // Seeking Wild Resources: Harvest wood, steel, and stone from wild nodes
              unit.orderType = 'gather_node';

              let targetNode = unit.targetNodeId
                ? this.envResourceManager?.nodes.find((n) => n.id === unit.targetNodeId && !n.isDepleted)
                : null;

              if (!targetNode && this.envResourceManager) {
                const activeNodes = this.envResourceManager.nodes.filter((n) => !n.isDepleted);
                if (activeNodes.length > 0) {
                  // Distribute workers across available nodes based on index
                  targetNode = activeNodes[i % activeNodes.length];
                  unit.targetNodeId = targetNode.id;
                }
              }

              if (targetNode) {
                const angle = ((i * 1.4 + seed) % 6.28);
                unit.targetX = targetNode.x + Math.cos(angle) * 1.6;
                unit.targetZ = targetNode.z + Math.sin(angle) * 1.6;
              } else {
                // No active nodes available: Rest near Kingdom House
                unit.orderType = 'idle';
                unit.targetX = this.kingdomHouseCoords.x + Math.sin(i * 1.5) * 4.0;
                unit.targetZ = this.kingdomHouseCoords.z + Math.cos(i * 1.5) * 4.0;
              }
            }
          }
        } else if (unit.type === 'dog') {
          // --- VIGILANT GUARD DOG AI ---
          let nearestThreatDist = Infinity;
          let targetThreat: ThreatEntity | null = null;

          for (const t of threats) {
            if (!t.active) continue;
            const d = Math.hypot(t.x - unit.x, t.z - unit.z);
            if (d < nearestThreatDist) {
              nearestThreatDist = d;
              targetThreat = t;
            }
          }

          if (targetThreat && nearestThreatDist < 22.0) {
            unit.targetX = targetThreat.x;
            unit.targetZ = targetThreat.z;
            unit.state = 'fighting';

            if (nearestThreatDist < 2.8) {
              // Bite and hold intruder
              onThreatDamaged(targetThreat.id, 40 * delta);
              if (now - (unit.barkAlertCooldown || 0) > 2200) {
                unit.barkAlertCooldown = now;
                soundManager.playDogBark();
              }
            } else if (now - (unit.barkAlertCooldown || 0) > 3500) {
              unit.barkAlertCooldown = now;
              soundManager.playDogBark();
            }
          } else {
            // Vigilant patrol around nearest worker or Citadel
            const nearestWorker = this.units.find((u) => u.type === 'worker' && u.id !== unit.id);
            const anchorX = nearestWorker ? nearestWorker.x : this.kingdomHouseCoords.x;
            const anchorZ = nearestWorker ? nearestWorker.z : this.kingdomHouseCoords.z;
            const patrolAngle = (timeSec * 0.8 + seed);
            unit.targetX = anchorX + Math.cos(patrolAngle) * 4.5;
            unit.targetZ = anchorZ + Math.sin(patrolAngle) * 4.5;
          }
        } else if (unit.type === 'cat') {
          // --- VIGILANT SENTINEL CAT AI ---
          let nearestThreatDist = Infinity;
          let targetThreat: ThreatEntity | null = null;

          for (const t of threats) {
            if (!t.active) continue;
            const d = Math.hypot(t.x - unit.x, t.z - unit.z);
            if (d < nearestThreatDist) {
              nearestThreatDist = d;
              targetThreat = t;
            }
          }

          if (targetThreat && nearestThreatDist < 25.0) {
            unit.targetX = targetThreat.x;
            unit.targetZ = targetThreat.z;
            unit.state = 'fighting';

            if (nearestThreatDist < 2.5) {
              // Rapid claw burst
              onThreatDamaged(targetThreat.id, 50 * delta);
              if (now - (unit.barkAlertCooldown || 0) > 2800) {
                unit.barkAlertCooldown = now;
                soundManager.playCatMeow();
              }
            } else if (now - (unit.barkAlertCooldown || 0) > 4000) {
              unit.barkAlertCooldown = now;
              soundManager.playCatMeow();
            }
          } else {
            // Agile perimeter stalking
            const patrolAngle = (timeSec * 0.6 + seed * 2);
            unit.targetX = this.kingdomHouseCoords.x + Math.cos(patrolAngle) * 7.5;
            unit.targetZ = this.kingdomHouseCoords.z + Math.sin(patrolAngle) * 7.5;
          }
        } else if (unit.type === 'robot') {
          // --- DEFENSE SENTINEL ROBOT AI ---
          let nearestThreatDist = Infinity;
          let targetThreat: ThreatEntity | null = null;

          for (const t of threats) {
            if (!t.active) continue;
            const d = Math.hypot(t.x - unit.x, t.z - unit.z);
            if (d < nearestThreatDist) {
              nearestThreatDist = d;
              targetThreat = t;
            }
          }

          if (targetThreat && nearestThreatDist < 28.0) {
            // Keep safe firing distance
            if (nearestThreatDist > 14.0) {
              unit.targetX = targetThreat.x;
              unit.targetZ = targetThreat.z;
            } else if (nearestThreatDist < 6.0) {
              // Back up slightly
              const pushX = (unit.x - targetThreat.x) / nearestThreatDist;
              const pushZ = (unit.z - targetThreat.z) / nearestThreatDist;
              unit.targetX = unit.x + pushX * 3.0;
              unit.targetZ = unit.z + pushZ * 3.0;
            }
            unit.state = 'fighting';

            // Twin Plasma Laser Blasters
            onThreatDamaged(targetThreat.id, 75 * delta);
            if (now - (unit.barkAlertCooldown || 0) > 1800) {
              unit.barkAlertCooldown = now;
              soundManager.playRobotBeep();
              soundManager.playLaserZap();
            }
          } else {
            // Scanning patrol around city center
            const patrolAngle = (timeSec * 0.5 + seed);
            unit.targetX = this.kingdomHouseCoords.x + Math.cos(patrolAngle) * 9.0;
            unit.targetZ = this.kingdomHouseCoords.z + Math.sin(patrolAngle) * 9.0;
          }
        } else if (unit.type === 'fire_truck') {
          const fire = threats.find((t) => t.type === 'fire' && t.active);
          if (fire) {
            unit.targetX = fire.x + 3.0;
            unit.targetZ = fire.z + 3.0;
            const dist = Math.hypot(fire.x - unit.x, fire.z - unit.z);
            if (dist < 8.0) {
              onThreatDamaged(fire.id, 45 * delta);
            }
          }
        } else if (unit.type === 'police' || unit.type === 'military') {
          let nearestDist = Infinity;
          let targetThreat: ThreatEntity | null = null;
          for (const t of threats) {
            if (!t.active) continue;
            const d = Math.hypot(t.x - unit.x, t.z - unit.z);
            if (d < nearestDist) {
              nearestDist = d;
              targetThreat = t;
            }
          }

          if (targetThreat) {
            unit.targetX = targetThreat.x;
            unit.targetZ = targetThreat.z;
            if (nearestDist < 12.0) {
              const dmg = unit.type === 'military' ? 60 * delta : 30 * delta;
              onThreatDamaged(targetThreat.id, dmg);
              if (now % 600 < 50 && Math.random() < 0.3) {
                soundManager.playLaserZap();
              }
            }
          }
        } else if (unit.type === 'citizen') {
          if (Math.random() < 0.015) {
            unit.targetX += (Math.random() - 0.5) * 10;
            unit.targetZ += (Math.random() - 0.5) * 10;
          }
        }
      }

      // Order & Task Execution Logic (Manual and Autonomous)
      if (unit.orderType === 'attack' && unit.targetThreatId) {
        const targetThreat = threats.find((t) => t.id === unit.targetThreatId && t.active);
        if (targetThreat) {
          unit.targetX = targetThreat.x;
          unit.targetZ = targetThreat.z;
          const dist = Math.hypot(targetThreat.x - unit.x, targetThreat.z - unit.z);
          if (dist < 12.0) {
            const dmg = unit.type === 'military' ? 75 * delta : unit.type === 'police' ? 40 * delta : 25 * delta;
            onThreatDamaged(targetThreat.id, dmg);
            if (now % 500 < 50 && Math.random() < 0.35) {
              soundManager.playLaserZap();
            }
          }
        } else {
          unit.manualOrder = false;
          unit.orderType = 'idle';
          unit.state = 'idle';
        }
      } else if (unit.orderType === 'build' && unit.targetBuildingId) {
        const bld = underConstructionBuildings.find((b) => b.instanceId === unit.targetBuildingId && !b.isConstructed);
        if (!bld) {
          // Finished building! Clear order and switch to idle so autonomous loop picks harvesting
          unit.manualOrder = false;
          unit.orderType = 'idle';
          unit.state = 'idle';
          unit.targetBuildingId = undefined;
        } else {
          const bldX = bld.gridX * 2;
          const bldZ = bld.gridZ * 2;
          const distToSite = Math.hypot(bldX - unit.x, bldZ - unit.z);
          const isCitadel = bld.defId === 'mon_kingdom_house';
          const workThreshold = isCitadel ? 5.2 : 2.8;

          if (distToSite <= workThreshold) {
            unit.state = 'working';
            // Intermittent construction hammer audio
            if (now % 1500 < 40 && Math.random() < 0.3) {
              soundManager.playConstructionHammer();
            }
          }
        }
      } else if (unit.orderType === 'gather_node') {
        let node = unit.targetNodeId
          ? this.envResourceManager?.nodes.find((n) => n.id === unit.targetNodeId)
          : null;

        if (!node || node.isDepleted) {
          const altNode = this.envResourceManager?.nodes.find((n) => !n.isDepleted);
          if (altNode) {
            unit.targetNodeId = altNode.id;
            node = altNode;
            unit.targetX = altNode.x + Math.cos(i + seed) * 1.5;
            unit.targetZ = altNode.z + Math.sin(i + seed) * 1.5;
          } else {
            unit.manualOrder = false;
            unit.orderType = 'idle';
            unit.state = 'idle';
          }
        }

        if (node && !node.isDepleted) {
          const nodeDist = Math.hypot(node.x - unit.x, node.z - unit.z);
          if (nodeDist <= 2.4) {
            unit.state = 'working';
            const lastHarvest = this.workerLastHarvestMap.get(unit.id) || 0;
            if (now - lastHarvest > 1400) {
              this.workerLastHarvestMap.set(unit.id, now);
              if (!unit.cargo) {
                unit.cargo = { wood: 0, steel: 0, concrete: 0, maxCapacity: 10 };
              }
              const totalCargo = unit.cargo.wood + unit.cargo.steel + unit.cargo.concrete;
              if (totalCargo >= unit.cargo.maxCapacity) {
                // Full cargo! Switch to deliver to Kingdom House
                unit.orderType = 'deliver_kingdom';
                unit.targetX = this.kingdomHouseCoords.x + ((i % 3) - 1) * 0.9;
                unit.targetZ = this.kingdomHouseCoords.z + 3.5;
                unit.state = 'walking';
              } else {
                const spaceLeft = unit.cargo.maxCapacity - totalCargo;
                const harvestAmt = Math.min(2, spaceLeft);
                const harvestRes = this.envResourceManager?.harvestNode(node.id, harvestAmt, 'worker');
                if (harvestRes) {
                  unit.cargo[harvestRes.type] += harvestRes.gathered;
                  const newCargoTotal = unit.cargo.wood + unit.cargo.steel + unit.cargo.concrete;
                  if (newCargoTotal >= unit.cargo.maxCapacity) {
                    unit.orderType = 'deliver_kingdom';
                    unit.targetX = this.kingdomHouseCoords.x + ((i % 3) - 1) * 0.9;
                    unit.targetZ = this.kingdomHouseCoords.z + 3.5;
                    unit.state = 'walking';
                  }
                }
              }
            }
          }
        }
      } else if (unit.orderType === 'deliver_kingdom') {
        const dropX = this.kingdomHouseCoords.x;
        const dropZ = this.kingdomHouseCoords.z + 3.5;
        const kingdomDist = Math.hypot(dropX - unit.x, dropZ - unit.z);

        if (kingdomDist <= 2.2) {
          // Reached Kingdom House Depository! Deposit cargo
          if (unit.cargo && (unit.cargo.wood > 0 || unit.cargo.steel > 0 || unit.cargo.concrete > 0)) {
            if (this.onWorkerDeliveredToKingdom) {
              this.onWorkerDeliveredToKingdom(unit.cargo, unit.id);
            }
            unit.cargo = { wood: 0, steel: 0, concrete: 0, maxCapacity: 10 };
          }

          // Return to gathering wild resources automatically
          unit.orderType = 'gather_node';
          unit.state = 'walking';

          const activeNode = this.envResourceManager?.nodes.find((n) => !n.isDepleted);
          if (activeNode) {
            unit.targetNodeId = activeNode.id;
            unit.targetX = activeNode.x + Math.cos(i + seed) * 1.5;
            unit.targetZ = activeNode.z + Math.sin(i + seed) * 1.5;
          } else {
            unit.manualOrder = false;
            unit.orderType = 'idle';
            unit.state = 'idle';
          }
        }
      }

      // 2. Spatial Movement Calculation
      const dx = unit.targetX - unit.x;
      const dz = unit.targetZ - unit.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const isMoving = dist > 0.45;

      if (isMoving) {
        const moveDist = Math.min(dist, unit.speed * delta);
        unit.x += (dx / dist) * moveDist;
        unit.z += (dz / dist) * moveDist;
        mesh.position.x = unit.x;
        mesh.position.z = unit.z;

        // Smooth orientation turning
        const targetRotY = Math.atan2(dx, dz);
        let diff = targetRotY - mesh.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        mesh.rotation.y += diff * Math.min(1, delta * 10);

        unit.state = 'walking';
      } else {
        if (unit.manualOrder && unit.orderType === 'move') {
          unit.manualOrder = false;
          unit.orderType = 'idle';
          unit.state = 'idle';
        } else if (unit.state === 'walking') {
          unit.state = 'idle';
        }
      }

      // 3. EXECUTE THE MULTI-STATE ANIMATIONS:
      const isVehicle = unit.type === 'military' || unit.type === 'fire_truck' || unit.type === 'police';
      const isPet = unit.type === 'dog' || unit.type === 'cat' || unit.type === 'robot';

      if (unit.type === 'dog') {
        // --- GUARD DOG ANIMATIONS ---
        const dogTail = mesh.getObjectByName('dog_tail');
        const dogHead = mesh.getObjectByName('dog_head');
        const legFL = mesh.getObjectByName('dog_leg_fl');
        const legFR = mesh.getObjectByName('dog_leg_fr');
        const legRL = mesh.getObjectByName('dog_leg_rl');
        const legRR = mesh.getObjectByName('dog_leg_rr');
        const dogBody = mesh.getObjectByName('dog_body_group');

        if (unit.state === 'walking' || unit.state === 'fighting') {
          const runSpeed = unit.speed * 2.8;
          walkPhase += delta * runSpeed;
          this.walkPhaseMap.set(unit.id, walkPhase);
          const sinRun = Math.sin(walkPhase);

          if (legFL) legFL.rotation.x = sinRun * 0.8;
          if (legFR) legFR.rotation.x = -sinRun * 0.8;
          if (legRL) legRL.rotation.x = -sinRun * 0.8;
          if (legRR) legRR.rotation.x = sinRun * 0.8;

          if (dogTail) dogTail.rotation.y = Math.sin(now * 0.02) * 0.6;
          if (dogBody) dogBody.position.y = 0.45 + Math.abs(sinRun) * 0.08;
          if (dogHead) dogHead.rotation.x = -0.1 + Math.sin(now * 0.015) * 0.08;
        } else {
          // Idle sniffing & panting
          const idleTime = timeSec + seed;
          if (legFL) legFL.rotation.x = 0;
          if (legFR) legFR.rotation.x = 0;
          if (legRL) legRL.rotation.x = 0;
          if (legRR) legRR.rotation.x = 0;

          if (dogTail) dogTail.rotation.y = Math.sin(idleTime * 4.0) * 0.4;
          if (dogBody) dogBody.position.y = 0.45 + Math.sin(idleTime * 2.0) * 0.02;
          if (dogHead) {
            dogHead.rotation.y = Math.sin(idleTime * 0.8) * 0.3;
            dogHead.rotation.x = Math.sin(idleTime * 1.5) * 0.1;
          }
        }
      } else if (unit.type === 'cat') {
        // --- SENTINEL CAT ANIMATIONS ---
        const catTail = mesh.getObjectByName('cat_tail');
        const catHead = mesh.getObjectByName('cat_head');
        const legFL = mesh.getObjectByName('cat_leg_fl');
        const legFR = mesh.getObjectByName('cat_leg_fr');
        const legRL = mesh.getObjectByName('cat_leg_rl');
        const legRR = mesh.getObjectByName('cat_leg_rr');
        const catBody = mesh.getObjectByName('cat_body_group');

        if (unit.state === 'walking' || unit.state === 'fighting') {
          const runSpeed = unit.speed * 2.5;
          walkPhase += delta * runSpeed;
          this.walkPhaseMap.set(unit.id, walkPhase);
          const sinRun = Math.sin(walkPhase);

          if (legFL) legFL.rotation.x = sinRun * 0.7;
          if (legFR) legFR.rotation.x = -sinRun * 0.7;
          if (legRL) legRL.rotation.x = -sinRun * 0.7;
          if (legRR) legRR.rotation.x = sinRun * 0.7;

          if (catTail) catTail.rotation.z = Math.sin(now * 0.015) * 0.4;
          if (catBody) catBody.position.y = 0.35 + Math.abs(sinRun) * 0.05;
        } else {
          // Idle cat scanning & tail curling
          const idleTime = timeSec + seed;
          if (legFL) legFL.rotation.x = 0;
          if (legFR) legFR.rotation.x = 0;
          if (legRL) legRL.rotation.x = 0;
          if (legRR) legRR.rotation.x = 0;

          if (catTail) catTail.rotation.z = Math.sin(idleTime * 2.0) * 0.5;
          if (catHead) {
            catHead.rotation.y = Math.sin(idleTime * 0.6) * 0.45;
          }
        }
      } else if (unit.type === 'robot') {
        // --- DEFENSE SENTINEL ROBOT ANIMATIONS ---
        const botChassis = mesh.getObjectByName('robot_chassis');
        const radar = mesh.getObjectByName('robot_radar');

        // Continuous radar scanning rotation
        if (radar) {
          radar.rotation.y += delta * 3.5;
        }

        // Anti-gravity hovering bob
        if (botChassis) {
          const hoverOffset = Math.sin(now * 0.005 + seed) * 0.12;
          botChassis.position.y = 0.85 + hoverOffset;
          if (unit.state === 'walking' || unit.state === 'fighting') {
            botChassis.rotation.x = 0.12; // Forward tilt
          } else {
            botChassis.rotation.x = 0;
          }
        }
      } else if (!isVehicle) {
        // --- HUMANOID TWO-STATE ANIMATIONS ---
        const pelvis = mesh.getObjectByName('pelvis');
        const torso = mesh.getObjectByName('torso');
        const headGroup = mesh.getObjectByName('head_group');
        const leftArm = mesh.getObjectByName('left_arm');
        const rightArm = mesh.getObjectByName('right_arm');
        const leftLeg = mesh.getObjectByName('left_leg');
        const rightLeg = mesh.getObjectByName('right_leg');
        const tool = mesh.getObjectByName('worker_tool');

        if (unit.state === 'walking') {
          // ==========================================
          // STATE 2: WALK ANIMATION (Full Locomotion Cycle)
          // ==========================================
          const walkSpeedFreq = unit.speed * 2.2;
          walkPhase += delta * walkSpeedFreq;
          this.walkPhaseMap.set(unit.id, walkPhase);

          const sinWalk = Math.sin(walkPhase);
          const cosWalk = Math.cos(walkPhase);

          // 1. Legs swinging in opposite phases
          if (leftLeg) {
            leftLeg.rotation.x = sinWalk * 0.72;
            leftLeg.rotation.z = -0.04;
          }
          if (rightLeg) {
            rightLeg.rotation.x = -sinWalk * 0.72;
            rightLeg.rotation.z = 0.04;
          }

          // 2. Arms swinging in counter-stride to legs
          if (leftArm) {
            leftArm.rotation.x = -sinWalk * 0.65;
            leftArm.rotation.z = 0.06;
          }
          if (rightArm) {
            rightArm.rotation.x = sinWalk * 0.65;
            rightArm.rotation.z = -0.06;
          }

          // 3. Bipedal vertical step bounce (rises on each step)
          if (pelvis) {
            pelvis.position.y = 0.75 + Math.abs(sinWalk) * 0.12;
          }

          // 4. Athletic torso forward lean & side-to-side swagger
          if (torso) {
            torso.rotation.x = 0.14; // Forward lean
            torso.rotation.y = -sinWalk * 0.12; // Torso twist
            torso.rotation.z = sinWalk * 0.06; // Pelvic roll
          }

          // 5. Head counter-balance looking forward
          if (headGroup) {
            headGroup.rotation.x = -0.08;
            headGroup.rotation.y = sinWalk * 0.06;
            headGroup.rotation.z = -sinWalk * 0.03;
          }

          // Reset tool idle swing
          if (tool) {
            tool.rotation.x = 0.2;
          }
        } else {
          // ==========================================
          // STATE 1: IDLE ANIMATION (Breathing, Sway & Scan)
          // ==========================================
          const idleTime = timeSec + seed;
          const breathFreq = 2.4;
          const breathSin = Math.sin(idleTime * breathFreq);
          const swaySin = Math.sin(idleTime * 1.1);

          // 1. Legs firmly planted in relaxed stance
          if (leftLeg) {
            leftLeg.rotation.x = 0;
            leftLeg.rotation.z = -0.05; // Slight comfortable stance width
          }
          if (rightLeg) {
            rightLeg.rotation.x = 0;
            rightLeg.rotation.z = 0.05;
          }

          // 2. Gentle vertical breathing movement on pelvis
          if (pelvis) {
            pelvis.position.y = 0.75 + breathSin * 0.025;
          }

          // 3. Subtle torso breathing and gentle weight shift
          if (torso) {
            torso.rotation.x = breathSin * 0.02;
            torso.rotation.y = swaySin * 0.04;
            torso.rotation.z = swaySin * 0.025;
          }

          // 4. Arms hanging naturally at sides with subtle breathing motion
          if (leftArm) {
            leftArm.rotation.x = Math.cos(idleTime * breathFreq) * 0.06;
            leftArm.rotation.z = 0.08 + breathSin * 0.02;
          }
          if (rightArm) {
            rightArm.rotation.x = -Math.cos(idleTime * breathFreq) * 0.06;
            rightArm.rotation.z = -0.08 - breathSin * 0.02;
          }

          // 5. Head looking around / scanning environment
          if (headGroup) {
            const headTurn = Math.sin(idleTime * 0.6) * 0.35;
            const headNod = Math.cos(idleTime * 1.2) * 0.08;
            headGroup.rotation.y = headTurn;
            headGroup.rotation.x = headNod;
            headGroup.rotation.z = headTurn * 0.1;
          }

          // 6. If worker is actively hammering a building site, crafting at a workshop, or harvesting an environment node
          const isAtConstruction = unit.type === 'worker' && underConstructionBuildings.length > 0 && dist <= 0.6;
          const isAtWorkshop = unit.type === 'worker' && unit.orderType === 'work_harvest' && dist <= 0.6;
          const isAtResourceNode = unit.type === 'worker' && unit.orderType === 'gather_node' && dist <= 0.8;
          const isWorking = unit.type === 'worker' && (unit.state === 'working' || isAtConstruction || isAtWorkshop || isAtResourceNode);

          if (isWorking) {
            if (tool && rightArm) {
              rightArm.rotation.x = -0.6 + Math.sin(now * 0.02) * 0.85;
              tool.rotation.x = Math.sin(now * 0.02) * 0.5;
            }
            if (now - this.lastHammerSoundTime > 900 && Math.random() < 0.25) {
              soundManager.playConstructionHammer();
              this.lastHammerSoundTime = now;
            }
          }
        }
      } else {
        // --- VEHICLE TWO-STATE ANIMATIONS ---
        const chassis = mesh.getObjectByName('chassis');
        const siren = mesh.getObjectByName('siren_light');
        const turret = mesh.getObjectByName('turret');

        if (unit.state === 'walking') {
          // ==========================================
          // STATE 2: VEHICLE DRIVING (Wheel Rotation & Suspension Roll)
          // ==========================================
          const rotSpeed = delta * unit.speed * 3.5;

          // Rotate wheels
          mesh.traverse((child) => {
            if (child instanceof THREE.Mesh && child.name.includes('wheel')) {
              child.rotation.x += rotSpeed;
            }
          });

          // Chassis driving suspension tilt & engine vibration
          if (chassis) {
            chassis.position.y = (unit.type === 'military' ? 0.45 : 0.4) + Math.sin(now * 0.03) * 0.02;
            chassis.rotation.x = -0.04; // Acceleration pitch
            chassis.rotation.z = Math.sin(now * 0.015) * 0.03; // Road wobble
          }

          // Emergency Flashing Siren
          if (siren instanceof THREE.Mesh && siren.material) {
            const isFlash = Math.sin(now * 0.018) > 0;
            (siren.material as THREE.MeshStandardMaterial).emissiveIntensity = isFlash ? 3.0 : 0.2;
          }
        } else {
          // ==========================================
          // STATE 1: VEHICLE IDLE (Engine Rumble & Scan)
          // ==========================================
          const idleTime = timeSec + seed;

          // Subtle engine idling rumble
          if (chassis) {
            chassis.position.y = (unit.type === 'military' ? 0.45 : 0.4) + Math.sin(now * 0.025 + seed) * 0.008;
            chassis.rotation.x = 0;
            chassis.rotation.z = 0;
          }

          // Tank Turret / Radar scanning
          if (turret) {
            turret.rotation.y = Math.sin(idleTime * 0.9) * 0.45;
          }

          // Soft siren pulse
          if (siren instanceof THREE.Mesh && siren.material) {
            (siren.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8 + Math.sin(idleTime * 4) * 0.6;
          }
        }
      }

      // 4. Update Overhead In-World Billboard Health Bar
      const hb = mesh.getObjectByName('unit_health_bar');
      if (hb) {
        hb.quaternion.copy((this.scene as any).cameraQuaternion || hb.quaternion);
        const fg = hb.getObjectByName('fg_unit_health') as THREE.Mesh;
        if (fg) {
          const hpPct = Math.max(0, Math.min(1, unit.hp / unit.maxHp));
          fg.scale.x = hpPct;
          fg.position.x = (hpPct - 1) * 0.76;
          const mat = fg.material as THREE.MeshBasicMaterial;
          if (hpPct > 0.5) mat.color.setHex(0x22c55e);
          else if (hpPct > 0.25) mat.color.setHex(0xf59e0b);
          else mat.color.setHex(0xef4444);
        }
      }
    }
  }

  public damageUnit(unitId: string, amount: number): boolean {
    const idx = this.units.findIndex((u) => u.id === unitId);
    if (idx === -1) return false;
    const unit = this.units[idx];
    unit.hp = Math.max(0, unit.hp - amount);
    if (unit.hp <= 0) {
      const mesh = this.unitMeshes.get(unit.id);
      if (mesh) this.scene.remove(mesh);
      this.unitMeshes.delete(unit.id);
      this.units.splice(idx, 1);
      this.walkPhaseMap.delete(unit.id);
      this.animSeedMap.delete(unit.id);
      soundManager.playExplosion();
      return true; // killed
    }
    return false;
  }

  public clearAll() {
    this.units.forEach((u) => {
      const mesh = this.unitMeshes.get(u.id);
      if (mesh) this.scene.remove(mesh);
    });
    this.units = [];
    this.unitMeshes.clear();
    this.walkPhaseMap.clear();
    this.animSeedMap.clear();
  }
}
