// ═══════════════════════════════════════════════════════════
// Board3D.js — 3D Floating Isometric Board (Monopoly-style)
// Creates the platform, spaces, corners, center text
// ═══════════════════════════════════════════════════════════

import * as THREE from 'three';
import { BOARD_DATA, LEVEL_RENT_MULTIPLIERS } from '../data/boardData.js';
import { Scene3D } from './Scene3D.js';

const BOARD_HALF = 24.2;        // Half-width of the board (5.5 * SIZE for perfect alignment)
const SPACE_SIZE = 4.4;         // Normal space width (= corner for alignment)
const CORNER_SIZE = 4.4;        // Corner size
const SPACE_HEIGHT = 0.35;      // Slot extrusion height
const PLATFORM_THICKNESS = 1.0; // Board platform thickness
const PLATFORM_Y = 0;           // Board Y position

// Map space index to 3D world position (X, Z) — same Monopoly layout
// Bottom row: 0-9 (right to left), Left col: 10-19, Top row: 20-29, Right col: 30-39
function getSpaceWorldPos(index) {
    const offset = BOARD_HALF - CORNER_SIZE / 2;
    const step = (2 * offset - CORNER_SIZE) / 9;

    let x, z;
    if (index === 0) { x = offset; z = offset; }
    else if (index > 0 && index < 10) { x = offset - CORNER_SIZE / 2 - step * (index - 0.5); z = offset; }
    else if (index === 10) { x = -offset; z = offset; }
    else if (index > 10 && index < 20) { x = -offset; z = offset - CORNER_SIZE / 2 - step * (index - 10 - 0.5); }
    else if (index === 20) { x = -offset; z = -offset; }
    else if (index > 20 && index < 30) { x = -offset + CORNER_SIZE / 2 + step * (index - 20 - 0.5); z = -offset; }
    else if (index === 30) { x = offset; z = -offset; }
    else { x = offset; z = -offset + CORNER_SIZE / 2 + step * (index - 30 - 0.5); }

    return new THREE.Vector3(x, PLATFORM_Y + PLATFORM_THICKNESS / 2 + SPACE_HEIGHT / 2, z);
}

// Color CSS variable mapping → hex string for canvas
const CSS_COLOR_MAP = {
    'var(--color-cipa)':    '#4caf50',
    'var(--color-aet)':     '#8d6e63',
    'var(--color-pca)':     '#42a5f5',
    'var(--color-pcmso)':   '#ef5350',
    'var(--color-pgr)':     '#ff7043',
    'var(--color-ltcat)':   '#7e57c2',
    'var(--color-ppp)':     '#26c6da',
    'var(--color-brigada)': '#ffa726',
    'var(--color-pce)':     '#8f603c',
    'var(--color-gestao)':  '#1c1c1c',
};

function resolveColorHex(cssColor) {
    if (!cssColor) return '#e5ebf0';
    if (CSS_COLOR_MAP[cssColor]) return CSS_COLOR_MAP[cssColor];
    if (typeof cssColor === 'string' && cssColor.startsWith('#')) return cssColor;
    return '#e5ebf0';
}

function resolveColor(cssColor) {
    const hex = resolveColorHex(cssColor);
    return parseInt(hex.replace('#', ''), 16);
}

// ─── Canvas texture generation for space top-face labels ───
const TEX_W = 1024;
const TEX_H = 1024;
const TEX_CORNER = 1024;

function _createSpaceTexture(space, index, isCorner) {
    const w = isCorner ? TEX_CORNER : TEX_W;
    const h = isCorner ? TEX_CORNER : TEX_H;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    let rotation = 0;
    if (index === 0)       rotation = 180;
    else if (index === 10) rotation = -90;
    else if (index === 20) rotation = 0;
    else if (index === 30) rotation = 90;
    else if (index > 0 && index < 10)  rotation = 180;
    else if (index > 10 && index < 20) rotation = -90;
    else if (index > 20 && index < 30) rotation = 0;
    else if (index > 30 && index < 40) rotation = 90;

    if (rotation !== 0) {
        ctx.translate(w / 2, h / 2);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.translate(-w / 2, -h / 2);
    }

    if (space.type === 'property') {
        _drawPropertyCard(ctx, w, h, space);
    } else if (space.type === 'corner') {
        _drawCornerCard(ctx, w, h, space, index);
    } else if (space.type === 'card') {
        _drawCartaSST(ctx, w, h);
    } else if (space.type === 'sesmt') {
        _drawSesmtCard(ctx, w, h, space);
    } else if (space.type === 'tax') {
        _drawTaxCard(ctx, w, h, space);
    } else {
        _drawGenericCard(ctx, w, h, space);
    }

    // Store canvas ref and rotation for dynamic updates
    canvas._rotation = rotation;

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 16;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;

    _spaceCanvases[index] = canvas;
    _spaceTextures[index] = tex;

    return tex;
}

function _drawPropertyCard(ctx, w, h, space) {
    // Background
    ctx.fillStyle = '#e5ebf0';
    ctx.fillRect(0, 0, w, h);

    // Color header band (top 28%)
    const headerH = Math.round(h * 0.28);
    const col = resolveColorHex(space.color);
    ctx.fillStyle = col;
    ctx.fillRect(0, 0, w, headerH);

    // Group name ONLY in header (e.g. "PCA", "CIPA", "AET")
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const groupName = space.group || '';
    if (groupName === 'SIST.GESTÃO') {
        ctx.font = 'bold 110px Arial, sans-serif';
        ctx.fillText('SIST.', w / 2, headerH * 0.35);
        ctx.fillText('GESTÃO', w / 2, headerH * 0.70);
    } else {
        ctx.font = 'bold 180px Arial, sans-serif';
        ctx.fillText(groupName, w / 2, headerH / 2);
    }

    // Sub-name in body (e.g. "Exp. Ruído", "Treinamento")
    let subName = '';
    if (space.name.includes('—')) {
        subName = space.name.split('—')[1].trim();
    } else {
        subName = space.name;
    }
    ctx.fillStyle = '#1c2733';
    ctx.font = 'bold 140px Arial, sans-serif';
    const bodyY = headerH + (h - headerH) * 0.40;
    _wrapText(ctx, subName, w / 2, bodyY, w - 60, 150);

    // Price area — left empty, filled dynamically by updateSpaceInfo()
    // (bottom region reserved for rent display)
}

function _drawCornerCard(ctx, w, h, space, index) {
    // NOTE: Rotation is handled by _createSpaceTexture (90° multiples).
    // This function draws in normal canvas space — no internal rotation needed.
    // This avoids black patches from non-90° rotations.

    const cornerThemes = {
        0:  { bg1: '#1b5e20', bg2: '#388e3c', accent: '#a5d6a7', title: 'INÍCIO',      sub: 'Receba $500' },
        10: { bg1: '#b71c1c', bg2: '#d32f2f', accent: '#ffcdd2', title: 'INTERDIÇÃO',   sub: 'Pague $500 ou tire dupla' },
        20: { bg1: '#0d47a1', bg2: '#1976d2', accent: '#bbdefb', title: 'SIPAT',         sub: 'Evento SST / Premiação!' },
        30: { bg1: '#4a148c', bg2: '#7b1fa2', accent: '#ce93d8', title: 'APORTE',        sub: 'de Capital' },
    };
    const t = cornerThemes[index] || cornerThemes[0];

    // Full background gradient — covers entire canvas
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, t.bg1);
    grad.addColorStop(1, t.bg2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle grid pattern
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 2;
    for (let i = 0; i < w; i += 80) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
    }

    // Corner border glow
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 16;
    ctx.strokeRect(8, 8, w - 16, h - 16);

    // Title — large, centered, with strong shadow
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ffffff';
    const titleSize = t.title.length > 7 ? 120 : 160;
    ctx.font = `bold ${titleSize}px Arial, sans-serif`;
    ctx.fillText(t.title, w / 2, h * 0.42);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.font = '72px Arial, sans-serif';
    ctx.fillStyle = t.accent;
    ctx.fillText(t.sub, w / 2, h * 0.65);

    // Decorative line separator
    ctx.strokeStyle = t.accent;
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(w * 0.2, h * 0.52);
    ctx.lineTo(w * 0.8, h * 0.52);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
}

function _drawCartaSST(ctx, w, h) {
    ctx.fillStyle = '#1a237e';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 260px Arial, sans-serif';
    ctx.fillText('\u2753', w / 2, h * 0.36);
    ctx.font = 'bold 120px Arial, sans-serif';
    ctx.fillText('Carta', w / 2, h * 0.66);
    ctx.fillText('SST', w / 2, h * 0.82);
}

function _drawSesmtCard(ctx, w, h, space) {
    ctx.fillStyle = '#546e7a';
    ctx.fillRect(0, 0, w, h);

    // Icon at top
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '160px Arial, sans-serif';
    ctx.fillText(space.icon || '\ud83e\uddd1', w / 2, h * 0.16);

    // Name — large, wraps to 2 lines
    ctx.font = 'bold 130px Arial, sans-serif';
    _wrapText(ctx, space.name, w / 2, h * 0.48, w - 60, 140);

    // Price area — left empty, filled dynamically by updateSpaceInfo()
}

function _drawTaxCard(ctx, w, h, space) {
    ctx.fillStyle = '#37474f';
    ctx.fillRect(0, 0, w, h);

    // Icon at top
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '160px Arial, sans-serif';
    ctx.fillText(space.icon || '\ud83d\udd75\ufe0f', w / 2, h * 0.18);

    // Name — large, wraps to 2 lines
    ctx.font = 'bold 130px Arial, sans-serif';
    _wrapText(ctx, space.name, w / 2, h * 0.55, w - 60, 140);
}

function _drawGenericCard(ctx, w, h, space) {
    ctx.fillStyle = '#78909c';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (space.icon) {
        ctx.font = '220px Arial, sans-serif';
        ctx.fillText(space.icon, w / 2, h * 0.35);
    }
    ctx.font = 'bold 90px Arial, sans-serif';
    _wrapText(ctx, space.name, w / 2, h * 0.72, w - 40, 100);
}

function _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    const lines = [];
    for (const word of words) {
        const testLine = line ? line + ' ' + word : word;
        if (ctx.measureText(testLine).width > maxWidth && line) {
            lines.push(line);
            line = word;
        } else {
            line = testLine;
        }
    }
    if (line) lines.push(line);
    const startY = y - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
}

// Space meshes array for runtime access
const _spaceMeshes = [];
const _ownerIndicators = [];
const _spaceCanvases = [];   // canvas element per space (for re-drawing)
const _spaceTextures = [];   // THREE.CanvasTexture per space (for needsUpdate)
const _sipatBadges = [];     // SIPAT star sprites per space
let _boardGroup = null;
let _centerTextMesh = null;
let _floatTime = 0;

export const Board3D = {
    spaceMeshes: _spaceMeshes,

    getSpacePosition(index) {
        return getSpaceWorldPos(index);
    },

    init() {
        _boardGroup = new THREE.Group();
        _boardGroup.name = 'board';

        // === MAIN PLATFORM (floating board with extrusion) ===
        this._createPlatform();

        // === BOARD SPACES (40 slots) ===
        this._createSpaces();

        // === CENTER TEXT "BANCO SST" ===
        this._createCenterText();

        Scene3D.scene.add(_boardGroup);

        // Floating animation
        Scene3D.onAnimate((delta) => {
            _floatTime += delta * 0.5;
            _boardGroup.position.y = Math.sin(_floatTime) * 0.15;
        });
    },

    _createPlatform() {
        // Main board body
        const boardSize = BOARD_HALF * 2 + 1;
        const platformGeo = new THREE.BoxGeometry(boardSize, PLATFORM_THICKNESS, boardSize);

        // Create beveled edges look with rounded edge shader
        const platformMat = new THREE.MeshStandardMaterial({
            color: 0x2b3947,
            roughness: 0.4,
            metalness: 0.1,
        });
        const platform = new THREE.Mesh(platformGeo, platformMat);
        platform.position.y = PLATFORM_Y;
        platform.castShadow = true;
        platform.receiveShadow = true;
        _boardGroup.add(platform);

        // Top face (playing surface — beige)
        const surfaceGeo = new THREE.BoxGeometry(boardSize - 0.2, 0.05, boardSize - 0.2);
        const surfaceMat = new THREE.MeshStandardMaterial({
            color: 0xf5e6c8,
            roughness: 0.7,
            metalness: 0.0,
        });
        const surface = new THREE.Mesh(surfaceGeo, surfaceMat);
        surface.position.y = PLATFORM_Y + PLATFORM_THICKNESS / 2 + 0.025;
        surface.receiveShadow = true;
        _boardGroup.add(surface);

        // Edge glow strip
        const edgeGeo = new THREE.BoxGeometry(boardSize + 0.1, 0.08, boardSize + 0.1);
        const edgeMat = new THREE.MeshStandardMaterial({
            color: 0x14202c,
            roughness: 0.2,
            metalness: 0.6,
            emissive: 0x112233,
            emissiveIntensity: 0.3,
        });
        const edge = new THREE.Mesh(edgeGeo, edgeMat);
        edge.position.y = PLATFORM_Y + PLATFORM_THICKNESS / 2;
        _boardGroup.add(edge);

        // Bottom glow (underside of floating board)
        const glowGeo = new THREE.PlaneGeometry(boardSize * 0.8, boardSize * 0.8);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x40a2ff,
            transparent: true,
            opacity: 0.08,
            side: THREE.DoubleSide,
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.rotation.x = Math.PI / 2;
        glow.position.y = PLATFORM_Y - PLATFORM_THICKNESS / 2 - 0.1;
        _boardGroup.add(glow);
    },

    _createSpaces() {
        BOARD_DATA.forEach((space, index) => {
            const pos = getSpaceWorldPos(index);
            const isCorner = space.type === 'corner';
            const size = isCorner ? CORNER_SIZE : SPACE_SIZE;
            const depth = size; // All spaces are square, aligned with corners

            // Determine orientation for non-corner spaces
            let sizeX = size, sizeZ = depth;
            if (index > 10 && index < 20) { sizeX = depth; sizeZ = size; }   // left
            if (index > 30 && index < 40) { sizeX = depth; sizeZ = size; }   // right

            // Base (side) color
            let sideColor = 0xe5ebf0;
            let emissive = 0x000000;
            let emissiveIntensity = 0;

            if (space.type === 'property') {
                sideColor = resolveColor(space.color);
                emissive = sideColor;
                emissiveIntensity = 0.15;
            } else if (space.type === 'corner') {
                // Each corner has its own color theme
                const cornerColors = {
                    0:  { side: 0x2e7d32, emit: 0x4caf50 },   // INÍCIO — green
                    10: { side: 0xc62828, emit: 0xff1744 },    // INTERDIÇÃO — red
                    20: { side: 0x1565c0, emit: 0x42a5f5 },    // SIPAT — blue
                    30: { side: 0x6a1b9a, emit: 0xab47bc },    // APORTE — purple
                };
                const cc = cornerColors[index] || { side: 0xffde59, emit: 0xffde59 };
                sideColor = cc.side;
                emissive = cc.emit;
                emissiveIntensity = 0.25;
            } else if (space.type === 'card') {
                sideColor = 0x1a237e;
                emissive = 0x2233ff;
                emissiveIntensity = 0.1;
            } else if (space.type === 'sesmt') {
                sideColor = 0x546e7a;
                emissive = 0x78909c;
                emissiveIntensity = 0.1;
            } else if (space.type === 'tax') {
                sideColor = 0x37474f;
                emissive = 0xff4444;
                emissiveIntensity = 0.1;
            }

            const sideMat = new THREE.MeshStandardMaterial({
                color: sideColor,
                roughness: 0.5,
                metalness: 0.15,
                emissive,
                emissiveIntensity,
            });

            // Canvas texture for the top face
            const topTex = _createSpaceTexture(space, index, isCorner);
            const topMat = new THREE.MeshStandardMaterial({
                map: topTex,
                roughness: 0.55,
                metalness: 0.05,
            });

            // BoxGeometry has 6 faces: +x, -x, +y, -y, +z, -z
            // We want the top (+y, index 2) to have the canvas texture, sides get sideColor
            const geo = new THREE.BoxGeometry(sizeX, SPACE_HEIGHT, sizeZ);
            const materials = [
                sideMat,  // +x
                sideMat,  // -x
                topMat,   // +y  (TOP — with card info)
                sideMat,  // -y
                sideMat,  // +z
                sideMat,  // -z
            ];

            const mesh = new THREE.Mesh(geo, materials);
            mesh.position.copy(pos);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData = { spaceIndex: index, spaceData: space };

            // Corner special models (larger, unique shapes)
            if (isCorner) {
                this._addCornerDecoration(mesh, space, index);
            }

            // Owner flag (hidden by default) — colored flag on a pole
            const flagGroup = new THREE.Group();
            flagGroup.visible = false;

            // Pole
            const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.4, 6);
            const poleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.6, roughness: 0.2 });
            const pole = new THREE.Mesh(poleGeo, poleMat);
            pole.position.y = 1.2;
            pole.castShadow = true;
            flagGroup.add(pole);

            // Flag banner (triangle shape)
            const flagShape = new THREE.Shape();
            flagShape.moveTo(0, 0);
            flagShape.lineTo(1.2, 0.3);
            flagShape.lineTo(0, 0.8);
            flagShape.lineTo(0, 0);
            const flagGeo = new THREE.ShapeGeometry(flagShape);
            const flagMat = new THREE.MeshStandardMaterial({
                color: 0x000000,
                emissive: 0x000000,
                emissiveIntensity: 0.5,
                roughness: 0.4,
                metalness: 0.1,
                side: THREE.DoubleSide,
            });
            const flag = new THREE.Mesh(flagGeo, flagMat);
            flag.position.set(0.06, 1.8, 0);
            flag.name = 'flagBanner';
            flag.castShadow = true;
            flagGroup.add(flag);

            flagGroup.position.y = SPACE_HEIGHT / 2;
            mesh.add(flagGroup);
            _ownerIndicators[index] = flagGroup;

            _spaceMeshes[index] = mesh;
            _boardGroup.add(mesh);
        });
    },

    _addCornerDecoration(mesh, space, index) {
        const y = SPACE_HEIGHT / 2 + 0.01;

        if (index === 0) {
            // ═══ INÍCIO — Starting gate with checkered banner ═══
            const poleMat = new THREE.MeshStandardMaterial({
                color: 0xeeeeee, roughness: 0.25, metalness: 0.5,
            });
            // Two tall poles
            const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8);
            const pL = new THREE.Mesh(poleGeo, poleMat);
            pL.position.set(-1.0, y + 1.1, 0);
            pL.castShadow = true;
            mesh.add(pL);
            const pR = new THREE.Mesh(poleGeo, poleMat);
            pR.position.set(1.0, y + 1.1, 0);
            pR.castShadow = true;
            mesh.add(pR);

            // Arch bar on top
            const archGeo = new THREE.BoxGeometry(2.3, 0.18, 0.18);
            const archMat = new THREE.MeshStandardMaterial({
                color: 0x4caf50, emissive: 0x4caf50, emissiveIntensity: 0.4,
                roughness: 0.2, metalness: 0.4,
            });
            const arch = new THREE.Mesh(archGeo, archMat);
            arch.position.set(0, y + 2.2, 0);
            arch.castShadow = true;
            mesh.add(arch);

            // Checkered banner
            const bGeo = new THREE.PlaneGeometry(2.0, 0.6);
            const bCv = document.createElement('canvas');
            bCv.width = 256; bCv.height = 64;
            const bc = bCv.getContext('2d');
            const sq = 32;
            for (let r = 0; r < 2; r++)
                for (let c = 0; c < 8; c++) {
                    bc.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#111111';
                    bc.fillRect(c * sq, r * sq, sq, sq);
                }
            const bTex = new THREE.CanvasTexture(bCv);
            const bMat = new THREE.MeshStandardMaterial({ map: bTex, side: THREE.DoubleSide, roughness: 0.5 });
            const banner = new THREE.Mesh(bGeo, bMat);
            banner.position.set(0, y + 1.85, 0);
            banner.castShadow = true;
            mesh.add(banner);

            // Green GO arrow
            const aShape = new THREE.Shape();
            aShape.moveTo(0, 0.4);
            aShape.lineTo(-0.3, 0); aShape.lineTo(-0.12, 0);
            aShape.lineTo(-0.12, -0.3); aShape.lineTo(0.12, -0.3);
            aShape.lineTo(0.12, 0); aShape.lineTo(0.3, 0);
            aShape.closePath();
            const aGeo = new THREE.ExtrudeGeometry(aShape, { depth: 0.12, bevelEnabled: false });
            const aMat = new THREE.MeshStandardMaterial({
                color: 0x66bb6a, emissive: 0x66bb6a, emissiveIntensity: 0.7,
                roughness: 0.1, metalness: 0.4,
            });
            const arrw = new THREE.Mesh(aGeo, aMat);
            arrw.position.set(0, y + 2.45, -0.06);
            arrw.castShadow = true;
            mesh.add(arrw);

        } else if (index === 10) {
            // ═══ INTERDIÇÃO — Two traffic cones + zebra tape ═══
            const orangeMat = new THREE.MeshStandardMaterial({
                color: 0xff6d00, emissive: 0xff6d00, emissiveIntensity: 0.15,
                roughness: 0.45, metalness: 0.1,
            });
            const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
            const baseMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });

            // Two cones spaced apart
            [[-0.65, 0], [0.65, 0]].forEach(([cx, cz]) => {
                // Base
                const bGeo = new THREE.BoxGeometry(0.6, 0.08, 0.6);
                const base = new THREE.Mesh(bGeo, baseMat);
                base.position.set(cx, y + 0.04, cz);
                mesh.add(base);
                // Cone
                const cGeo = new THREE.ConeGeometry(0.25, 1.2, 12);
                const cone = new THREE.Mesh(cGeo, orangeMat);
                cone.position.set(cx, y + 0.68, cz);
                cone.castShadow = true;
                mesh.add(cone);
                // White stripe
                const sGeo = new THREE.CylinderGeometry(0.17, 0.20, 0.15, 12);
                const stripe = new THREE.Mesh(sGeo, whiteMat);
                stripe.position.set(cx, y + 0.70, cz);
                mesh.add(stripe);
                // Second white stripe higher
                const s2Geo = new THREE.CylinderGeometry(0.10, 0.13, 0.12, 12);
                const stripe2 = new THREE.Mesh(s2Geo, whiteMat);
                stripe2.position.set(cx, y + 1.0, cz);
                mesh.add(stripe2);
            });

            // Zebra tape between cones (canvas textured plane)
            const tCv = document.createElement('canvas');
            tCv.width = 256; tCv.height = 48;
            const tc = tCv.getContext('2d');
            for (let i = 0; i < 20; i++) {
                tc.fillStyle = i % 2 === 0 ? '#ffeb3b' : '#111111';
                tc.fillRect(i * 13, 0, 13, 48);
            }
            const tTex = new THREE.CanvasTexture(tCv);
            const tMat = new THREE.MeshStandardMaterial({ map: tTex, side: THREE.DoubleSide, roughness: 0.5 });
            // Lower tape
            const tpGeo = new THREE.PlaneGeometry(1.3, 0.15);
            const tp1 = new THREE.Mesh(tpGeo, tMat);
            tp1.position.set(0, y + 0.65, 0);
            mesh.add(tp1);
            // Upper tape (slightly sagging)
            const tp2 = new THREE.Mesh(tpGeo.clone(), tMat);
            tp2.position.set(0, y + 1.0, 0);
            mesh.add(tp2);

            // Red warning light
            const lGeo = new THREE.SphereGeometry(0.12, 10, 8);
            const lMat = new THREE.MeshStandardMaterial({
                color: 0xff1744, emissive: 0xff0000, emissiveIntensity: 1.2, roughness: 0.05,
            });
            const light = new THREE.Mesh(lGeo, lMat);
            light.position.set(-0.65, y + 1.38, 0);
            mesh.add(light);

        } else if (index === 20) {
            // ═══ SIPAT — Green safety cross (first-aid / SST symbol) ═══
            const crossMat = new THREE.MeshStandardMaterial({
                color: 0x2e7d32, emissive: 0x43a047, emissiveIntensity: 0.5,
                roughness: 0.15, metalness: 0.3,
            });

            // Cross shape (extruded)
            const cr = new THREE.Shape();
            const a = 0.22, b = 0.65; // half-arm width, half-arm length
            cr.moveTo(-a, b);  cr.lineTo(a, b);
            cr.lineTo(a, a);   cr.lineTo(b, a);
            cr.lineTo(b, -a);  cr.lineTo(a, -a);
            cr.lineTo(a, -b);  cr.lineTo(-a, -b);
            cr.lineTo(-a, -a); cr.lineTo(-b, -a);
            cr.lineTo(-b, a);  cr.lineTo(-a, a);
            cr.closePath();
            const crGeo = new THREE.ExtrudeGeometry(cr, {
                depth: 0.2, bevelEnabled: true, bevelThickness: 0.04,
                bevelSize: 0.04, bevelSegments: 2,
            });
            const cross = new THREE.Mesh(crGeo, crossMat);
            cross.position.set(0, y + 1.0, -0.1);
            cross.castShadow = true;
            mesh.add(cross);

            // White backing circle behind the cross
            const circGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.08, 24);
            const circMat = new THREE.MeshStandardMaterial({
                color: 0xffffff, roughness: 0.4, metalness: 0.05,
            });
            const circle = new THREE.Mesh(circGeo, circMat);
            circle.position.set(0, y + 0.04, 0);
            circle.castShadow = true;
            mesh.add(circle);

            // Green ring border around the circle
            const ringGeo = new THREE.TorusGeometry(0.85, 0.06, 8, 32);
            const ringMat = new THREE.MeshStandardMaterial({
                color: 0x1b5e20, emissive: 0x2e7d32, emissiveIntensity: 0.3,
                roughness: 0.2, metalness: 0.4,
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = -Math.PI / 2;
            ring.position.set(0, y + 0.09, 0);
            mesh.add(ring);

        } else if (index === 30) {
            // ═══ APORTE — Stack of gold coins + dollar bill ═══
            const goldMat = new THREE.MeshStandardMaterial({
                color: 0xffd700, emissive: 0xffa000, emissiveIntensity: 0.45,
                roughness: 0.08, metalness: 0.9,
            });

            // Stack of coins (3 layers, slightly offset for realism)
            const coinGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 20);
            const offsets = [
                [0, 0.05, 0],
                [0.04, 0.15, -0.03],
                [-0.02, 0.25, 0.02],
                [0.03, 0.35, -0.01],
                [-0.01, 0.45, 0.03],
            ];
            offsets.forEach(([cx, cy, cz]) => {
                const coin = new THREE.Mesh(coinGeo, goldMat);
                coin.position.set(cx, y + cy, cz);
                coin.castShadow = true;
                mesh.add(coin);
            });

            // Dollar bill (green rectangle with $ canvas texture)
            const billCv = document.createElement('canvas');
            billCv.width = 256; billCv.height = 128;
            const bc = billCv.getContext('2d');
            // Green bill background
            bc.fillStyle = '#2e7d32';
            bc.fillRect(0, 0, 256, 128);
            // Inner border
            bc.strokeStyle = '#a5d6a7';
            bc.lineWidth = 6;
            bc.strokeRect(10, 10, 236, 108);
            // $ symbol
            bc.fillStyle = '#c8e6c9';
            bc.font = 'bold 80px Arial';
            bc.textAlign = 'center';
            bc.textBaseline = 'middle';
            bc.fillText('$', 128, 68);
            const billTex = new THREE.CanvasTexture(billCv);
            const billMat = new THREE.MeshStandardMaterial({
                map: billTex, side: THREE.DoubleSide, roughness: 0.6,
            });
            const billGeo = new THREE.PlaneGeometry(1.2, 0.6);
            // Bill leaning against the coin stack
            const bill = new THREE.Mesh(billGeo, billMat);
            bill.position.set(0, y + 0.8, 0.05);
            bill.rotation.x = -0.15;
            bill.castShadow = true;
            mesh.add(bill);

            // A few scattered coins around
            const smallCoin = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 14);
            [[0.7, 0.03, 0.5], [-0.6, 0.03, -0.4], [0.5, 0.03, -0.6]].forEach(([cx2, cy2, cz2]) => {
                const c = new THREE.Mesh(smallCoin, goldMat);
                c.position.set(cx2, y + cy2, cz2);
                c.rotation.x = Math.PI * 0.4 * (Math.random() - 0.5);
                c.castShadow = true;
                mesh.add(c);
            });

            // Purple base pedestal
            const baseGeo = new THREE.CylinderGeometry(0.6, 0.7, 0.1, 16);
            const baseMat = new THREE.MeshStandardMaterial({
                color: 0x4a148c, emissive: 0x6a1b9a, emissiveIntensity: 0.2,
                roughness: 0.25, metalness: 0.3,
            });
            const base = new THREE.Mesh(baseGeo, baseMat);
            base.position.y = y + 0.0;
            base.castShadow = true;
            mesh.add(base);
        }
    },

    _createCenterText() {
        const textGroup = new THREE.Group();
        textGroup.name = 'centerText';
        const topY = PLATFORM_Y + PLATFORM_THICKNESS / 2;

        // Beige center surface (covers entire inner area)
        const innerSize = (BOARD_HALF - CORNER_SIZE) * 2 - 1;
        const surfaceGeo = new THREE.BoxGeometry(innerSize, 0.06, innerSize);
        const surfaceMat = new THREE.MeshStandardMaterial({
            color: 0xf5e6c8,
            roughness: 0.7,
            metalness: 0.0,
        });
        const surface = new THREE.Mesh(surfaceGeo, surfaceMat);
        surface.position.y = topY + 0.03;
        surface.receiveShadow = true;
        textGroup.add(surface);

        // 2D text painted on board via canvas texture
        const cvW = 1024, cvH = 1024;
        const cv = document.createElement('canvas');
        cv.width = cvW; cv.height = cvH;
        const ctx = cv.getContext('2d');

        // Transparent background — the beige surface shows through
        ctx.clearRect(0, 0, cvW, cvH);

        // Draw text
        ctx.fillStyle = '#1a1a1a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.font = 'bold 180px Arial, Helvetica, sans-serif';
        ctx.fillText('BANCO', cvW / 2, cvH / 2 - 120);

        ctx.font = 'bold 240px Arial, Helvetica, sans-serif';
        ctx.fillText('SST', cvW / 2, cvH / 2 + 140);

        const tex = new THREE.CanvasTexture(cv);
        tex.anisotropy = 8;

        const planeSize = innerSize * 0.85;
        const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
        const planeMat = new THREE.MeshStandardMaterial({
            map: tex,
            transparent: true,
            roughness: 0.8,
            metalness: 0.0,
            depthWrite: false,
        });
        const planeMesh = new THREE.Mesh(planeGeo, planeMat);
        // Lay flat on board
        planeMesh.rotation.x = -Math.PI / 2;
        // Rotate 90° CCW then align to camera (-45°): -45° + 90° = +45°
        planeMesh.rotation.z = Math.PI / 4;
        planeMesh.position.y = topY + 0.07;
        planeMesh.receiveShadow = true;
        textGroup.add(planeMesh);

        _boardGroup.add(textGroup);
        _centerTextMesh = textGroup;
    },

    // === PUBLIC API ===

    setSpaceHighlight(index, active) {
        const mesh = _spaceMeshes[index];
        if (!mesh) return;
        // material can be an array (multi-material) or single
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        if (active) {
            mats.forEach(m => { if (m.emissiveIntensity !== undefined) m.emissiveIntensity = 0.6; });
            mesh.scale.y = 1.5;
        } else {
            const space = BOARD_DATA[index];
            const base = space.type === 'corner' ? 0.2 : 0.15;
            mats.forEach(m => { if (m.emissiveIntensity !== undefined) m.emissiveIntensity = base; });
            mesh.scale.y = 1.0;
        }
    },

    setSpaceOwner(index, colorHex, level) {
        const flagGroup = _ownerIndicators[index];
        if (!flagGroup) return;
        const color = typeof colorHex === 'string' ? parseInt(colorHex.replace('#', ''), 16) : colorHex;
        const banner = flagGroup.getObjectByName('flagBanner');
        if (banner) {
            banner.material.color.setHex(color);
            banner.material.emissive.setHex(color);
        }

        // Scale flag by level for visual progression
        const lvl = level || 1;
        const pole = flagGroup.children[0]; // pole mesh
        if (pole) {
            const poleHeight = 1.6 + lvl * 0.4; // 2.0 → 2.4 → 2.8 → 3.2
            pole.scale.y = poleHeight / 2.4;
            pole.position.y = poleHeight / 2;
        }
        if (banner) {
            const bannerScale = 0.7 + lvl * 0.2; // 0.9 → 1.1 → 1.3 → 1.5
            banner.scale.set(bannerScale, bannerScale, 1);
            banner.position.y = (pole ? (1.6 + lvl * 0.4) : 1.8) + 0.1;
            // Higher levels glow more
            banner.material.emissiveIntensity = 0.3 + lvl * 0.2;
        }

        // Add/update level icon sprite on the ground next to flag (only for level 2+)
        const existingIcon = flagGroup.getObjectByName('levelIcon');
        if (existingIcon) flagGroup.remove(existingIcon);

        if (lvl >= 2 && lvl <= 4) {
            const iconCanvas = document.createElement('canvas');
            iconCanvas.width = 128;
            iconCanvas.height = 128;
            const ictx = iconCanvas.getContext('2d');
            const icons = { 2: '📋', 3: '⚙️', 4: '🏆' };
            ictx.font = '90px Arial';
            ictx.textAlign = 'center';
            ictx.textBaseline = 'middle';
            ictx.fillText(icons[lvl] || '📋', 64, 64);
            const iconTex = new THREE.CanvasTexture(iconCanvas);
            iconTex.colorSpace = THREE.SRGBColorSpace;
            const iconMat = new THREE.SpriteMaterial({ map: iconTex, transparent: true, depthTest: false });
            const iconSprite = new THREE.Sprite(iconMat);
            iconSprite.name = 'levelIcon';
            // 150% of flag banner size (3x original), placed on the ground next to the pole
            iconSprite.scale.set(1.5, 1.5, 1);
            iconSprite.position.set(0.6, 0.5, 0);
            flagGroup.add(iconSprite);
        }

        flagGroup.visible = true;
    },

    pulseSpace(index) {
        const mesh = _spaceMeshes[index];
        if (!mesh) return;
        const origY = mesh.scale.y;
        mesh.scale.y = 2.0;
        setTimeout(() => { mesh.scale.y = origY; }, 300);
    },

    /**
     * Update the bottom portion of a space's texture to show current rent.
     * Uses same rotation transform as original card drawing.
     */
    updateSpaceInfo(index, rentText) {
        const canvas = _spaceCanvases[index];
        const tex = _spaceTextures[index];
        if (!canvas || !tex) return;

        const space = BOARD_DATA[index];
        if (!space || (space.type !== 'property' && space.type !== 'sesmt')) return;

        const w = canvas.width;
        const h = canvas.height;
        const ctx = canvas.getContext('2d');

        // Reset transform then re-apply same rotation used when card was first drawn
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.save();
        const rotation = canvas._rotation || 0;
        if (rotation !== 0) {
            ctx.translate(w / 2, h / 2);
            ctx.rotate(rotation * Math.PI / 180);
            ctx.translate(-w / 2, -h / 2);
        }

        // Clear only the bottom rent area (last 18% of canvas in logical space)
        const rentAreaY = Math.round(h * 0.82);
        const bgColor = space.type === 'sesmt' ? '#546e7a' : '#e5ebf0';
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, rentAreaY, w, h - rentAreaY);

        // Draw rent value (centered in rent area)
        if (rentText) {
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 161px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(rentText, w / 2, rentAreaY + (h - rentAreaY) * 0.50);
        }

        ctx.restore();

        // Force Three.js to re-upload the canvas texture to GPU
        tex.image = canvas;
        tex.source.data = canvas;
        tex.needsUpdate = true;
    },

    /**
     * Add a SIPAT star badge floating above the given space.
     */
    setSipatBadge(spaceId) {
        // Remove any existing badge first
        this.removeSipatBadge(spaceId);

        const mesh = _spaceMeshes[spaceId];
        if (!mesh) return;

        // Create a canvas for the star sprite
        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.font = `${size * 0.8}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⭐', size / 2, size / 2);

        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(1.2, 1.2, 1);
        sprite.position.set(0, SPACE_HEIGHT / 2 + 0.4, 0);
        mesh.add(sprite);
        _sipatBadges[spaceId] = sprite;
    },

    /**
     * Remove SIPAT star badge from the given space.
     */
    removeSipatBadge(spaceId) {
        const sprite = _sipatBadges[spaceId];
        if (sprite) {
            if (sprite.parent) sprite.parent.remove(sprite);
            if (sprite.material.map) sprite.material.map.dispose();
            sprite.material.dispose();
            _sipatBadges[spaceId] = null;
        }
    },

    /**
     * Let the player click on one of the eligible board spaces (e.g. SIPAT pick).
     * @param {number[]} eligibleIds
     * @returns {Promise<number>} resolves with the chosen space id
     */
    enableSpacePicking(eligibleIds) {
        // Highlight eligible spaces
        eligibleIds.forEach(id => this.setSpaceHighlight(id, true));

        // Pulsing animation for eligible spaces
        let _pulseActive = true;
        const _pulseLoop = () => {
            if (!_pulseActive) return;
            const t = performance.now() * 0.003;
            eligibleIds.forEach(id => {
                const m = _spaceMeshes[id];
                if (m) m.scale.y = 1.0 + 0.25 * Math.sin(t + id * 0.5);
            });
            requestAnimationFrame(_pulseLoop);
        };
        requestAnimationFrame(_pulseLoop);

        return new Promise(resolve => {
            const raycaster = new THREE.Raycaster();
            const pointer = new THREE.Vector2();
            const camera = Scene3D.camera;
            const domElement = Scene3D.renderer.domElement;

            const onPointerMove = (e) => {
                const rect = domElement.getBoundingClientRect();
                pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
                raycaster.setFromCamera(pointer, camera);
                domElement.style.cursor = 'default';
                for (const id of eligibleIds) {
                    const m = _spaceMeshes[id];
                    if (!m) continue;
                    const hits = raycaster.intersectObject(m, true);
                    if (hits.length > 0) {
                        domElement.style.cursor = 'pointer';
                        break;
                    }
                }
            };

            const onClick = (e) => {
                const rect = domElement.getBoundingClientRect();
                pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
                raycaster.setFromCamera(pointer, camera);

                for (const id of eligibleIds) {
                    const m = _spaceMeshes[id];
                    if (!m) continue;
                    const hits = raycaster.intersectObject(m, true);
                    if (hits.length > 0) {
                        _pulseActive = false;
                        domElement.removeEventListener('pointermove', onPointerMove);
                        domElement.removeEventListener('click', onClick);
                        domElement.style.cursor = 'default';
                        eligibleIds.forEach(sid => {
                            this.setSpaceHighlight(sid, false);
                            const sm = _spaceMeshes[sid];
                            if (sm) sm.scale.y = 1.0;
                        });
                        resolve(id);
                        return;
                    }
                }
            };

            domElement.addEventListener('pointermove', onPointerMove);
            domElement.addEventListener('click', onClick);
        });
    },

    getGroup() {
        return _boardGroup;
    }
};
