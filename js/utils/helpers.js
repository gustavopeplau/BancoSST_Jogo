// utilitário fantástico pra "Pausar/Aguardar" o andamento lógico de scripts pra a animação na UI ter tempo de exibir o visual (GAME JUICE!)
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Embaralha um array in-place (Fisher-Yates) e retorna ele mesmo
export function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}