/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { BuildingDefinition, PlacedBuilding, WeatherType, ViewMode, UnitEntity, ResourceNode, ResourceCargo } from '../types';
import { BuildingMeshFactory } from './buildingMeshFactory';
import { ThreatManager } from './threatManager';
import { WorkerManager } from './workerManager';
import { EnvironmentResourceManager } from './environmentResourceManager';
import confetti from 'canvas-confetti';
import { soundManager } from '../audio/soundManager';

interface WaypointPing {
  group: THREE.Group;
  createdAt: number;
  duration: number;
  type: 'move' | 'attack' | 'build';
}

export interface RockObstacle {
  x: number;
  z: number;
  radius: number;
}

interface FloatingPopup {
  sprite: THREE.Sprite;
  startTime: number;
  duration: number;
  startY: number;
  startX: number;
  startZ: number;
}

export class ThreeEngine {
  public container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;

  // Managers
  public threatManager: ThreatManager;
  public workerManager: WorkerManager;
  public envResourceManager: EnvironmentResourceManager;

  // Environment & Lighting
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private ambientLight: THREE.AmbientLight;
  private stars: THREE.Points | null = null;
  private rainParticles: THREE.Points | null = null;
  private snowParticles: THREE.Points | null = null;
  private waterMesh: THREE.Mesh | null = null;
  private terrainGroup: THREE.Group = new THREE.Group();

  // Natural Obstacles & Constraints (Rocks, Stones, River)
  public rockObstacles: RockObstacle[] = [];
  public riverBounds = { minX: 34, maxX: 58, minZ: -60, maxZ: 60 };

  // Grid & Ghost Placement
  public gridHelper: THREE.GridHelper;
  public ghostMesh: THREE.Group | null = null;
  public selectedDef: BuildingDefinition | null = null;
  public hoveredGridX: number = 0;
  public hoveredGridZ: number = 0;
  public isPlacementValid: boolean = true;
  public placementInvalidReason: string = '';

  // Building Meshes Cache & State Cache
  public buildingMeshes: Map<string, THREE.Group> = new Map();
  public placedBuildingsCache: PlacedBuilding[] = [];

  // Waypoint Pings & 3D Floating Popups
  private waypointPings: WaypointPing[] = [];
  private floatingPopups: FloatingPopup[] = [];

  // View Mode & Avatar
  public viewMode: ViewMode = 'orbit';
  public playerAvatar: THREE.Group | null = null;
  public playerPos: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public playerKeys: { [key: string]: boolean } = {};
  public avatarCargo: ResourceCargo = { wood: 0, steel: 0, concrete: 0, maxCapacity: 25 };
  public isAutoReturningToKingdom: boolean = false;
  public kingdomHouseCoords: { x: number; z: number } = { x: 0, z: -2 };

  // Animation Loop
  private reqId: number = 0;
  private clock: THREE.Clock = new THREE.Clock();
  private isDestroyed: boolean = false;

  // Mouse / Raycasting & Marquee Drag Selection State
  private isPointerDown: boolean = false;
  private pointerDownPos: { x: number; y: number } = { x: 0, y: 0 };
  private currentPointerPos: { x: number; y: number } = { x: 0, y: 0 };
  private isDraggingMarquee: boolean = false;
  private mouseVec: THREE.Vector2 = new THREE.Vector2();
  private raycaster: THREE.Raycaster = new THREE.Raycaster();

  // Events
  public onTileClick?: (gridX: number, gridZ: number) => void;
  public onBuildingClick?: (instanceId: string, defId: string) => void;
  public onResourceNodeClick?: (node: ResourceNode) => void;
  public onAvatarProximityNode?: (node: ResourceNode | null) => void;
  public onAvatarCargoChange?: (cargo: ResourceCargo) => void;
  public onKingdomDeposit?: (deposited: { wood: number; steel: number; concrete: number }) => void;
  public onAutoReturnTriggered?: (isAutoReturning: boolean) => void;
  public onSelectionChange?: (selectedUnits: UnitEntity[]) => void;
  public onMarqueeBoxChange?: (rect: { startX: number; startY: number; endX: number; endY: number } | null) => void;
  public onPlacementValidationChange?: (info: { isValid: boolean; reason: string; gridX: number; gridZ: number } | null) => void;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);

    // 2. Camera
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 500);
    this.camera.position.set(28, 32, 38);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't clip under ground
    this.controls.minDistance = 5;
    this.controls.maxDistance = 140;
    this.controls.target.set(0, 0, 0);

    // 5. Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
    this.hemiLight.position.set(0, 50, 0);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    this.dirLight.position.set(35, 60, 35);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 160;
    const d = 50;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);

    // 6. Grid Helper
    this.gridHelper = new THREE.GridHelper(100, 50, 0x38bdf8, 0x334155);
    this.gridHelper.position.y = 0.01;
    this.scene.add(this.gridHelper);

    // 7. Managers
    this.threatManager = new ThreatManager(this.scene);
    this.workerManager = new WorkerManager(this.scene);
    this.envResourceManager = new EnvironmentResourceManager(this.scene);
    this.workerManager.envResourceManager = this.envResourceManager;

    // 8. Generate Environment & Terrain
    this.setupEnvironment();
    this.setupWeatherParticles();
    this.setupStars();
    this.setupPlayerAvatar();

    // 9. Attach Listeners
    this.setupEventListeners();

    // 10. Start Loop
    this.animate();
  }

  private setupEnvironment() {
    this.scene.add(this.terrainGroup);

    // Main Ground Plane
    const groundGeom = new THREE.PlaneGeometry(120, 120, 32, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x15803d, // Rich vibrant grass green
      roughness: 0.85,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = 'terrain_ground';
    this.terrainGroup.add(ground);

    // River / Water Canal along east edge (x: 35 to 57)
    const waterGeom = new THREE.PlaneGeometry(120, 22);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.82,
    });
    this.waterMesh = new THREE.Mesh(waterGeom, waterMat);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.set(46, 0.05, 0);
    this.waterMesh.rotation.z = Math.PI / 2;
    this.waterMesh.receiveShadow = true;
    this.terrainGroup.add(this.waterMesh);

    // Procedural Trees & Rocks with collision registry
    const treeMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });

    this.rockObstacles = [];

    // 1. Natural Boulders & Stone Formations scattered across the terrain
    const stoneFormations: { x: number; z: number; radius: number }[] = [
      { x: -18, z: -14, radius: 2.2 },
      { x: -16, z: 18, radius: 2.5 },
      { x: -26, z: -2, radius: 3.0 },
      { x: 14, z: -22, radius: 2.0 },
      { x: 18, z: 16, radius: 2.4 },
      { x: -8, z: -32, radius: 2.8 },
      { x: 6, z: 28, radius: 2.6 },
    ];

    stoneFormations.forEach((st) => {
      this.rockObstacles.push(st);
      const rockGroup = new THREE.Group();
      rockGroup.position.set(st.x, 0, st.z);

      const mainRock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(st.radius * 0.85),
        rockMat
      );
      mainRock.position.y = st.radius * 0.45;
      mainRock.castShadow = true;
      mainRock.receiveShadow = true;
      rockGroup.add(mainRock);

      // Accent smaller boulders
      const subRock1 = new THREE.Mesh(
        new THREE.DodecahedronGeometry(st.radius * 0.45),
        rockMat
      );
      subRock1.position.set(st.radius * 0.55, st.radius * 0.25, -st.radius * 0.3);
      subRock1.castShadow = true;
      rockGroup.add(subRock1);

      this.terrainGroup.add(rockGroup);
    });

    // 2. Border Trees and Perimeter Rocks
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2;
      const radius = 28 + (i % 5) * 4.5;
      const tx = Math.cos(angle) * radius;
      const tz = Math.sin(angle) * radius;

      // Avoid placing trees directly in river
      if (tx >= 34 && tx <= 58) continue;

      // Tree Trunk
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 1.4, 6), trunkMat);
      trunk.position.set(tx, 0.7, tz);
      trunk.castShadow = true;
      this.terrainGroup.add(trunk);

      // Tree Foliage
      const foliage = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.8, 6), treeMat);
      foliage.position.set(tx, 2.4, tz);
      foliage.castShadow = true;
      this.terrainGroup.add(foliage);

      // Occasional perimeter rocks
      if (i % 4 === 0) {
        const rSize = 1.0 + (i % 3) * 0.4;
        const rx = tx + 1.6;
        const rz = tz + 1.2;
        const rock = new THREE.Mesh(
          new THREE.DodecahedronGeometry(rSize),
          rockMat
        );
        rock.position.set(rx, rSize * 0.4, rz);
        rock.castShadow = true;
        rock.receiveShadow = true;
        this.terrainGroup.add(rock);
        this.rockObstacles.push({ x: rx, z: rz, radius: rSize });
      }
    }
  }

  /**
   * Placement Validation: Prevents building in rivers, over stones/boulders, beyond map boundaries, or on occupied slots.
   */
  public checkPlacementValidity(
    gridX: number,
    gridZ: number,
    def: BuildingDefinition,
    placedBuildings: PlacedBuilding[] = this.placedBuildingsCache
  ): { isValid: boolean; reason: string } {
    const worldX = gridX * 2;
    const worldZ = gridZ * 2;
    const halfW = (def.size[0] * 2) / 2;
    const halfD = (def.size[1] * 2) / 2;

    const bMinX = worldX - halfW;
    const bMaxX = worldX + halfW;
    const bMinZ = worldZ - halfD;
    const bMaxZ = worldZ + halfD;

    // 1. Boundary Check
    if (Math.abs(worldX) > 52 || Math.abs(worldZ) > 52) {
      return { isValid: false, reason: 'Outside designated construction territory!' };
    }

    // 2. River / Water Canal Collision (Cannot build in river, unless bridge)
    if (def.id !== 'infra_bridge') {
      const riverMinX = this.riverBounds.minX;
      const riverMaxX = this.riverBounds.maxX;
      if (bMaxX >= riverMinX && bMinX <= riverMaxX) {
        return { isValid: false, reason: 'Cannot construct over river water canal!' };
      }
    }

    // 3. Rock / Boulder / Stone Collision Check (Cannot build on or below stones)
    for (const rock of this.rockObstacles) {
      // Find closest point on building AABB to rock center
      const closestX = Math.max(bMinX, Math.min(rock.x, bMaxX));
      const closestZ = Math.max(bMinZ, Math.min(rock.z, bMaxZ));
      const distSq = (rock.x - closestX) ** 2 + (rock.z - closestZ) ** 2;
      const collisionThreshold = (rock.radius + 0.4) ** 2;

      if (distSq < collisionThreshold) {
        return { isValid: false, reason: 'Cannot construct on boulders or rock formations!' };
      }
    }

    // 4. Natural Environment Resource Nodes Check (Trees, Steel veins, Quarries)
    if (this.envResourceManager) {
      for (const node of this.envResourceManager.nodes) {
        if (!node.isDepleted) {
          const closestX = Math.max(bMinX, Math.min(node.x, bMaxX));
          const closestZ = Math.max(bMinZ, Math.min(node.z, bMaxZ));
          const distSq = (node.x - closestX) ** 2 + (node.z - closestZ) ** 2;
          if (distSq < 2.6 ** 2) {
            return {
              isValid: false,
              reason: `Blocked by ${node.name} (${node.type.toUpperCase()})! Harvest it first!`,
            };
          }
        }
      }
    }

    // 5. Existing Placed Building Overlap Check
    for (const b of placedBuildings) {
      const bldWorldX = b.gridX * 2;
      const bldWorldZ = b.gridZ * 2;
      // Approximate building radius/box
      const otherHalfW = 2.0;
      const otherHalfD = 2.0;

      const overlapX = Math.abs(worldX - bldWorldX) < (halfW + otherHalfW - 0.2);
      const overlapZ = Math.abs(worldZ - bldWorldZ) < (halfD + otherHalfD - 0.2);

      if (overlapX && overlapZ) {
        return { isValid: false, reason: 'Location is already occupied by a structure!' };
      }
    }

    return { isValid: true, reason: 'Clear site ready for construction' };
  }

  /**
   * Floating 3D Resource Gathering Text Sprite Popup
   */
  public spawnFloatingResourcePopup(x: number, y: number, z: number, text: string, colorHex: string = '#f59e0b') {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw stylized badge
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.roundRect ? ctx.roundRect(8, 8, 240, 64, 16) : ctx.rect(8, 8, 240, 64);
    ctx.fill();

    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 40);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 1.0, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(3.6, 1.1, 1.0);
    sprite.position.set(x, y + 2.5, z);

    this.scene.add(sprite);
    this.floatingPopups.push({
      sprite,
      startTime: Date.now(),
      duration: 1600,
      startY: y + 2.5,
      startX: x,
      startZ: z,
    });
  }

  private setupStars() {
    const starCount = 600;
    const starGeom = new THREE.BufferGeometry();
    const pos = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 400;
      pos[i + 1] = 60 + Math.random() * 150;
      pos[i + 2] = (Math.random() - 0.5) * 400;
    }

    starGeom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, transparent: true, opacity: 0 });
    this.stars = new THREE.Points(starGeom, starMat);
    this.scene.add(this.stars);
  }

  private setupWeatherParticles() {
    // Rain Particles
    const rainCount = 1800;
    const rainGeom = new THREE.BufferGeometry();
    const rainPos = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount * 3; i += 3) {
      rainPos[i] = (Math.random() - 0.5) * 100;
      rainPos[i + 1] = Math.random() * 50;
      rainPos[i + 2] = (Math.random() - 0.5) * 100;
    }
    rainGeom.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.4,
      transparent: true,
      opacity: 0,
    });
    this.rainParticles = new THREE.Points(rainGeom, rainMat);
    this.scene.add(this.rainParticles);

    // Snow Particles
    const snowCount = 1200;
    const snowGeom = new THREE.BufferGeometry();
    const snowPos = new Float32Array(snowCount * 3);
    for (let i = 0; i < snowCount * 3; i += 3) {
      snowPos[i] = (Math.random() - 0.5) * 100;
      snowPos[i + 1] = Math.random() * 50;
      snowPos[i + 2] = (Math.random() - 0.5) * 100;
    }
    snowGeom.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
    const snowMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.6,
      transparent: true,
      opacity: 0,
    });
    this.snowParticles = new THREE.Points(snowGeom, snowMat);
    this.scene.add(this.snowParticles);
  }

  private playerWalkPhase: number = 0;

  private setupPlayerAvatar() {
    this.playerAvatar = new THREE.Group();
    this.playerAvatar.name = 'player_avatar';

    const pelvis = new THREE.Group();
    pelvis.name = 'player_pelvis';
    pelvis.position.y = 0.8;
    this.playerAvatar.add(pelvis);

    const torso = new THREE.Group();
    torso.name = 'player_torso';
    pelvis.add(torso);

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.7, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 })
    );
    body.position.y = 0.35;
    body.castShadow = true;
    torso.add(body);

    // Resource Cargo Backpack
    const backpackGroup = new THREE.Group();
    backpackGroup.name = 'player_backpack';
    backpackGroup.position.set(0, 0.35, -0.28);

    const backpackCrate = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.52, 0.26),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 })
    );
    backpackCrate.castShadow = true;
    backpackGroup.add(backpackCrate);

    // Leather straps & gold buckle
    const strapMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.7, roughness: 0.3 });
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.04), strapMat);
    buckle.position.set(0, 0.08, -0.14);
    backpackGroup.add(buckle);

    // Dynamic resource payload indicator nodes
    const woodIndicator = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.36, 6),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 })
    );
    woodIndicator.name = 'backpack_wood_gem';
    woodIndicator.rotation.z = Math.PI / 2;
    woodIndicator.position.set(0, 0.3, 0);
    backpackGroup.add(woodIndicator);

    const steelIndicator = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.2 })
    );
    steelIndicator.name = 'backpack_steel_gem';
    steelIndicator.position.set(-0.14, 0.3, 0);
    backpackGroup.add(steelIndicator);

    const concreteIndicator = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.12, 0.14),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.9 })
    );
    concreteIndicator.name = 'backpack_concrete_gem';
    concreteIndicator.position.set(0.14, 0.3, 0);
    backpackGroup.add(concreteIndicator);

    torso.add(backpackGroup);

    const headGroup = new THREE.Group();
    headGroup.name = 'player_head';
    headGroup.position.set(0, 0.78, 0);
    torso.add(headGroup);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xfde047 })
    );
    head.castShadow = true;
    headGroup.add(head);

    // Left & Right Arms
    const armMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8 });
    const leftArm = new THREE.Group();
    leftArm.name = 'player_left_arm';
    leftArm.position.set(-0.4, 0.6, 0);
    const leftArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.55, 0.18), armMat);
    leftArmMesh.position.y = -0.25;
    leftArmMesh.castShadow = true;
    leftArm.add(leftArmMesh);
    torso.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.name = 'player_right_arm';
    rightArm.position.set(0.4, 0.6, 0);
    const rightArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.55, 0.18), armMat);
    rightArmMesh.position.y = -0.25;
    rightArmMesh.castShadow = true;
    rightArm.add(rightArmMesh);
    torso.add(rightArm);

    // Left & Right Legs
    const legMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
    const leftLeg = new THREE.Group();
    leftLeg.name = 'player_left_leg';
    leftLeg.position.set(-0.2, 0, 0);
    const leftLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.22), legMat);
    leftLegMesh.position.y = -0.3;
    leftLegMesh.castShadow = true;
    leftLeg.add(leftLegMesh);
    pelvis.add(leftLeg);

    const rightLeg = new THREE.Group();
    rightLeg.name = 'player_right_leg';
    rightLeg.position.set(0.2, 0, 0);
    const rightLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.22), legMat);
    rightLegMesh.position.y = -0.3;
    rightLegMesh.castShadow = true;
    rightLeg.add(rightLegMesh);
    pelvis.add(rightLeg);

    this.playerAvatar.visible = false;
    this.scene.add(this.playerAvatar);
  }

  public setSelectedDefinition(def: BuildingDefinition | null) {
    this.selectedDef = def;
    if (this.ghostMesh) {
      this.scene.remove(this.ghostMesh);
      this.ghostMesh = null;
    }

    if (def) {
      this.ghostMesh = BuildingMeshFactory.createBuildingMesh(def, true);
      this.ghostMesh.position.set(this.hoveredGridX * 2, 0, this.hoveredGridZ * 2);
      this.scene.add(this.ghostMesh);
      this.updateGhostMeshValidity();
    } else {
      if (this.onPlacementValidationChange) {
        this.onPlacementValidationChange(null);
      }
    }
  }

  private updateGhostMeshValidity() {
    if (!this.ghostMesh || !this.selectedDef) return;

    const validation = this.checkPlacementValidity(
      this.hoveredGridX,
      this.hoveredGridZ,
      this.selectedDef,
      this.placedBuildingsCache
    );

    this.isPlacementValid = validation.isValid;
    this.placementInvalidReason = validation.reason;

    const tintColor = validation.isValid ? 0x22c55e : 0xef4444; // Green vs Red
    const opacityVal = validation.isValid ? 0.65 : 0.85;

    this.ghostMesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => {
            m.transparent = true;
            m.opacity = opacityVal;
            m.color.setHex(tintColor);
          });
        } else {
          child.material.transparent = true;
          child.material.opacity = opacityVal;
          child.material.color.setHex(tintColor);
        }
      }
    });

    if (this.onPlacementValidationChange) {
      this.onPlacementValidationChange({
        isValid: validation.isValid,
        reason: validation.reason,
        gridX: this.hoveredGridX,
        gridZ: this.hoveredGridZ,
      });
    }
  }

  public updateTimeOfDay(hour: number) {
    const sunAngle = ((hour - 6) / 24) * Math.PI * 2;
    const sunDist = 70;
    const sunY = Math.sin(sunAngle) * sunDist;
    const sunX = Math.cos(sunAngle) * sunDist;
    const sunZ = Math.sin(sunAngle * 0.5) * 30;

    this.dirLight.position.set(sunX, Math.max(-10, sunY), sunZ);

    const isDay = hour >= 6 && hour <= 19;
    const isSunset = (hour >= 17 && hour <= 19) || (hour >= 5 && hour <= 6);

    let skyColor: number;
    if (isSunset) {
      skyColor = 0xf97316; // Orange golden hour
      this.dirLight.color.setHex(0xfeb743);
      this.dirLight.intensity = 1.0;
      this.ambientLight.intensity = 0.35;
    } else if (isDay) {
      skyColor = 0x60a5fa; // Day Blue
      this.dirLight.color.setHex(0xfffaed);
      this.dirLight.intensity = 1.3;
      this.ambientLight.intensity = 0.5;
    } else {
      skyColor = 0x020617; // Deep Dark Night
      this.dirLight.color.setHex(0x38bdf8);
      this.dirLight.intensity = 0.15;
      this.ambientLight.intensity = 0.15;
    }

    this.scene.background = new THREE.Color(skyColor);

    if (this.stars) {
      (this.stars.material as THREE.PointsMaterial).opacity = isDay ? 0 : 0.85;
    }
  }

  public updateWeather(weather: WeatherType) {
    const rainMat = this.rainParticles?.material as THREE.PointsMaterial;
    const snowMat = this.snowParticles?.material as THREE.PointsMaterial;

    if (weather === 'rain' || weather === 'storm') {
      if (rainMat) rainMat.opacity = weather === 'storm' ? 0.9 : 0.6;
      if (snowMat) snowMat.opacity = 0;
      this.scene.fog = new THREE.FogExp2(0x475569, weather === 'storm' ? 0.015 : 0.008);
    } else if (weather === 'snow') {
      if (rainMat) rainMat.opacity = 0;
      if (snowMat) snowMat.opacity = 0.8;
      this.scene.fog = new THREE.FogExp2(0xe2e8f0, 0.01);
    } else if (weather === 'fog') {
      if (rainMat) rainMat.opacity = 0;
      if (snowMat) snowMat.opacity = 0;
      this.scene.fog = new THREE.FogExp2(0x64748b, 0.028);
    } else {
      if (rainMat) rainMat.opacity = 0;
      if (snowMat) snowMat.opacity = 0;
      this.scene.fog = null;
    }
  }

  public syncBuildings(buildings: PlacedBuilding[], defs: BuildingDefinition[]) {
    this.placedBuildingsCache = buildings;
    const activeIds = new Set(buildings.map((b) => b.instanceId));

    // Remove obsolete meshes
    for (const [id, mesh] of this.buildingMeshes.entries()) {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        this.buildingMeshes.delete(id);
      }
    }

    // Add or update existing
    buildings.forEach((b) => {
      const def = defs.find((d) => d.id === b.defId);
      if (!def) return;

      let mesh = this.buildingMeshes.get(b.instanceId);
      const isComplete = b.isConstructed;

      if (!mesh || (mesh.name === 'construction_site' && isComplete) || (mesh.name !== 'construction_site' && !isComplete)) {
        if (mesh) this.scene.remove(mesh);
        mesh = isComplete
          ? BuildingMeshFactory.createBuildingMesh(def)
          : BuildingMeshFactory.createConstructionSite(def, b.progress);

        mesh.userData = {
          buildingInstanceId: b.instanceId,
          defId: b.defId,
          isConstructed: b.isConstructed,
          type: 'building',
        };
        mesh.position.set(b.gridX * 2, 0, b.gridZ * 2);
        mesh.rotation.y = (b.rotation * Math.PI) / 180;
        this.scene.add(mesh);
        this.buildingMeshes.set(b.instanceId, mesh);
      } else if (!isComplete && mesh.name === 'construction_site') {
        this.scene.remove(mesh);
        mesh = BuildingMeshFactory.createConstructionSite(def, b.progress);
        mesh.userData = {
          buildingInstanceId: b.instanceId,
          defId: b.defId,
          isConstructed: b.isConstructed,
          type: 'building',
        };
        mesh.position.set(b.gridX * 2, 0, b.gridZ * 2);
        mesh.rotation.y = (b.rotation * Math.PI) / 180;
        this.scene.add(mesh);
        this.buildingMeshes.set(b.instanceId, mesh);
      }

      if (b.hp < b.maxHp * 0.4) {
        mesh.rotation.z = Math.sin(Date.now() * 0.005) * 0.05;
      } else {
        mesh.rotation.z = 0;
      }

      // 1. Building Fire & Smoke Particles when damaged
      const isDamaged = b.hp < b.maxHp * 0.8 || b.isOnFire;
      let fireGroup = mesh.getObjectByName('building_fire_particles');
      if (isDamaged && b.isConstructed) {
        if (!fireGroup) {
          fireGroup = new THREE.Group();
          fireGroup.name = 'building_fire_particles';
          const bldHeight = (def as any).height || 3.5;
          fireGroup.position.y = bldHeight * 0.5;

          // Animated flame tongues
          for (let f = 0; f < 3; f++) {
            const flame = new THREE.Mesh(
              new THREE.ConeGeometry(0.45, 1.6, 6),
              new THREE.MeshBasicMaterial({ color: f === 0 ? 0xef4444 : f === 1 ? 0xf97316 : 0xfacc15, transparent: true, opacity: 0.9 })
            );
            flame.name = `flame_${f}`;
            flame.position.set((f - 1) * 0.6, 0.4, (Math.random() - 0.5) * 0.8);
            fireGroup.add(flame);
          }

          const smoke = new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.7),
            new THREE.MeshBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.55 })
          );
          smoke.name = 'smoke_puff';
          smoke.position.set(0, 1.4, 0);
          fireGroup.add(smoke);

          mesh.add(fireGroup);
        }
      } else if (fireGroup) {
        mesh.remove(fireGroup);
      }

      // 2. Overhead In-World Billboard Health Bar for damaged buildings or Citadel
      let bldHb = mesh.getObjectByName('bld_health_bar');
      const isCitadel = b.defId === 'mon_kingdom_house';
      const showHb = b.hp < b.maxHp || isCitadel;

      if (showHb) {
        const bldHeight = isCitadel ? 12 : ((def as any).height || 3.5);
        if (!bldHb) {
          bldHb = new THREE.Group();
          bldHb.name = 'bld_health_bar';
          bldHb.position.y = bldHeight + 1.6;

          const barWidth = isCitadel ? 4.8 : 2.6;
          const barHeight = isCitadel ? 0.46 : 0.28;

          const bgBar = new THREE.Mesh(
            new THREE.PlaneGeometry(barWidth, barHeight),
            new THREE.MeshBasicMaterial({ color: 0x090d16, side: THREE.DoubleSide })
          );
          bldHb.add(bgBar);

          const fgBar = new THREE.Mesh(
            new THREE.PlaneGeometry(barWidth * 0.96, barHeight * 0.76),
            new THREE.MeshBasicMaterial({
              color: isCitadel ? 0xf59e0b : 0x22c55e,
              side: THREE.DoubleSide,
            })
          );
          fgBar.name = 'fg_bld_health';
          fgBar.position.z = 0.01;
          bldHb.add(fgBar);

          mesh.add(bldHb);
        }

        const fg = bldHb.getObjectByName('fg_bld_health') as THREE.Mesh;
        if (fg) {
          const hpPct = Math.max(0, Math.min(1, b.hp / b.maxHp));
          fg.scale.x = hpPct;
          const barWidth = isCitadel ? 4.8 : 2.6;
          fg.position.x = (hpPct - 1) * (barWidth * 0.48);
          const mat = fg.material as THREE.MeshBasicMaterial;
          if (hpPct > 0.5) mat.color.setHex(isCitadel ? 0xf59e0b : 0x22c55e);
          else if (hpPct > 0.25) mat.color.setHex(0xeab308);
          else mat.color.setHex(0xef4444);
        }
      } else if (bldHb) {
        mesh.remove(bldHb);
      }
    });
  }

  // --- RTS Animated Waypoint Ping ---
  public spawnWaypointPing(x: number, z: number, type: 'move' | 'attack' | 'build' = 'move') {
    const group = new THREE.Group();
    group.position.set(x, 0.06, z);

    const color = type === 'attack' ? 0xef4444 : type === 'build' ? 0xf59e0b : 0x22c55e;

    // Outer Expanding Ring
    const outerRing = new THREE.Mesh(
      new THREE.RingGeometry(0.8, 0.95, 32),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
    );
    outerRing.rotation.x = -Math.PI / 2;
    outerRing.name = 'outer_ring';
    group.add(outerRing);

    // Inner Concentric Pulse Ring
    const innerRing = new THREE.Mesh(
      new THREE.RingGeometry(0.25, 0.35, 24),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.95 })
    );
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.name = 'inner_ring';
    group.add(innerRing);

    // Crosshair markers
    const crossMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.08), crossMat);
      line.rotation.x = -Math.PI / 2;
      line.rotation.z = angle;
      line.position.set(Math.cos(angle) * 0.6, 0, Math.sin(angle) * 0.6);
      group.add(line);
    }

    this.scene.add(group);
    this.waypointPings.push({
      group,
      createdAt: Date.now(),
      duration: 600, // ms
      type,
    });
  }

  public triggerCelebration() {
    soundManager.playCelebration();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  }

  // --- Mouse Raycasting, RTS Selection & Destination Movement ---

  private setupEventListeners() {
    const canvas = this.renderer.domElement;

    const updateMouseCoords = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseVec.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.mouseVec.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      this.currentPointerPos = { x: clientX - rect.left, y: clientY - rect.top };
    };

    const onPointerDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX;
      const clientY = e.clientY;
      this.pointerDownPos = { x: clientX - rect.left, y: clientY - rect.top };
      this.currentPointerPos = { x: clientX - rect.left, y: clientY - rect.top };
      this.isPointerDown = true;
      this.isDraggingMarquee = false;

      // Disable orbit controls temporarily during selection drag if left click and not placing building
      if (e.button === 0 && !this.selectedDef && !e.altKey) {
        // Will decide if it's camera drag or marquee drag on move
      }
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      updateMouseCoords(clientX, clientY);

      this.raycaster.setFromCamera(this.mouseVec, this.camera);
      const groundIntersects = this.raycaster.intersectObjects(this.terrainGroup.children, true);

      if (groundIntersects.length > 0) {
        const point = groundIntersects[0].point;
        this.hoveredGridX = Math.round(point.x / 2);
        this.hoveredGridZ = Math.round(point.z / 2);

        if (this.ghostMesh) {
          this.ghostMesh.position.set(this.hoveredGridX * 2, 0, this.hoveredGridZ * 2);
          this.updateGhostMeshValidity();
        }
      }

      // Marquee drag check
      if (this.isPointerDown && !('touches' in e) && (e as MouseEvent).buttons === 1 && !this.selectedDef && !(e as MouseEvent).altKey) {
        const dx = this.currentPointerPos.x - this.pointerDownPos.x;
        const dy = this.currentPointerPos.y - this.pointerDownPos.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 10) {
          this.isDraggingMarquee = true;
          this.controls.enabled = false; // pause orbit controls to allow smooth marquee selection

          const startX = Math.min(this.pointerDownPos.x, this.currentPointerPos.x);
          const startY = Math.min(this.pointerDownPos.y, this.currentPointerPos.y);
          const endX = Math.max(this.pointerDownPos.x, this.currentPointerPos.x);
          const endY = Math.max(this.pointerDownPos.y, this.currentPointerPos.y);

          if (this.onMarqueeBoxChange) {
            this.onMarqueeBoxChange({ startX, startY, endX, endY });
          }
        }
      }

      // Dynamic cursor styling based on raycast hit
      this.updateHoverCursor();
    };

    const onPointerUp = (e: MouseEvent) => {
      if (e.button === 0) {
        // Left mouse button released
        if (this.isDraggingMarquee) {
          // Execute Marquee Screen-to-World Raycasting Box Selection!
          const startX = Math.min(this.pointerDownPos.x, this.currentPointerPos.x);
          const startY = Math.min(this.pointerDownPos.y, this.currentPointerPos.y);
          const endX = Math.max(this.pointerDownPos.x, this.currentPointerPos.x);
          const endY = Math.max(this.pointerDownPos.y, this.currentPointerPos.y);

          this.selectUnitsInScreenRect(startX, startY, endX, endY, e.shiftKey);
          if (this.onMarqueeBoxChange) {
            this.onMarqueeBoxChange(null);
          }
        } else {
          // Single Left Click Raycast
          this.handleLeftClick(e);
        }

        this.controls.enabled = this.viewMode === 'orbit';
      }

      this.isPointerDown = false;
      this.isDraggingMarquee = false;
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Stop default browser menu
      // RTS Right-Click Destination Raycast Command!
      this.handleRightClick(e);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      this.playerKeys[e.code] = true;

      // RTS Hotkeys:
      // 'A' key or 'Space' -> Attack nearest threat / Stop
      if (e.code === 'KeyS' && !e.ctrlKey && !e.metaKey) {
        const selected = this.workerManager.getSelectedUnitIds();
        if (selected.length > 0) {
          this.workerManager.stopUnits(selected);
          this.notifySelectionChange();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      this.playerKeys[e.code] = false;
    };

    canvas.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    canvas.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Resize handler
    const onResize = () => {
      if (this.isDestroyed) return;
      const w = this.container.clientWidth || window.innerWidth;
      const h = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);
  }

  private updateHoverCursor() {
    const canvas = this.renderer.domElement;
    if (this.selectedDef) {
      canvas.style.cursor = this.isPlacementValid ? 'crosshair' : 'not-allowed';
      return;
    }

    this.raycaster.setFromCamera(this.mouseVec, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    const hitUnit = intersects.find((hit) => {
      let cur: THREE.Object3D | null = hit.object;
      while (cur) {
        if (cur.userData && cur.userData.type === 'unit') return true;
        cur = cur.parent;
      }
      return false;
    });

    if (hitUnit) {
      canvas.style.cursor = 'pointer';
      return;
    }

    const hitThreat = intersects.find((hit) => {
      let cur: THREE.Object3D | null = hit.object;
      while (cur) {
        if (cur.userData && cur.userData.type === 'threat') return true;
        cur = cur.parent;
      }
      return false;
    });

    if (hitThreat && this.workerManager.getSelectedUnits().length > 0) {
      canvas.style.cursor = 'crosshair';
      return;
    }

    const hitBuilding = intersects.find((hit) => {
      let cur: THREE.Object3D | null = hit.object;
      while (cur) {
        if (cur.userData && cur.userData.type === 'building') return true;
        cur = cur.parent;
      }
      return false;
    });

    if (hitBuilding) {
      canvas.style.cursor = 'pointer';
      return;
    }

    const hitResourceNode = intersects.find((hit) => {
      let cur: THREE.Object3D | null = hit.object;
      while (cur) {
        if (cur.userData && cur.userData.type === 'resource_node') return true;
        cur = cur.parent;
      }
      return false;
    });

    if (hitResourceNode) {
      canvas.style.cursor = 'pointer';
      return;
    }

    canvas.style.cursor = 'default';
  }

  private handleLeftClick(e: MouseEvent) {
    this.raycaster.setFromCamera(this.mouseVec, this.camera);

    // 1. If currently in Building Placement Mode -> place building
    if (this.selectedDef) {
      if (this.onTileClick) {
        this.onTileClick(this.hoveredGridX, this.hoveredGridZ);
      }
      return;
    }

    // 2. Raycast against all interactive objects in scene
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    // Check if clicked directly on a Unit (Worker, Military, Fire Engine, etc.)
    for (const hit of intersects) {
      let cur: THREE.Object3D | null = hit.object;
      while (cur) {
        if (cur.userData && cur.userData.type === 'unit' && cur.userData.unitId) {
          const unitId = cur.userData.unitId;
          this.workerManager.selectUnit(unitId, e.shiftKey);
          this.notifySelectionChange();
          return;
        }
        cur = cur.parent;
      }
    }

    // Check if clicked on a Building -> Inspect Building / Open details
    for (const hit of intersects) {
      let cur: THREE.Object3D | null = hit.object;
      while (cur) {
        if (cur.userData && cur.userData.type === 'building' && cur.userData.buildingInstanceId) {
          if (this.onBuildingClick) {
            this.onBuildingClick(cur.userData.buildingInstanceId, cur.userData.defId);
          }
          return;
        }
        cur = cur.parent;
      }
    }

    // Check if clicked on an Environment Resource Node (Wood, Steel, Concrete)
    for (const hit of intersects) {
      let cur: THREE.Object3D | null = hit.object;
      while (cur) {
        if (cur.userData && cur.userData.type === 'resource_node' && cur.userData.nodeId) {
          const node = this.envResourceManager.nodes.find((n) => n.id === cur.userData.nodeId);
          if (node && this.onResourceNodeClick) {
            this.onResourceNodeClick(node);
            return;
          }
        }
        cur = cur.parent;
      }
    }

    // Check if clicked on empty Ground/Terrain -> Deselect units
    const groundHit = intersects.find((h) => h.object.name === 'terrain_ground' || this.terrainGroup.children.includes(h.object));
    if (groundHit && !e.shiftKey) {
      this.workerManager.deselectAll();
      this.notifySelectionChange();
    }
  }

  private handleRightClick(e: MouseEvent) {
    const selectedUnits = this.workerManager.getSelectedUnits();
    if (selectedUnits.length === 0) return;

    this.raycaster.setFromCamera(this.mouseVec, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    const selectedIds = selectedUnits.map((u) => u.id);

    // 1. Check if right-clicked on an enemy / threat!
    for (const hit of intersects) {
      let cur: THREE.Object3D | null = hit.object;
      while (cur) {
        if (cur.userData && cur.userData.type === 'threat' && cur.userData.threatId) {
          const threatId = cur.userData.threatId;
          const threat = this.threatManager.threats.find((t) => t.id === threatId);
          if (threat) {
            this.workerManager.orderAttack(selectedIds, threat.id, threat.x, threat.z);
            this.spawnWaypointPing(threat.x, threat.z, 'attack');
            this.notifySelectionChange();
            return;
          }
        }
        cur = cur.parent;
      }
    }

    // 2. Check if right-clicked on a natural environment resource node (Wood Grove, Steel Vein, Concrete Quarry)
    for (const hit of intersects) {
      let cur: THREE.Object3D | null = hit.object;
      while (cur) {
        if (cur.userData && cur.userData.type === 'resource_node' && cur.userData.nodeId) {
          const nodeId = cur.userData.nodeId;
          const node = this.envResourceManager.nodes.find((n) => n.id === nodeId);
          if (node && !node.isDepleted) {
            // Check if Citadel structure is under construction
            const citadelUnderConstruction = this.placedBuildingsCache.find(
              (b) => b.defId === 'mon_kingdom_house' && !b.isConstructed
            );

            if (citadelUnderConstruction) {
              // PRIORITY: Build Citadel first!
              this.workerManager.orderConstruct(
                selectedIds,
                citadelUnderConstruction.instanceId,
                citadelUnderConstruction.gridX * 2,
                citadelUnderConstruction.gridZ * 2,
                true
              );
              this.spawnFloatingResourcePopup(
                node.x,
                2.5,
                node.z,
                '⚠️ Build Citadel First! Workers routed to Citadel foundation... 🏰',
                '#f59e0b'
              );
              this.spawnWaypointPing(citadelUnderConstruction.gridX * 2, citadelUnderConstruction.gridZ * 2, 'build');
              this.notifySelectionChange();
              return;
            }

            this.workerManager.orderGatherResourceNode(selectedIds, node.id, node.x, node.z);
            this.spawnWaypointPing(node.x, node.z, 'build');
            this.notifySelectionChange();
            return;
          }
        }
        cur = cur.parent;
      }
    }

    // 3. Check if right-clicked on a building (Construction Site or Workshop Gathering site)
    for (const hit of intersects) {
      let cur: THREE.Object3D | null = hit.object;
      while (cur) {
        if (cur.userData && cur.userData.type === 'building' && cur.userData.buildingInstanceId) {
          const bldId = cur.userData.buildingInstanceId;
          const mesh = this.buildingMeshes.get(bldId);
          const defId = cur.userData.defId as string;
          const isConstructed = cur.userData.isConstructed;

          if (mesh) {
            if (!isConstructed) {
              // Order Construction
              this.workerManager.orderConstruct(selectedIds, bldId, mesh.position.x, mesh.position.z, defId === 'mon_kingdom_house');
              this.spawnWaypointPing(mesh.position.x, mesh.position.z, 'build');
            } else if (defId && defId.startsWith('workshop_')) {
              // Order Workshop Gathering & Production Work!
              this.workerManager.orderWorkAtWorkshop(selectedIds, bldId, mesh.position.x, mesh.position.z);
              this.spawnWaypointPing(mesh.position.x, mesh.position.z, 'build');
            } else {
              // General move towards building entrance
              this.workerManager.orderMove(selectedIds, mesh.position.x, mesh.position.z);
              this.spawnWaypointPing(mesh.position.x, mesh.position.z, 'move');
            }
            this.notifySelectionChange();
            return;
          }
        }
        cur = cur.parent;
      }
    }

    // 3. Right-clicked on Ground -> Order Selected Units to Move to Raycasted (x, z)!
    const groundHit = intersects.find((h) => h.object.name === 'terrain_ground' || this.terrainGroup.children.includes(h.object));
    if (groundHit) {
      const destX = groundHit.point.x;
      const destZ = groundHit.point.z;

      this.workerManager.orderMove(selectedIds, destX, destZ);
      this.spawnWaypointPing(destX, destZ, 'move');
      this.notifySelectionChange();
    }
  }

  // --- Screen Rectangle (Marquee) to World Raycast Selection ---
  private selectUnitsInScreenRect(startX: number, startY: number, endX: number, endY: number, multiSelect: boolean) {
    const canvas = this.renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    const selectedIds: string[] = multiSelect ? this.workerManager.getSelectedUnitIds() : [];

    const tempVec = new THREE.Vector3();

    this.workerManager.units.forEach((unit) => {
      tempVec.set(unit.x, 0.8, unit.z);
      tempVec.project(this.camera);

      // Convert Normalized Device Coordinates (-1 to 1) to screen pixels (0 to width/height)
      const screenX = ((tempVec.x + 1) / 2) * rect.width;
      const screenY = ((-tempVec.y + 1) / 2) * rect.height;

      // Check if within bounds and in front of camera
      if (
        tempVec.z < 1 &&
        screenX >= startX &&
        screenX <= endX &&
        screenY >= startY &&
        screenY <= endY
      ) {
        if (!selectedIds.includes(unit.id)) {
          selectedIds.push(unit.id);
        }
      }
    });

    this.workerManager.selectUnits(selectedIds);
    this.notifySelectionChange();
  }

  public notifySelectionChange() {
    if (this.onSelectionChange) {
      this.onSelectionChange(this.workerManager.getSelectedUnits());
    }
  }

  public setViewMode(mode: ViewMode) {
    this.viewMode = mode;
    if (this.playerAvatar) {
      this.playerAvatar.visible = mode === 'third_person';
    }

    if (mode === 'orbit') {
      this.controls.enabled = true;
      this.camera.position.set(28, 32, 38);
      this.controls.target.set(0, 0, 0);
    } else {
      this.controls.enabled = false;
    }
  }

  public returnAvatarToKingdom() {
    const totalCargo = this.avatarCargo.wood + this.avatarCargo.steel + this.avatarCargo.concrete;
    this.isAutoReturningToKingdom = true;
    if (this.onAutoReturnTriggered) this.onAutoReturnTriggered(true);
    soundManager.playUnitOrder();
    this.spawnFloatingResourcePopup(
      this.playerPos.x,
      2.8,
      this.playerPos.z,
      totalCargo > 0
        ? `🚶 Delivering ${totalCargo} items to Kingdom House... 🏰`
        : `🚶 Moving to Kingdom House Citadel... 🏰`,
      '#f59e0b'
    );
  }

  private updateAvatar(delta: number) {
    if (this.viewMode === 'orbit') return;

    const speed = 12 * delta;
    let dx = 0;
    let dz = 0;

    // Check if Avatar is in Auto-Return navigation mode towards Kingdom House
    if (this.isAutoReturningToKingdom) {
      // Depository drop-off point at the front of the Kingdom House
      const targetX = this.kingdomHouseCoords.x;
      const targetZ = this.kingdomHouseCoords.z + 3.8;

      const toX = targetX - this.playerPos.x;
      const toZ = targetZ - this.playerPos.z;
      const distToKingdom = Math.hypot(toX, toZ);

      if (distToKingdom > 1.3) {
        dx = toX;
        dz = toZ;
        const len = Math.hypot(dx, dz);
        this.playerPos.x += (dx / len) * (14 * delta);
        this.playerPos.z += (dz / len) * (14 * delta);

        if (this.playerAvatar) {
          this.playerAvatar.position.copy(this.playerPos);
          this.playerAvatar.lookAt(this.playerPos.x + dx, this.playerPos.y, this.playerPos.z + dz);
        }
      } else {
        // Arrived at the Kingdom House Depository Intake!
        const totalDepositing = this.avatarCargo.wood + this.avatarCargo.steel + this.avatarCargo.concrete;
        if (totalDepositing > 0) {
          soundManager.playVictoryFanfare();
          try {
            confetti({
              particleCount: 45,
              spread: 65,
              origin: { y: 0.6 }
            });
          } catch {
            // ignore
          }

          this.spawnFloatingResourcePopup(
            this.kingdomHouseCoords.x,
            3.6,
            this.kingdomHouseCoords.z + 3.8,
            `🏰 Deposited +${this.avatarCargo.wood} Wood, +${this.avatarCargo.steel} Steel, +${this.avatarCargo.concrete} Concrete! 🌟`,
            '#fbbf24'
          );

          if (this.onKingdomDeposit) {
            this.onKingdomDeposit({
              wood: this.avatarCargo.wood,
              steel: this.avatarCargo.steel,
              concrete: this.avatarCargo.concrete,
            });
          }
        }

        this.avatarCargo = { wood: 0, steel: 0, concrete: 0, maxCapacity: 25 };
        this.isAutoReturningToKingdom = false;
        if (this.onAvatarCargoChange) this.onAvatarCargoChange({ ...this.avatarCargo });
        if (this.onAutoReturnTriggered) this.onAutoReturnTriggered(false);
      }
    } else {
      // Manual Player WASD/Arrow Movement
      if (this.playerKeys['KeyW'] || this.playerKeys['ArrowUp']) dz -= 1;
      if (this.playerKeys['KeyS'] || this.playerKeys['ArrowDown']) dz += 1;
      if (this.playerKeys['KeyA'] || this.playerKeys['ArrowLeft']) dx -= 1;
      if (this.playerKeys['KeyD'] || this.playerKeys['ArrowRight']) dx += 1;

      if (dx !== 0 || dz !== 0) {
        const len = Math.hypot(dx, dz);
        this.playerPos.x += (dx / len) * speed;
        this.playerPos.z += (dz / len) * speed;

        if (this.playerAvatar) {
          this.playerAvatar.position.copy(this.playerPos);
          this.playerAvatar.lookAt(this.playerPos.x + dx, this.playerPos.y, this.playerPos.z + dz);
        }
      }
    }

    const isWalking = dx !== 0 || dz !== 0;

    // Avatar Proximity Node Check (Harvest Wood, Steel, Concrete)
    const nearestNode = this.envResourceManager?.findNearestNode(this.playerPos.x, this.playerPos.z);
    const isNear =
      nearestNode &&
      !nearestNode.isDepleted &&
      Math.hypot(nearestNode.x - this.playerPos.x, nearestNode.z - this.playerPos.z) < 3.8;

    if (this.onAvatarProximityNode) {
      this.onAvatarProximityNode(isNear ? nearestNode : null);
    }

    // Avatar Two-State Animations (Idle vs Walk vs Harvest)
    if (this.playerAvatar) {
      const pelvis = this.playerAvatar.getObjectByName('player_pelvis');
      const torso = this.playerAvatar.getObjectByName('player_torso');
      const head = this.playerAvatar.getObjectByName('player_head');
      const leftArm = this.playerAvatar.getObjectByName('player_left_arm');
      const rightArm = this.playerAvatar.getObjectByName('player_right_arm');
      const leftLeg = this.playerAvatar.getObjectByName('player_left_leg');
      const rightLeg = this.playerAvatar.getObjectByName('player_right_leg');

      // Update Backpack Cargo Visual Indicators
      const woodGem = this.playerAvatar.getObjectByName('backpack_wood_gem') as THREE.Mesh;
      const steelGem = this.playerAvatar.getObjectByName('backpack_steel_gem') as THREE.Mesh;
      const concreteGem = this.playerAvatar.getObjectByName('backpack_concrete_gem') as THREE.Mesh;

      if (woodGem) woodGem.visible = this.avatarCargo.wood > 0;
      if (steelGem) steelGem.visible = this.avatarCargo.steel > 0;
      if (concreteGem) concreteGem.visible = this.avatarCargo.concrete > 0;

      const timeSec = Date.now() * 0.001;

      // Check if Player is harvesting with E or Space
      const isHarvestingKey = isNear && !this.isAutoReturningToKingdom && (this.playerKeys['KeyE'] || this.playerKeys['Space']);
      if (isHarvestingKey && nearestNode) {
        if (!this.lastAvatarHarvestTime || Date.now() - this.lastAvatarHarvestTime > 420) {
          this.lastAvatarHarvestTime = Date.now();

          const totalCargo = this.avatarCargo.wood + this.avatarCargo.steel + this.avatarCargo.concrete;
          if (totalCargo >= this.avatarCargo.maxCapacity) {
            // Already full! Trigger auto return
            this.isAutoReturningToKingdom = true;
            if (this.onAutoReturnTriggered) this.onAutoReturnTriggered(true);
            soundManager.playUnitOrder();
            this.spawnFloatingResourcePopup(
              this.playerPos.x,
              2.8,
              this.playerPos.z,
              '🎒 Backpack Full (25/25)! Returning to Kingdom House... 🏰',
              '#38bdf8'
            );
          } else {
            const spaceLeft = this.avatarCargo.maxCapacity - totalCargo;
            const amountToGather = Math.min(5, spaceLeft);
            const harvestRes = this.envResourceManager.harvestNode(nearestNode.id, amountToGather, 'avatar');

            if (harvestRes) {
              soundManager.playResourceGathered();
              this.avatarCargo[harvestRes.type] += harvestRes.gathered;
              const newTotal = this.avatarCargo.wood + this.avatarCargo.steel + this.avatarCargo.concrete;

              if (this.onAvatarCargoChange) {
                this.onAvatarCargoChange({ ...this.avatarCargo });
              }

              const icon = harvestRes.type === 'wood' ? '🪵' : harvestRes.type === 'steel' ? '🔩' : '🧱';
              const color =
                harvestRes.type === 'wood'
                  ? '#a3e635'
                  : harvestRes.type === 'steel'
                  ? '#cbd5e1'
                  : '#fbbf24';

              if (newTotal >= this.avatarCargo.maxCapacity) {
                // Reached max capacity! Auto-move to Kingdom House
                this.isAutoReturningToKingdom = true;
                if (this.onAutoReturnTriggered) this.onAutoReturnTriggered(true);
                soundManager.playUnitOrder();
                this.spawnFloatingResourcePopup(
                  this.playerPos.x,
                  2.8,
                  this.playerPos.z,
                  `🎒 Backpack Full (${newTotal}/25)! Returning to Kingdom House... 🏰`,
                  '#38bdf8'
                );
              } else {
                this.spawnFloatingResourcePopup(
                  nearestNode.x,
                  2.6,
                  nearestNode.z,
                  `+${harvestRes.gathered} ${harvestRes.type.toUpperCase()} ${icon} (${newTotal}/${this.avatarCargo.maxCapacity} 🎒)`,
                  color
                );
              }
            }
          }
        }

        // Dedicated Harvesting Swing Animation
        if (rightArm) rightArm.rotation.x = -1.1 + Math.sin(Date.now() * 0.02) * 0.9;
        if (leftArm) leftArm.rotation.x = -0.3 + Math.cos(Date.now() * 0.02) * 0.4;
        if (torso) torso.rotation.x = 0.2 + Math.sin(Date.now() * 0.02) * 0.15;
      } else if (isWalking) {
        // STATE 2: WALK
        this.playerWalkPhase += delta * 12.0;
        const sinWalk = Math.sin(this.playerWalkPhase);

        if (leftLeg) leftLeg.rotation.x = sinWalk * 0.75;
        if (rightLeg) rightLeg.rotation.x = -sinWalk * 0.75;
        if (leftArm) leftArm.rotation.x = -sinWalk * 0.65;
        if (rightArm) rightArm.rotation.x = sinWalk * 0.65;
        if (pelvis) pelvis.position.y = 0.8 + Math.abs(sinWalk) * 0.12;
        if (torso) {
          torso.rotation.x = 0.12;
          torso.rotation.y = -sinWalk * 0.1;
          torso.rotation.z = sinWalk * 0.05;
        }
        if (head) {
          head.rotation.x = -0.08;
          head.rotation.y = sinWalk * 0.05;
        }
      } else {
        // STATE 1: IDLE
        const breathSin = Math.sin(timeSec * 2.4);
        const swaySin = Math.sin(timeSec * 1.2);

        if (leftLeg) {
          leftLeg.rotation.x = 0;
          leftLeg.rotation.z = -0.04;
        }
        if (rightLeg) {
          rightLeg.rotation.x = 0;
          rightLeg.rotation.z = 0.04;
        }
        if (pelvis) pelvis.position.y = 0.8 + breathSin * 0.025;
        if (torso) {
          torso.rotation.x = breathSin * 0.02;
          torso.rotation.y = swaySin * 0.04;
          torso.rotation.z = swaySin * 0.02;
        }
        if (leftArm) {
          leftArm.rotation.x = Math.cos(timeSec * 2.4) * 0.05;
          leftArm.rotation.z = 0.08 + breathSin * 0.02;
        }
        if (rightArm) {
          rightArm.rotation.x = -Math.cos(timeSec * 2.4) * 0.05;
          rightArm.rotation.z = -0.08 - breathSin * 0.02;
        }
        if (head) {
          head.rotation.y = Math.sin(timeSec * 0.7) * 0.3;
          head.rotation.x = Math.cos(timeSec * 1.4) * 0.06;
        }
      }
    }

    if (this.viewMode === 'third_person') {
      this.camera.position.set(this.playerPos.x - 8, this.playerPos.y + 7, this.playerPos.z + 10);
      this.camera.lookAt(this.playerPos.x, this.playerPos.y + 1.5, this.playerPos.z);
    } else if (this.viewMode === 'first_person') {
      this.camera.position.set(this.playerPos.x, this.playerPos.y + 1.7, this.playerPos.z);
      this.camera.lookAt(this.playerPos.x + (dx || 0.01), this.playerPos.y + 1.7, this.playerPos.z - 5);
    }
  }

  private lastAvatarHarvestTime: number = 0;

  private animate = () => {
    if (this.isDestroyed) return;
    this.reqId = requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const now = Date.now();

    // 1. Controls / Avatar Update
    if (this.viewMode === 'orbit') {
      this.controls.update();
    } else {
      this.updateAvatar(delta);
    }

    // 2. Animate Environment Resource Nodes (Billboards, Particles, Shake, Respawn)
    this.envResourceManager?.update(delta, now);

    // 2.5 Update Worker Manager AI & Physics at 60 FPS
    if (this.workerManager) {
      const underConstruction = this.placedBuildingsCache.filter((b) => !b.isConstructed);
      this.workerManager.update(
        delta,
        underConstruction,
        this.threatManager.threats,
        (threatId, dmg) => {
          this.threatManager.damageThreat(threatId, dmg);
        },
        this.placedBuildingsCache
      );
    }

    // 3. Animate Waypoint Pings
    for (let i = this.waypointPings.length - 1; i >= 0; i--) {
      const ping = this.waypointPings[i];
      const elapsed = now - ping.createdAt;
      const progress = elapsed / ping.duration;

      if (progress >= 1.0) {
        this.scene.remove(ping.group);
        this.waypointPings.splice(i, 1);
      } else {
        const outer = ping.group.getObjectByName('outer_ring') as THREE.Mesh;
        const inner = ping.group.getObjectByName('inner_ring') as THREE.Mesh;

        if (outer && outer.material) {
          outer.scale.setScalar(0.4 + progress * 1.6);
          (outer.material as THREE.MeshBasicMaterial).opacity = (1.0 - progress) * 0.9;
        }
        if (inner && inner.material) {
          inner.scale.setScalar(0.8 + progress * 0.6);
          (inner.material as THREE.MeshBasicMaterial).opacity = (1.0 - progress) * 0.95;
        }
      }
    }

    // 3. Animate 3D Floating Popups
    for (let i = this.floatingPopups.length - 1; i >= 0; i--) {
      const popup = this.floatingPopups[i];
      const elapsed = now - popup.startTime;
      const progress = elapsed / popup.duration;

      if (progress >= 1.0) {
        this.scene.remove(popup.sprite);
        if (popup.sprite.material.map) popup.sprite.material.map.dispose();
        popup.sprite.material.dispose();
        this.floatingPopups.splice(i, 1);
      } else {
        popup.sprite.position.y = popup.startY + progress * 2.2;
        popup.sprite.material.opacity = Math.max(0, 1.0 - Math.pow(progress, 2.5));
      }
    }

    // 4. Animate Lighthouse Beams, Workshops, & Special mesh features
    for (const mesh of this.buildingMeshes.values()) {
      // Animate building billboard health bar orientation
      const bldHb = mesh.getObjectByName('bld_health_bar');
      if (bldHb) {
        bldHb.quaternion.copy(this.camera.quaternion);
      }

      // Animate fire and smoke particles
      const fireParticles = mesh.getObjectByName('building_fire_particles');
      if (fireParticles) {
        for (let f = 0; f < 3; f++) {
          const flame = fireParticles.getObjectByName(`flame_${f}`);
          if (flame) {
            flame.scale.y = 0.8 + Math.sin(now * 0.012 + f * 1.5) * 0.4;
            flame.scale.x = 0.9 + Math.cos(now * 0.015 + f) * 0.3;
          }
        }
        const smoke = fireParticles.getObjectByName('smoke_puff');
        if (smoke) {
          smoke.position.y = 1.3 + Math.sin(now * 0.003) * 0.3;
          smoke.rotation.y += delta * 0.5;
        }
      }

      const beam = mesh.getObjectByName('lighthouse_beam');
      if (beam) {
        beam.rotation.y += delta * 1.5;
      }
      const forceCrystal = mesh.getObjectByName('forcefield_crystal');
      if (forceCrystal) {
        forceCrystal.rotation.y += delta * 2.0;
        forceCrystal.rotation.x += delta * 1.0;
      }
      const sawBlade = mesh.getObjectByName('saw_blade');
      if (sawBlade) {
        sawBlade.rotation.x += delta * 14.0;
      }
      const mixerDrum = mesh.getObjectByName('mixer_drum');
      if (mixerDrum) {
        mixerDrum.rotation.z += delta * 4.0;
      }
      const foundryFlame = mesh.getObjectByName('foundry_flame');
      if (foundryFlame && foundryFlame instanceof THREE.Mesh && foundryFlame.material) {
        (foundryFlame.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.8 + Math.sin(now * 0.008) * 0.8;
      }
      const kingdomCrown = mesh.getObjectByName('kingdom_crown_spire');
      if (kingdomCrown) {
        kingdomCrown.rotation.y += delta * 1.8;
        kingdomCrown.position.y = 23.0 + Math.sin(now * 0.003) * 0.25;
      }
      const orbitRing = mesh.getObjectByName('kingdom_orbit_ring');
      if (orbitRing) {
        orbitRing.rotation.x += delta * 1.4;
        orbitRing.rotation.y += delta * 2.0;
      }
      const kingdomRune = mesh.getObjectByName('kingdom_depository_rune') as THREE.Mesh;
      if (kingdomRune && kingdomRune.material) {
        (kingdomRune.material as THREE.MeshStandardMaterial).opacity = 0.65 + Math.sin(now * 0.005) * 0.3;
        kingdomRune.rotation.z += delta * 0.4;
      }
      const beacon = mesh.getObjectByName('kingdom_citadel_beacon') as THREE.Mesh;
      if (beacon && beacon.material) {
        (beacon.material as THREE.MeshBasicMaterial).opacity = 0.18 + Math.sin(now * 0.0025) * 0.08;
        beacon.rotation.y += delta * 0.15;
      }
      const torches = mesh.getObjectsByProperty('name', 'kingdom_torch_flame');
      torches.forEach((t) => {
        if (t instanceof THREE.Mesh && t.material) {
          (t.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.8 + Math.sin(now * 0.015 + Math.random() * 0.05) * 0.5;
        }
      });
      const flags = mesh.getObjectsByProperty('name', 'kingdom_flag_banner');
      flags.forEach((f, idx) => {
        f.rotation.y = Math.sin(now * 0.004 + idx) * 0.25;
      });
    }

    // 4. Animate Rain & Snow
    if (this.rainParticles && (this.rainParticles.material as THREE.PointsMaterial).opacity > 0) {
      const pos = this.rainParticles.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < pos.length; i += 3) {
        pos[i] -= delta * 45;
        if (pos[i] < 0) pos[i] = 45;
      }
      this.rainParticles.geometry.attributes.position.needsUpdate = true;
    }

    if (this.snowParticles && (this.snowParticles.material as THREE.PointsMaterial).opacity > 0) {
      const pos = this.snowParticles.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < pos.length; i += 3) {
        pos[i] -= delta * 12;
        if (pos[i] < 0) pos[i] = 45;
      }
      this.snowParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 5. Render Scene
    this.renderer.render(this.scene, this.camera);
  };

  public destroy() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.reqId);
    this.controls.dispose();
    this.renderer.dispose();
    this.envResourceManager?.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
