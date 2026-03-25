export class DiceLogic {
    // Sorteia entre 1 e 6 para dois dados
    static roll() {
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        
        return {
            d1: d1,
            d2: d2,
            total: d1 + d2,
            isDouble: (d1 === d2)
        };
    }
}