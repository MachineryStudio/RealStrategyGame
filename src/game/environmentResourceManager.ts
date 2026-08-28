/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { ResourceNode, ResourceNodeType } from '../types';
import { soundManager } from '../audio/soundManager';

interface NodeMeshEntry {
  node: ResourceNode;
  group: THREE.Group;
  billboardSprite: THREE.Sprite;
  billboardCanvas: HTMLCanvasElement;
  billboardCtx: CanvasRenderingContext2D;
  billboardTexture: THREE.CanvasTexture;
  particleSystem?: THREE.Points;
  particlePositions?: Float32Array;
  particleVelocities?: Float32Array;
  shakeTime: number;
  originalScale: THREE.Vector3;
}

export class EnvironmentResourceManager {
  private scene: THREE.Scene;
  public nodes: ResourceNode[] = [];
  public nodeMeshes: Map<string, NodeMeshEntry> = new Map();
  public nodesGroup: THREE.Group;

  // Callback for when resources are harvested
  public onResourceGathered?: (
    type: ResourceNodeType,
    amount: number,
    nodeX: number,
    nodeZ: number,
    source: 'worker' | 'avatar'
  ) => void;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.nodesGroup = new THREE.Group();
    this.nodesGroup.name = 'environment_resource_nodes';
    this.scene.add(this.nodesGroup);

    this.generateInitialWorldNodes();
  }

  /**
   * Generates initial procedural environment resource nodes distributed across the landscape
   */
  public generateInitialWorldNodes() {
    this.clearAllNodes();

    // Preset balanced distribution across valid walkable terrain zones
    // Avoids river (x: 34 to 58) and extreme edges
    const initialConfigs: {
      type: ResourceNodeType;
      name: string;
      x: number;
      z: number;
      amount: number;
      description: string;
    }[] = [
      // Wood Groves (Forest & Lumber Reserves)
      {
        type: 'wood',
        name: 'Ancient Redwood Grove',
        x: -24,
        z: -18,
        amount: 150,
        description: 'Dense cluster of towering ancient redwoods rich in structural timber.',
      },
      {
        type: 'wood',
        name: 'Pine Lumber Strand',
        x: -12,
        z: 22,
        amount: 120,
        description: 'Hardy alpine pines providing clean lumber for building frameworks.',
      },
      {
        type: 'wood',
        name: 'Wild Birch Hollow',
        x: 16,
        z: -26,
        amount: 110,
        description: 'Lush grove of fast-growing birch trees with harvestable logs.',
      },
      {
        type: 'wood',
        name: 'Overgrown Cedar Ridge',
        x: -32,
        z: 14,
        amount: 140,
        description: 'Aromatic cedar grove with high-yield timber yield.',
      },

      // Steel Deposits (Ore Veins & Industrial Salvage)
      {
        type: 'steel',
        name: 'Iron Ore Outcropping',
        x: -28,
        z: -4,
        amount: 120,
        description: 'Dense iron-rich mineral vein exposed above the surface.',
      },
      {
        type: 'steel',
        name: 'Scrap Metal Derelict',
        x: 20,
        z: 18,
        amount: 100,
        description: 'Salvageable structural steel girders and rusted industrial plating.',
      },
      {
        type: 'steel',
        name: 'Fallen Truss Cache',
        x: 8,
        z: -34,
        amount: 90,
        description: 'Heavy architectural steel trusses ready for dismantling and recycling.',
      },
      {
        type: 'steel',
        name: 'Magnetic Ore Crag',
        x: -18,
        z: 32,
        amount: 130,
        description: 'Highly concentrated metallic ore outcropping with rich steel yield.',
      },

      // Concrete Quarries & Limestone Beds
      {
        type: 'concrete',
        name: 'Limestone Quarry Bed',
        x: -8,
        z: -20,
        amount: 140,
        description: 'Layered sedimentary limestone perfect for crushing into fine cement.',
      },
      {
        type: 'concrete',
        name: 'Granite Aggregate Mound',
        x: 24,
        z: -12,
        amount: 120,
        description: 'Heavy granite rock aggregate used to formulate reinforced concrete.',
      },
      {
        type: 'concrete',
        name: 'Crushed Slag Formation',
        x: -20,
        z: -34,
        amount: 110,
        description: 'Pre-crushed mineral slag and dense gravel ready for batch mixing.',
      },
      {
        type: 'concrete',
        name: 'Quarry Pit Foundation',
        x: 12,
        z: 28,
        amount: 130,
        description: 'Deep stone quarry with exposed high-density concrete aggregates.',
      },
    ];

    initialConfigs.forEach((cfg, idx) => {
      this.createNode({
        id: `env_node_${cfg.type}_${idx}_${Date.now()}`,
        type: cfg.type,
        name: cfg.name,
        x: cfg.x,
        z: cfg.z,
        remainingAmount: cfg.amount,
        maxAmount: cfg.amount,
        isDepleted: false,
        gatherRatePerSec: cfg.type === 'wood' ? 4 : cfg.type === 'steel' ? 3 : 3.5,
        description: cfg.description,
        respawnTime: 0,
      });
    });
  }

  /**
   * Spawns a new random environment node at a random valid land coordinate
   */
  public spawnRandomNode(type?: ResourceNodeType): ResourceNode {
    const types: ResourceNodeType[] = ['wood', 'steel', 'concrete'];
    const chosenType = type || types[Math.floor(Math.random() * types.length)];

    // Generate random valid coordinates
    let rx = (Math.random() - 0.5) * 65;
    let rz = (Math.random() - 0.5) * 65;

    // Avoid river canal (x: 34 to 58)
    if (rx >= 30 && rx <= 60) {
      rx = rx > 45 ? 64 : 26;
    }

    // Avoid dead center starter plot slightly
    if (Math.hypot(rx, rz) < 6) {
      rx += 12;
      rz += 12;
    }

    const namesByType: Record<ResourceNodeType, string[]> = {
      wood: ['Ancient Pine Stand', 'Timber Reserve', 'Wild Oak Cluster', 'Redwood Spire'],
      steel: ['Iron Shard Vein', 'Scrap Metal Cache', 'Steel Slag Pile', 'Alloy Outcropping'],
      concrete: ['Limestone Bluff', 'Aggregate Crag', 'Quarry Aggregate', 'Granite Shelf'],
    };

    const nameList = namesByType[chosenType];
    const name = `${nameList[Math.floor(Math.random() * nameList.length)]} #${Math.floor(
      Math.random() * 90 + 10
    )}`;
    const maxAmount = chosenType === 'wood' ? 140 : chosenType === 'steel' ? 100 : 120;

    const node: ResourceNode = {
      id: `env_node_${chosenType}_rnd_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: chosenType,
      name,
      x: rx,
      z: rz,
      remainingAmount: maxAmount,
      maxAmount,
      isDepleted: false,
      gatherRatePerSec: chosenType === 'wood' ? 4 : chosenType === 'steel' ? 3 : 3.5,
      description: `Natural ${chosenType} environment deposit ready for harvesting.`,
      respawnTime: 0,
    };

    this.createNode(node);
    soundManager.playClick();
    return node;
  }

  /**
   * Builds the 3D representation and registers the resource node
   */
  private createNode(node: ResourceNode) {
    this.nodes.push(node);

    const group = new THREE.Group();
    group.position.set(node.x, 0, node.z);
    group.userData = {
      type: 'resource_node',
      nodeId: node.id,
      resourceType: node.type,
    };

    // 1. Build Type-Specific Geometry
    if (node.type === 'wood') {
      this.buildWoodGroveMesh(group);
    } else if (node.type === 'steel') {
      this.buildSteelDepositMesh(group);
    } else if (node.type === 'concrete') {
      this.buildConcreteQuarryMesh(group);
    }

    // 2. Build Interactive 3D Billboard Status Tag
    const { sprite, canvas, ctx, texture } = this.createBillboard(node);
    sprite.position.set(0, 3.2, 0);
    group.add(sprite);

    // 3. Build Particle Emitter for Harvesting feedback
    const { pSystem, pPos, pVel } = this.createParticleEmitter(node.type);
    group.add(pSystem);

    this.nodesGroup.add(group);

    this.nodeMeshes.set(node.id, {
      node,
      group,
      billboardSprite: sprite,
      billboardCanvas: canvas,
      billboardCtx: ctx,
      billboardTexture: texture,
      particleSystem: pSystem,
      particlePositions: pPos,
      particleVelocities: pVel,
      shakeTime: 0,
      originalScale: new THREE.Vector3(1, 1, 1),
    });
  }

  // --- 3D Mesh Builders ---

  private buildWoodGroveMesh(group: THREE.Group) {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c2e14, roughness: 0.85 });
    const leafMat1 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
    const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.75 });
    const woodChipMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });

    // Main central tree
    const trunk1 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 2.8, 8), trunkMat);
    trunk1.position.set(0, 1.4, 0);
    trunk1.castShadow = true;
    trunk1.receiveShadow = true;
    group.add(trunk1);

    const foliage1 = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.2, 8), leafMat1);
    foliage1.position.set(0, 3.6, 0);
    foliage1.castShadow = true;
    group.add(foliage1);

    const foliage1Sub = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.2, 8), leafMat2);
    foliage1Sub.position.set(0, 4.8, 0);
    foliage1Sub.castShadow = true;
    group.add(foliage1Sub);

    // Second smaller tree
    const trunk2 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.35, 2.0, 7), trunkMat);
    trunk2.position.set(-1.1, 1.0, 0.7);
    trunk2.castShadow = true;
    group.add(trunk2);

    const foliage2 = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.2, 7), leafMat2);
    foliage2.position.set(-1.1, 2.6, 0.7);
    foliage2.castShadow = true;
    group.add(foliage2);

    // Fallen log & Chopping Stump
    const fallenLog = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 2.2, 6), trunkMat);
    fallenLog.rotation.z = Math.PI / 2;
    fallenLog.rotation.y = 0.5;
    fallenLog.position.set(0.8, 0.25, -0.6);
    fallenLog.castShadow = true;
    group.add(fallenLog);

    const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.5, 8), trunkMat);
    stump.position.set(0.9, 0.25, 0.9);
    stump.castShadow = true;
    group.add(stump);

    // Embedded axe on stump
    const axeBlade = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.22, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 })
    );
    axeBlade.position.set(0.9, 0.55, 0.9);
    group.add(axeBlade);

    // Wood chips scattered on ground
    for (let i = 0; i < 5; i++) {
      const chip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.18), woodChipMat);
      chip.position.set(0.6 + (Math.random() - 0.5) * 1.0, 0.03, 0.6 + (Math.random() - 0.5) * 1.0);
      chip.rotation.y = Math.random() * Math.PI;
      group.add(chip);
    }
  }

  private buildSteelDepositMesh(group: THREE.Group) {
    const oreMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.85,
      roughness: 0.35,
    });
    const rustMat = new THREE.MeshStandardMaterial({
      color: 0x7c2d12,
      metalness: 0.5,
      roughness: 0.7,
    });
    const steelBeamMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.25,
    });

    // Central Iron Ore Spire / Crag
    const mainCrag = new THREE.Mesh(new THREE.DodecahedronGeometry(1.3), oreMat);
    mainCrag.scale.set(1.1, 1.6, 1.0);
    mainCrag.position.set(0, 1.2, 0);
    mainCrag.castShadow = true;
    mainCrag.receiveShadow = true;
    group.add(mainCrag);

    // Secondary ore crystals protruding
    const subSpire1 = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.8, 5), oreMat);
    subSpire1.position.set(-0.9, 0.9, 0.6);
    subSpire1.rotation.z = 0.3;
    subSpire1.castShadow = true;
    group.add(subSpire1);

    const subSpire2 = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.4, 5), oreMat);
    subSpire2.position.set(0.8, 0.7, -0.7);
    subSpire2.rotation.x = 0.4;
    subSpire2.castShadow = true;
    group.add(subSpire2);

    // Rusted Industrial Steel I-Beam leaning against the crag
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.6, 0.25), rustMat);
    beam.position.set(0.7, 1.0, 0.7);
    beam.rotation.z = -0.5;
    beam.rotation.y = 0.4;
    beam.castShadow = true;
    group.add(beam);

    // Salvageable Metal Box / Plating
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.8), steelBeamMat);
    crate.position.set(-0.7, 0.3, -0.6);
    crate.rotation.y = 0.6;
    crate.castShadow = true;
    group.add(crate);

    // Glowing energy mineral flecks
    const glowFleck = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 8, 8),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.9,
      })
    );
    glowFleck.position.set(-0.2, 1.6, 0.8);
    group.add(glowFleck);
  }

  private buildConcreteQuarryMesh(group: THREE.Group) {
    const limestoneMat = new THREE.MeshStandardMaterial({
      color: 0xa8a29e,
      roughness: 0.9,
      metalness: 0.1,
    });
    const darkStoneMat = new THREE.MeshStandardMaterial({
      color: 0x78716c,
      roughness: 0.95,
    });
    const concreteBlockMat = new THREE.MeshStandardMaterial({
      color: 0xd6d3d1,
      roughness: 0.8,
    });

    // Tiered stepped limestone bedrock
    const baseBed = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.4, 0.6, 8), darkStoneMat);
    baseBed.position.set(0, 0.3, 0);
    baseBed.castShadow = true;
    baseBed.receiveShadow = true;
    group.add(baseBed);

    const stepTier = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.6, 0.8, 7), limestoneMat);
    stepTier.position.set(-0.3, 0.9, -0.2);
    stepTier.castShadow = true;
    group.add(stepTier);

    // Stacked prefabricated concrete aggregate blocks
    const block1 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.9), concreteBlockMat);
    block1.position.set(0.7, 0.4, 0.6);
    block1.rotation.y = 0.3;
    block1.castShadow = true;
    group.add(block1);

    const block2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.8), concreteBlockMat);
    block2.position.set(0.65, 0.95, 0.55);
    block2.rotation.y = -0.2;
    block2.castShadow = true;
    group.add(block2);

    // Crushed gravel / aggregate rubble mound
    const rubble1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45), darkStoneMat);
    rubble1.position.set(-1.1, 0.35, 0.9);
    rubble1.castShadow = true;
    group.add(rubble1);

    const rubble2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35), limestoneMat);
    rubble2.position.set(-0.8, 0.25, -1.0);
    rubble2.castShadow = true;
    group.add(rubble2);
  }

  // --- 3D Billboard Canvas Tag Generator ---

  private createBillboard(node: ResourceNode) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 96;
    const ctx = canvas.getContext('2d')!;

    this.drawBillboardCanvas(ctx, node);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(3.4, 1.25, 1.0);

    return { sprite, canvas, ctx, texture };
  }

  private drawBillboardCanvas(ctx: CanvasRenderingContext2D, node: ResourceNode) {
    ctx.clearRect(0, 0, 256, 96);

    const isDepleted = node.isDepleted;
    const pct = Math.max(0, Math.min(100, (node.remainingAmount / node.maxAmount) * 100));

    // Colors by resource type
    const headerColor =
      node.type === 'wood' ? '#f59e0b' : node.type === 'steel' ? '#94a3b8' : '#e2e8f0';
    const barColor =
      isDepleted
        ? '#ef4444'
        : pct > 50
        ? node.type === 'wood'
          ? '#22c55e'
          : node.type === 'steel'
          ? '#38bdf8'
          : '#fbbf24'
        : pct > 20
        ? '#f59e0b'
        : '#ef4444';

    const icon = node.type === 'wood' ? '🪵' : node.type === 'steel' ? '🔩' : '🧱';

    // Dark Rounded Background Card
    ctx.fillStyle = isDepleted ? 'rgba(30, 41, 59, 0.75)' : 'rgba(15, 23, 42, 0.92)';
    if (ctx.roundRect) {
      ctx.roundRect(8, 8, 240, 80, 16);
    } else {
      ctx.rect(8, 8, 240, 80);
    }
    ctx.fill();

    // Outline Border
    ctx.strokeStyle = isDepleted ? 'rgba(239, 68, 68, 0.4)' : `${headerColor}88`;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Header Title
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = isDepleted ? '#94a3b8' : '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${icon} ${node.name}`, 20, 28);

    // Remaining Amount text
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = headerColor;
    ctx.textAlign = 'right';
    const amtText = isDepleted ? 'DEPLETED' : `${Math.ceil(node.remainingAmount)}/${node.maxAmount}`;
    ctx.fillText(amtText, 236, 28);

    // Progress Bar Track
    ctx.fillStyle = '#0f172a';
    if (ctx.roundRect) {
      ctx.roundRect(20, 48, 216, 14, 7);
    } else {
      ctx.rect(20, 48, 216, 14);
    }
    ctx.fill();

    // Progress Bar Fill
    if (!isDepleted && pct > 0) {
      const fillW = Math.max(8, (pct / 100) * 216);
      ctx.fillStyle = barColor;
      if (ctx.roundRect) {
        ctx.roundRect(20, 48, fillW, 14, 7);
      } else {
        ctx.rect(20, 48, fillW, 14);
      }
      ctx.fill();
    }

    // Subtext
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    const sub = isDepleted
      ? 'Regenerating in wilderness...'
      : node.harvestersCount && node.harvestersCount > 0
      ? `⚡ Harvesting (${node.harvestersCount} units)`
      : 'Right-click or walk near to harvest';
    ctx.fillText(sub, 20, 76);
  }

  // --- Harvesting Particle System ---

  private createParticleEmitter(type: ResourceNodeType) {
    const pCount = 35;
    const geom = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    const pVel = new Float32Array(pCount * 3);

    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 1.5;
      pPos[i * 3 + 1] = 0.5 + Math.random() * 1.5;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 1.5;

      pVel[i * 3] = 0;
      pVel[i * 3 + 1] = 0;
      pVel[i * 3 + 2] = 0;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));

    const pColor =
      type === 'wood' ? 0xd97706 : type === 'steel' ? 0x38bdf8 : 0xfbbf24;
    const pMat = new THREE.PointsMaterial({
      color: pColor,
      size: 0.35,
      transparent: true,
      opacity: 0,
    });

    const pSystem = new THREE.Points(geom, pMat);
    return { pSystem, pPos, pVel };
  }

  /**
   * Triggers a burst of harvest extraction particles at the given node
   */
  public triggerHarvestParticles(nodeId: string) {
    const entry = this.nodeMeshes.get(nodeId);
    if (!entry || !entry.particleSystem || !entry.particlePositions || !entry.particleVelocities) return;

    entry.shakeTime = 0.25; // Shake duration in seconds
    const mat = entry.particleSystem.material as THREE.PointsMaterial;
    mat.opacity = 0.95;

    const count = entry.particlePositions.length / 3;
    for (let i = 0; i < count; i++) {
      entry.particlePositions[i * 3] = (Math.random() - 0.5) * 0.8;
      entry.particlePositions[i * 3 + 1] = 0.8 + Math.random() * 1.0;
      entry.particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 0.8;

      entry.particleVelocities[i * 3] = (Math.random() - 0.5) * 3.5;
      entry.particleVelocities[i * 3 + 1] = 2.0 + Math.random() * 3.0;
      entry.particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 3.5;
    }

    entry.particleSystem.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Harvests an amount of resource from a node.
   * Returns details of gathered resources, or null if invalid/depleted.
   */
  public harvestNode(
    nodeId: string,
    amount: number,
    source: 'worker' | 'avatar' = 'worker'
  ): { gathered: number; type: ResourceNodeType; isDepleted: boolean } | null {
    const node = this.nodes.find((n) => n.id === nodeId);
    if (!node || node.isDepleted) return null;

    const actualGathered = Math.min(node.remainingAmount, amount);
    node.remainingAmount -= actualGathered;

    const isDepletedNow = node.remainingAmount <= 0;
    if (isDepletedNow) {
      node.isDepleted = true;
      node.remainingAmount = 0;
      node.respawnTime = Date.now() + 50000; // 50 seconds wilderness respawn timer
    }

    // Trigger visual particles & billboard redraw
    this.triggerHarvestParticles(nodeId);
    this.updateBillboard(nodeId);

    if (this.onResourceGathered) {
      this.onResourceGathered(node.type, actualGathered, node.x, node.z, source);
    }

    return {
      gathered: actualGathered,
      type: node.type,
      isDepleted: isDepletedNow,
    };
  }

  /**
   * Re-renders the 2D canvas texture on the 3D billboard
   */
  public updateBillboard(nodeId: string) {
    const entry = this.nodeMeshes.get(nodeId);
    if (!entry) return;

    this.drawBillboardCanvas(entry.billboardCtx, entry.node);
    entry.billboardTexture.needsUpdate = true;
  }

  /**
   * Finds the nearest active (non-depleted) resource node to a world position
   */
  public findNearestNode(x: number, z: number, type?: ResourceNodeType): ResourceNode | null {
    let bestDist = Infinity;
    let bestNode: ResourceNode | null = null;

    for (const node of this.nodes) {
      if (node.isDepleted) continue;
      if (type && node.type !== type) continue;

      const dist = Math.hypot(node.x - x, node.z - z);
      if (dist < bestDist) {
        bestDist = dist;
        bestNode = node;
      }
    }

    return bestNode;
  }

  /**
   * Regenerates and restores all depleted resource nodes in the wilderness
   */
  public regenerateAllNodes() {
    this.nodes.forEach((node) => {
      node.remainingAmount = node.maxAmount;
      node.isDepleted = false;
      node.respawnTime = 0;
      this.updateBillboard(node.id);

      const entry = this.nodeMeshes.get(node.id);
      if (entry) {
        entry.group.scale.set(1, 1, 1);
      }
    });
    soundManager.playCelebration();
  }

  /**
   * Main per-frame animation and simulation update
   */
  public update(delta: number, now: number) {
    const timeSec = now * 0.001;

    for (const [nodeId, entry] of this.nodeMeshes.entries()) {
      const node = entry.node;

      // 1. Natural Respawn timer check
      if (node.isDepleted && node.respawnTime && now >= node.respawnTime) {
        node.isDepleted = false;
        node.remainingAmount = node.maxAmount;
        node.respawnTime = 0;
        this.updateBillboard(nodeId);
        entry.group.scale.set(1, 1, 1);
        this.triggerHarvestParticles(nodeId);
      }

      // 2. Depletion Visual Scaling
      if (node.isDepleted) {
        entry.group.scale.y = THREE.MathUtils.lerp(entry.group.scale.y, 0.4, delta * 3.0);
        entry.group.scale.x = THREE.MathUtils.lerp(entry.group.scale.x, 0.6, delta * 3.0);
        entry.group.scale.z = THREE.MathUtils.lerp(entry.group.scale.z, 0.6, delta * 3.0);
      } else {
        const healthPct = node.remainingAmount / node.maxAmount;
        const targetScaleY = 0.75 + healthPct * 0.25;
        entry.group.scale.y = THREE.MathUtils.lerp(entry.group.scale.y, targetScaleY, delta * 2.0);
      }

      // 3. Shake animation on harvest hit
      if (entry.shakeTime > 0) {
        entry.shakeTime -= delta;
        const shakeMag = 0.12 * (entry.shakeTime / 0.25);
        entry.group.position.x = node.x + (Math.random() - 0.5) * shakeMag;
        entry.group.position.z = node.z + (Math.random() - 0.5) * shakeMag;
      } else {
        entry.group.position.x = node.x;
        entry.group.position.z = node.z;
      }

      // 4. Subtle Bobbing of Floating Status Billboard
      entry.billboardSprite.position.y = 3.2 + Math.sin(timeSec * 2.0 + node.x) * 0.12;

      // 5. Animate Harvesting Particles
      if (
        entry.particleSystem &&
        entry.particlePositions &&
        entry.particleVelocities
      ) {
        const mat = entry.particleSystem.material as THREE.PointsMaterial;
        if (mat.opacity > 0.01) {
          mat.opacity -= delta * 1.5;
          const count = entry.particlePositions.length / 3;

          for (let i = 0; i < count; i++) {
            entry.particlePositions[i * 3] += entry.particleVelocities[i * 3] * delta;
            entry.particlePositions[i * 3 + 1] += entry.particleVelocities[i * 3 + 1] * delta;
            entry.particlePositions[i * 3 + 2] += entry.particleVelocities[i * 3 + 2] * delta;

            entry.particleVelocities[i * 3 + 1] -= 9.8 * delta; // Gravity
          }
          entry.particleSystem.geometry.attributes.position.needsUpdate = true;
        } else {
          mat.opacity = 0;
        }
      }
    }
  }

  public clearAllNodes() {
    this.nodes = [];
    for (const entry of this.nodeMeshes.values()) {
      this.nodesGroup.remove(entry.group);
      entry.billboardTexture.dispose();
      entry.billboardSprite.material.dispose();
    }
    this.nodeMeshes.clear();
  }

  public dispose() {
    this.clearAllNodes();
    this.scene.remove(this.nodesGroup);
  }
}
