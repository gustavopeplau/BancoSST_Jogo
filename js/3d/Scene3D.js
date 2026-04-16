// ═══════════════════════════════════════════════════════════
// Scene3D.js — Main 3D Scene, Isometric Camera, Lighting
// Three.js WebGL renderer for Banco SST isometric diorama
// ═══════════════════════════════════════════════════════════

import * as THREE from 'three';

const CAMERA_DISTANCE = 32;
const FRUSTUM_SIZE = 36.75;
const BOBBING_AMPLITUDE = 0.08;
const BOBBING_SPEED = 0.4;
const FOLLOW_FRUSTUM = 20;
const CAMERA_LERP_SPEED = 3.0;
const ZOOM_LERP_SPEED = 2.5;

let _scene, _camera, _renderer, _clock, _animationId;
let _bobbingTime = 0;
let _cameraBaseY = 0;
let _resizeHandler = null;
let _onAnimateCallbacks = [];
let _followEnabled = false;
let _followTarget = null;
let _currentLookAt = null;
let _targetFrustum = FRUSTUM_SIZE;
let _currentFrustum = FRUSTUM_SIZE;
let _container = null;
const _zeroVec = { x: 0, y: 0, z: 0 };

export const Scene3D = {
    scene: null,
    camera: null,
    renderer: null,

    init(containerId = 'board-3d-container') {
        const container = document.getElementById(containerId);
        if (!container) { console.error('Scene3D: container not found:', containerId); return; }

        // Scene
        _scene = new THREE.Scene();
        _scene.background = new THREE.Color(0x1a2332);
        _scene.fog = new THREE.FogExp2(0x1a2332, 0.008);
        this.scene = _scene;

        // Background image
        const bgLoader = new THREE.TextureLoader();
        bgLoader.load('/assets/bg_game.png', (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            _scene.background = tex;
        });

        // Isometric Camera (OrthographicCamera for true isometric)
        const aspect = container.clientWidth / container.clientHeight;
        const frustumSize = FRUSTUM_SIZE;
        _camera = new THREE.OrthographicCamera(
            -frustumSize * aspect / 2,
            frustumSize * aspect / 2,
            frustumSize / 2,
            -frustumSize / 2,
            0.1,
            200
        );
        // Classic isometric angle (45 degrees rotated, ~35.264° elevation)
        _camera.position.set(CAMERA_DISTANCE, CAMERA_DISTANCE * 0.82, CAMERA_DISTANCE);
        _camera.lookAt(0, 0, 0);
        _camera.updateProjectionMatrix();
        _cameraBaseY = _camera.position.y;
        this.camera = _camera;

        // Follow mode vectors
        _followTarget = new THREE.Vector3(0, 0, 0);
        _currentLookAt = new THREE.Vector3(0, 0, 0);
        _container = container;

        // Renderer
        _renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        _renderer.setSize(container.clientWidth, container.clientHeight);
        _renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        _renderer.shadowMap.enabled = true;
        _renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        _renderer.toneMapping = THREE.ACESFilmicToneMapping;
        _renderer.toneMappingExposure = 1.1;
        _renderer.outputColorSpace = THREE.SRGBColorSpace;
        container.appendChild(_renderer.domElement);
        this.renderer = _renderer;

        // Clock
        _clock = new THREE.Clock();

        // Lighting
        this._setupLighting();

        // Environment
        this._setupEnvironment();

        // Resize handler
        _resizeHandler = () => this._onResize(container);
        window.addEventListener('resize', _resizeHandler);

        // Start render loop
        this._animate();
    },

    _setupLighting() {
        // Ambient fill
        const ambient = new THREE.AmbientLight(0x6688aa, 0.6);
        _scene.add(ambient);

        // Main directional (sun)
        const sun = new THREE.DirectionalLight(0xfff4e0, 1.4);
        sun.position.set(15, 25, 10);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.near = 1;
        sun.shadow.camera.far = 80;
        sun.shadow.camera.left = -38;
        sun.shadow.camera.right = 38;
        sun.shadow.camera.top = 38;
        sun.shadow.camera.bottom = -38;
        sun.shadow.bias = -0.001;
        sun.shadow.normalBias = 0.02;
        _scene.add(sun);

        // Fill light from opposite side 
        const fill = new THREE.DirectionalLight(0x8899cc, 0.35);
        fill.position.set(-10, 12, -8);
        _scene.add(fill);

        // Rim light for diorama edge highlight
        const rim = new THREE.PointLight(0xffcc66, 0.4, 50);
        rim.position.set(0, 15, -15);
        _scene.add(rim);

        // Soft hemisphere for ambient gradient
        const hemi = new THREE.HemisphereLight(0x88bbff, 0x445566, 0.3);
        _scene.add(hemi);
    },

    _setupEnvironment() {
        // Floating platform shadow ground (invisible plane for shadow receiving)
        const groundGeo = new THREE.PlaneGeometry(80, 80);
        const groundMat = new THREE.ShadowMaterial({ opacity: 0.25 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -2.5;
        ground.receiveShadow = true;
        _scene.add(ground);

        // Particle dust motes for atmosphere
        const particleCount = 60;
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 40;
            positions[i * 3 + 1] = Math.random() * 15 + 2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
        }
        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.06,
            transparent: true,
            opacity: 0.4,
            sizeAttenuation: true,
        });
        const particles = new THREE.Points(particleGeo, particleMat);
        particles.userData.isParticles = true;
        _scene.add(particles);
    },

    _onResize(container) {
        const w = container.clientWidth;
        const h = container.clientHeight;
        const aspect = w / h;
        const frustumSize = _currentFrustum;

        _camera.left = -frustumSize * aspect / 2;
        _camera.right = frustumSize * aspect / 2;
        _camera.top = frustumSize / 2;
        _camera.bottom = -frustumSize / 2;
        _camera.updateProjectionMatrix();

        _renderer.setSize(w, h);
    },

    _animate() {
        _animationId = requestAnimationFrame(() => this._animate());
        const delta = _clock.getDelta();

        // Camera bobbing + follow
        _bobbingTime += delta * BOBBING_SPEED;
        const bobY = Math.sin(_bobbingTime) * BOBBING_AMPLITUDE;

        // Lerp lookAt toward follow target or board center
        const lookTarget = (_followEnabled && _followTarget) ? _followTarget : _zeroVec;
        _currentLookAt.lerp(lookTarget, 1 - Math.exp(-CAMERA_LERP_SPEED * delta));

        _camera.position.set(
            CAMERA_DISTANCE + _currentLookAt.x,
            _cameraBaseY + bobY + _currentLookAt.y,
            CAMERA_DISTANCE + _currentLookAt.z
        );
        _camera.lookAt(_currentLookAt.x, _currentLookAt.y, _currentLookAt.z);

        // Smooth frustum zoom
        if (Math.abs(_currentFrustum - _targetFrustum) > 0.01 && _container) {
            _currentFrustum += (_targetFrustum - _currentFrustum) * (1 - Math.exp(-ZOOM_LERP_SPEED * delta));
            const aspect = _container.clientWidth / _container.clientHeight;
            _camera.left = -_currentFrustum * aspect / 2;
            _camera.right = _currentFrustum * aspect / 2;
            _camera.top = _currentFrustum / 2;
            _camera.bottom = -_currentFrustum / 2;
            _camera.updateProjectionMatrix();
        }

        // Animate particles
        _scene.traverse(obj => {
            if (obj.userData.isParticles) {
                const pos = obj.geometry.attributes.position;
                for (let i = 0; i < pos.count; i++) {
                    pos.array[i * 3 + 1] += delta * 0.15;
                    if (pos.array[i * 3 + 1] > 18) pos.array[i * 3 + 1] = 2;
                }
                pos.needsUpdate = true;
            }
        });

        // Fire external animation callbacks
        for (const cb of _onAnimateCallbacks) {
            cb(delta);
        }

        _renderer.render(_scene, _camera);
    },

    onAnimate(callback) {
        _onAnimateCallbacks.push(callback);
    },

    removeAnimateCallback(callback) {
        _onAnimateCallbacks = _onAnimateCallbacks.filter(cb => cb !== callback);
    },

    enableFollow(enabled) {
        _followEnabled = enabled;
        _targetFrustum = enabled ? FOLLOW_FRUSTUM : FRUSTUM_SIZE;
        if (!enabled && _followTarget) {
            _followTarget.set(0, 0, 0);
        }
    },

    setFollowTarget(x, y, z) {
        if (_followTarget) _followTarget.set(x, y || 0, z);
    },

    isFollowEnabled() {
        return _followEnabled;
    },

    dispose() {
        if (_animationId) cancelAnimationFrame(_animationId);
        if (_resizeHandler) window.removeEventListener('resize', _resizeHandler);
        if (_renderer) {
            _renderer.dispose();
            _renderer.domElement.remove();
        }
        _onAnimateCallbacks = [];
    }
};
