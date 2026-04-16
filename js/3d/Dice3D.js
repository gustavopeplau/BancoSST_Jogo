// ═══════════════════════════════════════════════════════════
// Dice3D.js — Physics-based 3D dice rolling using cannon-es
// Dice are thrown onto the center of the board, collide and 
// settle before reporting the result.
// The PHYSICS determine the final face — no forced overrides.
// ═══════════════════════════════════════════════════════════

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Scene3D } from './Scene3D.js';

const DICE_SIZE = 1.5;
const THROW_FORCE = 10;
const SETTLE_THRESHOLD = 0.08;
const MAX_SETTLE_TIME = 5000; // ms

let _world = null;
let _dieMeshes = [];
let _dieBodies = [];
let _physicsActive = false;
let _animCallback = null;
let _floorBody = null;
let _diceMaterial = null;

// Pip dot patterns for each face (3x3 grid, 1=pip, 0=empty)
const PIP_LAYOUTS = {
    1: [0,0,0, 0,1,0, 0,0,0],
    2: [0,0,1, 0,0,0, 1,0,0],
    3: [0,0,1, 0,1,0, 1,0,0],
    4: [1,0,1, 0,0,0, 1,0,1],
    5: [1,0,1, 0,1,0, 1,0,1],
    6: [1,0,1, 1,0,1, 1,0,1],
};

// Face normals (which face points up determines value)
const FACE_NORMALS = [
    { value: 1, normal: new THREE.Vector3(0, 1, 0) },   // top
    { value: 6, normal: new THREE.Vector3(0, -1, 0) },  // bottom
    { value: 2, normal: new THREE.Vector3(1, 0, 0) },   // right
    { value: 5, normal: new THREE.Vector3(-1, 0, 0) },  // left
    { value: 3, normal: new THREE.Vector3(0, 0, 1) },   // front
    { value: 4, normal: new THREE.Vector3(0, 0, -1) },  // back
];

function _initPhysics() {
    if (_world) return;
    _world = new CANNON.World({ gravity: new CANNON.Vec3(0, -36, 0) });
    _world.broadphase = new CANNON.NaiveBroadphase();
    _world.solver.iterations = 10;

    // Materials for realistic contact
    const floorMat = new CANNON.Material('floor');
    _diceMaterial = new CANNON.Material('dice');

    // Dice ↔ Floor: moderate bounce, good grip
    _world.addContactMaterial(new CANNON.ContactMaterial(floorMat, _diceMaterial, {
        friction: 0.7,
        restitution: 0.28,
    }));

    // Dice ↔ Dice: slight bounce when they collide
    _world.addContactMaterial(new CANNON.ContactMaterial(_diceMaterial, _diceMaterial, {
        friction: 0.4,
        restitution: 0.35,
    }));

    // Dice ↔ Wall: absorb energy
    const wallMat = new CANNON.Material('wall');
    _world.addContactMaterial(new CANNON.ContactMaterial(wallMat, _diceMaterial, {
        friction: 0.5,
        restitution: 0.15,
    }));

    // Floor (invisible, at board center height)
    // Very thick slab (half-extent Y=10) prevents fast dice from tunnelling through
    const floorShape = new CANNON.Box(new CANNON.Vec3(8, 10, 8));
    _floorBody = new CANNON.Body({ mass: 0, shape: floorShape, material: floorMat });
    _floorBody.position.set(0, 0.7 - 10, 0);   // top surface at y ≈ 0.7
    _world.addBody(_floorBody);

    // Walls (invisible, keep dice in center area)
    const wallShape = new CANNON.Box(new CANNON.Vec3(6, 3, 0.1));
    const wallPositions = [
        [0, 2, 6], [0, 2, -6], [6, 2, 0], [-6, 2, 0]
    ];
    wallPositions.forEach((pos, i) => {
        const wall = new CANNON.Body({ mass: 0, shape: wallShape, material: wallMat });
        wall.position.set(pos[0], pos[1], pos[2]);
        if (i >= 2) {
            wall.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2);
        }
        _world.addBody(wall);
    });
}

function _createDieMesh(idx) {
    const group = new THREE.Group();
    group.name = `die-${idx}`;

    // Main cube
    const geo = new THREE.BoxGeometry(DICE_SIZE, DICE_SIZE, DICE_SIZE);

    // Rounded edges effect via beveling
    const mat = new THREE.MeshStandardMaterial({
        color: 0xf5f5f5,
        roughness: 0.25,
        metalness: 0.05,
    });
    const cube = new THREE.Mesh(geo, mat);
    cube.castShadow = true;
    cube.receiveShadow = true;
    group.add(cube);

    // Add pips on each face as small spheres
    _addPipsToFace(group, 1, new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1));     // top
    _addPipsToFace(group, 6, new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 1));    // bottom
    _addPipsToFace(group, 2, new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0));     // right
    _addPipsToFace(group, 5, new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1, 0));    // left
    _addPipsToFace(group, 3, new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0));     // front
    _addPipsToFace(group, 4, new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, 0));    // back

    return group;
}

function _addPipsToFace(group, value, faceNormal, upVec) {
    const layout = PIP_LAYOUTS[value];
    const half = DICE_SIZE / 2 + 0.01;
    const pipRadius = 0.10;
    const pipGeo = new THREE.SphereGeometry(pipRadius, 8, 6);
    const pipMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });

    // Determine right and up vectors on the face
    const right = new THREE.Vector3().crossVectors(upVec, faceNormal).normalize();
    const up = upVec.clone().normalize();

    const spacing = DICE_SIZE * 0.28;

    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            if (!layout[row * 3 + col]) continue;
            const r = (col - 1) * spacing;
            const u = (1 - row) * spacing;
            const pos = faceNormal.clone().multiplyScalar(half)
                .add(right.clone().multiplyScalar(r))
                .add(up.clone().multiplyScalar(u));
            const pip = new THREE.Mesh(pipGeo, pipMat);
            pip.position.copy(pos);
            group.add(pip);
        }
    }
}

function _createDieBody() {
    const halfSize = DICE_SIZE / 2;
    const shape = new CANNON.Box(new CANNON.Vec3(halfSize, halfSize, halfSize));
    const body = new CANNON.Body({
        mass: 1,
        shape: shape,
        material: _diceMaterial,
        linearDamping: 0.25,
        angularDamping: 0.2,
    });
    return body;
}

function _readDieValue(body) {
    // Which face is pointing up?
    const quat = new THREE.Quaternion(
        body.quaternion.x,
        body.quaternion.y,
        body.quaternion.z,
        body.quaternion.w
    );

    let bestValue = 1;
    let bestDot = -Infinity;

    for (const face of FACE_NORMALS) {
        const worldNormal = face.normal.clone().applyQuaternion(quat);
        const dot = worldNormal.dot(new THREE.Vector3(0, 1, 0));
        if (dot > bestDot) {
            bestDot = dot;
            bestValue = face.value;
        }
    }
    return bestValue;
}

function _syncMeshToBody(mesh, body) {
    mesh.position.set(body.position.x, body.position.y, body.position.z);
    mesh.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
}

function _isDieSettled(body) {
    const v = body.velocity;
    const w = body.angularVelocity;
    return (Math.abs(v.x) + Math.abs(v.y) + Math.abs(v.z)) < SETTLE_THRESHOLD &&
           (Math.abs(w.x) + Math.abs(w.y) + Math.abs(w.z)) < SETTLE_THRESHOLD;
}

export const Dice3D = {

    /**
     * Roll two dice with physics.
     * - Called WITHOUT args → physics determines result (local play).
     * - Called WITH forcedD1/forcedD2 → forces those values (network replay).
     * Returns { d1, d2, total, isDouble }.
     */
    async roll(forcedD1 = null, forcedD2 = null) {
        _initPhysics();

        // Cancel any pending dismiss cleanup
        if (this._dismissTimer) {
            clearTimeout(this._dismissTimer);
            this._dismissTimer = null;
        }

        // Cleanup previous
        this._cleanup();

        // Create two dice
        for (let i = 0; i < 2; i++) {
            const mesh = _createDieMesh(i);
            const body = _createDieBody();

            // Starting position: high drop, spread apart
            const x = (i === 0 ? -1.8 : 1.8) + (Math.random() - 0.5) * 0.5;
            const z = (Math.random() - 0.5) * 1.5;
            body.position.set(x, 20 + Math.random() * 4, z);

            // Random initial orientation so each throw looks different
            body.quaternion.setFromEuler(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );

            // Natural toss: moderate horizontal, gentle downward
            body.velocity.set(
                (Math.random() - 0.5) * THROW_FORCE,
                -(Math.random() * 1.5 + 0.5),
                (Math.random() - 0.5) * THROW_FORCE
            );

            // Good spin for tumbling effect
            body.angularVelocity.set(
                (Math.random() - 0.5) * 22,
                (Math.random() - 0.5) * 22,
                (Math.random() - 0.5) * 22
            );

            _world.addBody(body);
            Scene3D.scene.add(mesh);

            _dieMeshes.push(mesh);
            _dieBodies.push(body);
        }

        _physicsActive = true;

        // Physics step callback
        _animCallback = (delta) => {
            if (!_physicsActive) return;
            const step = Math.min(delta, 1 / 30);
            _world.step(1 / 60, step, 5);
            for (let i = 0; i < _dieMeshes.length; i++) {
                _syncMeshToBody(_dieMeshes[i], _dieBodies[i]);
            }
        };
        Scene3D.onAnimate(_animCallback);

        // Wait for dice to settle
        await this._waitForSettle();

        _physicsActive = false;

        let d1, d2;

        if (forcedD1 !== null && forcedD2 !== null) {
            // Network replay: force specific values (client-side)
            this._forceValue(_dieBodies[0], _dieMeshes[0], forcedD1);
            this._forceValue(_dieBodies[1], _dieMeshes[1], forcedD2);
            d1 = forcedD1;
            d2 = forcedD2;
        } else {
            // Local play: read the ACTUAL physics result
            d1 = _readDieValue(_dieBodies[0]);
            d2 = _readDieValue(_dieBodies[1]);
            // Smooth alignment so the winning face is perfectly level
            await Promise.all([
                this._smoothAlign(_dieBodies[0], _dieMeshes[0], d1),
                this._smoothAlign(_dieBodies[1], _dieMeshes[1], d2),
            ]);
        }

        const isDouble = d1 === d2;

        // Highlight glow on double
        if (isDouble) {
            _dieMeshes.forEach(mesh => {
                mesh.traverse(child => {
                    if (child.isMesh && child.material && child.material.emissive) {
                        child.material.emissive.setHex(0xf1dd38);
                        child.material.emissiveIntensity = 0.5;
                    }
                });
            });
        }

        return { d1, d2, total: d1 + d2, isDouble };
    },

    _waitForSettle() {
        return new Promise(resolve => {
            const startTime = Date.now();
            const check = () => {
                if (Date.now() - startTime > MAX_SETTLE_TIME) {
                    resolve();
                    return;
                }
                if (_dieBodies.length === 2 && _isDieSettled(_dieBodies[0]) && _isDieSettled(_dieBodies[1])) {
                    // Wait a tiny bit more for visual stability
                    setTimeout(resolve, 150);
                    return;
                }
                requestAnimationFrame(check);
            };
            requestAnimationFrame(check);
        });
    },

    /**
     * Smoothly SLERP the die from its current orientation to perfectly
     * align the winning face with world UP. Since physics already placed
     * the face approximately up, the correction is subtle (~200ms).
     */
    _smoothAlign(body, mesh, value) {
        return new Promise(resolve => {
            const targetFace = FACE_NORMALS.find(f => f.value === value);
            if (!targetFace) { resolve(); return; }

            const currentQuat = new THREE.Quaternion(
                body.quaternion.x, body.quaternion.y,
                body.quaternion.z, body.quaternion.w
            );

            // Where is the winning face's normal in world space right now?
            const currentFaceDir = targetFace.normal.clone()
                .applyQuaternion(currentQuat).normalize();

            // Rotation that brings current face direction to exact world UP
            const correction = new THREE.Quaternion()
                .setFromUnitVectors(currentFaceDir, new THREE.Vector3(0, 1, 0));

            // Apply correction on top of current orientation
            const targetQuat = correction.clone().multiply(currentQuat);

            // SLERP over 200ms with ease-out
            const duration = 200;
            const startTime = performance.now();
            const startQuat = currentQuat.clone();

            const animate = (now) => {
                const t = Math.min((now - startTime) / duration, 1);
                const eased = 1 - (1 - t) * (1 - t); // ease-out quadratic

                const q = startQuat.clone().slerp(targetQuat, eased);
                body.quaternion.set(q.x, q.y, q.z, q.w);
                mesh.quaternion.copy(q);

                if (t < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            requestAnimationFrame(animate);
        });
    },

    _forceValue(body, mesh, desiredValue) {
        // Find the face that should point up
        const targetFace = FACE_NORMALS.find(f => f.value === desiredValue);
        if (!targetFace) return;

        // Directly compute a quaternion that aligns target face normal with world UP
        const worldUp = new THREE.Vector3(0, 1, 0);
        const baseQuat = new THREE.Quaternion().setFromUnitVectors(targetFace.normal, worldUp);

        // Add random Y-axis rotation for natural look (Y rotation preserves top face)
        const yRot = new THREE.Quaternion().setFromAxisAngle(worldUp, Math.random() * Math.PI * 2);
        const finalQuat = yRot.multiply(baseQuat);

        // Apply to physics body and sync mesh
        body.quaternion.set(finalQuat.x, finalQuat.y, finalQuat.z, finalQuat.w);
        body.angularVelocity.set(0, 0, 0);
        body.velocity.set(0, 0, 0);
        _syncMeshToBody(mesh, body);
    },

    _cleanup() {
        if (_animCallback) {
            Scene3D.removeAnimateCallback(_animCallback);
            _animCallback = null;
        }
        _dieMeshes.forEach(m => Scene3D.scene.remove(m));
        _dieBodies.forEach(b => _world.removeBody(b));
        _dieMeshes = [];
        _dieBodies = [];
        _physicsActive = false;
    },

    /** Remove dice from scene after animation */
    dismiss() {
        // Fade out
        _dieMeshes.forEach(mesh => {
            mesh.traverse(child => {
                if (child.isMesh && child.material) {
                    child.material.transparent = true;
                }
            });
            let opacity = 1;
            const fade = () => {
                opacity -= 0.05;
                mesh.traverse(child => {
                    if (child.isMesh && child.material) {
                        child.material.opacity = opacity;
                    }
                });
                if (opacity > 0) requestAnimationFrame(fade);
                else Scene3D.scene.remove(mesh);
            };
            setTimeout(fade, 800);
        });
        this._dismissTimer = setTimeout(() => {
            this._dismissTimer = null;
            this._cleanup();
        }, 1500);
    }
};
