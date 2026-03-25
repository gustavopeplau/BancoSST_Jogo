// ═══════════════════════════════════════════════════════════
// EventBus — Sistema Pub/Sub desacoplado para comunicação
// entre módulos (Game ↔ UI ↔ Network).
// Preparação para multiplayer: todos os eventos do jogo
// passam pelo bus, permitindo interceptação pela rede.
// ═══════════════════════════════════════════════════════════

export class EventBus {
    constructor() {
        this._listeners = {};
    }

    /**
     * Registra um listener para um evento.
     * @param {string} event
     * @param {Function} callback
     * @returns {Function} Função de unsubscribe
     */
    on(event, callback) {
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(callback);
        return () => this.off(event, callback);
    }

    /**
     * Registra um listener que é chamado apenas uma vez.
     */
    once(event, callback) {
        const wrapper = (data) => {
            this.off(event, wrapper);
            callback(data);
        };
        return this.on(event, wrapper);
    }

    /**
     * Remove um listener específico.
     */
    off(event, callback) {
        if (!this._listeners[event]) return;
        this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
    }

    /**
     * Emite um evento para todos os listeners registrados.
     * @param {string} event
     * @param {*} data — Dados serializáveis do evento
     */
    emit(event, data) {
        const listeners = this._listeners[event];
        if (!listeners || listeners.length === 0) return;
        for (const cb of [...listeners]) {
            cb(data);
        }
    }

    /**
     * Remove todos os listeners de um evento (ou todos, se event omitido).
     */
    clear(event) {
        if (event) {
            delete this._listeners[event];
        } else {
            this._listeners = {};
        }
    }
}

// Instância global compartilhada por todo o app
export const globalBus = new EventBus();
