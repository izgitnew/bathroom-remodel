// 3D Bathroom Scene - REALISTIC VERSION v3
// Room dimensions: 102" × 32" × 108" (length × width × height)
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
    if (typeof THREE.RGBELoader === 'undefined') {
        console.warn('RGBELoader not found. Using fallback environment.');
        return;
    }
    const rgbe = new THREE.RGBELoader();
    rgbe.setPath('assets/');
    rgbe.load('studio.hdr', (hdr) => {
        hdr.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = hdr;
    }, undefined, () => {
        console.warn('HDRI not found at assets/studio.hdr; keeping default.');
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
    const vanityGroup = new THREE.Group();

    // Open-frame vanity: side panels + back panel (no solid body hiding drawers)
    const panelMaterial = oakMaterial;
    const sideThickness = 1;
    const sideHeight = 34;
    const sideDepth = 22.5;
    const halfWidth = 12;
    
    // Left side panel
    const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(sideThickness, sideHeight, sideDepth), panelMaterial);
    leftPanel.position.set(-halfWidth + sideThickness / 2, sideHeight / 2, 0);
    leftPanel.castShadow = true;
    leftPanel.receiveShadow = true;
    vanityGroup.add(leftPanel);

    // Right side panel
    const rightPanel = new THREE.Mesh(new THREE.BoxGeometry(sideThickness, sideHeight, sideDepth), panelMaterial);
    rightPanel.position.set(halfWidth - sideThickness / 2, sideHeight / 2, 0);
    rightPanel.castShadow = true;
    rightPanel.receiveShadow = true;
    vanityGroup.add(rightPanel);

    // Back panel
    const backThickness = 0.5;
    const backPanel = new THREE.Mesh(new THREE.BoxGeometry(24 - sideThickness * 2, sideHeight - 2, backThickness), panelMaterial);
    backPanel.position.set(0, sideHeight / 2 - 1, -sideDepth / 2 + backThickness / 2);
    backPanel.castShadow = true;
    vanityGroup.add(backPanel);

    // Legs (tapered)
    const legGeometry = new THREE.CylinderGeometry(1.2, 0.8, 6, 24);
    const legMaterial = oakMaterial;
    const legYOffset = 3;
    const legInset = 2;
    const legPositions = [
        [-halfWidth + legInset, legYOffset, -sideDepth / 2 + legInset],
        [halfWidth - legInset, legYOffset, -sideDepth / 2 + legInset],
        [-halfWidth + legInset, legYOffset, sideDepth / 2 - legInset],
        [halfWidth - legInset, legYOffset, sideDepth / 2 - legInset],
    ];
    for (const [x, y, z] of legPositions) {
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(x, y, z);
        leg.castShadow = true;
        vanityGroup.add(leg);
    }

    // Drawer fronts
    const drawerCount = 3;
    const drawerHeight = sideHeight / drawerCount;
    const drawerFrontThickness = 0.7;
    const drawerFrontWidth = 24 - sideThickness * 2 - 2; // small inset
    const drawerMaterial = oakMaterial;

    for (let i = 0; i < drawerCount; i++) {
        const front = new THREE.Mesh(
            new THREE.BoxGeometry(drawerFrontWidth, drawerHeight - 2, drawerFrontThickness),
            drawerMaterial
        );
        front.position.set(0, i * drawerHeight + drawerHeight / 2, sideDepth / 2 - drawerFrontThickness / 2);
        front.castShadow = true;
        vanityGroup.add(front);

        // Fluted slats across the drawer front
        const slatCount = 28;
        const slatSpacing = drawerFrontWidth / slatCount;
        const slatDepth = 0.4;
        const slatMaterial = oakMaterial;
        for (let s = 0; s < slatCount; s++) {
            const x = -drawerFrontWidth / 2 + slatSpacing * (s + 0.5);
            const slat = new THREE.Mesh(new THREE.BoxGeometry(slatSpacing * 0.9, drawerHeight - 2.5, slatDepth), slatMaterial);
            slat.position.set(x, 0, drawerFrontThickness / 2 - slatDepth / 2);
            front.add(slat);
        }

        // Knob
        const knob = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.4, metalness: 0.8 }));
        knob.position.set(0, 0, drawerFrontThickness / 2 + 0.3);
        front.add(knob);
    }

    // Countertop (white solid surface)
    const counter = new THREE.Mesh(new THREE.BoxGeometry(25, 1.5, 23.5), new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.2, metalness: 0.0 }));
    counter.position.y = 35.75;
    counter.castShadow = true;
    vanityGroup.add(counter);

    // Integrated sink
    const sink = new THREE.Mesh(new THREE.CylinderGeometry(7, 6.5, 2.5, 32), new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.25, metalness: 0.0 }));
    sink.position.y = 36.25;
    vanityGroup.add(sink);

    // Sink drain
    const drain = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.5, 16), new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.3, metalness: 0.9 }));
    drain.position.y = 35.5;
    vanityGroup.add(drain);

    // Modern black faucet with two handles
    const faucetGroup = new THREE.Group();
    const faucetMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.35, metalness: 0.9 });

    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 6, 16), faucetMaterial);
    spout.position.set(0, 3, 0);
    spout.rotation.x = Math.PI / 6;
    faucetGroup.add(spout);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1, 16), faucetMaterial);
    faucetGroup.add(base);

    const leftHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 3, 16), faucetMaterial);
    leftHandle.position.set(-2.5, 1.5, 0);
    leftHandle.rotation.z = Math.PI / 2;
    faucetGroup.add(leftHandle);

    const rightHandle = leftHandle.clone();
    rightHandle.position.set(2.5, 1.5, 0);
    rightHandle.rotation.z = -Math.PI / 2;
    faucetGroup.add(rightHandle);

    faucetGroup.position.set(0, 39, 0);
    vanityGroup.add(faucetGroup);

    vanityGroup.position.set(0, 0, -LENGTH / 2 + 11.25);
    scene.add(vanityGroup);
    console.log("Vanity added to scene at position:", vanityGroup.position);
    console.log("Vanity group children count:", vanityGroup.children.length);
    console.log("Vanity group bounding box:", new THREE.Box3().setFromObject(vanityGroup));
}

// Create toilet (more realistic)
function createToilet() {
    const toiletGroup = new THREE.Group();

    // Materials
    const ceramicMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.3,
        metalness: 0.0,
        clearcoat: 0.55,
        clearcoatRoughness: 0.18
    });
    const plasticMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.0 });
    const metalMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.35, metalness: 0.9 });

    // Base pedestal (Lathe)
    const basePts = [];
    basePts.push(new THREE.Vector2(6.5, 0));   // base outer
    basePts.push(new THREE.Vector2(7.5, 0.3));
    basePts.push(new THREE.Vector2(7.2, 1.0));
    basePts.push(new THREE.Vector2(6.0, 3.0));
    basePts.push(new THREE.Vector2(5.8, 4.5));
    basePts.push(new THREE.Vector2(6.2, 7.5)); // top of pedestal
    const baseGeo = new THREE.LatheGeometry(basePts, 48);
    const baseMesh = new THREE.Mesh(baseGeo, ceramicMaterial);
    baseMesh.position.set(0, 0, 0);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    toiletGroup.add(baseMesh);

    // Bowl outer (Lathe)
    const bowlOuterPts = [];
    bowlOuterPts.push(new THREE.Vector2(5.8, 7.5)); // start at top of pedestal
    bowlOuterPts.push(new THREE.Vector2(6.2, 10.0));
    bowlOuterPts.push(new THREE.Vector2(6.8, 12.0));
    bowlOuterPts.push(new THREE.Vector2(6.4, 13.0));
    bowlOuterPts.push(new THREE.Vector2(5.6, 14.0));
    bowlOuterPts.push(new THREE.Vector2(5.0, 15.5)); // rim level
    const bowlOuterGeo = new THREE.LatheGeometry(bowlOuterPts, 48);
    const bowlOuter = new THREE.Mesh(bowlOuterGeo, ceramicMaterial);
    bowlOuter.castShadow = true;
    toiletGroup.add(bowlOuter);

    // Inner bowl (Lathe, BackSide)
    const bowlInnerPts = [];
    bowlInnerPts.push(new THREE.Vector2(4.2, 7.6));
    bowlInnerPts.push(new THREE.Vector2(3.8, 10.4));
    bowlInnerPts.push(new THREE.Vector2(3.6, 12.5));
    bowlInnerPts.push(new THREE.Vector2(3.6, 14.6));
    const bowlInnerGeo = new THREE.LatheGeometry(bowlInnerPts, 48);
    const bowlInner = new THREE.Mesh(bowlInnerGeo, new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.25,
        clearcoat: 0.6,
        clearcoatRoughness: 0.15,
        side: THREE.BackSide
    }));
    bowlInner.castShadow = false;
    toiletGroup.add(bowlInner);

    // Rim (thin ring via extrude ellipse)
    const rimShape = new THREE.Shape();
    rimShape.absellipse(0, 0, 6.0, 4.5, 0, Math.PI * 2, false, 0);
    const rimHole = new THREE.Path();
    rimHole.absellipse(0, 0, 4.2, 3.2, 0, Math.PI * 2, false, 0);
    rimShape.holes.push(rimHole);
    const rimGeo = new THREE.ExtrudeGeometry(rimShape, { depth: 0.6, bevelEnabled: false });
    const rim = new THREE.Mesh(rimGeo, ceramicMaterial);
    rim.rotation.x = -Math.PI / 2;
    rim.position.set(0, 15.5, 0);
    rim.castShadow = true;
    toiletGroup.add(rim);

    // Seat (plastic ring)
    const seatShape = new THREE.Shape();
    seatShape.absellipse(0, 0, 6.1, 4.6, 0, Math.PI * 2, false, 0);
    const seatHole = new THREE.Path();
    seatHole.absellipse(0, 0, 4.0, 3.0, 0, Math.PI * 2, false, 0);
    seatShape.holes.push(seatHole);
    const seatGeo = new THREE.ExtrudeGeometry(seatShape, { depth: 0.4, bevelEnabled: false });
    const seat = new THREE.Mesh(seatGeo, plasticMaterial);
    seat.rotation.x = -Math.PI / 2;
    seat.position.set(0, 16.1, 0);
    seat.castShadow = true;
    toiletGroup.add(seat);

    // Lid (oval)
    const lidShape = new THREE.Shape();
    lidShape.absellipse(0, 0, 6.2, 4.7, 0, Math.PI * 2, false, 0);
    const lidGeo = new THREE.ExtrudeGeometry(lidShape, { depth: 0.5, bevelEnabled: true, bevelSize: 0.1, bevelThickness: 0.1, bevelSegments: 2 });
    const lid = new THREE.Mesh(lidGeo, plasticMaterial);
    lid.rotation.x = -Math.PI / 2;
    lid.position.set(0, 16.7, -0.2);
    lid.castShadow = true;
    toiletGroup.add(lid);

    // Hinges
    const hingeLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 1.2, 16), metalMaterial);
    hingeLeft.rotation.z = Math.PI / 2;
    hingeLeft.position.set(-2.0, 16.4, -1.8);
    const hingeRight = hingeLeft.clone();
    hingeRight.position.x = 2.0;
    toiletGroup.add(hingeLeft, hingeRight);

    // Tank (box with slight rounding suggestion via scaled cylinders at ends)
    const tank = new THREE.Mesh(new THREE.BoxGeometry(13, 10, 6.5), ceramicMaterial);
    tank.position.set(0, 22.5, -9.8);
    tank.castShadow = true;
    toiletGroup.add(tank);

    // Tank lid
    const tankLid = new THREE.Mesh(new THREE.BoxGeometry(13.2, 1.2, 6.7), ceramicMaterial);
    tankLid.position.set(0, 28.1, -9.8);
    tankLid.castShadow = true;
    toiletGroup.add(tankLid);

    // Flush handle
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 2.2, 16), metalMaterial);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(6.0, 25.0, -6.7);
    toiletGroup.add(handle);

    // Bolt caps (small domes)
    const boltL = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), ceramicMaterial);
    boltL.position.set(-2.5, 15.6, 4.0);
    const boltR = boltL.clone();
    boltR.position.x = 2.5;
    toiletGroup.add(boltL, boltR);

    // Final placement in room
    toiletGroup.position.set(0, 0, LENGTH/2 - 14.5);
    toiletGroup.rotation.y = Math.PI;
    scene.add(toiletGroup);
    console.log("Toilet added to scene at position:", toiletGroup.position);
}

// Create mirror
function createMirror() {
    const mirrorGroup = new THREE.Group();

    // Wavy frame via extruded shape
    const frameWidth = 26;
    const frameHeight = 30;
    const frameThickness = 2;
    const waveAmplitude = 1.6; // subtler wave
    const segments = 24;

    const pts = [];
    // Top edge
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = -frameWidth / 2 + frameWidth * t;
        const y = frameHeight / 2 + Math.sin(t * Math.PI * 2) * waveAmplitude;
        pts.push(new THREE.Vector2(x, y));
    }
    // Right edge
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const y = frameHeight / 2 - frameHeight * t;
        const x = frameWidth / 2 + Math.sin(t * Math.PI * 2) * waveAmplitude;
        pts.push(new THREE.Vector2(x, y));
    }
    // Bottom edge
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = frameWidth / 2 - frameWidth * t;
        const y = -frameHeight / 2 + Math.sin(t * Math.PI * 2) * waveAmplitude;
        pts.push(new THREE.Vector2(x, y));
    }
    // Left edge
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const y = -frameHeight / 2 + frameHeight * t;
        const x = -frameWidth / 2 + Math.sin(t * Math.PI * 2) * waveAmplitude;
        pts.push(new THREE.Vector2(x, y));
    }

    const outer = new THREE.Shape(pts);

    const inset = 3.0;
    const inner = new THREE.Path();
    inner.moveTo(-frameWidth / 2 + inset, -frameHeight / 2 + inset);
    inner.lineTo(frameWidth / 2 - inset, -frameHeight / 2 + inset);
    inner.lineTo(frameWidth / 2 - inset, frameHeight / 2 - inset);
    inner.lineTo(-frameWidth / 2 + inset, frameHeight / 2 - inset);
    inner.lineTo(-frameWidth / 2 + inset, -frameHeight / 2 + inset);
    outer.holes.push(inner);

    const frameGeo = new THREE.ExtrudeGeometry(outer, { depth: frameThickness, bevelEnabled: false, steps: 1 });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.6, metalness: 0.0 });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.castShadow = true;
    mirrorGroup.add(frameMesh);

    // Glass inset
    const glassGeo = new THREE.PlaneGeometry(frameWidth - inset * 2, frameHeight - inset * 2);
    const glassMat = new THREE.MeshStandardMaterial({ color: 0xE0E0E0, roughness: 0.05, metalness: 0.0, transparent: true, opacity: 0.9 });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.z = frameThickness * 0.55;
    mirrorGroup.add(glass);

    mirrorGroup.position.set(0, 55, -LENGTH/2 + 1);
    mirrorGroup.castShadow = true;
    scene.add(mirrorGroup);
    console.log("Mirror added to scene at position:", mirrorGroup.position);
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
    const cabinetGroup = new THREE.Group();
    
    // Main cabinet body
    const cabinetGeometry = new THREE.BoxGeometry(25, 11.8, 10);
    const cabinetMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xD2B48C,
        roughness: 0.6,
        metalness: 0.0
    });
    const cabinet = new THREE.Mesh(cabinetGeometry, cabinetMaterial);
    cabinet.castShadow = true;
    cabinet.receiveShadow = true;
    cabinetGroup.add(cabinet);
    
    // Two cabinet doors with fluted texture
    const doorWidth = 12;
    for (let i = 0; i < 2; i++) {
        const doorGeometry = new THREE.BoxGeometry(doorWidth - 1, 9.8, 1);
        const doorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xC19A6B,
            roughness: 0.55,
            metalness: 0.0
        });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set((i - 0.5) * doorWidth, 0, 5.5);
        door.castShadow = true;
        cabinetGroup.add(door);
        
        // Door knob (black round knob)
        const knobGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const knobMaterial = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.4, metalness: 0.8 });
        const knob = new THREE.Mesh(knobGeometry, knobMaterial);
        knob.position.set(0, 0, 0.6);
        door.add(knob);
    }
    
    cabinetGroup.position.set(0, 60, LENGTH/2 - 5);
    cabinetGroup.rotation.y = Math.PI;
    scene.add(cabinetGroup);
    console.log("Cabinet added to scene at position:", cabinetGroup.position);
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