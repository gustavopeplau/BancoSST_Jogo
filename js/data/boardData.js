// Mapa do tabuleiro SST — 40 casas em sentido anti-horário.
// type: 'property' | 'sesmt' | 'card' | 'corner' | 'tax' | 'special'
//
// Campos extras:
//   group        — grupo de monopólio (ex: 'CIPA', 'PGR')
//   side         — 1, 2, 3 ou 4 (para condição de vitória "Programas em Linha")
//   sesmt_key    — chave única do profissional (usada no Player.sesmtOwned e na Taxa de Consultoria)
//   sesmt_benefit — descrição do benefício concedido ao dono
//   rent         — aluguel fixo pago a quem possui a casa (SESMT: $100 fixo; property: 20% do price)
//   doubledRent  — flag que pode ser ativada pela SIPAT (casa 20)

export const BOARD_DATA = [
    /* === LADO 1 — BASE INFERIOR (índices 0 a 9) === */
    {
        id: 0, name: 'INÍCIO 🟢', type: 'corner', side: null,
        desc: 'Ao passar ou cair aqui, receba $500 de salário.'
    },
    {
        id: 1, name: 'CIPA — Eleição', type: 'property', group: 'CIPA', side: 1,
        color: 'var(--color-cipa)', price: 160, rent: 32, doubledRent: false,
        desc: 'Realização do processo eleitoral para escolha dos representantes dos empregados, garantindo participação na prevenção.',
        legal: 'NR-5, itens 5.5 e 5.6'
    },
    {
        id: 2, name: 'Carta SST', type: 'card', icon: '✉️', side: 1
    },
    {
        id: 3, name: 'CIPA — Treinamento', type: 'property', group: 'CIPA', side: 1,
        color: 'var(--color-cipa)', price: 240, rent: 48, doubledRent: false,
        desc: 'Capacitação obrigatória dos membros da CIPA para atuação em segurança e saúde.',
        legal: 'NR-5, item 5.32'
    },
    {
        id: 4, name: 'Téc. Segurança', type: 'sesmt', side: 1,
        color: '#78909c', icon: '👷', price: 400, rent: 100,
        sesmt_key: 'tecSeguranca',
        sesmt_benefit: 'Reduz em 50% o valor de todas as cartas de Fiscalização recebidas.'
    },
    {
        id: 5, name: 'Carta SST', type: 'card', icon: '✉️', side: 1
    },
    {
        id: 6, name: 'AET — Levant.', type: 'property', group: 'AET', side: 1,
        color: 'var(--color-aet)', price: 270, rent: 54, doubledRent: false,
        desc: 'Identificação das condições reais de trabalho para análise ergonômica.',
        legal: 'NR-17, item 17.3.1'
    },
    {
        id: 7, name: 'Carta SST', type: 'card', icon: '✉️', side: 1
    },
    {
        id: 8, name: 'AET — Avaliação', type: 'property', group: 'AET', side: 1,
        color: 'var(--color-aet)', price: 300, rent: 60, doubledRent: false,
        desc: 'Avaliação detalhada dos fatores ergonômicos que impactam o trabalhador.',
        legal: 'NR-17, item 17.3.2'
    },
    {
        id: 9, name: 'AET — Relatório', type: 'property', group: 'AET', side: 1,
        color: 'var(--color-aet)', price: 330, rent: 66, doubledRent: false,
        desc: 'Formalização da análise ergonômica com recomendações de melhoria.',
        legal: 'NR-17, item 17.3.3'
    },

    /* === LADO 2 — LATERAL ESQUERDA (índices 10 a 19) === */
    {
        id: 10, name: '🚫 Interdição', type: 'corner', side: null,
        desc: 'Fique parado. Tente dupla nos dados para sair, pague $500 ou aguarde até 4 rodadas.'
    },
    {
        id: 11, name: 'PCA — Exp. Ruído', type: 'property', group: 'PCA', side: 2,
        color: 'var(--color-pca)', price: 360, rent: 72, doubledRent: false,
        desc: 'Medição dos níveis de ruído no ambiente de trabalho.',
        legal: 'NR-01, item 1.5.4 (PGR – avaliação de riscos) + NR-15 (Anexo 1)'
    },
    {
        id: 12, name: 'Téc. Enfermagem', type: 'sesmt', side: 2,
        color: '#78909c', icon: '🩺', price: 400, rent: 100,
        sesmt_key: 'tecEnfermagem',
        sesmt_benefit: 'Reduz em 50% o valor de todas as cartas de Adoecimento recebidas.'
    },
    {
        id: 13, name: 'PCA — Audiometria', type: 'property', group: 'PCA', side: 2,
        color: 'var(--color-pca)', price: 400, rent: 80, doubledRent: false,
        desc: 'Realização de exames audiométricos para monitoramento da saúde auditiva.',
        legal: 'NR-7, item 7.5.1'
    },
    {
        id: 14, name: 'PCA — Controle', type: 'property', group: 'PCA', side: 2,
        color: 'var(--color-pca)', price: 440, rent: 88, doubledRent: false,
        desc: 'Implementação de medidas de controle coletivo e individual.',
        legal: 'NR-01, item 1.5.5 (medidas de prevenção)'
    },
    {
        id: 15, name: 'Engenheiro SST', type: 'sesmt', side: 2,
        color: '#78909c', icon: '📐', price: 500, rent: 100,
        sesmt_key: 'engenheiro',
        sesmt_benefit: 'Reduz em 25% o custo de compra e aluguel das casas de PGR e LTCAT.'
    },
    {
        id: 16, name: 'PCMSO — Plan.', type: 'property', group: 'PCMSO', side: 2,
        color: 'var(--color-pcmso)', price: 450, rent: 90, doubledRent: false,
        desc: 'Elaboração do programa com base nos riscos ocupacionais identificados.',
        legal: 'NR-7, item 7.4.1'
    },
    {
        id: 17, name: 'Carta SST', type: 'card', icon: '✉️', side: 2
    },
    {
        id: 18, name: 'PCMSO — Exames', type: 'property', group: 'PCMSO', side: 2,
        color: 'var(--color-pcmso)', price: 500, rent: 100, doubledRent: false,
        desc: 'Realização de exames médicos (admissional, periódico, etc.).',
        legal: 'NR-7, item 7.5.1'
    },
    {
        id: 19, name: 'PCMSO — Anual', type: 'property', group: 'PCMSO', side: 2,
        color: 'var(--color-pcmso)', price: 550, rent: 110, doubledRent: false,
        desc: 'Elaboração do relatório analítico anual do programa.',
        legal: 'NR-7, item 7.6.1'
    },

    /* === LADO 3 — LATERAL SUPERIOR (índices 20 a 29) === */
    {
        id: 20, name: '🎉 SIPAT', type: 'corner', side: null,
        desc: 'Escolha uma das suas propriedades para dobrar o aluguel permanentemente.'
    },
    {
        id: 21, name: 'PGR — Perigos', type: 'property', group: 'PGR', side: 3,
        color: 'var(--color-pgr)', price: 540, rent: 108, doubledRent: false,
        desc: 'Levantamento das fontes de risco presentes no ambiente de trabalho.',
        legal: 'NR-01, item 1.5.4.2'
    },
    {
        id: 22, name: 'Carta SST', type: 'card', icon: '✉️', side: 3
    },
    {
        id: 23, name: 'PGR — Inventário', type: 'property', group: 'PGR', side: 3,
        color: 'var(--color-pgr)', price: 600, rent: 120, doubledRent: false,
        desc: 'Registro e avaliação dos riscos ocupacionais.',
        legal: 'NR-01, item 1.5.4.4'
    },
    {
        id: 24, name: 'PGR — Ação', type: 'property', group: 'PGR', side: 3,
        color: 'var(--color-pgr)', price: 660, rent: 132, doubledRent: false,
        desc: 'Definição de medidas para controle dos riscos identificados.',
        legal: 'NR-01, item 1.5.5.2'
    },
    {
        id: 25, name: 'Médico do Trab.', type: 'sesmt', side: 3,
        color: '#78909c', icon: '🏥', price: 500, rent: 100,
        sesmt_key: 'medico',
        sesmt_benefit: 'Reduz em 25% o custo de compra e aluguel das casas de PCMSO e PCA.'
    },
    {
        id: 26, name: 'LTCAT — Agentes', type: 'property', group: 'LTCAT', side: 3,
        color: 'var(--color-ltcat)', price: 630, rent: 126, doubledRent: false,
        desc: 'Identificação de agentes que podem gerar aposentadoria especial.',
        legal: 'Lei 8.213/91, art. 58'
    },
    {
        id: 27, name: 'LTCAT — Caract.', type: 'property', group: 'LTCAT', side: 3,
        color: 'var(--color-ltcat)', price: 700, rent: 140, doubledRent: false,
        desc: 'Determinação da intensidade e tempo de exposição aos agentes.',
        legal: 'Decreto 3.048/99, art. 68'
    },
    {
        id: 28, name: 'Carta SST', type: 'card', icon: '✉️', side: 3
    },
    {
        id: 29, name: 'LTCAT — Emissão', type: 'property', group: 'LTCAT', side: 3,
        color: 'var(--color-ltcat)', price: 770, rent: 154, doubledRent: false,
        desc: 'Elaboração do laudo técnico por profissional habilitado.',
        legal: 'Lei 8.213/91, art. 58, §1º'
    },

    /* === LADO 4 — LATERAL DIREITA (índices 30 a 39) === */
    {
        id: 30, name: '🚖 Aporte', type: 'corner', side: null,
        desc: 'Na próxima rodada, antes de rolar, escolha mover-se para qualquer casa do tabuleiro.'
    },
    {
        id: 31, name: 'PCE — Cenários', type: 'property', group: 'PCE', side: 4,
        color: 'var(--color-pce)', price: 720, rent: 144, doubledRent: false,
        desc: 'Identificação de possíveis situações de emergência no ambiente.',
        legal: 'NR-23, item 23.1'
    },
    {
        id: 32, name: 'PCE — Abandono', type: 'property', group: 'PCE', side: 4,
        color: 'var(--color-pce)', price: 800, rent: 160, doubledRent: false,
        desc: 'Definição de rotas de fuga e procedimentos de evacuação.',
        legal: 'NR-23, item 23.3'
    },
    {
        id: 33, name: 'Carta SST', type: 'card', icon: '✉️', side: 4
    },
    {
        id: 34, name: 'PCE — Treinam.', type: 'property', group: 'PCE', side: 4,
        color: 'var(--color-pce)', price: 880, rent: 176, doubledRent: false,
        desc: 'Treinamento dos trabalhadores para resposta a emergências.',
        legal: 'NR-23, item 23.1.1'
    },
    {
        id: 35, name: 'SisGestão — Aud.', type: 'property', group: 'SIST.GESTÃO', side: 4,
        color: 'var(--color-gestao)', price: 720, rent: 144, doubledRent: false,
        desc: 'Avaliação interna da eficácia das ações de SST.',
        legal: 'NR-01, item 1.5.7 (monitoramento e melhoria)'
    },
    {
        id: 36, name: 'Brigada Emerg.', type: 'sesmt', side: 4,
        color: '#78909c', icon: '🧯', price: 600, rent: 100,
        sesmt_key: 'brigada',
        sesmt_benefit: 'Reduz em 50% cartas de Acidente. Sai da Interdição automaticamente em 1 rodada.'
    },
    {
        id: 37, name: 'Auditoria Int.', type: 'tax', icon: '🕵️', side: 4,
        desc: 'Pague 10% do valor total de suas propriedades sem monopólio.'
    },
    {
        id: 38, name: 'Carta SST', type: 'card', icon: '✉️', side: 4
    },
    {
        id: 39, name: 'SisGestão — Cert.', type: 'property', group: 'SIST.GESTÃO', side: 4,
        color: 'var(--color-gestao)', price: 1080, rent: 216, doubledRent: false,
        desc: 'Reconhecimento formal da gestão de SST conforme padrões internacionais.',
        legal: 'ISO 45001'
    }
];

// Mapa auxiliar: quais grupos pertencem a cada lado do tabuleiro
export const SIDE_GROUPS = {
    1: ['CIPA', 'AET'],
    2: ['PCA', 'PCMSO'],
    3: ['PGR', 'LTCAT'],
    4: ['PCE', 'SIST.GESTÃO']
};

// Mapa auxiliar: quantas casas de property cada grupo possui (para checar monopólio)
export const GROUP_SIZE = {
    'CIPA': 2, 'AET': 3, 'PCA': 3, 'PCMSO': 3,
    'PGR': 3, 'LTCAT': 3, 'PCE': 3, 'SIST.GESTÃO': 2
};

// Chaves dos 5 profissionais SESMT para checar condição de vitória
export const SESMT_KEYS = ['tecSeguranca', 'tecEnfermagem', 'engenheiro', 'medico', 'brigada'];