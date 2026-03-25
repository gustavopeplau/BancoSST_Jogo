import { SoundManager } from '../utils/SoundManager.js';
import { shuffleArray } from '../utils/helpers.js';

export class ModalManager {

    static init() {
        this.overlay    = document.getElementById('modal-overlay');
        this.titleEl    = document.getElementById('modal-title');
        this.textEl     = document.getElementById('modal-text');
        this.actionsDiv = document.getElementById('modal-actions');
        this._activeTimer = null;
    }

    static _open(title, html) {
        if (this._activeTimer) { clearInterval(this._activeTimer); this._activeTimer = null; }
        this.titleEl.innerHTML    = title;
        this.textEl.innerHTML     = html;
        this.actionsDiv.innerHTML = '';
        this.overlay.classList.add('active');
    }

    static closeModal() {
        if (this._activeTimer) { clearInterval(this._activeTimer); this._activeTimer = null; }
        this.overlay.classList.remove('active');
    }

    // ── Modal simples com botão OK ────────────────────────────
    static showOkPrompt(title, html) {
        return new Promise(resolve => {
            this._open(title, html);
            const btn = document.createElement('button');
            btn.className   = 'btn-ok';
            btn.textContent = 'OK — Confirmar';
            btn.onclick = () => { SoundManager.play('click'); this.closeModal(); resolve(true); };
            this.actionsDiv.appendChild(btn);
        });
    }

    // Mapa de siglas → nome completo dos programas
    static PROGRAM_FULL_NAMES = {
        'CIPA':         'Comissão Interna de Prevenção de Acidentes e de Assédio',
        'AET':          'Análise Ergonômica do Trabalho',
        'PCA':          'Programa de Conservação Auditiva',
        'PCMSO':        'Programa de Controle Médico de Saúde Ocupacional',
        'PGR':          'Programa de Gerenciamento de Riscos',
        'LTCAT':        'Laudo Técnico das Condições Ambientais do Trabalho',
        'PCE':          'Plano de Controle de Emergências',
        'SIST.GESTÃO':  'Sistema de Gestão de Segurança e Saúde no Trabalho',
    };

    // ── Comprar propriedade ou profissional SESMT ─────────────
    static askToBuy(spaceData, price) {
        return new Promise(resolve => {
            // Monta nome formatado (programa negrito + sub)
            let mainName = spaceData.name;
            let subName = '';
            if (spaceData.name.includes('—')) {
                const parts = spaceData.name.split('—');
                mainName = parts[0].trim();
                subName = parts[1].trim();
            }

            const isSesmt = spaceData.type === 'sesmt';
            const colorVal = spaceData.color || '#78909c';
            const groupLabel = isSesmt
                ? 'Profissional SESMT'
                : (this.PROGRAM_FULL_NAMES[spaceData.group] || spaceData.group || '');

            const descHtml = spaceData.desc
                ? `<p class="prop-card-desc">${spaceData.desc}</p>` : '';
            const legalHtml = spaceData.legal
                ? `<div class="prop-card-legal">📖 Base legal: ${spaceData.legal}</div>` : '';
            const benefitHtml = spaceData.sesmt_benefit
                ? `<div class="prop-card-benefit">🛡️ ${spaceData.sesmt_benefit}</div>` : '';

            const cardHtml = `
            <div class="prop-modal-card">
                <div class="prop-card-header" style="background:${colorVal}">
                    <span class="prop-card-group">${groupLabel}</span>
                    <span class="prop-card-title">${spaceData.icon || ''} ${mainName}</span>
                    ${subName ? `<span class="prop-card-subtitle">${subName}</span>` : ''}
                </div>
                <div class="prop-card-body">
                    ${descHtml}
                    ${legalHtml}
                    ${benefitHtml}
                    <div class="prop-card-stats">
                        <div class="prop-stat">
                            <span class="prop-stat-label">Preço</span>
                            <span class="prop-stat-value" style="color:#8ae37f">$${price}</span>
                        </div>
                        <div class="prop-stat">
                            <span class="prop-stat-label">Aluguel</span>
                            <span class="prop-stat-value">$${spaceData.rent}</span>
                        </div>
                        ${!isSesmt ? `<div class="prop-stat">
                            <span class="prop-stat-label">Monopólio</span>
                            <span class="prop-stat-value" style="font-size:.75rem">×2 aluguel</span>
                        </div>` : ''}
                    </div>
                </div>
            </div>`;

            this._open(`🏗️ Área Disponível`, cardHtml);
            const buyBtn  = document.createElement('button');
            const passBtn = document.createElement('button');
            buyBtn.className    = 'btn-buy';
            buyBtn.innerHTML    = 'Sim, Comprar 💵';
            passBtn.className   = 'btn-pass';
            passBtn.textContent = 'Passar / Cancelar';
            buyBtn.onclick  = () => { SoundManager.play('click'); this.closeModal(); resolve(true); };
            passBtn.onclick = () => { SoundManager.play('click'); this.closeModal(); resolve(false); };
            this.actionsDiv.append(buyBtn, passBtn);
        });
    }

    // ── Quiz SST com timer e embaralhamento de alternativas ──
    static showQuiz(card) {
        return new Promise(resolve => {
            let resolved = false;
            const finish = (acertou) => {
                if (resolved) return;
                resolved = true;
                this.closeModal();
                resolve(acertou);
            };
            const total = card.tempo || 20;
            let remaining = total;

            // Embaralha opções mantendo rastreamento da resposta correta
            const indexedOptions = card.opcoes.map((txt, i) => ({ txt, originalIndex: i }));
            shuffleArray(indexedOptions);
            const correctShuffledIndex = indexedOptions.findIndex(o => o.originalIndex === card.resposta);

            this._open(
                '🎓 Quiz SST!',
                `<p style="font-size:1.05rem;margin-bottom:10px">${card.pergunta}</p>
                 <div id="quiz-timer-bar-wrap">
                     <div id="quiz-timer-bar" style="width:100%"></div>
                     <span id="quiz-timer-text">${total}s</span>
                 </div>`
            );

            indexedOptions.forEach((opcao, i) => {
                const btn = document.createElement('button');
                btn.className = 'btn-quiz-option';
                btn.innerHTML = `<span class="quiz-letter">${String.fromCharCode(65 + i)}</span>${opcao.txt}`;
                btn.onclick   = () => finish(i === correctShuffledIndex);
                this.actionsDiv.appendChild(btn);
            });

            this._activeTimer = setInterval(() => {
                remaining--;
                const pct = (remaining / total) * 100;
                const bar = document.getElementById('quiz-timer-bar');
                const txt = document.getElementById('quiz-timer-text');
                if (bar) {
                    bar.style.width = pct + '%';
                    bar.style.backgroundColor = pct > 40 ? '#40a2ff' : pct > 20 ? '#f1dd38' : '#ff4747';
                }
                if (txt) txt.textContent = remaining + 's';
                if (remaining <= 0) finish(false);
            }, 1000);
        });
    }

    // ── Opções na Interdição ──────────────────────────────────
    static showInterdictionOptions(player, currentTurn, maxAttempts) {
        return new Promise(resolve => {
            const remaining = maxAttempts - currentTurn;
            this._open(
                '⛓️ Você está Interditado!',
                `<b>Tentativa ${currentTurn} de ${maxAttempts}.</b><br>` +
                (remaining > 0
                    ? `Faltam <b>${remaining}</b> rodada(s) até a liberação compulsória.`
                    : 'Você será liberado automaticamente na próxima rodada!') +
                '<br><br>O que deseja fazer?'
            );
            const tryBtn = document.createElement('button');
            tryBtn.className = 'btn-buy';
            tryBtn.innerHTML = '🎲 Tentar Dupla nos Dados';
            tryBtn.onclick   = () => { this.closeModal(); resolve('try'); };

            const payBtn = document.createElement('button');
            payBtn.className = 'btn-pass';
            payBtn.innerHTML = '💸 Pagar $500 de Multa';
            if (player.money < 500) {
                payBtn.disabled      = true;
                payBtn.style.opacity = '0.4';
                payBtn.title         = 'Saldo insuficiente';
            }
            payBtn.onclick = () => { this.closeModal(); resolve('pay'); };
            this.actionsDiv.append(tryBtn, payBtn);
        });
    }

    // ── Seletor de propriedade (SIPAT) ────────────────────────
    static showPropertySelector(title, text, properties) {
        return new Promise(resolve => {
            this._open(title, text);
            properties.forEach(sp => {
                const btn = document.createElement('button');
                btn.className = 'btn-prop-select';
                btn.style.borderLeftColor = sp.color || '#555';
                btn.innerHTML =
                    `<span class="prop-select-dot" style="background:${sp.color || '#555'}"></span>` +
                    `<span class="prop-select-info">` +
                    `<b>${sp.name}</b>` +
                    `<span class="prop-select-sub">Aluguel: $${sp.rent}${sp.doubledRent ? ' (já dobrado)' : ''}</span>` +
                    `</span>`;
                btn.onclick = () => { this.closeModal(); resolve(sp.id); };
                this.actionsDiv.appendChild(btn);
            });
            const cancelBtn = document.createElement('button');
            cancelBtn.className       = 'btn-ok';
            cancelBtn.style.marginTop = '8px';
            cancelBtn.textContent     = 'Cancelar';
            cancelBtn.onclick = () => { this.closeModal(); resolve(null); };
            this.actionsDiv.appendChild(cancelBtn);
        });
    }

    // ── Seletor de casa (Aporte de Capital) ───────────────────
    static showSpaceSelector(boardData, player) {
        return new Promise(resolve => {
            this._open(
                '🚖 Aporte de Capital',
                'Escolha qualquer casa do tabuleiro para se mover agora:'
            );
            const grid = document.createElement('div');
            grid.className = 'space-select-grid';
            boardData.forEach(sp => {
                if (sp.id === player.position) return;
                const btn = document.createElement('button');
                btn.className = 'btn-space-select';
                btn.innerHTML = `<b>${sp.id}.</b> ${sp.icon || ''} ${sp.name}`;
                btn.onclick   = () => { this.closeModal(); resolve(sp.id); };
                grid.appendChild(btn);
            });
            this.actionsDiv.appendChild(grid);
            const rollBtn = document.createElement('button');
            rollBtn.className       = 'btn-ok';
            rollBtn.style.marginTop = '8px';
            rollBtn.textContent     = '🎲 Rolar os Dados Normalmente';
            rollBtn.onclick = () => { this.closeModal(); resolve(null); };
            this.actionsDiv.appendChild(rollBtn);
        });
    }

    // ── Imunidade a Fiscalização (Nível 3 de Maturidade) ─────
    static showImmunityChoice(card) {
        return new Promise(resolve => {
            this._open(
                '🛡️ Imunidade Disponível!',
                `Você puxou uma carta de <b>Fiscalização</b>:<br>` +
                `<i style="opacity:.8">"${card.title}"</i><br><br>` +
                `Seu <b>Nível 3 de Maturidade</b> permite descartar 1 carta de Fiscalização por rodada.<br>` +
                `Deseja usar esta imunidade agora?`
            );
            const yesBtn = document.createElement('button');
            yesBtn.className   = 'btn-buy';
            yesBtn.textContent = '🛡️ Sim, Descartar Carta';
            yesBtn.onclick = () => { this.closeModal(); resolve(true); };

            const noBtn = document.createElement('button');
            noBtn.className   = 'btn-pass';
            noBtn.textContent = '❌ Não, Pagar Normalmente';
            noBtn.onclick = () => { this.closeModal(); resolve(false); };
            this.actionsDiv.append(yesBtn, noBtn);
        });
    }

    // ── Venda forçada de propriedade (sistema de dívida) ──────
    static showSellProperty(player, properties, debt) {
        return new Promise(resolve => {
            this._open(
                '💸 Dívida! Venda uma Propriedade',
                `<b style="color:${player.color}">${player.name}</b> está com saldo negativo: ` +
                `<b style="color:#ff4747">$${player.money.toLocaleString('pt-BR')}</b><br>` +
                `Dívida restante: <b style="color:#ff4747">$${Math.abs(player.money).toLocaleString('pt-BR')}</b><br><br>` +
                `Venda propriedades para quitar a dívida:`
            );
            properties.forEach(sp => {
                const sellPrice = Math.floor(sp.price * 0.5);
                const btn = document.createElement('button');
                btn.className = 'btn-sell-prop';
                btn.style.borderLeftColor = sp.color || '#555';
                btn.innerHTML =
                    `<span class="prop-select-dot" style="background:${sp.color || '#555'}"></span>` +
                    `<span class="prop-select-info">` +
                    `<b>${sp.name}</b>` +
                    `<span class="prop-select-sub">${sp.group || sp.type}</span>` +
                    `</span>` +
                    `<span class="sell-price-tag">+$${sellPrice}</span>`;
                btn.onclick = () => { this.closeModal(); resolve(sp.id); };
                this.actionsDiv.appendChild(btn);
            });
        });
    }
}