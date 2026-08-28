/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { BuildingDefinition } from '../types';

export class BuildingMeshFactory {
  private static materials: { [key: string]: THREE.Material } = {};

  private static getMaterial(color: number, opts: THREE.MeshStandardMaterialParameters = {}): THREE.MeshStandardMaterial {
    const key = `${color}_${JSON.stringify(opts)}`;
    if (!this.materials[key]) {
      this.materials[key] = new THREE.MeshStandardMaterial({
        color,
        roughness: opts.roughness ?? 0.6,
        metalness: opts.metalness ?? 0.2,
        transparent: opts.transparent ?? false,
        opacity: opts.opacity ?? 1.0,
        emissive: opts.emissive ?? 0x000000,
        emissiveIntensity: opts.emissiveIntensity ?? 0,
        side: opts.side ?? THREE.FrontSide,
        ...opts,
      });
    }
    return this.materials[key] as THREE.MeshStandardMaterial;
  }

  /**
   * Generates a 3D Mesh Group for a building definition
   */
  public static createBuildingMesh(def: BuildingDefinition, isBlueprint: boolean = false): THREE.Group {
    const group = new THREE.Group();
    group.name = `building_${def.id}`;

    // Custom model if present
    if (def.customModelData) {
      // Placeholder or custom mesh will be handled by custom loader
      const customBox = new THREE.Mesh(
        new THREE.BoxGeometry(def.size[0] * 2, def.height, def.size[1] * 2),
        this.getMaterial(0x38bdf8, { roughness: 0.3, metalness: 0.5 })
      );
      customBox.position.y = def.height / 2;
      group.add(customBox);
      return group;
    }

    switch (def.id) {
      case 'res_small':
        this.buildSmallHouse(group);
        break;
      case 'res_medium':
        this.buildMediumApartment(group);
        break;
      case 'res_luxury':
        this.buildLuxurySkyscraper(group);
        break;
      case 'com_shop':
        this.buildCornerMarket(group);
        break;
      case 'com_mall':
        this.buildShoppingPlaza(group);
        break;
      case 'com_office':
        this.buildCorporateHQ(group);
        break;
      case 'infra_road':
        this.buildRoad(group);
        break;
      case 'infra_bridge':
        this.buildBridge(group);
        break;
      case 'infra_power':
        this.buildPowerPlant(group);
        break;
      case 'infra_water':
        this.buildWaterTower(group);
        break;
      case 'infra_hospital':
        this.buildHospital(group);
        break;
      case 'infra_police':
        this.buildPoliceStation(group);
        break;
      case 'infra_fire':
        this.buildFireStation(group);
        break;
      case 'def_wall':
        this.buildReinforcedWall(group);
        break;
      case 'def_bunker':
        this.buildBunker(group);
        break;
      case 'def_turret':
        this.buildLaserTurret(group);
        break;
      case 'def_barrier':
        this.buildForcefieldGenerator(group);
        break;
      case 'mon_kingdom_house':
        this.buildKingdomHouse(group);
        break;
      case 'mon_lighthouse':
        this.buildLighthouseMonument(group);
        break;
      case 'mon_statue':
        this.buildGoldenStatue(group);
        break;
      case 'mon_park':
        this.buildZenPark(group);
        break;
      case 'workshop_wood':
        this.buildWorkshopWood(group);
        break;
      case 'workshop_steel':
        this.buildWorkshopSteel(group);
        break;
      case 'workshop_concrete':
        this.buildWorkshopConcrete(group);
        break;
      default:
        this.buildGenericBuilding(group, def);
        break;
    }

    // Apply shadow properties and blueprint transparency if needed
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (isBlueprint) {
          child.material = new THREE.MeshStandardMaterial({
            color: 0x22c55e,
            transparent: true,
            opacity: 0.6,
            wireframe: false,
          });
        } else {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      }
    });

    return group;
  }

  /**
   * Generates scaffolding & crane construction site for progress 0-99%
   */
  public static createConstructionSite(def: BuildingDefinition, progress: number): THREE.Group {
    const group = new THREE.Group();
    group.name = 'construction_site';

    const width = def.size[0] * 2;
    const depth = def.size[1] * 2;
    const isCitadel = def.id === 'mon_kingdom_house';
    const currentHeight = Math.max(0.6, (def.height * progress) / 100);

    // Foundation concrete slab
    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.4, depth),
      this.getMaterial(0x94a3b8, { roughness: 0.9 })
    );
    slab.position.y = 0.2;
    slab.castShadow = true;
    slab.receiveShadow = true;
    group.add(slab);

    // Partial building stone/concrete core (growing with progress)
    const core = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.88, currentHeight, depth * 0.88),
      this.getMaterial(isCitadel ? 0x475569 : 0x64748b, { roughness: 0.75 })
    );
    core.position.y = currentHeight / 2 + 0.3;
    core.castShadow = true;
    group.add(core);

    // Scaffolding cage
    const scaffoldMat = this.getMaterial(0xeab308, { metalness: 0.8, roughness: 0.4 });
    const poleRadius = 0.08;
    const corners = [
      [-width / 2, -depth / 2],
      [width / 2, -depth / 2],
      [width / 2, depth / 2],
      [-width / 2, depth / 2],
    ];

    corners.forEach(([cx, cz]) => {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(poleRadius, poleRadius, currentHeight + 1.4, 6),
        scaffoldMat
      );
      pole.position.set(cx, (currentHeight + 1.4) / 2, cz);
      group.add(pole);
    });

    // Horizontal scaffolding crossbars
    const levels = Math.max(1, Math.floor(currentHeight / 1.5));
    for (let l = 1; l <= levels; l++) {
      const y = l * 1.5;
      const bar1 = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, 0.08), scaffoldMat);
      bar1.position.set(0, y, -depth / 2);
      group.add(bar1);

      const bar2 = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, 0.08), scaffoldMat);
      bar2.position.set(0, y, depth / 2);
      group.add(bar2);

      const bar3 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, depth), scaffoldMat);
      bar3.position.set(-width / 2, y, 0);
      group.add(bar3);

      const bar4 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, depth), scaffoldMat);
      bar4.position.set(width / 2, y, 0);
      group.add(bar4);
    }

    // Special Citadel Foundation structures
    if (isCitadel) {
      // 4 Watchtower circular base piers at corners
      const towerBaseMat = this.getMaterial(0x334155, { roughness: 0.8 });
      const towerCorners = [
        [-width / 2 + 0.8, -depth / 2 + 0.8],
        [width / 2 - 0.8, -depth / 2 + 0.8],
        [width / 2 - 0.8, depth / 2 - 0.8],
        [-width / 2 + 0.8, depth / 2 - 0.8],
      ];

      towerCorners.forEach(([tx, tz]) => {
        const towerPier = new THREE.Mesh(
          new THREE.CylinderGeometry(0.9, 1.0, currentHeight * 0.95 + 0.4, 12),
          towerBaseMat
        );
        towerPier.position.set(tx, (currentHeight * 0.95 + 0.4) / 2 + 0.2, tz);
        towerPier.castShadow = true;
        group.add(towerPier);
      });

      // Front Gateway Scaffolding Arch
      const archMat = this.getMaterial(0xf59e0b, { roughness: 0.5, metalness: 0.4 });
      const archPoleL = new THREE.Mesh(new THREE.BoxGeometry(0.2, currentHeight + 0.8, 0.2), archMat);
      archPoleL.position.set(-1.4, (currentHeight + 0.8) / 2, depth / 2 + 0.1);
      group.add(archPoleL);

      const archPoleR = new THREE.Mesh(new THREE.BoxGeometry(0.2, currentHeight + 0.8, 0.2), archMat);
      archPoleR.position.set(1.4, (currentHeight + 0.8) / 2, depth / 2 + 0.1);
      group.add(archPoleR);

      const archLintel = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.25, 0.25), archMat);
      archLintel.position.set(0, currentHeight + 0.7, depth / 2 + 0.1);
      group.add(archLintel);

      // Depository Hopper Foundation Layout
      const hopperFoundation = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.3, 1.6),
        this.getMaterial(0x1e293b, { roughness: 0.6 })
      );
      hopperFoundation.position.set(0, 0.35, 3.3);
      group.add(hopperFoundation);
    }

    // Construction Tower Crane
    const craneHeight = def.height + 3.5;
    const craneTower = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, craneHeight, 0.5),
      this.getMaterial(0xf59e0b, { metalness: 0.9 })
    );
    craneTower.position.set(width / 2 + 0.6, craneHeight / 2, depth / 2 + 0.6);
    craneTower.castShadow = true;
    group.add(craneTower);

    // Flashing safety beacon on top of crane
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 8, 8),
      this.getMaterial(0xf59e0b, { emissive: 0xff3300, emissiveIntensity: 2.5 })
    );
    beacon.position.set(width / 2 + 0.6, craneHeight + 0.25, depth / 2 + 0.6);
    group.add(beacon);

    // Crane Jib (horizontal arm)
    const jib = new THREE.Mesh(
      new THREE.BoxGeometry(width + 2, 0.3, 0.3),
      this.getMaterial(0xf59e0b, { metalness: 0.9 })
    );
    jib.position.set(width / 2 - 0.5, craneHeight, depth / 2 + 0.6);
    group.add(jib);

    // Crane cable & hook
    const cable = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 1.5, 4),
      this.getMaterial(0x1e293b, { metalness: 0.9 })
    );
    cable.position.set(width / 2 - 1.2, craneHeight - 0.75, depth / 2 + 0.6);
    group.add(cable);

    return group;
  }

  // --- Specific Building Builders ---

  private static buildSmallHouse(group: THREE.Group) {
    // Base walls
    const walls = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 2.2, 3.2),
      this.getMaterial(0xfde68a, { roughness: 0.8 })
    );
    walls.position.y = 1.1;
    group.add(walls);

    // Roof (Pyramid / Prism)
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(2.7, 1.6, 4),
      this.getMaterial(0xb91c1c, { roughness: 0.6 })
    );
    roof.position.y = 2.2 + 0.8;
    roof.rotation.y = Math.PI / 4;
    group.add(roof);

    // Chimney
    const chimney = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 1.2, 0.4),
      this.getMaterial(0x78716c, { roughness: 0.9 })
    );
    chimney.position.set(0.8, 3.2, -0.6);
    group.add(chimney);

    // Door
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 1.2, 0.1),
      this.getMaterial(0x78350f, { roughness: 0.7 })
    );
    door.position.set(0, 0.6, 1.62);
    group.add(door);

    // Windows (Glowing warm light)
    const winMat = this.getMaterial(0x38bdf8, {
      emissive: 0x0284c7,
      emissiveIntensity: 0.3,
      roughness: 0.1,
    });
    const win1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.08), winMat);
    win1.position.set(0.9, 1.4, 1.62);
    group.add(win1);

    const win2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.08), winMat);
    win2.position.set(-0.9, 1.4, 1.62);
    group.add(win2);
  }

  private static buildMediumApartment(group: THREE.Group) {
    const floors = 4;
    const floorHeight = 1.6;
    const width = 4.8;
    const depth = 4.8;

    // Main concrete frame
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(width, floors * floorHeight, depth),
      this.getMaterial(0xe2e8f0, { roughness: 0.6 })
    );
    body.position.y = (floors * floorHeight) / 2;
    group.add(body);

    // Modern glass windows & balconies
    const winMat = this.getMaterial(0x0284c7, {
      metalness: 0.7,
      roughness: 0.1,
      emissive: 0x0369a1,
      emissiveIntensity: 0.2,
    });

    for (let f = 0; f < floors; f++) {
      const y = f * floorHeight + 0.8;
      // Front window strip
      const winFront = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.8, 0.1), winMat);
      winFront.position.set(0, y, depth / 2 + 0.02);
      group.add(winFront);

      // Balcony ledge
      const balcony = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.15, 0.8),
        this.getMaterial(0x475569)
      );
      balcony.position.set(0, y - 0.4, depth / 2 + 0.4);
      group.add(balcony);
    }

    // Rooftop AC and garden features
    const ac = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.8, 1.2),
      this.getMaterial(0x94a3b8, { metalness: 0.8 })
    );
    ac.position.set(1.2, floors * floorHeight + 0.4, -1.2);
    group.add(ac);
  }

  private static buildLuxurySkyscraper(group: THREE.Group) {
    const height = 14;
    const width = 5.2;
    const depth = 5.2;

    // Glass tower
    const tower = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      this.getMaterial(0x0f172a, {
        roughness: 0.2,
        metalness: 0.8,
        emissive: 0x1e293b,
        emissiveIntensity: 0.2,
      })
    );
    tower.position.y = height / 2;
    group.add(tower);

    // Glowing Neon Vertical Edge Strips
    const neonMat = this.getMaterial(0x38bdf8, {
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.8,
    });
    const strip1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, height, 0.1), neonMat);
    strip1.position.set(width / 2, height / 2, depth / 2);
    group.add(strip1);

    const strip2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, height, 0.1), neonMat);
    strip2.position.set(-width / 2, height / 2, depth / 2);
    group.add(strip2);

    // Rooftop Penthouse & Swimming Pool
    const pool = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.2, 2.4),
      this.getMaterial(0x06b6d4, {
        transparent: true,
        opacity: 0.8,
        roughness: 0.1,
        emissive: 0x0891b2,
        emissiveIntensity: 0.4,
      })
    );
    pool.position.set(1.0, height + 0.1, 1.0);
    group.add(pool);

    // Helipad circle
    const helipad = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 0.1, 16),
      this.getMaterial(0x334155, { roughness: 0.5 })
    );
    helipad.position.set(-1.2, height + 0.1, -1.2);
    group.add(helipad);
  }

  private static buildCornerMarket(group: THREE.Group) {
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 2.6, 3.4),
      this.getMaterial(0xfef08a, { roughness: 0.7 })
    );
    body.position.y = 1.3;
    group.add(body);

    // Striped Awning (Red & White)
    const awning = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.2, 1.2),
      this.getMaterial(0xef4444, { roughness: 0.4 })
    );
    awning.position.set(0, 2.2, 1.8);
    awning.rotation.x = 0.2;
    group.add(awning);

    // Display glass windows
    const display = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 1.4, 0.1),
      this.getMaterial(0x38bdf8, { roughness: 0.1, emissive: 0x0284c7, emissiveIntensity: 0.3 })
    );
    display.position.set(0, 1.0, 1.72);
    group.add(display);
  }

  private static buildShoppingPlaza(group: THREE.Group) {
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(7.2, 4.2, 7.2),
      this.getMaterial(0xf1f5f9, { roughness: 0.4 })
    );
    base.position.y = 2.1;
    group.add(base);

    // Glass Atrium Dome
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(2.2, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
      this.getMaterial(0x38bdf8, {
        transparent: true,
        opacity: 0.7,
        roughness: 0.1,
        metalness: 0.8,
      })
    );
    dome.position.set(0, 4.2, 0);
    group.add(dome);

    // Billboard / Mall Sign
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 1.2, 0.2),
      this.getMaterial(0xf43f5e, { emissive: 0xe11d48, emissiveIntensity: 0.5 })
    );
    sign.position.set(0, 3.2, 3.65);
    group.add(sign);
  }

  private static buildCorporateHQ(group: THREE.Group) {
    const height = 18;
    // Lower tier
    const lower = new THREE.Mesh(
      new THREE.BoxGeometry(6.8, 10, 6.8),
      this.getMaterial(0x1e293b, { metalness: 0.8, roughness: 0.2 })
    );
    lower.position.y = 5;
    group.add(lower);

    // Upper tier (step setback)
    const upper = new THREE.Mesh(
      new THREE.BoxGeometry(5.0, 8, 5.0),
      this.getMaterial(0x0f172a, { metalness: 0.9, roughness: 0.1 })
    );
    upper.position.y = 10 + 4;
    group.add(upper);

    // Roof Antenna / Spire
    const spire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.2, 4.0, 8),
      this.getMaterial(0xe2e8f0, { metalness: 1.0 })
    );
    spire.position.set(0, 18 + 2.0, 0);
    group.add(spire);

    // Flashing red aircraft warning light
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 8, 8),
      this.getMaterial(0xef4444, { emissive: 0xff0000, emissiveIntensity: 1.5 })
    );
    beacon.position.set(0, 22.0, 0);
    group.add(beacon);
  }

  private static buildRoad(group: THREE.Group) {
    const road = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.08, 2.0),
      this.getMaterial(0x1e293b, { roughness: 0.9 })
    );
    road.position.y = 0.04;
    group.add(road);

    // Yellow center divider line
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.09, 1.4),
      this.getMaterial(0xeab308, { roughness: 0.6 })
    );
    line.position.set(0, 0.05, 0);
    group.add(line);
  }

  private static buildBridge(group: THREE.Group) {
    const roadDeck = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.3, 7.6),
      this.getMaterial(0x475569, { roughness: 0.8 })
    );
    roadDeck.position.y = 1.0;
    group.add(roadDeck);

    // Suspension Towers
    const towerMat = this.getMaterial(0xef4444, { metalness: 0.5 });
    const tower1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.5, 0.4), towerMat);
    tower1.position.set(-1.7, 2.25, 0);
    group.add(tower1);

    const tower2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.5, 0.4), towerMat);
    tower2.position.set(1.7, 2.25, 0);
    group.add(tower2);

    // Crossbeam
    const crossbeam = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.3, 0.4), towerMat);
    crossbeam.position.set(0, 4.2, 0);
    group.add(crossbeam);
  }

  private static buildPowerPlant(group: THREE.Group) {
    // Cooling Tower
    const tower = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 2.4, 6.0, 16, 1, true),
      this.getMaterial(0x94a3b8, { roughness: 0.9, side: THREE.DoubleSide })
    );
    tower.position.set(-1.4, 3.0, -1.2);
    group.add(tower);

    // Solar panels array
    const solarMat = this.getMaterial(0x1d4ed8, { metalness: 0.9, roughness: 0.2 });
    for (let i = 0; i < 3; i++) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 1.2), solarMat);
      panel.position.set(1.4, 0.6, -1.8 + i * 1.6);
      panel.rotation.x = -0.3;
      group.add(panel);
    }
  }

  private static buildWaterTower(group: THREE.Group) {
    // 4 Steel Legs
    const legMat = this.getMaterial(0x64748b, { metalness: 0.8 });
    const legRadius = 0.1;
    const positions = [
      [-1.0, -1.0],
      [1.0, -1.0],
      [1.0, 1.0],
      [-1.0, 1.0],
    ];

    positions.forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(legRadius, legRadius, 6.5, 6),
        legMat
      );
      leg.position.set(lx, 3.25, lz);
      group.add(leg);
    });

    // Central Pipe
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 6.5, 8),
      this.getMaterial(0x0284c7, { metalness: 0.6 })
    );
    pipe.position.set(0, 3.25, 0);
    group.add(pipe);

    // Water Sphere/Tank
    const tank = new THREE.Mesh(
      new THREE.SphereGeometry(2.0, 16, 16),
      this.getMaterial(0x38bdf8, { metalness: 0.6, roughness: 0.3 })
    );
    tank.position.set(0, 7.5, 0);
    group.add(tank);
  }

  private static buildHospital(group: THREE.Group) {
    // Main building
    const main = new THREE.Mesh(
      new THREE.BoxGeometry(5.2, 4.5, 5.2),
      this.getMaterial(0xf8fafc, { roughness: 0.5 })
    );
    main.position.y = 2.25;
    group.add(main);

    // Red Cross on Front
    const crossMat = this.getMaterial(0xef4444, { emissive: 0xdc2626, emissiveIntensity: 0.3 });
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 0.1), crossMat);
    crossH.position.set(0, 3.2, 2.65);
    group.add(crossH);

    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.6, 0.1), crossMat);
    crossV.position.set(0, 3.2, 2.65);
    group.add(crossV);

    // Emergency Entrance Canopy
    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.15, 1.4),
      this.getMaterial(0x0ea5e9)
    );
    canopy.position.set(0, 1.2, 3.2);
    group.add(canopy);
  }

  private static buildPoliceStation(group: THREE.Group) {
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(5.0, 4.0, 5.0),
      this.getMaterial(0x334155, { roughness: 0.6 })
    );
    base.position.y = 2.0;
    group.add(base);

    // Blue accent facade
    const accent = new THREE.Mesh(
      new THREE.BoxGeometry(5.1, 0.6, 5.1),
      this.getMaterial(0x2563eb, { emissive: 0x1d4ed8, emissiveIntensity: 0.4 })
    );
    accent.position.y = 3.2;
    group.add(accent);

    // Police Siren Light bar on roof
    const siren = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.3, 0.4),
      this.getMaterial(0x3b82f6, { emissive: 0x60a5fa, emissiveIntensity: 1.0 })
    );
    siren.position.set(0, 4.2, 0);
    group.add(siren);
  }

  private static buildFireStation(group: THREE.Group) {
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(5.2, 4.2, 5.2),
      this.getMaterial(0x991b1b, { roughness: 0.7 })
    );
    base.position.y = 2.1;
    group.add(base);

    // 2 Garage Roll-up Bay doors
    const doorMat = this.getMaterial(0xf1f5f9, { metalness: 0.5 });
    const bay1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 0.1), doorMat);
    bay1.position.set(-1.2, 1.1, 2.65);
    group.add(bay1);

    const bay2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 0.1), doorMat);
    bay2.position.set(1.2, 1.1, 2.65);
    group.add(bay2);

    // Hose drying tower
    const hoseTower = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 6.0, 1.4),
      this.getMaterial(0x7f1d1d)
    );
    hoseTower.position.set(-1.8, 3.0, -1.8);
    group.add(hoseTower);
  }

  private static buildReinforcedWall(group: THREE.Group) {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 2.8, 3.6),
      this.getMaterial(0x475569, { roughness: 0.9 })
    );
    wall.position.y = 1.4;
    group.add(wall);

    // Yellow hazard warning stripe
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(1.65, 0.3, 3.65),
      this.getMaterial(0xeab308, { roughness: 0.5 })
    );
    stripe.position.set(0, 1.8, 0);
    group.add(stripe);
  }

  private static buildBunker(group: THREE.Group) {
    const bunker = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 2.4, 2.0, 8),
      this.getMaterial(0x334155, { roughness: 0.8, metalness: 0.4 })
    );
    bunker.position.y = 1.0;
    group.add(bunker);

    // Heavy blast door
    const blastDoor = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.2, 0.2),
      this.getMaterial(0xf59e0b, { metalness: 0.9 })
    );
    blastDoor.position.set(0, 0.7, 2.0);
    group.add(blastDoor);
  }

  private static buildLaserTurret(group: THREE.Group) {
    // Pedestal base
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.6, 1.2, 12),
      this.getMaterial(0x1e293b, { metalness: 0.8 })
    );
    base.position.y = 0.6;
    group.add(base);

    // Swivel Turret Head
    const headGroup = new THREE.Group();
    headGroup.name = 'turret_head';
    headGroup.position.y = 1.6;

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 12, 12),
      this.getMaterial(0x0284c7, { metalness: 0.8, roughness: 0.3 })
    );
    headGroup.add(dome);

    // Dual laser cannons
    const barrelMat = this.getMaterial(0x38bdf8, {
      metalness: 0.9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.5,
    });
    const barrel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.4, 8), barrelMat);
    barrel1.rotation.x = Math.PI / 2;
    barrel1.position.set(-0.35, 0.1, 0.8);
    headGroup.add(barrel1);

    const barrel2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.4, 8), barrelMat);
    barrel2.rotation.x = Math.PI / 2;
    barrel2.position.set(0.35, 0.1, 0.8);
    headGroup.add(barrel2);

    group.add(headGroup);
  }

  private static buildForcefieldGenerator(group: THREE.Group) {
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.8, 1.0, 8),
      this.getMaterial(0x1e1b4b, { metalness: 0.9 })
    );
    base.position.y = 0.5;
    group.add(base);

    // Central Plasma Crystal
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.0),
      this.getMaterial(0xa855f7, {
        emissive: 0x9333ea,
        emissiveIntensity: 1.0,
        roughness: 0.1,
      })
    );
    crystal.name = 'forcefield_crystal';
    crystal.position.y = 2.4;
    group.add(crystal);

    // 4 Emitter Pylons
    const pylonMat = this.getMaterial(0x6366f1, { metalness: 0.8 });
    const angles = [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2];
    angles.forEach((ang) => {
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.2, 0.3), pylonMat);
      pylon.position.set(Math.cos(ang) * 1.5, 1.6, Math.sin(ang) * 1.5);
      group.add(pylon);
    });
  }

  private static buildLighthouseMonument(group: THREE.Group) {
    // Grand Foundation / Bridge Arch
    const foundation = new THREE.Mesh(
      new THREE.CylinderGeometry(3.6, 4.4, 2.0, 16),
      this.getMaterial(0x1e293b, { roughness: 0.8, metalness: 0.3 })
    );
    foundation.position.y = 1.0;
    group.add(foundation);

    // Main Lighthouse Tower (White & Crimson bands)
    const tower = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 2.8, 14.0, 16),
      this.getMaterial(0xf8fafc, { roughness: 0.4 })
    );
    tower.position.y = 9.0;
    group.add(tower);

    // Crimson Stripe Band
    const redBand = new THREE.Mesh(
      new THREE.CylinderGeometry(2.1, 2.3, 3.0, 16),
      this.getMaterial(0xdc2626, { roughness: 0.5 })
    );
    redBand.position.y = 8.5;
    group.add(redBand);

    // Observation Deck Balcony
    const deck = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.4, 0.5, 16),
      this.getMaterial(0x0f172a, { metalness: 0.8 })
    );
    deck.position.y = 16.25;
    group.add(deck);

    // Glass Lantern Room
    const lanternRoom = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 1.8, 2.2, 16),
      this.getMaterial(0x38bdf8, {
        transparent: true,
        opacity: 0.7,
        emissive: 0xfef08a,
        emissiveIntensity: 0.9,
      })
    );
    lanternRoom.position.y = 17.6;
    group.add(lanternRoom);

    // Rotating Searchlight Beam Assembly
    const beamGroup = new THREE.Group();
    beamGroup.name = 'lighthouse_beam';
    beamGroup.position.y = 17.6;

    // Glowing Light Bulb
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 12, 12),
      this.getMaterial(0xfef08a, {
        emissive: 0xfacc15,
        emissiveIntensity: 2.0,
      })
    );
    beamGroup.add(bulb);

    // Volumetric Cone of Light
    const coneGeom = new THREE.ConeGeometry(8.0, 32.0, 24, 1, true);
    coneGeom.rotateX(-Math.PI / 2);
    coneGeom.translate(0, 0, 16.0);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const lightCone = new THREE.Mesh(coneGeom, coneMat);
    beamGroup.add(lightCone);

    group.add(beamGroup);

    // Copper Domed Roof
    const roof = new THREE.Mesh(
      new THREE.SphereGeometry(1.9, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
      this.getMaterial(0x0d9488, { metalness: 0.6 })
    );
    roof.position.y = 18.7;
    group.add(roof);

    // Gold Plaque: "LIGHTHOUSE 橋"
    const plaque = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.8, 0.2),
      this.getMaterial(0xf59e0b, { metalness: 0.9, roughness: 0.2 })
    );
    plaque.position.set(0, 3.2, 3.2);
    group.add(plaque);
  }

  /**
   * The Grand Kingdom House & Central Resource Depository (Sovereign Citadel)
   */
  private static buildKingdomHouse(group: THREE.Group) {
    // --- Architectural Materials ---
    const stoneDarkSlate = this.getMaterial(0x1e293b, { roughness: 0.85, metalness: 0.2 });
    const stoneCastleWall = this.getMaterial(0x475569, { roughness: 0.8 });
    const stoneTrim = this.getMaterial(0x64748b, { roughness: 0.7 });
    const stoneCrenel = this.getMaterial(0x334155, { roughness: 0.75 });
    const royalBlueSlate = this.getMaterial(0x1e3a8a, { roughness: 0.45, metalness: 0.25 });
    const royalSapphireAccent = this.getMaterial(0x2563eb, { roughness: 0.35, metalness: 0.3 });
    const royalGoldTrim = this.getMaterial(0xf59e0b, { metalness: 0.9, roughness: 0.2 });
    const royalGoldBright = this.getMaterial(0xfbbf24, {
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0xd97706,
      emissiveIntensity: 0.4,
    });
    const royalCrimson = this.getMaterial(0x991b1b, { roughness: 0.5 });
    const stainedGlassWarm = this.getMaterial(0xf59e0b, {
      emissive: 0xf59e0b,
      emissiveIntensity: 0.95,
      transparent: true,
      opacity: 0.9,
    });
    const stainedGlassRose = this.getMaterial(0x38bdf8, {
      emissive: 0x0284c7,
      emissiveIntensity: 0.85,
      transparent: true,
      opacity: 0.9,
    });
    const ironPortcullis = this.getMaterial(0x0f172a, { metalness: 0.9, roughness: 0.3 });
    const woodOakDoor = this.getMaterial(0x78350f, { roughness: 0.85 });
    const torchFire = this.getMaterial(0xf97316, {
      emissive: 0xff5500,
      emissiveIntensity: 2.2,
      roughness: 0.2,
    });

    // ==========================================
    // 1. PLINTH & COURTYARD FORTRESS FOUNDATION
    // ==========================================
    // Lower stepped foundation plinth
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.4, 8.4), stoneDarkSlate);
    plinth.position.y = 0.2;
    group.add(plinth);

    // Main flagstone courtyard terrace
    const terrace = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.3, 8.0), stoneCastleWall);
    terrace.position.y = 0.45;
    group.add(terrace);

    // Grand entrance stone staircase leading to the gate
    for (let step = 0; step < 3; step++) {
      const stepMesh = new THREE.Mesh(
        new THREE.BoxGeometry(3.0 - step * 0.3, 0.12, 0.4),
        stoneTrim
      );
      stepMesh.position.set(0, 0.36 - step * 0.1, 4.1 + step * 0.35);
      group.add(stepMesh);
    }

    // ==========================================
    // 2. DEFENSIVE CURTAIN WALLS & BATTLEMENTS
    // ==========================================
    // West Curtain Wall (between NW and SW towers)
    const wallW = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.4, 4.2), stoneCastleWall);
    wallW.position.set(-3.2, 1.6, 0);
    group.add(wallW);

    // East Curtain Wall (between NE and SE towers)
    const wallE = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.4, 4.2), stoneCastleWall);
    wallE.position.set(3.2, 1.6, 0);
    group.add(wallE);

    // North Rear Wall (between NW and NE towers)
    const wallN = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.4, 0.7), stoneCastleWall);
    wallN.position.set(0, 1.6, -3.2);
    group.add(wallN);

    // South Front Walls (flanking the Gatehouse Barbican)
    const wallFrontL = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.0, 0.7), stoneCastleWall);
    wallFrontL.position.set(-2.2, 1.4, 3.2);
    group.add(wallFrontL);

    const wallFrontR = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.0, 0.7), stoneCastleWall);
    wallFrontR.position.set(2.2, 1.4, 3.2);
    group.add(wallFrontR);

    // Curtain wall crenellations (merlons)
    [-2.6, -1.8, 1.8, 2.6].forEach((xPos) => {
      const cren = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.5), stoneCrenel);
      cren.position.set(xPos, 2.6, 3.3);
      group.add(cren);
    });

    [-1.6, -0.8, 0, 0.8, 1.6].forEach((zPos) => {
      const crenW = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.5), stoneCrenel);
      crenW.position.set(-3.3, 2.9, zPos);
      group.add(crenW);

      const crenE = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.5), stoneCrenel);
      crenE.position.set(3.3, 2.9, zPos);
      group.add(crenE);
    });

    // ==========================================
    // 3. FOUR GRAND CORNER BASTION TOWERS
    // ==========================================
    const towerCoords = [
      { x: -3.2, z: -3.2, flagAng: -0.6 },
      { x: 3.2, z: -3.2, flagAng: 0.6 },
      { x: -3.2, z: 3.2, flagAng: -0.3 },
      { x: 3.2, z: 3.2, flagAng: 0.3 },
    ];

    towerCoords.forEach((tc) => {
      // Main stone tower column
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.45, 9.0, 12), stoneCastleWall);
      tower.position.set(tc.x, 4.7, tc.z);
      group.add(tower);

      // Machicolation corbelled overhang gallery
      const corbel = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.2, 0.7, 12), stoneTrim);
      corbel.position.set(tc.x, 9.4, tc.z);
      group.add(corbel);

      // Tower top battlements (merlons around rim)
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.5, 0.35), stoneCrenel);
        merlon.position.set(tc.x + Math.cos(ang) * 1.4, 10.0, tc.z + Math.sin(ang) * 1.4);
        group.add(merlon);
      }

      // Steep Conical Royal Blue Slate Roof
      const tRoof = new THREE.Mesh(new THREE.ConeGeometry(1.65, 3.4, 12), royalBlueSlate);
      tRoof.position.set(tc.x, 11.5, tc.z);
      group.add(tRoof);

      // Gold Eave Ring Trim
      const eaveRing = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.08, 6, 16), royalGoldTrim);
      eaveRing.rotation.x = Math.PI / 2;
      eaveRing.position.set(tc.x, 9.8, tc.z);
      group.add(eaveRing);

      // Gold Pinnacle Spear & Finial Ball
      const spear = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.15, 1.4, 8), royalGoldTrim);
      spear.position.set(tc.x, 13.6, tc.z);
      group.add(spear);

      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), royalGoldBright);
      ball.position.set(tc.x, 14.3, tc.z);
      group.add(ball);

      // Dark Arrow Slits on Tower Faces
      const slit = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.2, 0.3), stoneDarkSlate);
      slit.position.set(tc.x + (tc.x > 0 ? 1.25 : -1.25), 5.5, tc.z + (tc.z > 0 ? 0.4 : -0.4));
      group.add(slit);

      // Heraldic Royal Crimson Shield on outer face
      const shield = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.85, 0.1), royalCrimson);
      shield.position.set(tc.x + (tc.x > 0 ? 1.3 : -1.3), 6.8, tc.z);
      shield.rotation.y = tc.x > 0 ? Math.PI / 2 : -Math.PI / 2;
      group.add(shield);

      const shieldTrim = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.12, 0.12), royalGoldTrim);
      shieldTrim.position.set(shield.position.x, shield.position.y + 0.35, shield.position.z);
      shieldTrim.rotation.y = shield.rotation.y;
      group.add(shieldTrim);
    });

    // ==========================================
    // 4. THE COLOSSAL ROYAL CITADEL KEEP
    // ==========================================
    // Tier 1: Great Hall Base Keep
    const keepBase = new THREE.Mesh(new THREE.BoxGeometry(5.4, 5.6, 5.4), stoneCastleWall);
    keepBase.position.set(0, 3.2, -0.5);
    group.add(keepBase);

    // Keep Stone Buttresses
    const buttressL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 4.8, 0.6), stoneTrim);
    buttressL.position.set(-2.5, 2.8, 2.0);
    group.add(buttressL);

    const buttressR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 4.8, 0.6), stoneTrim);
    buttressR.position.set(2.5, 2.8, 2.0);
    group.add(buttressR);

    // Tier 2: Royal Throne Hall Keep
    const keepMid = new THREE.Mesh(new THREE.BoxGeometry(4.6, 4.6, 4.6), stoneCastleWall);
    keepMid.position.set(0, 8.0, -0.5);
    group.add(keepMid);

    // Keep Middle Battlements (Crenellations)
    for (let bx = -2.0; bx <= 2.0; bx += 0.8) {
      const crenF = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.4), stoneCrenel);
      crenF.position.set(bx, 10.5, 1.7);
      group.add(crenF);

      const crenB = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.4), stoneCrenel);
      crenB.position.set(bx, 10.5, -2.7);
      group.add(crenB);
    }

    // Tier 3: Upper Citadel Astronomical Sanctuary
    const keepTop = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.4, 3.6), stoneTrim);
    keepTop.position.set(0, 11.8, -0.5);
    group.add(keepTop);

    // Steep Royal Blue Roof over Keep
    const keepRoof = new THREE.Mesh(new THREE.ConeGeometry(3.2, 3.4, 4), royalBlueSlate);
    keepRoof.rotation.y = Math.PI / 4;
    keepRoof.position.set(0, 14.5, -0.5);
    group.add(keepRoof);

    // Gold Eaves Ridge on Keep Roof
    const roofRidge = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.15, 0.15), royalGoldTrim);
    roofRidge.position.set(0, 13.0, -0.5);
    group.add(roofRidge);

    // --- Gothic Arched Stained Glass Windows ---
    // Front Great Hall Window (glowing warm interior light)
    const winFront = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.2, 0.15), stainedGlassWarm);
    winFront.position.set(0, 4.2, 2.22);
    group.add(winFront);

    // Front Window Gothic Arch Cap
    const winArch = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.15, 8, 1, false, 0, Math.PI), stoneTrim);
    winArch.rotation.z = Math.PI / 2;
    winArch.position.set(0, 5.3, 2.22);
    group.add(winArch);

    // Side Stained Glass Windows
    const winWest = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.8, 0.8), stainedGlassWarm);
    winWest.position.set(-2.72, 4.0, -0.5);
    group.add(winWest);

    const winEast = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.8, 0.8), stainedGlassWarm);
    winEast.position.set(2.72, 4.0, -0.5);
    group.add(winEast);

    // Upper Grand Rose Window (circular stained glass with radiant glow)
    const roseWindow = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.15, 16), stainedGlassRose);
    roseWindow.rotation.x = Math.PI / 2;
    roseWindow.position.set(0, 12.0, 1.32);
    group.add(roseWindow);

    const roseTrim = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.08, 6, 20), royalGoldTrim);
    roseTrim.position.set(0, 12.0, 1.35);
    group.add(roseTrim);

    // ==========================================
    // 5. CENTRAL CELESTIAL SPIRE & ROYAL CROWN
    // ==========================================
    // Soaring Central Octagonal Spire Column
    const spireColumn = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.2, 4.4, 8), stoneTrim);
    spireColumn.position.set(0, 15.6, -0.5);
    group.add(spireColumn);

    // Conical Spire Roof in Royal Sapphire
    const spireRoof = new THREE.Mesh(new THREE.ConeGeometry(1.3, 3.2, 8), royalSapphireAccent);
    spireRoof.position.set(0, 19.0, -0.5);
    group.add(spireRoof);

    // Golden Spire Pinnacle Mast
    const crownPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 2.2, 8), royalGoldTrim);
    crownPillar.position.set(0, 21.2, -0.5);
    group.add(crownPillar);

    // Golden Royal Crown Base
    const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.55, 0.6, 8), royalGoldBright);
    crownBase.position.set(0, 22.0, -0.5);
    group.add(crownBase);

    // 8 Crown Fleur-de-lis Spikes
    for (let c = 0; c < 8; c++) {
      const cAng = (c / 8) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 4), royalGoldBright);
      spike.position.set(Math.cos(cAng) * 0.7, 22.45, -0.5 + Math.sin(cAng) * 0.7);
      group.add(spike);
    }

    // Radiant Levitating Citadel Star Gem (animated hover & rotation)
    const crownGem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.65),
      this.getMaterial(0xfbbf24, {
        emissive: 0xd97706,
        emissiveIntensity: 2.2,
        metalness: 0.95,
        roughness: 0.1,
      })
    );
    crownGem.name = 'kingdom_crown_spire';
    crownGem.position.set(0, 23.0, -0.5);
    group.add(crownGem);

    // Spinning Gold Astrological Orbit Ring around the gem
    const orbitRing = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.05, 8, 24), royalGoldBright);
    orbitRing.name = 'kingdom_orbit_ring';
    orbitRing.rotation.x = Math.PI / 3;
    orbitRing.position.set(0, 23.0, -0.5);
    group.add(orbitRing);

    // ==========================================
    // 6. GRAND FORTRESS GATEHOUSE & BARBICAN
    // ==========================================
    // Massive Stone Barbican Archway Frame
    const gateFrame = new THREE.Mesh(new THREE.BoxGeometry(2.8, 3.6, 1.2), stoneCastleWall);
    gateFrame.position.set(0, 2.2, 2.6);
    group.add(gateFrame);

    // Portal opening inner void
    const portalVoid = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.6, 1.3), stoneDarkSlate);
    portalVoid.position.set(0, 1.6, 2.6);
    group.add(portalVoid);

    // Heavy Ironbound Oak Double Castle Doors
    const doorL = new THREE.Mesh(new THREE.BoxGeometry(0.78, 2.3, 0.18), woodOakDoor);
    doorL.position.set(-0.4, 1.45, 2.65);
    group.add(doorL);

    const doorR = new THREE.Mesh(new THREE.BoxGeometry(0.78, 2.3, 0.18), woodOakDoor);
    doorR.position.set(0.4, 1.45, 2.65);
    group.add(doorR);

    // Black Iron Hinges & Ring Knocker
    [-0.4, 0.4].forEach((dx) => {
      const hingeTop = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.22), ironPortcullis);
      hingeTop.position.set(dx, 2.1, 2.65);
      group.add(hingeTop);

      const hingeBot = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.22), ironPortcullis);
      hingeBot.position.set(dx, 0.8, 2.65);
      group.add(hingeBot);
    });

    // Raised Iron Portcullis Grille with sharp bottom spikes
    const portcullis = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 0.1), ironPortcullis);
    portcullis.position.set(0, 2.3, 2.9);
    group.add(portcullis);

    for (let p = -0.6; p <= 0.6; p += 0.3) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.25, 4), ironPortcullis);
      spike.rotation.x = Math.PI;
      spike.position.set(p, 1.4, 2.9);
      group.add(spike);
    }

    // Golden Royal Lion Crest above Gate Portal
    const crestShield = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.15, 6), royalGoldTrim);
    crestShield.rotation.x = Math.PI / 2;
    crestShield.position.set(0, 3.5, 3.25);
    group.add(crestShield);

    const crestCrown = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.3, 3), royalGoldBright);
    crestCrown.position.set(0, 4.0, 3.28);
    group.add(crestCrown);

    // Gatehouse Guard Sconce Torches with Flickering Fire
    [-1.55, 1.55].forEach((tx) => {
      // Iron Sconce Bracket
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 0.3), ironPortcullis);
      bracket.position.set(tx, 2.4, 3.1);
      group.add(bracket);

      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.12, 0.2, 6), ironPortcullis);
      bowl.position.set(tx, 2.7, 3.25);
      group.add(bowl);

      // Flickering Flame
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.35, 6), torchFire);
      flame.name = 'kingdom_torch_flame';
      flame.position.set(tx, 2.95, 3.25);
      group.add(flame);
    });

    // Twin Guardian Stone Statues flanking the gate entrance
    [-1.9, 1.9].forEach((gx) => {
      const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.6), stoneTrim);
      pedestal.position.set(gx, 0.65, 3.8);
      group.add(pedestal);

      const statueLion = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.45), stoneCastleWall);
      statueLion.position.set(gx, 1.25, 3.8);
      group.add(statueLion);
    });

    // =======================================================
    // 7. CENTRAL DEPOSITORY HOPPER & GLOWING INTAKE ZONE
    // =======================================================
    // Heavy reinforced hopper base in courtyard
    const hopperBase = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.65, 1.5), stoneDarkSlate);
    hopperBase.position.set(0, 0.6, 3.5);
    group.add(hopperBase);

    // Golden funnel chute (delivery drop point)
    const chute = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.45, 0.8, 8, 1, true),
      this.getMaterial(0xd97706, { metalness: 0.85, roughness: 0.25 })
    );
    chute.name = 'kingdom_depository_hopper';
    chute.position.set(0, 1.15, 3.5);
    group.add(chute);

    const chuteRim = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.08, 6, 16), royalGoldTrim);
    chuteRim.rotation.x = Math.PI / 2;
    chuteRim.position.set(0, 1.55, 3.5);
    group.add(chuteRim);

    // Pulsing Glowing Depository Rune Circle on the Courtyard Ground
    const runeDecal = new THREE.Mesh(
      new THREE.RingGeometry(1.0, 2.2, 32),
      this.getMaterial(0xfbbf24, {
        transparent: true,
        opacity: 0.85,
        emissive: 0xf59e0b,
        emissiveIntensity: 1.3,
        side: THREE.DoubleSide,
      })
    );
    runeDecal.name = 'kingdom_depository_rune';
    runeDecal.rotation.x = -Math.PI / 2;
    runeDecal.position.set(0, 0.32, 4.6);
    group.add(runeDecal);

    // Inner Concentric Rune Ring
    const innerRune = new THREE.Mesh(
      new THREE.RingGeometry(0.3, 0.65, 16),
      this.getMaterial(0xf59e0b, {
        transparent: true,
        opacity: 0.9,
        emissive: 0xd97706,
        emissiveIntensity: 1.5,
        side: THREE.DoubleSide,
      })
    );
    innerRune.rotation.x = -Math.PI / 2;
    innerRune.position.set(0, 0.33, 4.6);
    group.add(innerRune);

    // Ethereal Vertical Pillar of Golden Light (Beacon visible from across the city)
    const beaconGeom = new THREE.CylinderGeometry(0.4, 1.4, 32, 16);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const beacon = new THREE.Mesh(beaconGeom, beaconMat);
    beacon.name = 'kingdom_citadel_beacon';
    beacon.position.set(0, 16.0, 4.6);
    group.add(beacon);

    // ==========================================
    // 8. COURTYARD RESOURCE STOCKPILE VAULTS
    // ==========================================
    // Left Courtyard: Stack of Cut Timber Logs
    const woodLogMat = this.getMaterial(0x92400e, { roughness: 0.9 });
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3 - r; c++) {
        const log = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.8, 8), woodLogMat);
        log.rotation.z = Math.PI / 2;
        log.position.set(-2.0 + c * 0.38 + r * 0.19, 0.55 + r * 0.32, 1.5);
        group.add(log);
      }
    }

    // Right Courtyard: Stack of Polished Steel Ingots
    const steelIngotMat = this.getMaterial(0x94a3b8, { metalness: 0.9, roughness: 0.2 });
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3 - r; c++) {
        const ingot = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.24, 1.2), steelIngotMat);
        ingot.position.set(1.6 + c * 0.48 + r * 0.24, 0.52 + r * 0.26, 1.5);
        group.add(ingot);
      }
    }

    // Rear Courtyard: Concrete & Ashlar Silos
    const siloMat = this.getMaterial(0x64748b, { roughness: 0.65 });
    [-2.1, 2.1].forEach((sx) => {
      const silo = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 4.2, 12), siloMat);
      silo.position.set(sx, 2.35, -1.8);
      group.add(silo);

      const siloCap = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.8, 12), royalBlueSlate);
      siloCap.position.set(sx, 4.7, -1.8);
      group.add(siloCap);
    });

    // Golden Royal Treasure Chest (overflowing in courtyard)
    const chestBase = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.45, 0.5), woodOakDoor);
    chestBase.position.set(-1.4, 0.6, 2.7);
    group.add(chestBase);

    const chestLid = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.76, 8, 1, false, 0, Math.PI), woodOakDoor);
    chestLid.rotation.z = Math.PI / 2;
    chestLid.position.set(-1.4, 0.85, 2.7);
    group.add(chestLid);

    const chestTrim = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.1, 0.52), royalGoldTrim);
    chestTrim.position.set(-1.4, 0.75, 2.7);
    group.add(chestTrim);

    // ==========================================
    // 9. ROYAL HERALDIC BANNERS & FLYING STANDARDS
    // ==========================================
    const bannerPositions = [
      { x: -1.1, y: 2.5, z: 3.25 },
      { x: 1.1, y: 2.5, z: 3.25 },
      { x: -2.3, y: 7.2, z: 1.85 },
      { x: 2.3, y: 7.2, z: 1.85 },
    ];

    bannerPositions.forEach((bp) => {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 3.2, 6),
        this.getMaterial(0x78716c, { metalness: 0.5 })
      );
      pole.position.set(bp.x, bp.y, bp.z);
      group.add(pole);

      const banner = new THREE.Mesh(
        new THREE.PlaneGeometry(0.65, 1.8),
        this.getMaterial(0x991b1b, { side: THREE.DoubleSide, roughness: 0.55 })
      );
      banner.name = 'kingdom_flag_banner';
      banner.position.set(bp.x, bp.y + 0.2, bp.z + 0.05);
      group.add(banner);

      // Gold Lion/Chevron stripe on banner
      const stripe = new THREE.Mesh(
        new THREE.PlaneGeometry(0.65, 0.25),
        this.getMaterial(0xf59e0b, { side: THREE.DoubleSide, metalness: 0.7 })
      );
      stripe.position.set(bp.x, bp.y + 0.5, bp.z + 0.06);
      group.add(stripe);
    });

    // ==========================================
    // 10. GOLDEN 3D CITADEL TITLE BADGE
    // ==========================================
    const plaque = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 0.15), royalGoldTrim);
    plaque.position.set(0, 4.4, 3.28);
    group.add(plaque);

    const plaqueInner = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.44, 0.16), stoneDarkSlate);
    plaqueInner.position.set(0, 4.4, 3.29);
    group.add(plaqueInner);
  }

  private static buildGoldenStatue(group: THREE.Group) {
    const pedestal = new THREE.Mesh(
      new THREE.BoxGeometry(3.0, 2.5, 3.0),
      this.getMaterial(0x1e293b, { roughness: 0.6 })
    );
    pedestal.position.y = 1.25;
    group.add(pedestal);

    // Gold Statue Figure
    const goldMat = this.getMaterial(0xfbbf24, {
      metalness: 0.95,
      roughness: 0.2,
      emissive: 0xb45309,
      emissiveIntensity: 0.2,
    });

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.4, 2.2, 8), goldMat);
    torso.position.y = 3.6;
    group.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 12), goldMat);
    head.position.y = 5.1;
    group.add(head);

    // Raised Torch
    const torchArm = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 2.0, 6), goldMat);
    torchArm.position.set(0.7, 4.4, 0);
    torchArm.rotation.z = -0.4;
    group.add(torchArm);

    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 0.7, 8),
      this.getMaterial(0xf97316, { emissive: 0xea580c, emissiveIntensity: 1.5 })
    );
    flame.position.set(1.1, 5.6, 0);
    group.add(flame);
  }

  private static buildZenPark(group: THREE.Group) {
    // Grass base
    const grass = new THREE.Mesh(
      new THREE.BoxGeometry(5.8, 0.3, 5.8),
      this.getMaterial(0x22c55e, { roughness: 0.9 })
    );
    grass.position.y = 0.15;
    group.add(grass);

    // Pond
    const pond = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 0.1, 16),
      this.getMaterial(0x0284c7, {
        transparent: true,
        opacity: 0.85,
        roughness: 0.1,
      })
    );
    pond.position.set(-0.6, 0.25, -0.6);
    group.add(pond);

    // Cherry Blossom Tree (Pink Canopy)
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.25, 2.0, 6),
      this.getMaterial(0x78350f, { roughness: 0.9 })
    );
    trunk.position.set(1.4, 1.0, 1.2);
    group.add(trunk);

    const foliage = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 8, 8),
      this.getMaterial(0xf472b6, { roughness: 0.8 })
    );
    foliage.position.set(1.4, 2.4, 1.2);
    group.add(foliage);

    // Wooden Bridge
    const bridge = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.2, 0.8),
      this.getMaterial(0xa16207, { roughness: 0.7 })
    );
    bridge.position.set(-0.6, 0.45, -0.6);
    group.add(bridge);
  }

  // --- WORKSHOP 1: TIMBER & LUMBER SAWMILL ---
  private static buildWorkshopWood(group: THREE.Group) {
    // 1. Cobblestone & Timber Foundation
    const foundation = new THREE.Mesh(
      new THREE.BoxGeometry(5.6, 0.35, 5.6),
      this.getMaterial(0x78716c, { roughness: 0.9 })
    );
    foundation.position.y = 0.175;
    group.add(foundation);

    // 2. Main Sawmill Millhouse (Log structure)
    const millhouse = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 2.6, 3.4),
      this.getMaterial(0x92400e, { roughness: 0.8 }) // Rich Cedar Timber
    );
    millhouse.position.set(-0.9, 1.65, 0.6);
    group.add(millhouse);

    // Pitched Cedar Shingle Roof
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(2.8, 1.6, 4),
      this.getMaterial(0x451a03, { roughness: 0.9 }) // Dark rustic roof
    );
    roof.rotation.y = Math.PI / 4;
    roof.position.set(-0.9, 3.7, 0.6);
    group.add(roof);

    // Stone Chimney with Smoke Cap
    const chimney = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 3.4, 0.6),
      this.getMaterial(0x57534e, { roughness: 0.95 })
    );
    chimney.position.set(-2.0, 2.4, 1.8);
    group.add(chimney);

    const chimneyCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.15, 8),
      this.getMaterial(0x292524, { metalness: 0.5 })
    );
    chimneyCap.position.set(-2.0, 4.15, 1.8);
    group.add(chimneyCap);

    // 3. Open-Air Sawing Canopy Area (Supported by posts)
    const postMat = this.getMaterial(0x78350f, { roughness: 0.8 });
    const post1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.4, 6), postMat);
    post1.position.set(1.1, 1.4, -1.8);
    group.add(post1);

    const post2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.4, 6), postMat);
    post2.position.set(2.3, 1.4, -1.8);
    group.add(post2);

    const post3 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.4, 6), postMat);
    post3.position.set(2.3, 1.4, 0.2);
    group.add(post3);

    // Canopy Roof
    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.15, 2.6),
      this.getMaterial(0xa16207, { roughness: 0.7 })
    );
    canopy.position.set(1.7, 2.6, -0.8);
    group.add(canopy);

    // 4. Large Circular Buzzsaw & Workbench
    const sawTable = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.8, 1.8),
      this.getMaterial(0xb45309, { roughness: 0.6 })
    );
    sawTable.position.set(1.6, 0.75, -0.8);
    group.add(sawTable);

    // Circular Metal Saw Blade
    const sawBlade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 0.05, 16),
      this.getMaterial(0xe2e8f0, { metalness: 0.9, roughness: 0.2 })
    );
    sawBlade.rotation.z = Math.PI / 2;
    sawBlade.position.set(1.6, 1.3, -0.8);
    sawBlade.name = 'saw_blade';
    group.add(sawBlade);

    // 5. Stacked Raw Pine Logs Outside
    const logMat = this.getMaterial(0x78350f, { roughness: 0.9 });
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3 - r; c++) {
        const log = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2.0, 8), logMat);
        log.rotation.x = Math.PI / 2;
        log.position.set(-1.8 + c * 0.45 + r * 0.22, 0.55 + r * 0.35, -1.6);
        group.add(log);
      }
    }

    // 6. Refined Wood Planks Crate
    const plankStack = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.6, 0.9),
      this.getMaterial(0xfde68a, { roughness: 0.5 }) // Freshly cut bright wood
    );
    plankStack.position.set(1.5, 0.65, 1.8);
    group.add(plankStack);
  }

  // --- WORKSHOP 2: IRON SMELTERY & STEEL FOUNDRY ---
  private static buildWorkshopSteel(group: THREE.Group) {
    // 1. Industrial Concrete Base Pad with Heat Tiles
    const pad = new THREE.Mesh(
      new THREE.BoxGeometry(5.6, 0.4, 5.6),
      this.getMaterial(0x334155, { roughness: 0.8, metalness: 0.3 })
    );
    pad.position.y = 0.2;
    group.add(pad);

    // 2. Heavy Graphite Foundry Hall
    const hall = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 3.2, 3.4),
      this.getMaterial(0x1e293b, { roughness: 0.5, metalness: 0.6 })
    );
    hall.position.set(-0.7, 2.0, -0.6);
    group.add(hall);

    // Sloped Corrugated Metal Roof
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 0.2, 3.6),
      this.getMaterial(0x475569, { metalness: 0.8, roughness: 0.4 })
    );
    roof.rotation.x = 0.12;
    roof.position.set(-0.7, 3.7, -0.6);
    group.add(roof);

    // 3. Twin High Blast Smokestacks with Glowing Fiery Emissive Tops
    const stackMat = this.getMaterial(0x0f172a, { roughness: 0.6, metalness: 0.7 });
    const stack1 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.55, 4.6, 12), stackMat);
    stack1.position.set(-1.8, 3.8, -1.6);
    group.add(stack1);

    const fireGlow1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.2, 10),
      this.getMaterial(0xf97316, { emissive: 0xff5500, emissiveIntensity: 2.2 })
    );
    fireGlow1.position.set(-1.8, 6.15, -1.6);
    group.add(fireGlow1);

    const stack2 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.48, 4.0, 12), stackMat);
    stack2.position.set(-0.6, 3.5, -1.8);
    group.add(stack2);

    const fireGlow2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 0.2, 10),
      this.getMaterial(0xf97316, { emissive: 0xff5500, emissiveIntensity: 2.2 })
    );
    fireGlow2.position.set(-0.6, 5.55, -1.8);
    group.add(fireGlow2);

    // 4. Molten Crucible Smelting Basin (Glowing liquid orange steel)
    const vatBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.4, 1.2, 16),
      this.getMaterial(0x1e293b, { metalness: 0.7, roughness: 0.4 })
    );
    vatBase.position.set(1.5, 1.0, 0.8);
    group.add(vatBase);

    const moltenSteel = new THREE.Mesh(
      new THREE.CylinderGeometry(1.05, 1.05, 0.1, 16),
      this.getMaterial(0xf59e0b, {
        emissive: 0xff7700,
        emissiveIntensity: 2.5,
        roughness: 0.1,
        metalness: 0.9,
      })
    );
    moltenSteel.position.set(1.5, 1.58, 0.8);
    group.add(moltenSteel);

    // 5. Overhead Heavy Gantry Crane & I-Beam Track
    const craneColumn = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 3.8, 0.25),
      this.getMaterial(0xfacc15, { roughness: 0.5, metalness: 0.4 }) // Industrial Yellow
    );
    craneColumn.position.set(2.3, 2.1, -1.8);
    group.add(craneColumn);

    const craneBeam = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.35, 3.6),
      this.getMaterial(0xfacc15, { roughness: 0.5, metalness: 0.4 })
    );
    craneBeam.position.set(2.3, 3.8, 0);
    group.add(craneBeam);

    // 6. Stacked Steel Ingots / I-Beams Pallet
    const steelBeamMat = this.getMaterial(0x94a3b8, { metalness: 0.95, roughness: 0.25 });
    for (let s = 0; s < 4; s++) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 1.8), steelBeamMat);
      beam.position.set(-1.8 + s * 0.45, 0.55, 1.6);
      group.add(beam);
    }
  }

  // --- WORKSHOP 3: REINFORCED CONCRETE MIXER DEPOT ---
  private static buildWorkshopConcrete(group: THREE.Group) {
    // 1. Heavy Aggregate Poured Concrete Foundation
    const foundation = new THREE.Mesh(
      new THREE.BoxGeometry(5.6, 0.4, 5.6),
      this.getMaterial(0x64748b, { roughness: 0.95 })
    );
    foundation.position.y = 0.2;
    group.add(foundation);

    // 2. Twin High-Capacity Cement Mixing Silos (Steel Cylinders with Conical Hoppers)
    const siloMat = this.getMaterial(0xd1d5db, { metalness: 0.7, roughness: 0.3 });
    const hopperMat = this.getMaterial(0x9ca3af, { metalness: 0.6, roughness: 0.4 });

    // Silo 1
    const silo1 = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 3.6, 16), siloMat);
    silo1.position.set(-1.4, 2.6, -1.0);
    group.add(silo1);

    const hopper1 = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.0, 16), hopperMat);
    hopper1.rotation.x = Math.PI;
    hopper1.position.set(-1.4, 0.7, -1.0);
    group.add(hopper1);

    const siloDome1 = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), siloMat);
    siloDome1.position.set(-1.4, 4.4, -1.0);
    group.add(siloDome1);

    // Silo 2
    const silo2 = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 3.6, 16), siloMat);
    silo2.position.set(0.6, 2.6, -1.0);
    group.add(silo2);

    const hopper2 = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.0, 16), hopperMat);
    hopper2.rotation.x = Math.PI;
    hopper2.position.set(0.6, 0.7, -1.0);
    group.add(hopper2);

    const siloDome2 = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), siloMat);
    siloDome2.position.set(0.6, 4.4, -1.0);
    group.add(siloDome2);

    // 3. Central Revolving Concrete Mixer Barrel
    const mixerGroup = new THREE.Group();
    mixerGroup.name = 'concrete_mixer_drum';
    mixerGroup.position.set(-0.4, 1.6, 1.0);

    const drum = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 1.2, 2.2, 12),
      this.getMaterial(0x0284c7, { roughness: 0.4, metalness: 0.5 }) // Industrial Blue Drum
    );
    drum.rotation.z = Math.PI / 3;
    mixerGroup.add(drum);

    const mixerSpout = new THREE.Mesh(
      new THREE.ConeGeometry(0.6, 0.8, 12),
      this.getMaterial(0x475569, { roughness: 0.6 })
    );
    mixerSpout.rotation.z = -Math.PI / 6;
    mixerSpout.position.set(0.8, -0.6, 0);
    mixerGroup.add(mixerSpout);
    group.add(mixerGroup);

    // 4. Overhead Incline Aggregate Conveyor Chute
    const chute = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.25, 3.8),
      this.getMaterial(0xf59e0b, { roughness: 0.6, metalness: 0.4 }) // Yellow conveyor
    );
    chute.rotation.x = 0.45;
    chute.position.set(1.9, 2.2, 0.4);
    group.add(chute);

    // 5. Stacked Rebar Cages & Reinforcement Steel Grids
    const rebarMat = this.getMaterial(0x38bdf8, { metalness: 0.8, roughness: 0.3 });
    for (let k = 0; k < 3; k++) {
      const cage = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 1.2), rebarMat);
      cage.position.set(-1.8, 0.55 + k * 0.22, 1.6);
      group.add(cage);
    }

    // 6. Cast Reinforced Concrete Slab Output Pallet
    const slabBlock = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.8, 1.2),
      this.getMaterial(0x94a3b8, { roughness: 0.9 })
    );
    slabBlock.position.set(1.6, 0.8, 1.6);
    group.add(slabBlock);
  }

  private static buildGenericBuilding(group: THREE.Group, def: BuildingDefinition) {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(def.size[0] * 1.8, def.height, def.size[1] * 1.8),
      this.getMaterial(0x64748b, { roughness: 0.6 })
    );
    box.position.y = def.height / 2;
    group.add(box);
  }
}
