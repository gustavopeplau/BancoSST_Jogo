// ═══════════════════════════════════════════════════════════
// PlayerToken3D.js — Low-poly 3D character tokens
// Engenheiro, Técnico, Médico, Enfermeiro SST professionals
// ═══════════════════════════════════════════════════════════

import * as THREE from 'three';
import { Scene3D } from './Scene3D.js';
import { Board3D } from './Board3D.js';
import { SoundManager } from '../utils/SoundManager.js';

const TOKEN_SCALE = 1.4;
const JUMP_HEIGHT = 2.5;
const JUMP_DURATION = 0.28; // seconds per hop
const IDLE_BOB_SPEED = 1.5;
const IDLE_BOB_AMPLITUDE = 0.08;

// ── Worker character with PPE (helmet, vest, boots) ──
function _createLowPolyCharacter(colorHex, pawnType) {
    const group = new THREE.Group();
    const playerColor = new THREE.Color(colorHex);
    const darkPlayerColor = playerColor.clone().multiplyScalar(0.6);

    // Material palette
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5c9a0, roughness: 0.6, metalness: 0.05 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.7, metalness: 0.05 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.8, metalness: 0.1 });
    const bootSoleMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9, metalness: 0.0 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x546e7a, roughness: 0.6, metalness: 0.05 });
    const vestMat = new THREE.MeshStandardMaterial({
        color: playerColor, roughness: 0.35, metalness: 0.1,
        emissive: playerColor, emissiveIntensity: 0.1,
    });
    const helmetMat = new THREE.MeshStandardMaterial({
        color: playerColor, roughness: 0.2, metalness: 0.35,
        emissive: playerColor, emissiveIntensity: 0.08,
    });
    const reflectiveStripMat = new THREE.MeshStandardMaterial({
        color: 0xe0e0e0, roughness: 0.05, metalness: 0.9,
        emissive: 0xffffcc, emissiveIntensity: 0.4,
    });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 });

    // === BOOTS ===
    const bootGeo = new THREE.BoxGeometry(0.28, 0.24, 0.38);
    const soleGeo = new THREE.BoxGeometry(0.30, 0.06, 0.42);
    [-0.22, 0.22].forEach(x => {
        const boot = new THREE.Mesh(bootGeo, bootMat);
        boot.position.set(x, 0.18, 0.02);
        boot.castShadow = true;
        group.add(boot);
        const sole = new THREE.Mesh(soleGeo, bootSoleMat);
        sole.position.set(x, 0.03, 0.02);
        sole.castShadow = true;
        group.add(sole);
    });

    // === LEGS ===
    const legGeo = new THREE.CylinderGeometry(0.11, 0.13, 0.55, 8);
    [-0.22, 0.22].forEach(x => {
        const leg = new THREE.Mesh(legGeo, pantsMat);
        leg.position.set(x, 0.575, 0);
        leg.castShadow = true;
        group.add(leg);
    });

    // === TORSO (shirt) ===
    const torsoGeo = new THREE.CylinderGeometry(0.30, 0.34, 0.65, 10);
    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.y = 1.17;
    torso.castShadow = true;
    group.add(torso);

    // === VEST (hi-vis over torso) ===
    const vestGeo = new THREE.CylinderGeometry(0.32, 0.36, 0.60, 10);
    const vest = new THREE.Mesh(vestGeo, vestMat);
    vest.position.y = 1.17;
    vest.castShadow = true;
    group.add(vest);

    // Reflective horizontal strips on vest
    const stripGeo = new THREE.CylinderGeometry(0.365, 0.365, 0.035, 12);
    [1.0, 1.32].forEach(y => {
        const strip = new THREE.Mesh(stripGeo, reflectiveStripMat);
        strip.position.y = y;
        group.add(strip);
    });

    // === ARMS ===
    const armGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.55, 8);
    [-0.40, 0.40].forEach(x => {
        const arm = new THREE.Mesh(armGeo, shirtMat);
        arm.position.set(x, 1.10, 0);
        arm.rotation.z = x < 0 ? 0.15 : -0.15;
        arm.castShadow = true;
        group.add(arm);

        // Hand
        const handGeo = new THREE.SphereGeometry(0.09, 8, 6);
        const hand = new THREE.Mesh(handGeo, skinMat);
        hand.position.set(x + (x < 0 ? -0.04 : 0.04), 0.80, 0);
        hand.castShadow = true;
        group.add(hand);
    });

    // === NECK ===
    const neckGeo = new THREE.CylinderGeometry(0.10, 0.12, 0.12, 8);
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.y = 1.55;
    group.add(neck);

    // === HEAD ===
    const headGeo = new THREE.SphereGeometry(0.26, 12, 10);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.76;
    head.castShadow = true;
    group.add(head);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.04, 6, 4);
    [-0.10, 0.10].forEach(x => {
        const eye = new THREE.Mesh(eyeGeo, eyeMat);
        eye.position.set(x, 1.80, 0.22);
        group.add(eye);
    });

    // Mouth (subtle line)
    const mouthGeo = new THREE.BoxGeometry(0.10, 0.015, 0.03);
    const mouth = new THREE.Mesh(mouthGeo, eyeMat);
    mouth.position.set(0, 1.70, 0.24);
    group.add(mouth);

    // === HARD HAT (always present — player color) ===
    // Dome
    const helmetDomeGeo = new THREE.SphereGeometry(0.30, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const helmetDome = new THREE.Mesh(helmetDomeGeo, helmetMat);
    helmetDome.position.y = 1.85;
    helmetDome.castShadow = true;
    group.add(helmetDome);

    // Brim
    const brimGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.03, 16);
    const brim = new THREE.Mesh(brimGeo, helmetMat);
    brim.position.y = 1.78;
    group.add(brim);

    // Helmet front band (darker accent)
    const helmetBandGeo = new THREE.CylinderGeometry(0.305, 0.305, 0.04, 16);
    const helmetBandMat = new THREE.MeshStandardMaterial({
        color: darkPlayerColor, roughness: 0.3, metalness: 0.3,
    });
    const helmetBand = new THREE.Mesh(helmetBandGeo, helmetBandMat);
    helmetBand.position.y = 1.82;
    group.add(helmetBand);

    // === TYPE-SPECIFIC PPE EXTRAS ===
    if (pawnType === 'capacete') {
        // Headlamp on helmet
        const lampGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.04, 8);
        const lampMat = new THREE.MeshStandardMaterial({
            color: 0xffee58, emissive: 0xffee58, emissiveIntensity: 0.8, roughness: 0.1,
        });
        const lamp = new THREE.Mesh(lampGeo, lampMat);
        lamp.position.set(0, 1.85, 0.30);
        lamp.rotation.x = Math.PI / 2;
        group.add(lamp);
    } else if (pawnType === 'luva') {
        // Thick work gloves (replace bare hands)
        const gloveGeo = new THREE.SphereGeometry(0.12, 8, 6);
        const gloveMat = new THREE.MeshStandardMaterial({
            color: playerColor, roughness: 0.5, metalness: 0.1,
        });
        [-0.44, 0.44].forEach(x => {
            const glove = new THREE.Mesh(gloveGeo, gloveMat);
            glove.position.set(x + (x < 0 ? -0.04 : 0.04), 0.78, 0);
            glove.castShadow = true;
            group.add(glove);
        });
    } else if (pawnType === 'bota') {
        // Reinforced steel-toe boots (thicker, player-colored top)
        const steelToeGeo = new THREE.BoxGeometry(0.14, 0.08, 0.15);
        const steelToeMat = new THREE.MeshStandardMaterial({
            color: playerColor, roughness: 0.3, metalness: 0.5,
        });
        [-0.22, 0.22].forEach(x => {
            const steelToe = new THREE.Mesh(steelToeGeo, steelToeMat);
            steelToe.position.set(x, 0.22, 0.16);
            steelToe.castShadow = true;
            group.add(steelToe);
        });
    } else if (pawnType === 'colete') {
        // Extra-bright vest with X-pattern reflective strips
        const xStripGeo = new THREE.BoxGeometry(0.04, 0.50, 0.04);
        [-1, 1].forEach(dir => {
            const strip = new THREE.Mesh(xStripGeo, reflectiveStripMat);
            strip.position.set(dir * 0.12, 1.17, 0.33);
            strip.rotation.z = dir * 0.45;
            group.add(strip);
        });
    }

    // === GROUND GLOW (sprite under base) ===
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 128; glowCanvas.height = 128;
    const gctx = glowCanvas.getContext('2d');
    const grad = gctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    const hexStr = '#' + playerColor.getHexString();
    grad.addColorStop(0, hexStr + 'cc');
    grad.addColorStop(0.5, hexStr + '44');
    grad.addColorStop(1, hexStr + '00');
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, 128, 128);
    const glowTex = new THREE.CanvasTexture(glowCanvas);
    const glowSprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0.6, depthWrite: false })
    );
    glowSprite.scale.set(1.8, 1.8, 1);
    glowSprite.position.y = 0.02;
    group.add(glowSprite);

    group.scale.setScalar(TOKEN_SCALE);
    return group;
}

// Track all active tokens
const _tokens = {};
let _idleBobTime = 0;

// Pre-computed 2D offset slots for 1–4 tokens sharing a space
// Spread them in a 2×2 grid pattern relative to center
const SLOT_OFFSETS = {
    1: [[0, 0]],
    2: [[-0.55, -0.35], [0.55, 0.35]],
    3: [[-0.55, -0.45], [0.55, -0.45], [0, 0.50]],
    4: [[-0.55, -0.45], [0.55, -0.45], [-0.55, 0.45], [0.55, 0.45]],
};

/**
 * Compute the world-space (x, z) offset for a given player on a space,
 * considering how many other tokens are also on that space.
 * Returns { dx, dz } to add to the base space position.
 */
function _getSlotOffset(playerId, spaceIndex) {
    // Find all tokens currently on this space (including the one being placed)
    const idsOnSpace = [];
    for (const [id, tok] of Object.entries(_tokens)) {
        if (tok.userData.currentSpace === spaceIndex) {
            idsOnSpace.push(Number(id));
        }
    }
    // If the moving player isn't counted yet (mid-animation), add them
    if (!idsOnSpace.includes(playerId)) {
        idsOnSpace.push(playerId);
    }
    idsOnSpace.sort((a, b) => a - b);

    const count = Math.min(idsOnSpace.length, 4);
    const slotIndex = idsOnSpace.indexOf(playerId);
    const slots = SLOT_OFFSETS[count];
    const slot = slots[Math.min(slotIndex, count - 1)];

    return { dx: slot[0], dz: slot[1] };
}

/** Redistribute all tokens on a given space to their correct slots */
function _redistributeSpace(spaceIndex, excludePlayerId = -1) {
    const idsOnSpace = [];
    for (const [id, tok] of Object.entries(_tokens)) {
        if (tok.userData.currentSpace === spaceIndex && Number(id) !== excludePlayerId) {
            idsOnSpace.push(Number(id));
        }
    }
    if (idsOnSpace.length <= 1) return; // No need to adjust

    idsOnSpace.sort((a, b) => a - b);
    const base = Board3D.getSpacePosition(spaceIndex);
    const count = Math.min(idsOnSpace.length, 4);
    const slots = SLOT_OFFSETS[count];

    idsOnSpace.forEach((id, i) => {
        const tok = _tokens[id];
        if (!tok || tok.userData.isMoving) return;
        const slot = slots[Math.min(i, count - 1)];
        tok.position.x = base.x + slot[0];
        tok.position.z = base.z + slot[1];
    });
}

export const PlayerToken3D = {

    spawnAll(players) {
        players.forEach(p => {
            const mesh = _createLowPolyCharacter(p.color, p.pawnType || 'capacete');
            mesh.name = `token-${p.id}`;

            mesh.userData = { playerId: p.id, currentSpace: 0, isMoving: false };
            Scene3D.scene.add(mesh);
            _tokens[p.id] = mesh;
        });

        // Position all tokens on start space with proper slots
        const startBase = Board3D.getSpacePosition(0);
        const count = Math.min(players.length, 4);
        const slots = SLOT_OFFSETS[count];
        const sortedIds = players.map(p => p.id).sort((a, b) => a - b);
        sortedIds.forEach((id, i) => {
            const tok = _tokens[id];
            const slot = slots[Math.min(i, count - 1)];
            tok.position.set(startBase.x + slot[0], startBase.y + 0.35, startBase.z + slot[1]);
        });

        // Idle bobbing
        Scene3D.onAnimate((delta) => {
            _idleBobTime += delta * IDLE_BOB_SPEED;
            Object.values(_tokens).forEach((token, i) => {
                if (!token.userData.isMoving) {
                    const base = Board3D.getSpacePosition(token.userData.currentSpace);
                    token.position.y = base.y + 0.35 + Math.sin(_idleBobTime + i * 1.5) * IDLE_BOB_AMPLITUDE;
                }
            });
        });
    },

    async animateHop(playerId, fromSpace, spacesToMove) {
        const token = _tokens[playerId];
        if (!token) return;

        token.userData.isMoving = true;

        // Redistribute tokens left behind on the old space
        _redistributeSpace(fromSpace, playerId);

        for (let step = 1; step <= spacesToMove; step++) {
            let targetIdx = fromSpace + step;
            if (targetIdx > 39) targetIdx -= 40;

            const startPos = token.position.clone();
            const endPos = Board3D.getSpacePosition(targetIdx).clone();
            endPos.y += 0.35;

            // For intermediate hops, go to center; for final hop, use slot
            if (step === spacesToMove) {
                // Temporarily set currentSpace so slot calculation is correct
                token.userData.currentSpace = targetIdx;
                const slot = _getSlotOffset(playerId, targetIdx);
                endPos.x += slot.dx;
                endPos.z += slot.dz;
            }

            // Trail effect — highlight space
            Board3D.pulseSpace(targetIdx);

            // Progressive hop sound (pitch rises toward destination)
            SoundManager.play('step', step, spacesToMove);

            await this._jumpArc(token, startPos, endPos);
            token.userData.currentSpace = targetIdx;
        }

        token.userData.isMoving = false;

        // Landing bounce
        const landY = token.position.y;
        token.position.y = landY + 0.3;
        await this._tweenY(token, landY + 0.3, landY, 0.15);

        // Redistribute all tokens on the landing space
        _redistributeSpace(token.userData.currentSpace);
    },

    _jumpArc(token, start, end) {
        return new Promise(resolve => {
            const duration = JUMP_DURATION * 1000;
            const startTime = performance.now();
            const midY = Math.max(start.y, end.y) + JUMP_HEIGHT;

            const tick = (now) => {
                const t = Math.min((now - startTime) / duration, 1);
                // Ease
                const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

                // XZ linear
                token.position.x = start.x + (end.x - start.x) * ease;
                token.position.z = start.z + (end.z - start.z) * ease;

                // Y parabola
                const yParabola = -4 * (t - 0.5) * (t - 0.5) + 1;
                token.position.y = start.y + (end.y - start.y) * ease + yParabola * JUMP_HEIGHT;

                // Slight rotation during jump
                token.rotation.y = Math.sin(t * Math.PI) * 0.3;

                if (t < 1) {
                    requestAnimationFrame(tick);
                } else {
                    token.position.copy(end);
                    token.rotation.y = 0;
                    resolve();
                }
            };
            requestAnimationFrame(tick);
        });
    },

    _tweenY(obj, fromY, toY, durationSec) {
        return new Promise(resolve => {
            const duration = durationSec * 1000;
            const startTime = performance.now();
            const tick = (now) => {
                const t = Math.min((now - startTime) / duration, 1);
                obj.position.y = fromY + (toY - fromY) * t;
                if (t < 1) requestAnimationFrame(tick);
                else resolve();
            };
            requestAnimationFrame(tick);
        });
    },

    teleport(playerId, spaceIndex) {
        const token = _tokens[playerId];
        if (!token) return;
        const oldSpace = token.userData.currentSpace;
        token.userData.currentSpace = spaceIndex;

        const pos = Board3D.getSpacePosition(spaceIndex);
        const slot = _getSlotOffset(playerId, spaceIndex);
        token.position.set(pos.x + slot.dx, pos.y + 0.35, pos.z + slot.dz);

        // Redistribute tokens on old and new spaces
        _redistributeSpace(oldSpace);
        _redistributeSpace(spaceIndex);
    },

    setJailed(playerId, jailed) {
        const token = _tokens[playerId];
        if (!token) return;
        if (jailed) {
            // Gray out + slight shrink
            token.traverse(child => {
                if (child.isMesh && child.material) {
                    child.material._origColor = child.material.color.getHex();
                    child.material.color.multiplyScalar(0.5);
                }
            });
            token.scale.setScalar(TOKEN_SCALE * 0.8);
        } else {
            token.traverse(child => {
                if (child.isMesh && child.material && child.material._origColor !== undefined) {
                    child.material.color.setHex(child.material._origColor);
                }
            });
            token.scale.setScalar(TOKEN_SCALE);
        }
    },

    setActiveGlow(playerId, active) {
        const token = _tokens[playerId];
        if (!token) return;
        token.traverse(child => {
            if (child.isMesh && child.material && child.material.emissive) {
                child.material.emissiveIntensity = active ? 0.4 : 0.1;
            }
        });
    },

    getToken(playerId) {
        return _tokens[playerId];
    },

    getAllTokens() {
        return _tokens;
    }
};
