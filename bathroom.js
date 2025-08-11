// 3D Bathroom Scene - REALISTIC VERSION v3
// Room dimensions: 102" × 32" × 108" (length × width × height)
// Using ES modules for three + loaders
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'meshopt_decoder';
console.log("Loading REALISTIC bathroom scene v3 with detailed models!");

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2a2a2a);

// Shared PBR wood material (updated asynchronously when textures load)
let oakMaterial = new THREE.MeshStandardMaterial({ color: 0xD2B48C, roughness: 0.6, metalness: 0.0 });

function loadPBRTextures() {
    const loader = new THREE.TextureLoader();
    const anis = renderer?.capabilities?.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 1;
    const maps = {
        map: 'assets/oak_basecolor.jpg',
        normalMap: 'assets/oak_normal.jpg',
        roughnessMap: 'assets/oak_roughness.jpg',
        aoMap: 'assets/oak_ao.jpg'
    };
    Object.entries(maps).forEach(([key, path]) => {
        loader.load(
            path,
            (tex) => {
                if (key === 'map') tex.colorSpace = THREE.SRGBColorSpace;
                tex.anisotropy = anis;
                oakMaterial[key] = tex;
                oakMaterial.needsUpdate = true;
            },
            undefined,
            () => {
                // If a texture is missing, keep fallback color
                console.warn('Missing texture:', path);
            }
        );
    });
}

function loadEnvironmentHDR() {
    const rgbe = new RGBELoader();
    rgbe.setPath('assets/');
    rgbe.load('studio.hdr', (hdr) => {
        hdr.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = hdr;
    }, undefined, () => {
        console.warn('HDRI not found at assets/studio.hdr; attempting remote fallback.');
        // Remote fallback HDR from polyhaven CDN (studio small)
        const fallback = new RGBELoader();
        fallback.load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_03_1k.hdr', (hdr2) => {
            hdr2.mapping = THREE.EquirectangularReflectionMapping;
            scene.environment = hdr2;
            console.log('Loaded remote fallback HDR environment');
        }, undefined, () => {
            console.warn('Failed to load fallback HDR. Proceeding without environment map.');
        });
    });
}

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 0, 260);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.physicallyCorrectLights = true;
renderer.setClearColor(0x2a2a2a, 1);
document.getElementById('scene-container').appendChild(renderer.domElement);

// Simple orbit controls
let mouseX = 0;
let mouseY = 0;
let isMouseDown = false;
let targetRotationX = 0;
let targetRotationY = 0;
let currentRotationX = 0;
let currentRotationY = 0;

renderer.domElement.addEventListener('mousedown', onMouseDown);
renderer.domElement.addEventListener('mousemove', onMouseMove);
renderer.domElement.addEventListener('mouseup', onMouseUp);
renderer.domElement.addEventListener('wheel', onMouseWheel);

function onMouseDown(event) {
    isMouseDown = true;
    mouseX = event.clientX;
    mouseY = event.clientY;
}

function onMouseMove(event) {
    if (isMouseDown) {
        const deltaX = event.clientX - mouseX;
        const deltaY = event.clientY - mouseY;
        targetRotationY += deltaX * 0.01;
        targetRotationX += deltaY * 0.01;
        mouseX = event.clientX;
        mouseY = event.clientY;
    }
}

function onMouseUp() {
    isMouseDown = false;
}

function onMouseWheel(event) {
    const distance = camera.position.length();
    const newDistance = Math.max(10, Math.min(400, distance + event.deltaY * 0.1));
    camera.position.normalize().multiplyScalar(newDistance);
}

// Room dimensions
const LENGTH = 102; // 102 inches
const WIDTH = 32;   // 32 inches  
const HEIGHT = 108; // 108 inches

// Colors
const WALL_COLOR = 0x2D5016; // Sherwin-Williams 'Secret Garden' green
const FLOOR_COLOR = 0x8B4513; // Medium brown wood
const TRIM_COLOR = 0xFFFFFF;  // White trim
const CEILING_COLOR = 0xF8F8F8; // Light gray ceiling
// Vanity import scaling mode: 'uniformByWidth' | 'uniformByHeight' | 'exact'
const VANITY_SCALE_MODE = 'uniformByWidth';
// Toilet import scaling mode: 'uniformByDepth' | 'uniformByHeight' | 'exact'
const TOILET_SCALE_MODE = 'uniformByHeight';
// Toilet yaw orientation (radians). Clockwise 90° from facing into room.
const TOILET_ROTATION_Y = Math.PI / 2; // rotated two more 90° steps clockwise from previous
// Mirror scaling mode and targets
const MIRROR_SCALE_MODE = 'uniformByHeight';
const MIRROR_TARGET = { width: 24.5, height: 36, depth: 1.5 };
// Mirror yaw orientation (radians)
const MIRROR_ROTATION_Y = -Math.PI / 2; // counter-clockwise 90°
// Cabinet scaling mode and targets (match vanity logic: preserve proportions, match width)
const CABINET_SCALE_MODE = 'exact';
const CABINET_TARGET = { width: 25, height: 11.8, depth: 10 };
// Cabinet yaw orientation (radians)
const CABINET_ROTATION_Y = Math.PI / 2; // counter-clockwise 90°

// Lighting
function setupLighting() {
    // Subtle environment for reflections; upgraded with HDR if available
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x2a2a2a);
    const envTex = pmrem.fromScene(envScene).texture;
    scene.environment = envTex;

    // Soft, balanced ambient via hemisphere light
    const hemi = new THREE.HemisphereLight(0xffffff, 0x404040, 0.25);
    scene.add(hemi);

    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.25);
    scene.add(ambientLight);

    // Overhead key light
    const overheadLight = new THREE.PointLight(0xFFFFFF, 100, 300);
    overheadLight.position.set(0, HEIGHT - 5, 0);
    overheadLight.castShadow = true;
    overheadLight.shadow.mapSize.set(1024, 1024);
    overheadLight.shadow.radius = 4;
    scene.add(overheadLight);

    // Vanity spot (warm)
    const vanityLight = new THREE.SpotLight(0xFFE4B5, 150, 200, Math.PI / 5, 0.35, 1.0);
    vanityLight.position.set(0, HEIGHT - 15, -LENGTH/2 + 5);
    vanityLight.target.position.set(0, 34, -LENGTH/2 + 1);
    vanityLight.castShadow = true;
    vanityLight.shadow.mapSize.set(1024, 1024);
    vanityLight.shadow.radius = 4;
    scene.add(vanityLight);
    scene.add(vanityLight.target);

    // Fill light from the toilet side
    const fill = new THREE.DirectionalLight(0xffffff, 0.3);
    fill.position.set(0, HEIGHT/2, LENGTH/2);
    scene.add(fill);
}

// Create room
function createRoom() {
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(WIDTH, LENGTH);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: FLOOR_COLOR });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(WIDTH, LENGTH);
    const ceilingMaterial = new THREE.MeshLambertMaterial({ color: CEILING_COLOR });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = HEIGHT;
    scene.add(ceiling);

    // Back wall (vanity wall)
    const backWallGeometry = new THREE.PlaneGeometry(WIDTH, HEIGHT);
    const wallMaterial = new THREE.MeshLambertMaterial({ color: WALL_COLOR });
    const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
    backWall.position.set(0, HEIGHT/2, -LENGTH/2);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Front wall (toilet wall)
    const frontWallGeometry = new THREE.PlaneGeometry(WIDTH, HEIGHT);
    const frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
    frontWall.position.set(0, HEIGHT/2, LENGTH/2);
    frontWall.rotation.y = Math.PI;
    frontWall.receiveShadow = true;
    scene.add(frontWall);

    // Left wall (with door opening)
    const leftWallGeometry = new THREE.PlaneGeometry(LENGTH, HEIGHT);
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.position.set(-WIDTH/2, HEIGHT/2, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Right wall
    const rightWallGeometry = new THREE.PlaneGeometry(LENGTH, HEIGHT);
    const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
    rightWall.position.set(WIDTH/2, HEIGHT/2, 0);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    // Baseboards
    const baseboardHeight = 4;
    const baseboardMaterial = new THREE.MeshLambertMaterial({ color: TRIM_COLOR });
    
    // Back baseboard
    const backBaseboard = new THREE.Mesh(new THREE.BoxGeometry(WIDTH, baseboardHeight, 1), baseboardMaterial);
    backBaseboard.position.set(0, baseboardHeight/2, -LENGTH/2 + 0.5);
    scene.add(backBaseboard);
    
    // Front baseboard
    const frontBaseboard = new THREE.Mesh(new THREE.BoxGeometry(WIDTH, baseboardHeight, 1), baseboardMaterial);
    frontBaseboard.position.set(0, baseboardHeight/2, LENGTH/2 - 0.5);
    scene.add(frontBaseboard);
    
    // Left baseboard
    const leftBaseboard = new THREE.Mesh(new THREE.BoxGeometry(LENGTH, baseboardHeight, 1), baseboardMaterial);
    leftBaseboard.position.set(-WIDTH/2 + 0.5, baseboardHeight/2, 0);
    leftBaseboard.rotation.y = Math.PI / 2;
    scene.add(leftBaseboard);
    
    // Right baseboard
    const rightBaseboard = new THREE.Mesh(new THREE.BoxGeometry(LENGTH, baseboardHeight, 1), baseboardMaterial);
    rightBaseboard.position.set(WIDTH/2 - 0.5, baseboardHeight/2, 0);
    rightBaseboard.rotation.y = -Math.PI / 2;
    scene.add(rightBaseboard);
}

// Create vanity
function createVanity() {
    // Replace procedural vanity with GLB asset
    const loader = new GLTFLoader();
    // Hook up optional decoders if present
    const ktx2 = new KTX2Loader().setTranscoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/basis/');
    try { ktx2.detectSupport(renderer); } catch (_) {}
    loader.setKTX2Loader(ktx2);
    loader.setMeshoptDecoder(MeshoptDecoder);
    const candidatePaths = [
        'assets/VanityRender.glb',
        'assets/vanityrender.glb',
        'assets/Vanityrender.glb',
        'assets/vanityRender.glb'
    ];

    function onLoaded(gltf) {
            const vanity = gltf.scene || gltf.scenes[0];
            // Debug: log original hierarchy and sizes before any scaling/rotation
            try {
                const srcBBox = new THREE.Box3().setFromObject(vanity);
                const srcSize = new THREE.Vector3();
                srcBBox.getSize(srcSize);
                console.log(`Vanity source size before scaling (X×Y×Z): ${srcSize.x.toFixed(3)} × ${srcSize.y.toFixed(3)} × ${srcSize.z.toFixed(3)} (model units)`);
                console.log('Vanity children:');
                vanity.children.forEach((child) => {
                    const bb = new THREE.Box3().setFromObject(child);
                    const s = new THREE.Vector3();
                    bb.getSize(s);
                    console.log(` - ${child.name || '(unnamed)'}: ${s.x.toFixed(3)} × ${s.y.toFixed(3)} × ${s.z.toFixed(3)}`);
                });
            } catch (e) {}
            vanity.traverse((obj) => {
                if (obj.isMesh) {
                    obj.castShadow = true;
                    obj.receiveShadow = true;
                    const m = obj.material;
                    if (m) {
                        if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
                        if (m.emissiveMap) m.emissiveMap.colorSpace = THREE.SRGBColorSpace;
                        if (m.roughnessMap) m.roughnessMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
                        if (m.metalnessMap) m.metalnessMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
                        if (m.normalMap) m.normalMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
                        m.needsUpdate = true;
                        console.log('Material', m.name || '(unnamed)', {
                            hasMap: !!m.map,
                            hasNormal: !!m.normalMap,
                            hasRoughness: !!m.roughnessMap,
                            hasMetalness: !!m.metalnessMap,
                            hasAO: !!m.aoMap,
                        });
                    }
                }
            });

            // Scale and position to match the target footprint: 24" W x 22.5" D x ~34" H
            const bbox = new THREE.Box3().setFromObject(vanity);
            const size = new THREE.Vector3();
            bbox.getSize(size);

            const targetWidth = 24;   // inches (world X after rotation)
            const targetDepth = 22.5; // inches (world Z after rotation)
            const targetHeight = 34;  // inches (world Y)

            // Choose scaling mode
            if (VANITY_SCALE_MODE === 'exact') {
                // Per-axis (may distort). Map targets to model axes BEFORE rotation
                const scaleX = targetDepth / (size.x || 1);   // model X -> world Z
                const scaleY = targetHeight / (size.y || 1);  // model Y -> world Y
                const scaleZ = targetWidth / (size.z || 1);   // model Z -> world X
                vanity.scale.set(scaleX, scaleY, scaleZ);
            } else if (VANITY_SCALE_MODE === 'uniformByHeight') {
                const s = targetHeight / (size.y || 1);
                vanity.scale.setScalar(s);
            } else { // 'uniformByWidth'
                const s = targetWidth / (size.z || 1); // model Z will become width after rotation
                vanity.scale.setScalar(s);
            }

            // Recompute after scaling to center vertically on floor
            const bbox2 = new THREE.Box3().setFromObject(vanity);
            const center = new THREE.Vector3();
            bbox2.getCenter(center);
            const minY = bbox2.min.y;

            // Move model so it sits on the floor (y=0) and centered on X/Z
            vanity.position.y -= minY; // bring base to y=0
            vanity.position.x -= center.x;
            vanity.position.z -= center.z;

            // Rotate counter-clockwise 90 degrees
            vanity.rotation.y = -Math.PI / 2; // -90 degrees

            // Group for placement against back wall
            const vanityGroup = new THREE.Group();
            vanityGroup.add(vanity);
            // Place against the back wall using the model's actual depth after scaling
            const finalBBox = new THREE.Box3().setFromObject(vanity);
            const finalSize = new THREE.Vector3();
            finalBBox.getSize(finalSize);
            const halfDepth = finalSize.z / 2;
            // small back gap to avoid z-fighting with wall
            const backGap = 0.25; // inches
            vanityGroup.position.set(0, 0, -LENGTH / 2 + halfDepth + backGap);
    scene.add(vanityGroup);
            console.log('GLB vanity loaded and placed:', vanityGroup.position);
            console.log(`Vanity scale mode: ${VANITY_SCALE_MODE}`);
            console.log(`Vanity final size (W x H x D): ${finalSize.x.toFixed(2)}" × ${finalSize.y.toFixed(2)}" × ${finalSize.z.toFixed(2)}"`);
            try {
                const info = document.getElementById('info');
                if (info) {
                    const dimsLine = `Vanity: ${finalSize.x.toFixed(2)}\" W × ${finalSize.y.toFixed(2)}\" H × ${finalSize.z.toFixed(2)}\" D`;
                    const p = document.createElement('p');
                    p.textContent = dimsLine;
                    info.appendChild(p);
                }
            } catch (_) {}
    }

    // Try candidate paths until one succeeds
    (function tryNext(i){
        if (i >= candidatePaths.length) {
            console.error('Failed to load vanity GLB from candidates:', candidatePaths);
            return;
        }
        const path = candidatePaths[i];
        loader.load(path, onLoaded, undefined, () => {
            console.warn('Failed to load', path, '— trying next');
            tryNext(i+1);
        });
    })(0);
}

// Create toilet (load from GLB)
function createToilet() {
    const loader = new GLTFLoader();
    const ktx2 = new KTX2Loader().setTranscoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/basis/');
    try { ktx2.detectSupport(renderer); } catch (_) {}
    loader.setKTX2Loader(ktx2);
    loader.setMeshoptDecoder(MeshoptDecoder);

    const candidates = [
        'assets/toilet.glb',
        'assets/Toilet.glb',
        'assets/toilet_low.glb'
    ];

    // From provided spec image: width 18", depth 29.5", height 33.25" (seat height 16.5" noted separately)
    const target = { width: 18, depth: 29.5, height: 33.25 }; // inches

    function placeToilet(gltf) {
        const model = gltf.scene || gltf.scenes[0];
        model.traverse((o) => {
            if (o.isMesh) {
                o.castShadow = true;
                o.receiveShadow = true;
                const m = o.material;
                if (m && m.map) m.map.colorSpace = THREE.SRGBColorSpace;
            }
        });

        // Compute source size
        const srcBox = new THREE.Box3().setFromObject(model);
        const srcSize = new THREE.Vector3();
        srcBox.getSize(srcSize);

        // Scale according to mode
        if (TOILET_SCALE_MODE === 'exact') {
            const sx = target.width / (srcSize.x || 1);
            const sy = target.height / (srcSize.y || 1);
            const sz = target.depth / (srcSize.z || 1);
            model.scale.set(sx, sy, sz);
        } else if (TOILET_SCALE_MODE === 'uniformByHeight') {
            const s = target.height / (srcSize.y || 1);
            model.scale.setScalar(s);
        } else { // uniformByDepth
            const s = target.depth / (srcSize.z || 1);
            model.scale.setScalar(s);
        }

        // Floor and center
        const box2 = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        box2.getCenter(center);
        const minY = box2.min.y;
        model.position.y -= minY;
        model.position.x -= center.x;
        model.position.z -= center.z;

        // Orientation and placement against front wall
        model.rotation.y = TOILET_ROTATION_Y;
        const boxFinal = new THREE.Box3().setFromObject(model);
        const finalSize = new THREE.Vector3();
        boxFinal.getSize(finalSize);
        const halfDepth = finalSize.z / 2;
        const group = new THREE.Group();
        group.add(model);
        const frontGap = 0.5; // inches from front wall
        group.position.set(0, 0, LENGTH/2 - halfDepth - frontGap);
        scene.add(group);
        console.log('Toilet GLB loaded. Final size (W x H x D):', `${finalSize.x.toFixed(2)}" × ${finalSize.y.toFixed(2)}" × ${finalSize.z.toFixed(2)}"`);
    }

    (function tryNext(i){
        if (i >= candidates.length) {
            console.warn('Toilet GLB not found in candidates; keeping procedural toilet.');
            // Fallback: very simple placeholder
            const placeholder = new THREE.Mesh(new THREE.BoxGeometry(15, 16, 28), new THREE.MeshStandardMaterial({ color: 0xffffff }));
            placeholder.castShadow = true;
            const group = new THREE.Group();
            group.add(placeholder);
            group.position.set(0, 0, LENGTH/2 - 14.5);
            group.rotation.y = Math.PI;
            scene.add(group);
            return;
        }
        const path = candidates[i];
        loader.load(path, placeToilet, undefined, () => tryNext(i+1));
    })(0);
}

// Create mirror
function createMirror() {
    const loader = new GLTFLoader();
    const candidates = ['assets/mirror.glb', 'assets/Mirror.glb'];

    function place(gltf) {
        const model = gltf.scene || gltf.scenes[0];
        model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
        const src = new THREE.Box3().setFromObject(model); const s = new THREE.Vector3(); src.getSize(s);
        if (MIRROR_SCALE_MODE === 'uniformByWidth') {
            const k = MIRROR_TARGET.width / (s.x || 1); model.scale.setScalar(k);
        } else if (MIRROR_SCALE_MODE === 'uniformByHeight') {
            const k = MIRROR_TARGET.height / (s.y || 1); model.scale.setScalar(k);
        } else if (MIRROR_SCALE_MODE === 'exact') {
            model.scale.set(
                MIRROR_TARGET.width / (s.x || 1),
                MIRROR_TARGET.height / (s.y || 1),
                MIRROR_TARGET.depth / (s.z || 1)
            );
        }
        // Center model at origin
        const b2 = new THREE.Box3().setFromObject(model); const c = new THREE.Vector3(); b2.getCenter(c);
        model.position.x -= c.x; model.position.y -= c.y; model.position.z -= c.z;
        // Group for placement/rotation
        const group = new THREE.Group(); group.add(model);
        group.rotation.y = MIRROR_ROTATION_Y;
        // Place against the back wall, centered vertically at 55"
        const bFinal = new THREE.Box3().setFromObject(group); const sizeF = new THREE.Vector3(); bFinal.getSize(sizeF);
        const gap = 0.25;
        const halfDepth = sizeF.z / 2;
        group.position.set(0, 55, -LENGTH/2 + halfDepth + gap);
        scene.add(group);
        console.log('Mirror GLB loaded. Final size (W x H x D):', `${sizeF.x.toFixed(2)}" × ${sizeF.y.toFixed(2)}" × ${sizeF.z.toFixed(2)}"`);
    }
    (function next(i){ if (i>=candidates.length) return console.warn('Mirror GLB not found'); loader.load(candidates[i], place, undefined, ()=>next(i+1)); })(0);
}

// Create vanity light
function createVanityLight() {
    const lightGroup = new THREE.Group();
    
    // Black mounting bar
    const barGeometry = new THREE.BoxGeometry(32, 1.5, 2);
    const barMaterial = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.3, metalness: 0.8 });
    const bar = new THREE.Mesh(barGeometry, barMaterial);
    lightGroup.add(bar);
    
    // Two bell-shaped glass shades with bulbs
    for (let i = 0; i < 2; i++) {
        // Shade holder
        const holderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 16);
        const holderMaterial = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.3, metalness: 0.8 });
        const holder = new THREE.Mesh(holderGeometry, holderMaterial);
        holder.position.set((i - 0.5) * 14, -1, 0);
        lightGroup.add(holder);
        
        // Bell shade via LatheGeometry profile
        const pts = [];
        pts.push(new THREE.Vector2(0.2, -0.5));
        pts.push(new THREE.Vector2(0.35, -1.2));
        pts.push(new THREE.Vector2(1.0, -2.2));
        pts.push(new THREE.Vector2(1.8, -3.0));
        pts.push(new THREE.Vector2(2.3, -3.6));
        pts.push(new THREE.Vector2(2.5, -4.8));
        const latheGeo = new THREE.LatheGeometry(pts, 24);
        const shadeMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.05, metalness: 0.0, transparent: true, opacity: 0.25 });
        const shade = new THREE.Mesh(latheGeo, shadeMaterial);
        shade.scale.set(1, 1, 1);
        shade.position.set((i - 0.5) * 14, -2.8, 0);
        lightGroup.add(shade);
        
        // Light bulb inside shade
        const bulbGeometry = new THREE.SphereGeometry(0.8, 16, 16);
        const bulbMaterial = new THREE.MeshStandardMaterial({ color: 0xFFE4B5, emissive: 0xFFA500, emissiveIntensity: 1.0, roughness: 0.7, metalness: 0.0 });
        const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
        bulb.position.set((i - 0.5) * 14, -4.2, 0);
        lightGroup.add(bulb);
    }
    
    lightGroup.position.set(0, 80, -LENGTH/2 + 1);
    scene.add(lightGroup);
    console.log("Vanity light added to scene at position:", lightGroup.position);
}

// Create cabinet above toilet
function createCabinet() {
    const loader = new GLTFLoader();
    const candidates = ['assets/cabinet2.glb', 'assets/Cabinet2.glb', 'assets/cabinet.glb', 'assets/Cabinet.glb'];

    function place(gltf) {
        const model = gltf.scene || gltf.scenes[0];
        model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
        const src = new THREE.Box3().setFromObject(model); const s = new THREE.Vector3(); src.getSize(s);
        // Many cabinet GLBs have width along Z and depth along X. Map accordingly.
        if (CABINET_SCALE_MODE === 'uniformByWidth') {
            const k = CABINET_TARGET.width / (s.z || 1); // lock width using model Z
            model.scale.setScalar(k);
        } else if (CABINET_SCALE_MODE === 'exact') {
            const scaleX = CABINET_TARGET.depth / (s.x || 1);   // model X -> world depth
            const scaleY = CABINET_TARGET.height / (s.y || 1);  // model Y -> world height
            const scaleZ = CABINET_TARGET.width / (s.z || 1);   // model Z -> world width
            model.scale.set(scaleX, scaleY, scaleZ);
        }
        const b2 = new THREE.Box3().setFromObject(model); const c = new THREE.Vector3(); b2.getCenter(c); const minY = b2.min.y;
        model.position.y -= minY; model.position.x -= c.x; model.position.z -= c.z;
        const group = new THREE.Group(); group.add(model);
        group.position.set(0, 60, LENGTH/2 - 5);
        group.rotation.y = CABINET_ROTATION_Y; scene.add(group); console.log('Cabinet GLB loaded');
    }
    (function next(i){ if (i>=candidates.length) return console.warn('Cabinet GLB not found'); loader.load(candidates[i], place, undefined, ()=>next(i+1)); })(0);
}

// Create towel ring
function createTowelRing() {
    const ringGeometry = new THREE.TorusGeometry(3, 0.3, 8, 32);
    const ringMaterial = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.4, metalness: 0.8 });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.set(-WIDTH/2 + 2, 40, -LENGTH/4);
    ring.rotation.y = Math.PI / 2;
    ring.castShadow = true;
    scene.add(ring);
}

// Initialize scene
function init() {
    console.log("Starting scene initialization...");
    
    // Clear the scene completely
    while(scene.children.length > 0) {
        scene.remove(scene.children[0]);
    }
    console.log("Scene cleared");
    
    setupLighting();
    loadEnvironmentHDR();
    console.log("Lighting setup complete");
    createRoom();
    console.log("Room creation complete");
    createVanity();
    console.log("Vanity creation complete");
    createToilet();
    console.log("Toilet creation complete");
    createMirror();
    console.log("Mirror creation complete");
    createVanityLight();
    console.log("Vanity light creation complete");
    createCabinet();
    console.log("Cabinet creation complete");
    createTowelRing();
    console.log("Towel ring creation complete");
    
    camera.position.set(0, 0, 260);
    camera.lookAt(0, 0, 0);
    
    // Reset orbit controls
    targetRotationX = 0;
    targetRotationY = 0;
    currentRotationX = 0;
    currentRotationY = 0;
    
    console.log("Scene initialization complete!");
    console.log("Camera position:", camera.position);
    console.log("Scene children count:", scene.children.length);
    console.log("Scene children:", scene.children);
    
    // Check if any objects are visible
    scene.traverse((object) => {
        if (object.isMesh) {
            console.log("Mesh found:", object.name || "unnamed", "visible:", object.visible, "position:", object.position);
        }
    });
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update camera rotation with damping
    currentRotationX += (targetRotationX - currentRotationX) * 0.05;
    currentRotationY += (targetRotationY - currentRotationY) * 0.05;
    
    // Apply rotation to camera
    const distance = camera.position.length();
    camera.position.x = distance * Math.sin(currentRotationY) * Math.cos(currentRotationX);
    camera.position.y = distance * Math.sin(currentRotationX);
    camera.position.z = distance * Math.cos(currentRotationY) * Math.cos(currentRotationX);
    camera.lookAt(0, 0, 0);
    
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Start the scene
init();
animate(); 