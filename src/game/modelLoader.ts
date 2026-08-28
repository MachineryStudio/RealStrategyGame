/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { CustomModelBlueprint } from '../types';

export class ModelLoaderService {
  private static objLoader = new OBJLoader();
  private static fbxLoader = new FBXLoader();

  /**
   * Built-in rich custom blueprints for instant use
   */
  public static getDefaultCustomBlueprints(): CustomModelBlueprint[] {
    return [
      {
        id: 'custom_cyber_spire',
        name: 'Neo-Tokyo Cyber Spire',
        format: 'obj',
        role: 'building',
        rawContent: '',
        scale: 1.0,
        color: '#06b6d4',
        def: {
          id: 'custom_cyber_spire',
          name: 'Neo-Tokyo Cyber Spire',
          category: 'custom',
          description: 'Holographic cyberpunk spire boosting research and skyline prestige.',
          cost: { wood: 20, steel: 100, concrete: 80, glass: 70, electronics: 60, money: 1100 },
          buildTime: 25,
          size: [3, 3],
          height: 20,
          incomeRate: 35,
          happinessBonus: 30,
          maxHp: 2000,
          iconName: 'Sparkles',
          customModelType: 'procedural'
        }
      },
      {
        id: 'custom_mecha_titan',
        name: 'Mecha Defense Titan',
        format: 'obj',
        role: 'building',
        rawContent: '',
        scale: 1.2,
        color: '#f59e0b',
        def: {
          id: 'custom_mecha_titan',
          name: 'Mecha Defense Titan',
          category: 'defense',
          description: 'Colossal stationary battle mecha that unleashes devastating orbital strikes.',
          cost: { wood: 0, steel: 150, concrete: 90, glass: 40, electronics: 80, money: 1400 },
          buildTime: 30,
          size: [4, 4],
          height: 15,
          defensePower: 120,
          range: 30,
          maxHp: 2800,
          iconName: 'ShieldAlert',
          customModelType: 'procedural'
        }
      },
      {
        id: 'custom_kaiju_dragon',
        name: 'Infernal Wyrm (Boss Threat)',
        format: 'obj',
        role: 'enemy',
        rawContent: '',
        scale: 1.5,
        color: '#dc2626'
      },
      {
        id: 'custom_hover_speeder',
        name: 'Anti-Gravity Speeder',
        format: 'obj',
        role: 'decoration',
        rawContent: '',
        scale: 0.8,
        color: '#8b5cf6'
      }
    ];
  }

  /**
   * Parse OBJ text content into a Three.js Group
   */
  public static parseOBJ(objText: string): THREE.Group {
    try {
      const group = this.objLoader.parse(objText);
      this.normalizeAndCenterGroup(group);
      return group;
    } catch (err) {
      console.warn('OBJ parse fallback to geometric mesh', err);
      return this.createFallbackMesh('Imported OBJ');
    }
  }

  /**
   * Parse FBX ArrayBuffer into a Three.js Group
   */
  public static parseFBX(buffer: ArrayBuffer): THREE.Group {
    try {
      const group = this.fbxLoader.parse(buffer, '');
      this.normalizeAndCenterGroup(group);
      return group;
    } catch (err) {
      console.warn('FBX parse fallback', err);
      return this.createFallbackMesh('Imported FBX');
    }
  }

  /**
   * Creates a procedural model for presets
   */
  public static createPresetModel(id: string): THREE.Group {
    const group = new THREE.Group();

    if (id === 'custom_cyber_spire') {
      // Cyber spire with glowing holographic rings
      const spireMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0x0369a1,
        emissiveIntensity: 0.5
      });
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 2.5, 18, 6), spireMat);
      tower.position.y = 9;
      group.add(tower);

      // 3 Floating Holographic Rings
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x22d3ee,
        emissiveIntensity: 1.2,
        transparent: true,
        opacity: 0.85
      });
      for (let i = 0; i < 3; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(2.0 + i * 0.4, 0.12, 12, 24), ringMat);
        ring.position.y = 6 + i * 4.5;
        ring.rotation.x = Math.PI / 2 + (i * 0.2);
        group.add(ring);
      }
    } else if (id === 'custom_mecha_titan') {
      // Mecha Titan body
      const armorMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.8,
        roughness: 0.3
      });
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.9,
        roughness: 0.2
      });

      // Legs
      const legL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 5, 1.4), armorMat);
      legL.position.set(-1.4, 2.5, 0);
      group.add(legL);

      const legR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 5, 1.4), armorMat);
      legR.position.set(1.4, 2.5, 0);
      group.add(legR);

      // Torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(3.6, 4.0, 2.4), armorMat);
      torso.position.y = 7.0;
      group.add(torso);

      // Head / Visor
      const head = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 1.6), goldMat);
      head.position.y = 9.5;
      group.add(head);

      const visor = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.3, 0.2),
        new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xff0000, emissiveIntensity: 1.5 })
      );
      visor.position.set(0, 9.5, 0.82);
      group.add(visor);

      // Shoulder Rocket Pods
      const podL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 2.0), goldMat);
      podL.position.set(-2.6, 8.5, 0);
      group.add(podL);

      const podR = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 2.0), goldMat);
      podR.position.set(2.6, 8.5, 0);
      group.add(podR);
    } else if (id === 'custom_kaiju_dragon') {
      // Infernal Dragon Kaiju
      const dragonMat = new THREE.MeshStandardMaterial({
        color: 0x991b1b,
        roughness: 0.7,
        emissive: 0x7f1d1d,
        emissiveIntensity: 0.3
      });

      const body = new THREE.Mesh(new THREE.ConeGeometry(1.5, 6, 8), dragonMat);
      body.rotation.z = Math.PI / 2;
      body.position.y = 2.5;
      group.add(body);

      const head = new THREE.Mesh(new THREE.ConeGeometry(0.8, 2, 6), dragonMat);
      head.rotation.z = -Math.PI / 3;
      head.position.set(2.8, 3.2, 0);
      group.add(head);

      // Wings
      const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.5, 4.0), dragonMat);
      wingL.position.set(0, 4.5, 2.2);
      wingL.rotation.x = 0.4;
      group.add(wingL);

      const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.5, 4.0), dragonMat);
      wingR.position.set(0, 4.5, -2.2);
      wingR.rotation.x = -0.4;
      group.add(wingR);
    } else {
      return this.createFallbackMesh(id);
    }

    this.normalizeAndCenterGroup(group);
    return group;
  }

  private static createFallbackMesh(label: string): THREE.Group {
    const group = new THREE.Group();
    const mesh = new THREE.Mesh(
      new THREE.DodecahedronGeometry(2.0),
      new THREE.MeshStandardMaterial({
        color: 0x8b5cf6,
        metalness: 0.6,
        roughness: 0.3,
        emissive: 0x6d28d9,
        emissiveIntensity: 0.3
      })
    );
    mesh.position.y = 2.0;
    group.add(mesh);
    return group;
  }

  private static normalizeAndCenterGroup(group: THREE.Group) {
    const box = new THREE.Box3().setFromObject(group);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Center X & Z, place lowest point on Y=0
    group.position.x -= center.x;
    group.position.z -= center.z;
    group.position.y -= box.min.y;

    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }
}
