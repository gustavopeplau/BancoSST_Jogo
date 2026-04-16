// ═══════════════════════════════════════════════════════════
// SpeechBubble3D.js — 3D speech bubbles above characters
// CSS2DRenderer overlay for chat/action messages
// ═══════════════════════════════════════════════════════════

import * as THREE from 'three';
import { Scene3D } from './Scene3D.js';
import { PlayerToken3D } from './PlayerToken3D.js';

const BUBBLE_DURATION = 3000; // ms
const FLOAT_SPEED = 0.5;

let _activeBubbles = [];
let _bubbleAnimCallback = null;

function _createBubbleSprite(text, color = '#ffffff') {
    // Create canvas texture for speech bubble
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 192;
    const ctx = canvas.getContext('2d');

    // Bubble background
    const w = canvas.width, h = canvas.height;
    const radius = 24;
    const padding = 16;

    ctx.fillStyle = 'rgba(20, 32, 44, 0.88)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;

    // Rounded rect
    ctx.beginPath();
    ctx.moveTo(radius + padding, padding);
    ctx.lineTo(w - radius - padding, padding);
    ctx.quadraticCurveTo(w - padding, padding, w - padding, radius + padding);
    ctx.lineTo(w - padding, h - radius - padding - 30);
    ctx.quadraticCurveTo(w - padding, h - padding - 30, w - radius - padding, h - padding - 30);
    // Triangle pointer
    ctx.lineTo(w / 2 + 15, h - padding - 30);
    ctx.lineTo(w / 2, h - padding);
    ctx.lineTo(w / 2 - 15, h - padding - 30);
    ctx.lineTo(radius + padding, h - padding - 30);
    ctx.quadraticCurveTo(padding, h - padding - 30, padding, h - radius - padding - 30);
    ctx.lineTo(padding, radius + padding);
    ctx.quadraticCurveTo(padding, padding, radius + padding, padding);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Word wrap
    const maxWidth = w - padding * 4;
    const words = text.split(' ');
    let lines = [];
    let currentLine = words[0] || '';
    for (let i = 1; i < words.length; i++) {
        const testLine = currentLine + ' ' + words[i];
        if (ctx.measureText(testLine).width > maxWidth) {
            lines.push(currentLine);
            currentLine = words[i];
        } else {
            currentLine = testLine;
        }
    }
    lines.push(currentLine);

    const lineHeight = 36;
    const textY = (h - 30) / 2 - (lines.length - 1) * lineHeight / 2;
    lines.forEach((line, i) => {
        ctx.fillText(line, w / 2, textY + i * lineHeight);
    });

    // Create sprite
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const spriteMat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(4, 1.5, 1);

    return sprite;
}

function _ensureAnimCallback() {
    if (_bubbleAnimCallback) return;
    _bubbleAnimCallback = (delta) => {
        const now = Date.now();
        _activeBubbles = _activeBubbles.filter(b => {
            const elapsed = now - b.createdAt;
            if (elapsed > BUBBLE_DURATION) {
                Scene3D.scene.remove(b.sprite);
                b.sprite.material.map.dispose();
                b.sprite.material.dispose();
                return false;
            }
            // Float upward slightly
            b.sprite.position.y += delta * FLOAT_SPEED;
            // Fade out in last 30%
            const fadeStart = BUBBLE_DURATION * 0.7;
            if (elapsed > fadeStart) {
                b.sprite.material.opacity = 1 - (elapsed - fadeStart) / (BUBBLE_DURATION - fadeStart);
            }
            return true;
        });

        if (_activeBubbles.length === 0 && _bubbleAnimCallback) {
            Scene3D.removeAnimateCallback(_bubbleAnimCallback);
            _bubbleAnimCallback = null;
        }
    };
    Scene3D.onAnimate(_bubbleAnimCallback);
}

export const SpeechBubble3D = {

    show(playerId, text, color) {
        const token = PlayerToken3D.getToken(playerId);
        if (!token) return;

        const sprite = _createBubbleSprite(text, color || '#40a2ff');
        sprite.position.copy(token.position);
        sprite.position.y += 2.5;

        Scene3D.scene.add(sprite);

        _activeBubbles.push({
            sprite,
            playerId,
            createdAt: Date.now(),
        });

        _ensureAnimCallback();
    },

    /** Show a generic bubble at board center (not tied to player) */
    showAtCenter(text, color) {
        const sprite = _createBubbleSprite(text, color || '#f1dd38');
        sprite.position.set(0, 4, 0);

        Scene3D.scene.add(sprite);
        _activeBubbles.push({
            sprite,
            playerId: -1,
            createdAt: Date.now(),
        });
        _ensureAnimCallback();
    },

    clearAll() {
        _activeBubbles.forEach(b => {
            Scene3D.scene.remove(b.sprite);
            b.sprite.material.map.dispose();
            b.sprite.material.dispose();
        });
        _activeBubbles = [];
    }
};
