// ═══════════════════════════════════════════════════════════
// ActionTypes — Todas as ações possíveis do jogador.
// Cada ação é um objeto serializável { type, payload }.
// No modo local, são processadas diretamente pelo GameEngine.
// No modo online (futuro), são enviadas ao servidor via Socket.
// ═══════════════════════════════════════════════════════════

export const ActionTypes = {
    // Turno
    ROLL_DICE:           'ROLL_DICE',
    
    // Propriedade
    BUY_PROPERTY:        'BUY_PROPERTY',
    PASS_PROPERTY:       'PASS_PROPERTY',
    
    // Interdição
    PAY_INTERDICTION:    'PAY_INTERDICTION',
    TRY_DOUBLES:         'TRY_DOUBLES',
    
    // Quiz
    ANSWER_QUIZ:         'ANSWER_QUIZ',
    
    // Maturidade Nível 3 — Imunidade
    USE_IMMUNITY:        'USE_IMMUNITY',
    DECLINE_IMMUNITY:    'DECLINE_IMMUNITY',
    
    // Venda forçada (dívida)
    SELL_PROPERTY:       'SELL_PROPERTY',
    
    // SIPAT (casa 20)
    SELECT_SIPAT_SPACE:  'SELECT_SIPAT_SPACE',
    
    // Aporte de Capital (casa 30)
    SELECT_APORTE_SPACE: 'SELECT_APORTE_SPACE',
};

// ═══════════════════════════════════════════════════════════
// GameEvents — Eventos emitidos pelo GameEngine para a UI.
// A UI (e futuramente a rede) se inscreve nestes eventos.
// ═══════════════════════════════════════════════════════════

export const GameEvents = {
    // Estado geral
    STATE_CHANGED:       'game:stateChanged',
    GAME_STARTED:        'game:started',
    GAME_OVER:           'game:over',
    
    // Turno
    TURN_STARTED:        'turn:started',
    TURN_ENDED:          'turn:ended',
    
    // Dados
    DICE_ROLLED:         'dice:rolled',
    DICE_DOUBLE:         'dice:double',
    DICE_TRIPLE_DOUBLE:  'dice:tripleDouble',
    
    // Movimento
    PLAYER_MOVING:       'player:moving',
    PLAYER_LANDED:       'player:landed',
    PASSED_START:        'player:passedStart',
    
    // Propriedade
    PROPERTY_BOUGHT:     'property:bought',
    PROPERTY_PASSED:     'property:passed',
    PROPERTY_SOLD:       'property:sold',
    RENT_PAID:           'rent:paid',
    
    // Carta SST
    CARD_DRAWN:          'card:drawn',
    CARD_RESOLVED:       'card:resolved',
    QUIZ_STARTED:        'quiz:started',
    QUIZ_ANSWERED:       'quiz:answered',
    
    // SESMT
    SESMT_BENEFIT:       'sesmt:benefit',
    CONSULTORIA_PAID:    'sesmt:consultoria',
    
    // Interdição
    INTERDICTION_START:  'interdiction:start',
    INTERDICTION_FREE:   'interdiction:free',
    INTERDICTION_FAIL:   'interdiction:fail',
    
    // Maturidade
    MATURITY_CHANGED:    'maturity:changed',
    MONOPOLY_COMPLETE:   'monopoly:complete',
    
    // SIPAT / Aporte
    SIPAT_ACTIVATED:     'sipat:activated',
    APORTE_ACTIVATED:    'aporte:activated',
    
    // Finanças
    MONEY_CHANGED:       'money:changed',
    DEBT_CHECK:          'debt:check',
    PLAYER_ELIMINATED:   'player:eliminated',
    
    // Vitória
    VICTORY:             'victory',
    
    // Auditoria
    AUDITORIA:           'auditoria:applied',

    // Imunidade
    IMMUNITY_USED:       'immunity:used',

    // Modais (broadcast para espectadores)
    MODAL_SHOW:          'modal:show',
    MODAL_CLOSED:        'modal:closed',

    // Bot (jogador saiu e bot assumiu)
    PLAYER_BECAME_BOT:   'player:becameBot',
};
