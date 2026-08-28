/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { ThreatEntity, ThreatType, PlacedBuilding, UnitEntity } from '../types';
import { soundManager } from '../audio/soundManager';

export class ThreatManager {
  private scene: THREE.Scene;
  public threats: ThreatEntity[] = [];
  public threatMeshes: Map<string, THREE.Group> = new Map();
  private particleGroups: THREE.Group[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public spawnThreat(type: ThreatType, customName?: string): ThreatEntity {
    const id = `threat_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const angle = Math.random() * Math.PI * 2;
    const spawnDistance = 55;
    const x = Math.cos(angle) * spawnDistance;
    const z = Math.sin(angle) * spawnDistance;

    let category: 'natural' | 'human' | 'animal' = 'natural';
    let hp = 300;
    let speed = 2.5;
    let damage = 15;
    let radius = 3.0;

    switch (type) {
      case 'fire':
        category = 'natural';
        hp = 200;
        speed = 0.5;
        damage = 12;
        break;
      case 'flood':
        category = 'natural';
        hp = 500;
        speed = 1.0;
        damage = 8;
        radius = 12;
        break;
      case 'earthquake':
        category = 'natural';
        hp = 400;
        speed = 0;
        damage = 35;
        radius = 18;
        soundManager.startEarthquakeRumble();
        setTimeout(() => soundManager.stopEarthquakeRumble(), 4000);
        break;
      case 'tornado':
        category = 'natural';
        hp = 800;
        speed = 3.0;
        damage = 25;
        radius = 6;
        break;
      case 'volcano':
        category = 'natural';
        hp = 600;
        speed = 0.8;
        damage = 40;
        break;
      case 'mafia':
        category = 'human';
        hp = 350;
        speed = 4.0;
        damage = 18;
        break;
      case 'corporate_raiders':
        category = 'human';
        hp = 400;
        speed = 3.5;
        damage = 20;
        break;
      case 'zombies':
        category = 'human';
        hp = 250;
        speed = 1.8;
        damage = 14;
        break;
      case 'aliens':
        category = 'human';
        hp = 650;
        speed = 4.5;
        damage = 30;
        soundManager.playUFOHum();
        break;
      case 'pirates':
        category = 'human';
        hp = 380;
        speed = 3.0;
        damage = 16;
        break;
      case 'raptors':
        category = 'animal';
        hp = 450;
        speed = 5.0;
        damage = 28;
        break;
      case 'giant_spiders':
        category = 'animal';
        hp = 320;
        speed = 2.8;
        damage = 15;
        break;
      case 'godzilla':
        category = 'animal';
        hp = 4500;
        speed = 1.8;
        damage = 85;
        radius = 8.0;
        soundManager.playGodzillaRoar();
        soundManager.startEarthquakeRumble();
        setTimeout(() => soundManager.stopEarthquakeRumble(), 5000);
        break;
      case 'killer_bees':
        category = 'animal';
        hp = 180;
        speed = 4.2;
        damage = 10;
        break;
      default:
        category = 'animal';
        hp = 500;
        speed = 3.0;
        damage = 25;
    }

    const threat: ThreatEntity = {
      id,
      type,
      category,
      name: customName || (type === 'godzilla' ? 'GODZILLA (COLOSSAL KAIJU TITAN)' : type.toUpperCase().replace('_', ' ')),
      x,
      y: type === 'aliens' ? 12 : 0,
      z,
      hp,
      maxHp: hp,
      speed,
      damage,
      active: true,
      radius,
      spawnTime: Date.now(),
      isBoss: type === 'godzilla',
    };

    this.threats.push(threat);
    const mesh = this.createThreatMesh(threat);
    this.threatMeshes.set(id, mesh);
    this.scene.add(mesh);

    // Audio warning
    soundManager.startSiren();
    setTimeout(() => soundManager.stopSiren(), 3500);

    return threat;
  }

  private createThreatMesh(threat: ThreatEntity): THREE.Group {
    const group = new THREE.Group();
    group.position.set(threat.x, threat.y, threat.z);
    group.name = `threat_group_${threat.id}`;
    group.userData = {
      threatId: threat.id,
      type: 'threat',
      threatType: threat.type,
    };

    // Clickable raycast hitbox
    const hitBoxGeom = new THREE.CylinderGeometry(Math.max(1.8, threat.radius * 0.7), Math.max(1.8, threat.radius * 0.7), 4.0, 8);
    const hitBoxMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitBox = new THREE.Mesh(hitBoxGeom, hitBoxMat);
    hitBox.position.y = 2.0;
    hitBox.userData = { threatId: threat.id, type: 'threat' };
    group.add(hitBox);

    switch (threat.type) {
      case 'fire': {
        const fireMesh = new THREE.Mesh(
          new THREE.ConeGeometry(2.0, 4.0, 8),
          new THREE.MeshStandardMaterial({
            color: 0xf97316,
            emissive: 0xef4444,
            emissiveIntensity: 1.5,
            transparent: true,
            opacity: 0.85,
          })
        );
        fireMesh.position.y = 2.0;
        group.add(fireMesh);
        break;
      }
      case 'tornado': {
        const funnel = new THREE.Mesh(
          new THREE.CylinderGeometry(4.0, 0.4, 12, 12, 1, true),
          new THREE.MeshStandardMaterial({
            color: 0x64748b,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide,
          })
        );
        funnel.position.y = 6.0;
        group.add(funnel);
        break;
      }
      case 'aliens': {
        // Flying Saucer UFO
        const disc = new THREE.Mesh(
          new THREE.CylinderGeometry(3.5, 3.5, 0.6, 16),
          new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 })
        );
        group.add(disc);

        const dome = new THREE.Mesh(
          new THREE.SphereGeometry(1.5, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
          new THREE.MeshStandardMaterial({
            color: 0x06b6d4,
            emissive: 0x22d3ee,
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.8,
          })
        );
        dome.position.y = 0.3;
        group.add(dome);

        // Tractor Beam
        const beam = new THREE.Mesh(
          new THREE.ConeGeometry(5.0, 12.0, 16, 1, true),
          new THREE.MeshBasicMaterial({
            color: 0x22c55e,
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide,
          })
        );
        beam.position.y = -6.0;
        group.add(beam);
        break;
      }
      case 'zombies': {
        // Zombie Humanoid
        const zMat = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.8 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.6), zMat);
        body.position.y = 1.3;
        group.add(body);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), zMat);
        head.position.y = 2.3;
        group.add(head);

        // Reaching arms
        const arm1 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 1.0), zMat);
        arm1.position.set(-0.5, 1.6, 0.5);
        group.add(arm1);

        const arm2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 1.0), zMat);
        arm2.position.set(0.5, 1.6, 0.5);
        group.add(arm2);
        break;
      }
      case 'mafia': {
        // Black Gangster Cruiser Car
        const carMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 });
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 4.2), carMat);
        chassis.position.y = 0.6;
        group.add(chassis);

        const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 2.2), carMat);
        cabin.position.set(0, 1.35, -0.2);
        group.add(cabin);

        // Headlights
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
        const hl1 = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), lightMat);
        hl1.position.set(0.8, 0.6, 2.15);
        group.add(hl1);
        const hl2 = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), lightMat);
        hl2.position.set(-0.8, 0.6, 2.15);
        group.add(hl2);
        break;
      }
      case 'raptors': {
        // Raptor Dinosaur
        const dMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.6 });
        const body = new THREE.Mesh(new THREE.ConeGeometry(1.0, 3.5, 8), dMat);
        body.rotation.x = Math.PI / 2;
        body.position.y = 1.8;
        group.add(body);

        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 1.5, 6), dMat);
        neck.position.set(0, 2.4, 1.4);
        neck.rotation.x = -0.5;
        group.add(neck);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 1.2), dMat);
        head.position.set(0, 3.0, 2.0);
        group.add(head);
        break;
      }
      case 'giant_spiders': {
        // Arachnid body & legs
        const sMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
        const abdomen = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), sMat);
        abdomen.position.set(0, 1.2, -0.8);
        group.add(abdomen);

        const thorax = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), sMat);
        thorax.position.set(0, 1.0, 0.6);
        group.add(thorax);

        // Glowing red eyes
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 4, 4), eyeMat);
        eye1.position.set(0.2, 1.2, 1.3);
        group.add(eye1);
        const eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 4, 4), eyeMat);
        eye2.position.set(-0.2, 1.2, 1.3);
        group.add(eye2);
        break;
      }
      case 'godzilla': {
        // --- COLOSSAL KAIJU TITAN (GODZILLA) 3D MESH ---
        const kaijuScale = 2.4;
        const skinMat = new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          roughness: 0.85,
          metalness: 0.15,
        });
        const bellyMat = new THREE.MeshStandardMaterial({
          color: 0x334155,
          roughness: 0.9,
        });
        const dorsalMat = new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          emissive: 0x22d3ee,
          emissiveIntensity: 1.4,
          transparent: true,
          opacity: 0.95,
        });

        // 1. Massive Pelvis / Lower Body
        const pelvis = new THREE.Mesh(new THREE.BoxGeometry(2.4 * kaijuScale, 2.0 * kaijuScale, 2.2 * kaijuScale), skinMat);
        pelvis.position.y = 2.8 * kaijuScale;
        pelvis.castShadow = true;
        group.add(pelvis);

        // 2. Muscular Upper Torso & Chest Plates
        const chest = new THREE.Mesh(new THREE.BoxGeometry(2.2 * kaijuScale, 2.4 * kaijuScale, 2.0 * kaijuScale), skinMat);
        chest.position.set(0, 4.8 * kaijuScale, 0.2 * kaijuScale);
        chest.rotation.x = 0.1;
        chest.castShadow = true;
        group.add(chest);

        const belly = new THREE.Mesh(new THREE.BoxGeometry(1.6 * kaijuScale, 2.8 * kaijuScale, 0.8 * kaijuScale), bellyMat);
        belly.position.set(0, 4.0 * kaijuScale, 1.1 * kaijuScale);
        group.add(belly);

        // 3. Menacing Dinosaur Head with Snout & Jaws
        const headGroup = new THREE.Group();
        headGroup.name = 'kaiju_head';
        headGroup.position.set(0, 6.6 * kaijuScale, 0.9 * kaijuScale);
        group.add(headGroup);

        const cranium = new THREE.Mesh(new THREE.BoxGeometry(1.4 * kaijuScale, 1.2 * kaijuScale, 1.6 * kaijuScale), skinMat);
        cranium.position.set(0, 0, 0);
        headGroup.add(cranium);

        const upperJaw = new THREE.Mesh(new THREE.BoxGeometry(1.1 * kaijuScale, 0.6 * kaijuScale, 1.4 * kaijuScale), skinMat);
        upperJaw.position.set(0, 0.1 * kaijuScale, 1.2 * kaijuScale);
        headGroup.add(upperJaw);

        const lowerJaw = new THREE.Mesh(new THREE.BoxGeometry(1.0 * kaijuScale, 0.45 * kaijuScale, 1.3 * kaijuScale), skinMat);
        lowerJaw.position.set(0, -0.45 * kaijuScale, 1.1 * kaijuScale);
        lowerJaw.name = 'kaiju_lower_jaw';
        headGroup.add(lowerJaw);

        // Glowing red eyes
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.18 * kaijuScale, 6, 6), eyeMat);
        leftEye.position.set(-0.6 * kaijuScale, 0.25 * kaijuScale, 0.8 * kaijuScale);
        headGroup.add(leftEye);

        const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.18 * kaijuScale, 6, 6), eyeMat);
        rightEye.position.set(0.6 * kaijuScale, 0.25 * kaijuScale, 0.8 * kaijuScale);
        headGroup.add(rightEye);

        // Atomic Mouth Core Glow
        const mouthCore = new THREE.Mesh(
          new THREE.SphereGeometry(0.3 * kaijuScale, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0x22d3ee })
        );
        mouthCore.name = 'mouth_core';
        mouthCore.position.set(0, -0.1 * kaijuScale, 0.8 * kaijuScale);
        headGroup.add(mouthCore);

        // 4. Glowing Atomic Dorsal Spines along the Spine
        const spineDorsals = new THREE.Group();
        spineDorsals.name = 'kaiju_dorsals';
        group.add(spineDorsals);

        for (let s = 0; s < 7; s++) {
          const finHeight = (1.2 + Math.sin((s / 6) * Math.PI) * 1.6) * kaijuScale;
          const finGeom = new THREE.ConeGeometry(0.4 * kaijuScale, finHeight, 4);
          finGeom.rotateX(Math.PI / 2);
          const fin = new THREE.Mesh(finGeom, dorsalMat);
          fin.position.set(0, (6.2 - s * 0.7) * kaijuScale, (-0.8 - s * 0.4) * kaijuScale);
          fin.rotation.x = -0.3 + s * 0.1;
          spineDorsals.add(fin);
        }

        // 5. Heavy Muscular Legs & 3-Toed Talon Feet
        const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(1.0 * kaijuScale, 2.6 * kaijuScale, 1.2 * kaijuScale), skinMat);
        leftLeg.position.set(-1.1 * kaijuScale, 1.3 * kaijuScale, -0.1 * kaijuScale);
        leftLeg.name = 'kaiju_left_leg';
        leftLeg.castShadow = true;
        group.add(leftLeg);

        const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(1.2 * kaijuScale, 0.6 * kaijuScale, 1.8 * kaijuScale), skinMat);
        leftFoot.position.set(-1.1 * kaijuScale, 0.3 * kaijuScale, 0.4 * kaijuScale);
        leftFoot.castShadow = true;
        group.add(leftFoot);

        const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(1.0 * kaijuScale, 2.6 * kaijuScale, 1.2 * kaijuScale), skinMat);
        rightLeg.position.set(1.1 * kaijuScale, 1.3 * kaijuScale, -0.1 * kaijuScale);
        rightLeg.name = 'kaiju_right_leg';
        rightLeg.castShadow = true;
        group.add(rightLeg);

        const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(1.2 * kaijuScale, 0.6 * kaijuScale, 1.8 * kaijuScale), skinMat);
        rightFoot.position.set(1.1 * kaijuScale, 0.3 * kaijuScale, 0.4 * kaijuScale);
        rightFoot.castShadow = true;
        group.add(rightFoot);

        // 6. Clawed Arms
        const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.6 * kaijuScale, 1.6 * kaijuScale, 0.6 * kaijuScale), skinMat);
        leftArm.position.set(-1.4 * kaijuScale, 4.4 * kaijuScale, 0.8 * kaijuScale);
        leftArm.rotation.x = 0.5;
        leftArm.rotation.z = -0.3;
        group.add(leftArm);

        const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.6 * kaijuScale, 1.6 * kaijuScale, 0.6 * kaijuScale), skinMat);
        rightArm.position.set(1.4 * kaijuScale, 4.4 * kaijuScale, 0.8 * kaijuScale);
        rightArm.rotation.x = 0.5;
        rightArm.rotation.z = 0.3;
        group.add(rightArm);

        // 7. Long Segmented Tail
        const tailGroup = new THREE.Group();
        tailGroup.name = 'kaiju_tail';
        tailGroup.position.set(0, 2.2 * kaijuScale, -1.0 * kaijuScale);
        group.add(tailGroup);

        for (let t = 0; t < 5; t++) {
          const tWidth = (1.4 - t * 0.22) * kaijuScale;
          const tSeg = new THREE.Mesh(new THREE.BoxGeometry(tWidth, tWidth, 1.4 * kaijuScale), skinMat);
          tSeg.position.set(0, -t * 0.3 * kaijuScale, -t * 1.3 * kaijuScale);
          tSeg.castShadow = true;
          tailGroup.add(tSeg);
        }

        // 8. Atomic Breath Laser Beam (Activated during breath attacks)
        const breathBeam = new THREE.Mesh(
          new THREE.CylinderGeometry(0.4 * kaijuScale, 1.8 * kaijuScale, 18 * kaijuScale, 12, 1, true),
          new THREE.MeshBasicMaterial({
            color: 0x22d3ee,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide,
          })
        );
        breathBeam.name = 'atomic_breath_beam';
        breathBeam.position.set(0, 6.0 * kaijuScale, 10 * kaijuScale);
        breathBeam.rotation.x = Math.PI / 2.2;
        breathBeam.visible = false;
        group.add(breathBeam);
        break;
      }
      default: {
        const monster = new THREE.Mesh(
          new THREE.DodecahedronGeometry(2.0),
          new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 })
        );
        monster.position.y = 2.0;
        group.add(monster);
        break;
      }
    }

    // Health Bar Billboard floating above threat
    const hbGroup = new THREE.Group();
    hbGroup.name = 'health_bar';
    hbGroup.position.y = threat.type === 'godzilla' ? 18.0 : threat.type === 'aliens' ? 3.0 : 4.5;

    const bgBar = new THREE.Mesh(
      new THREE.PlaneGeometry(threat.type === 'godzilla' ? 6.0 : 2.4, threat.type === 'godzilla' ? 0.6 : 0.3),
      new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide })
    );
    hbGroup.add(bgBar);

    const fgBar = new THREE.Mesh(
      new THREE.PlaneGeometry(threat.type === 'godzilla' ? 5.8 : 2.3, threat.type === 'godzilla' ? 0.45 : 0.22),
      new THREE.MeshBasicMaterial({
        color: threat.type === 'godzilla' ? 0x06b6d4 : 0xef4444,
        side: THREE.DoubleSide,
      })
    );
    fgBar.name = 'fg_health';
    fgBar.position.z = 0.01;
    hbGroup.add(fgBar);

    group.add(hbGroup);

    return group;
  }

  public update(
    delta: number,
    buildings: PlacedBuilding[],
    units: UnitEntity[],
    onBuildingDamaged: (b: PlacedBuilding, dmg: number) => void,
    onThreatDefeated: (t: ThreatEntity) => void,
    onUnitDamaged?: (u: UnitEntity, dmg: number) => void
  ) {
    const now = Date.now();

    for (let i = this.threats.length - 1; i >= 0; i--) {
      const threat = this.threats[i];
      if (!threat.active) continue;

      const mesh = this.threatMeshes.get(threat.id);
      if (!mesh) continue;

      // Special Godzilla Boss Behavior
      if (threat.type === 'godzilla') {
        // Find nearest constructed target building
        let nearestDist = Infinity;
        let targetBld: PlacedBuilding | null = null;

        for (const b of buildings) {
          if (b.hp <= 0) continue;
          const dx = b.gridX * 2 - threat.x;
          const dz = b.gridZ * 2 - threat.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < nearestDist) {
            nearestDist = dist;
            targetBld = b;
          }
        }

        const tx = targetBld ? targetBld.gridX * 2 : 0;
        const tz = targetBld ? targetBld.gridZ * 2 : 0;

        const dirX = tx - threat.x;
        const dirZ = tz - threat.z;
        const distToGoal = Math.sqrt(dirX * dirX + dirZ * dirZ);

        // Animate Godzilla walking & tail swinging
        const walkCycle = (now * 0.003 * threat.speed);
        const tail = mesh.getObjectByName('kaiju_tail');
        if (tail) {
          tail.rotation.y = Math.sin(walkCycle) * 0.45;
        }
        const leftLeg = mesh.getObjectByName('kaiju_left_leg');
        const rightLeg = mesh.getObjectByName('kaiju_right_leg');
        if (leftLeg && rightLeg) {
          leftLeg.position.y = (1.3 + Math.max(0, Math.sin(walkCycle) * 0.5)) * 2.4;
          rightLeg.position.y = (1.3 + Math.max(0, -Math.sin(walkCycle) * 0.5)) * 2.4;
        }

        // Stomp forward
        if (distToGoal > 3.0) {
          const moveDist = threat.speed * delta;
          threat.x += (dirX / distToGoal) * moveDist;
          threat.z += (dirZ / distToGoal) * moveDist;
          mesh.position.x = threat.x;
          mesh.position.z = threat.z;
          mesh.lookAt(threat.x + dirX, threat.y, threat.z + dirZ);
        }

        // Periodic Atomic Breath Blast (Every 6 seconds, fires for 1.8 seconds)
        const breathTime = (now / 1000) % 7.0;
        const isChargingBreath = breathTime > 4.5 && breathTime < 5.2;
        const isFiringBreath = breathTime >= 5.2;

        const breathBeam = mesh.getObjectByName('atomic_breath_beam');
        const mouthCore = mesh.getObjectByName('mouth_core');
        const dorsals = mesh.getObjectByName('kaiju_dorsals');

        if (isChargingBreath) {
          // Dorsal fins surge with brilliant cyan power
          if (dorsals) dorsals.scale.setScalar(1.0 + Math.sin(now * 0.03) * 0.2);
        } else if (isFiringBreath) {
          if (breathBeam) {
            breathBeam.visible = true;
            breathBeam.scale.x = 0.8 + Math.random() * 0.4;
            breathBeam.scale.y = 0.8 + Math.random() * 0.4;
          }
          if (mouthCore) {
            mouthCore.scale.setScalar(1.5 + Math.random() * 0.5);
          }

          // Damage targeted building with Atomic Breath
          if (targetBld && nearestDist < 25) {
            onBuildingDamaged(targetBld, (threat.damage * 1.5) * delta);
          }

          // Damage nearby units caught in blast
          if (onUnitDamaged) {
            for (const u of units) {
              const uDist = Math.hypot(u.x - threat.x, u.z - threat.z);
              if (uDist < 16.0) {
                onUnitDamaged(u, 40 * delta);
              }
            }
          }
        } else {
          if (breathBeam) breathBeam.visible = false;
        }

        // Melee Stomp & Crush nearby buildings
        if (targetBld && nearestDist < 6.0) {
          onBuildingDamaged(targetBld, threat.damage * delta);
        }

        // Melee Stomp & Crush nearby units/workers/pets
        if (onUnitDamaged) {
          for (const u of units) {
            const uDist = Math.hypot(u.x - threat.x, u.z - threat.z);
            if (uDist < 5.0) {
              onUnitDamaged(u, 50 * delta);
            }
          }
        }
      } else {
        // Standard threat AI logic
        let nearestDist = Infinity;
        let targetBld: PlacedBuilding | null = null;

        for (const b of buildings) {
          if (b.hp <= 0) continue;
          const dx = b.gridX * 2 - threat.x;
          const dz = b.gridZ * 2 - threat.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < nearestDist) {
            nearestDist = dist;
            targetBld = b;
          }
        }

        // Move toward target or center
        const tx = targetBld ? targetBld.gridX * 2 : 0;
        const tz = targetBld ? targetBld.gridZ * 2 : 0;

        const dirX = tx - threat.x;
        const dirZ = tz - threat.z;
        const distToGoal = Math.sqrt(dirX * dirX + dirZ * dirZ);

        if (distToGoal > 1.5) {
          const moveDist = threat.speed * delta;
          threat.x += (dirX / distToGoal) * moveDist;
          threat.z += (dirZ / distToGoal) * moveDist;
          mesh.position.x = threat.x;
          mesh.position.z = threat.z;
          mesh.lookAt(threat.x + dirX, threat.y, threat.z + dirZ);
        } else if (targetBld) {
          // Attack building
          onBuildingDamaged(targetBld, threat.damage * delta);
        }

        // Also attack nearby workers / citizens
        if (onUnitDamaged) {
          for (const u of units) {
            const uDist = Math.hypot(u.x - threat.x, u.z - threat.z);
            if (uDist < 2.5) {
              onUnitDamaged(u, (threat.damage * 0.8) * delta);
            }
          }
        }

        // Animation tweaks (UFO hovering, tornado spinning, raptor bobbing)
        if (threat.type === 'tornado') {
          mesh.rotation.y += delta * 10;
        } else if (threat.type === 'aliens') {
          mesh.rotation.y += delta * 2;
          mesh.position.y = 12 + Math.sin(Date.now() * 0.003) * 1.5;
        }
      }

      // Update Health bar display
      const hb = mesh.getObjectByName('health_bar');
      if (hb) {
        hb.quaternion.copy(this.scene.parent ? (this.scene as any).cameraQuaternion : hb.quaternion);
        const fg = hb.getObjectByName('fg_health') as THREE.Mesh;
        if (fg) {
          const hpPct = Math.max(0, threat.hp / threat.maxHp);
          fg.scale.x = hpPct;
          const barWidth = threat.type === 'godzilla' ? 2.9 : 1.15;
          fg.position.x = (hpPct - 1) * barWidth;
        }
      }

      // Check if dead
      if (threat.hp <= 0) {
        threat.active = false;
        soundManager.playExplosion();
        this.scene.remove(mesh);
        this.threatMeshes.delete(threat.id);
        this.threats.splice(i, 1);
        onThreatDefeated(threat);
      }
    }
  }

  public damageThreat(threatId: string, amount: number) {
    const threat = this.threats.find((t) => t.id === threatId);
    if (threat && threat.active) {
      threat.hp -= amount;
    }
  }

  public clearAll() {
    this.threats.forEach((t) => {
      const mesh = this.threatMeshes.get(t.id);
      if (mesh) this.scene.remove(mesh);
    });
    this.threats = [];
    this.threatMeshes.clear();
  }
}
