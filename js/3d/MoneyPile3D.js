// ═══════════════════════════════════════════════════════════
// MoneyPile3D.js — 3D money piles next to player tokens 
// Visual representation of player balance (bills and coins)
// ═══════════════════════════════════════════════════════════

import * as THREE from 'three';
import { Scene3D } from './Scene3D.js';
import { PlayerToken3D } from './PlayerToken3D.js';

const BILL_SIZE = { w: 0.4, h: 0.02, d: 0.2 };
const COIN_RADIUS = 0.12;
const PILE_OFFSET_X = 0.8;
const MAX_BILLS = 10;  // Visual cap

const _piles = {};

function _billsForAmount(money) {
    // Each visual bill = $200
    return Math.min(Math.max(Math.floor(money / 200), 0), MAX_BILLS);
}

function _buildPile(color, billCount) {
    const group = new THREE.Group();
    group.name = 'money-pile';

    const billMat = new THREE.MeshStandardMaterial({
        color: 0x4caf50,
        roughness: 0.6,
        metalness: 0.1,
        emissive: 0x2e7d32,
        emissiveIntensity: 0.1,
    });

    // Stack of bills
    for (let i = 0; i < billCount; i++) {
        const geo = new THREE.BoxGeometry(BILL_SIZE.w, BILL_SIZE.h, BILL_SIZE.d);
        const bill = new THREE.Mesh(geo, billMat);
        bill.position.y = i * (BILL_SIZE.h + 0.005);
        // Slight random rotation for natural look
        bill.rotation.y = (Math.random() - 0.5) * 0.15;
        bill.position.x += (Math.random() - 0.5) * 0.03;
        bill.position.z += (Math.random() - 0.5) * 0.03;
        bill.castShadow = true;
        group.add(bill);
    }

    // Coins on top
    const coinMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.2,
        metalness: 0.7,
    });
    const coinCount = Math.min(Math.ceil(billCount / 3), 4);
    for (let i = 0; i < coinCount; i++) {
        const coinGeo = new THREE.CylinderGeometry(COIN_RADIUS, COIN_RADIUS, 0.03, 8);
        const coin = new THREE.Mesh(coinGeo, coinMat);
        coin.position.y = billCount * (BILL_SIZE.h + 0.005) + 0.02 + i * 0.035;
        coin.position.x = (Math.random() - 0.5) * 0.2;
        coin.position.z = (Math.random() - 0.5) * 0.1;
        coin.castShadow = true;
        group.add(coin);
    }

    group.scale.setScalar(0.8);
    return group;
}

export const MoneyPile3D = {

    update(playerId, money) {
        const token = PlayerToken3D.getToken(playerId);
        if (!token) return;

        const billCount = _billsForAmount(money);

        // Remove old pile
        if (_piles[playerId]) {
            Scene3D.scene.remove(_piles[playerId]);
            _piles[playerId] = null;
        }

        if (billCount <= 0) return;

        const pile = _buildPile(token.userData.color, billCount);
        // Position next to token
        pile.position.copy(token.position);
        pile.position.x += PILE_OFFSET_X;
        pile.position.y = token.position.y - 0.3;

        Scene3D.scene.add(pile);
        _piles[playerId] = pile;

        // Animate pile appearing (scale up)
        pile.scale.setScalar(0);
        const target = 0.8;
        let t = 0;
        const grow = () => {
            t += 0.05;
            if (t >= 1) {
                pile.scale.setScalar(target);
                return;
            }
            const ease = 1 - Math.pow(1 - t, 3);
            pile.scale.setScalar(target * ease);
            requestAnimationFrame(grow);
        };
        requestAnimationFrame(grow);
    },

    updateAll(players) {
        players.forEach(p => {
            this.update(p.id, p.money);
        });
    },

    dispose() {
        Object.values(_piles).forEach(p => {
            if (p) Scene3D.scene.remove(p);
        });
    }
};
