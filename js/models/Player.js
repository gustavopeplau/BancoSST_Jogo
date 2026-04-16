export class Player {
    constructor(id, name, color, icon, pawnSvg, pawnType) {
        this.id    = id;
        this.name  = name;
        this.color = color;
        this.icon  = icon;
        this.pawnSvg  = pawnSvg || '';
        this.pawnType = pawnType || 'capacete';

        this.money    = 5000;
        this.position = 0;

        // Propriedades compradas (IDs do BOARD_DATA)
        this.ownedPropertiesIds = [];

        // Nível de evolução de cada propriedade: { spaceId: 1-4 }
        // Nível 1 = Básico (ao comprar), até Nível 4 = Excelência
        this.propertyLevels = {};

        // ID da propriedade que recebe o bônus SIPAT (⭐), ou null
        this.sipatSpaceId = null;

        // Chaves dos profissionais SESMT contratados
        // ex: ['tecSeguranca', 'medico', 'brigada']
        this.sesmtOwned = [];

        // Controle de interdição (casa 10)
        // 0 = livre; 1+ = nº da tentativa atual de sair
        this.interdictionTurns = 0;

        // Aporte de Capital (casa 30): na próxima rodada o jogador
        // escolhe qualquer casa antes de rolar
        this.canChooseSpace = false;

        // Nível 3 de maturidade: descarta 1 carta de fiscalização por rodada
        this.fiscalizacaoImmunityUsed = false;

        // Calculados pelo GameEngine após cada compra
        this.maturityLevel  = 0; // 0-3
        this.monopoliesCount = 0;

        // Eliminação por falência
        this.eliminated = false;

        // Bot (substituto quando jogador sai)
        this.isBot = false;
    }

    // Move o peão e credita $500 ao cruzar o INÍCIO
    move(spaces) {
        this.position += spaces;
        let passedStart = false;
        if (this.position > 39) {
            this.position -= 40;
            this.money += 500;
            passedStart = true;
        }
        return { passedStart };
    }

    // ═══════════════════════════════════════════════════════════
    // SERIALIZAÇÃO — necessário para multiplayer (sync via rede)
    // ═══════════════════════════════════════════════════════════

    /** Retorna um snapshot JSON-safe do jogador */
    toJSON() {
        return {
            id:    this.id,
            name:  this.name,
            color: this.color,
            icon:  this.icon,
            pawnSvg:  this.pawnSvg,
            pawnType: this.pawnType,
            money:    this.money,
            position: this.position,
            ownedPropertiesIds:      [...this.ownedPropertiesIds],
            propertyLevels:          { ...this.propertyLevels },
            sipatSpaceId:            this.sipatSpaceId,
            sesmtOwned:              [...this.sesmtOwned],
            interdictionTurns:       this.interdictionTurns,
            canChooseSpace:          this.canChooseSpace,
            fiscalizacaoImmunityUsed: this.fiscalizacaoImmunityUsed,
            maturityLevel:   this.maturityLevel,
            monopoliesCount: this.monopoliesCount,
            eliminated:      this.eliminated,
            isBot:           this.isBot,
        };
    }

    /** Reconstrói um Player a partir de dados serializados */
    static fromJSON(data) {
        const p = new Player(data.id, data.name, data.color, data.icon, data.pawnSvg, data.pawnType);
        p.money                    = data.money;
        p.position                 = data.position;
        p.ownedPropertiesIds       = [...(data.ownedPropertiesIds || [])];
        p.propertyLevels           = { ...(data.propertyLevels || {}) };
        p.sipatSpaceId             = data.sipatSpaceId ?? null;
        p.sesmtOwned               = [...(data.sesmtOwned || [])];
        p.interdictionTurns        = data.interdictionTurns || 0;
        p.canChooseSpace           = data.canChooseSpace || false;
        p.fiscalizacaoImmunityUsed = data.fiscalizacaoImmunityUsed || false;
        p.maturityLevel            = data.maturityLevel || 0;
        p.monopoliesCount          = data.monopoliesCount || 0;
        p.eliminated               = data.eliminated || false;
        p.isBot                    = data.isBot || false;
        return p;
    }
}