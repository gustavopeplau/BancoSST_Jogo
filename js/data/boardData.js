// Mapa do tabuleiro SST — 40 casas em sentido anti-horário.
// type: 'property' | 'sesmt' | 'card' | 'corner' | 'tax' | 'special'
//
// Campos extras:
//   group        — grupo de monopólio (ex: 'CIPA', 'PGR')
//   side         — 1, 2, 3 ou 4 (para condição de vitória "Programas em Linha")
//   sesmt_key    — chave única do profissional (usada no Player.sesmtOwned e na Taxa de Consultoria)
//   sesmt_benefit — descrição do benefício concedido ao dono
//   rent         — aluguel BASE (10% do price). Multiplicado pela evolução e monopólio em runtime.
//   sipatMultiplier — multiplicador cumulativo da SIPAT (1 = sem bônus)
//   levels       — descrição dos 4 níveis de evolução (Básico, Intermediário, Avançado, Excelência)

// ── Multiplicadores de aluguel por nível de evolução ──
// Nível 1 (Básico) = 1×, Nível 2 = 2×, Nível 3 = 4×, Nível 4 = 8×
export const LEVEL_RENT_MULTIPLIERS = [0, 1, 2, 4, 8];
// Custo de evolução como fração do preço: Nível 2 = 50%, Nível 3 = 75%, Nível 4 = 100%
export const LEVEL_UPGRADE_COST_PCT = [0, 0, 0.50, 0.75, 1.00];
export const LEVEL_NAMES = ['—', 'Básico', 'Intermediário', 'Avançado', 'Excelência'];

// Rastreia quantas vezes a SIPAT já foi ativada (multiplicador cumulativo)
export let sipatActivationCount = 0;
export function incrementSipatCount() { sipatActivationCount++; }
export function getSipatMultiplier() { return sipatActivationCount + 1; }

export const BOARD_DATA = [
    /* === LADO 1 — BASE INFERIOR (índices 0 a 9) === */
    {
        id: 0, name: 'INÍCIO 🟢', type: 'corner', side: null,
        desc: 'Ao passar ou cair aqui, receba $500 de salário.'
    },
    {
        id: 1, name: 'CIPA — Eleição', type: 'property', group: 'CIPA', side: 1,
        color: 'var(--color-cipa)', price: 120, rent: 12, sipatMultiplier: 1,
        desc: 'Realização do processo eleitoral para escolha dos representantes dos empregados, garantindo participação na prevenção.',
        legal: 'NR-5, itens 5.5 e 5.6',
        levels: [
            '',
            'Eleições feitas só para cumprir a lei, com baixa participação.',
            'Processo eleitoral organizado com boa divulgação e participação razoável.',
            'Eleição transparente com engajamento dos colaboradores e diversidade de representantes.',
            'Eleição estratégica com participação massiva, auditoria de transparência e valorização dos eleitos.'
        ]
    },
    {
        id: 2, name: 'Carta SST', type: 'card', icon: '✉️', side: 1
    },
    {
        id: 3, name: 'CIPA — Treinamento', type: 'property', group: 'CIPA', side: 1,
        color: 'var(--color-cipa)', price: 180, rent: 18, sipatMultiplier: 1,
        desc: 'Capacitação obrigatória dos membros da CIPA para atuação em segurança e saúde.',
        legal: 'NR-5, item 5.32',
        levels: [
            '',
            'Treinamento genérico, só para cumprir legislação.',
            'Instrutores preparados com exemplos práticos do ambiente de trabalho.',
            'Dinâmicas interativas, estudos de caso e acompanhamento prático.',
            'Treinamento contínuo com reciclagens periódicas e avaliação de impacto na redução de riscos.'
        ]
    },
    {
        id: 4, name: 'Téc. Segurança Trabalho', type: 'sesmt', side: 1,
        color: '#78909c', icon: '👷', price: 400, rent: 100,
        sesmt_key: 'tecSeguranca',
        sesmt_benefit: 'Reduz em 50% o valor de todas as cartas de Fiscalização recebidas.'
    },
    {
        id: 5, name: 'Carta SST', type: 'card', icon: '✉️', side: 1
    },
    {
        id: 6, name: 'AET — Levant.', type: 'property', group: 'AET', side: 1,
        color: 'var(--color-aet)', price: 180, rent: 18, sipatMultiplier: 1,
        desc: 'Identificação das condições reais de trabalho para análise ergonômica.',
        legal: 'NR-17, item 17.3.1',
        levels: [
            '',
            'Levantamento superficial, sem considerar variações reais do trabalho.',
            'Mapeamento das principais tarefas com observação direta dos trabalhadores.',
            'Levantamento detalhado incluindo variações operacionais e participação dos trabalhadores.',
            'Mapeamento completo e contínuo das atividades, integrado com indicadores e melhorias constantes.'
        ]
    },
    {
        id: 7, name: 'Carta SST', type: 'card', icon: '✉️', side: 1
    },
    {
        id: 8, name: 'AET — Avaliação', type: 'property', group: 'AET', side: 1,
        color: 'var(--color-aet)', price: 200, rent: 20, sipatMultiplier: 1,
        desc: 'Avaliação detalhada dos fatores ergonômicos que impactam o trabalhador.',
        legal: 'NR-17, item 17.3.2',
        levels: [
            '',
            'Avaliação genérica baseada apenas em normas, sem análise aprofundada.',
            'Medições básicas e identificação dos principais riscos ergonômicos.',
            'Análise biomecânica e organizacional detalhada do trabalho.',
            'Redesign dos postos focado em conforto, produtividade e bem-estar.'
        ]
    },
    {
        id: 9, name: 'AET — Relatório', type: 'property', group: 'AET', side: 1,
        color: 'var(--color-aet)', price: 220, rent: 22, sipatMultiplier: 1,
        desc: 'Formalização da análise ergonômica com recomendações de melhoria.',
        legal: 'NR-17, item 17.3.3',
        levels: [
            '',
            'Relatório simples com poucas recomendações práticas.',
            'Relatório estruturado com recomendações aplicáveis.',
            'Relatório completo com plano de ação e priorização de riscos.',
            'Relatório estratégico integrado à gestão da empresa, com acompanhamento de resultados.'
        ]
    },

    /* === LADO 2 — LATERAL ESQUERDA (índices 10 a 19) === */
    {
        id: 10, name: '🚫 Interdição', type: 'corner', side: null,
        desc: 'Fique parado. Tente dupla nos dados para sair, pague $500 ou aguarde até 4 rodadas.'
    },
    {
        id: 11, name: 'PCA — Exp. Ruído', type: 'property', group: 'PCA', side: 2,
        color: 'var(--color-pca)', price: 230, rent: 23, sipatMultiplier: 1,
        desc: 'Medição dos níveis de ruído no ambiente de trabalho.',
        legal: 'NR-01, item 1.5.4 (PGR – avaliação de riscos) + NR-15 (Anexo 1)',
        levels: [
            '',
            'Avaliação pontual e sem continuidade dos níveis de ruído.',
            'Medições periódicas com identificação das áreas críticas.',
            'Monitoramento contínuo com análise detalhada das exposições.',
            'Sistema integrado de monitoramento com controle em tempo real e ações preventivas.'
        ]
    },
    {
        id: 12, name: 'Téc. Enfermagem Trabalho', type: 'sesmt', side: 2,
        color: '#78909c', icon: '🩺', price: 400, rent: 100,
        sesmt_key: 'tecEnfermagem',
        sesmt_benefit: 'Reduz em 50% o valor de todas as cartas de Adoecimento recebidas.'
    },
    {
        id: 13, name: 'PCA — Audiometria', type: 'property', group: 'PCA', side: 2,
        color: 'var(--color-pca)', price: 260, rent: 26, sipatMultiplier: 1,
        desc: 'Realização de exames audiométricos para monitoramento da saúde auditiva.',
        legal: 'NR-7, item 7.5.1',
        levels: [
            '',
            'Exames realizados apenas para cumprimento legal.',
            'Exames periódicos com controle básico dos resultados.',
            'Análise evolutiva dos exames com identificação precoce de perdas auditivas.',
            'Gestão completa da saúde auditiva com ações preventivas personalizadas.'
        ]
    },
    {
        id: 14, name: 'PCA — Controle', type: 'property', group: 'PCA', side: 2,
        color: 'var(--color-pca)', price: 290, rent: 29, sipatMultiplier: 1,
        desc: 'Implementação de medidas de controle coletivo e individual.',
        legal: 'NR-01, item 1.5.5 (medidas de prevenção)',
        levels: [
            '',
            'Uso de EPI sem controle efetivo.',
            'Implementação de algumas medidas de controle coletivo.',
            'Controle eficaz com redução significativa da exposição.',
            'Eliminação ou neutralização do risco com soluções de engenharia.'
        ]
    },
    {
        id: 15, name: 'Eng. Segurança Trabalho', type: 'sesmt', side: 2,
        color: '#78909c', icon: '📐', price: 500, rent: 100,
        sesmt_key: 'engenheiro',
        sesmt_benefit: 'Reduz em 25% o custo de compra e aluguel das casas de PGR e LTCAT.'
    },
    {
        id: 16, name: 'PCMSO — Plan.', type: 'property', group: 'PCMSO', side: 2,
        color: 'var(--color-pcmso)', price: 300, rent: 30, sipatMultiplier: 1,
        desc: 'Elaboração do programa com base nos riscos ocupacionais identificados.',
        legal: 'NR-7, item 7.4.1',
        levels: [
            '',
            'Planejamento genérico, sem ligação com os riscos.',
            'Planejamento baseado nos principais riscos identificados.',
            'Planejamento integrado com outros programas de SST.',
            'Planejamento estratégico com foco em prevenção e promoção da saúde.'
        ]
    },
    {
        id: 17, name: 'Carta SST', type: 'card', icon: '✉️', side: 2
    },
    {
        id: 18, name: 'PCMSO — Exames', type: 'property', group: 'PCMSO', side: 2,
        color: 'var(--color-pcmso)', price: 340, rent: 34, sipatMultiplier: 1,
        desc: 'Realização de exames médicos (admissional, periódico, etc.).',
        legal: 'NR-7, item 7.5.1',
        levels: [
            '',
            'Exames realizados apenas para cumprimento legal.',
            'Exames organizados com controle básico.',
            'Monitoramento da saúde com análise de tendências.',
            'Gestão proativa da saúde com intervenções preventivas.'
        ]
    },
    {
        id: 19, name: 'PCMSO — Anual', type: 'property', group: 'PCMSO', side: 2,
        color: 'var(--color-pcmso)', price: 380, rent: 38, sipatMultiplier: 1,
        desc: 'Elaboração do relatório analítico anual do programa.',
        legal: 'NR-7, item 7.6.1',
        levels: [
            '',
            'Relatório simples e descritivo.',
            'Relatório com análise básica de dados.',
            'Relatório com indicadores e recomendações.',
            'Relatório estratégico com impacto direto na gestão da empresa.'
        ]
    },

    /* === LADO 3 — LATERAL SUPERIOR (índices 20 a 29) === */
    {
        id: 20, name: '🎉 SIPAT', type: 'corner', side: null,
        desc: 'Escolha uma propriedade: ela recebe um multiplicador SIPAT cumulativo (2×, 3×, 4×…)!'
    },
    {
        id: 21, name: 'PGR — Perigos', type: 'property', group: 'PGR', side: 3,
        color: 'var(--color-pgr)', price: 400, rent: 40, sipatMultiplier: 1,
        desc: 'Levantamento das fontes de risco presentes no ambiente de trabalho.',
        legal: 'NR-01, item 1.5.4.2',
        levels: [
            '',
            'Identificação superficial dos perigos.',
            'Identificação dos principais riscos.',
            'Identificação detalhada com participação dos trabalhadores.',
            'Sistema contínuo de identificação com revisão constante.'
        ]
    },
    {
        id: 22, name: 'Carta SST', type: 'card', icon: '✉️', side: 3
    },
    {
        id: 23, name: 'PGR — Inventário', type: 'property', group: 'PGR', side: 3,
        color: 'var(--color-pgr)', price: 440, rent: 44, sipatMultiplier: 1,
        desc: 'Registro e avaliação dos riscos ocupacionais.',
        legal: 'NR-01, item 1.5.4.4',
        levels: [
            '',
            'Inventário incompleto e desatualizado.',
            'Inventário estruturado com classificação básica.',
            'Inventário detalhado com priorização de riscos.',
            'Inventário dinâmico integrado à gestão da empresa.'
        ]
    },
    {
        id: 24, name: 'PGR — Ação', type: 'property', group: 'PGR', side: 3,
        color: 'var(--color-pgr)', price: 480, rent: 48, sipatMultiplier: 1,
        desc: 'Definição de medidas para controle dos riscos identificados.',
        legal: 'NR-01, item 1.5.5.2',
        levels: [
            '',
            'Plano genérico sem acompanhamento.',
            'Plano com ações definidas.',
            'Plano com metas, prazos e responsáveis.',
            'Plano estratégico com monitoramento contínuo e melhoria constante.'
        ]
    },
    {
        id: 25, name: 'Méd. Trabalho', type: 'sesmt', side: 3,
        color: '#78909c', icon: '🏥', price: 500, rent: 100,
        sesmt_key: 'medico',
        sesmt_benefit: 'Reduz em 25% o custo de compra e aluguel das casas de PCMSO e PCA.'
    },
    {
        id: 26, name: 'LTCAT — Agentes', type: 'property', group: 'LTCAT', side: 3,
        color: 'var(--color-ltcat)', price: 500, rent: 50, sipatMultiplier: 1,
        desc: 'Identificação de agentes que podem gerar aposentadoria especial.',
        legal: 'Lei 8.213/91, art. 58',
        levels: [
            '',
            'Identificação superficial dos agentes, sem medições adequadas.',
            'Avaliação com medições básicas dos principais agentes.',
            'Avaliação detalhada com uso de metodologia técnica adequada.',
            'Monitoramento contínuo com dados confiáveis e suporte à tomada de decisão.'
        ]
    },
    {
        id: 27, name: 'LTCAT — Caract.', type: 'property', group: 'LTCAT', side: 3,
        color: 'var(--color-ltcat)', price: 560, rent: 56, sipatMultiplier: 1,
        desc: 'Determinação da intensidade e tempo de exposição aos agentes.',
        legal: 'Decreto 3.048/99, art. 68',
        levels: [
            '',
            'Caracterização genérica da exposição, sem precisão técnica.',
            'Análise com dados básicos de intensidade e tempo de exposição.',
            'Caracterização detalhada com base em critérios técnicos e legais.',
            'Caracterização precisa, integrada com gestão de riscos e decisões estratégicas.'
        ]
    },
    {
        id: 28, name: 'Carta SST', type: 'card', icon: '✉️', side: 3
    },
    {
        id: 29, name: 'LTCAT — Emissão', type: 'property', group: 'LTCAT', side: 3,
        color: 'var(--color-ltcat)', price: 620, rent: 62, sipatMultiplier: 1,
        desc: 'Elaboração do laudo técnico por profissional habilitado.',
        legal: 'Lei 8.213/91, art. 58, §1º',
        levels: [
            '',
            'Laudo elaborado apenas para cumprimento legal.',
            'Laudo estruturado com informações técnicas básicas.',
            'Laudo completo, bem fundamentado e atualizado.',
            'Laudo utilizado como ferramenta estratégica para gestão e prevenção.'
        ]
    },

    /* === LADO 4 — LATERAL DIREITA (índices 30 a 39) === */
    {
        id: 30, name: '🚖 Aporte', type: 'corner', side: null,
        desc: 'Na próxima rodada, antes de rolar, escolha mover-se para qualquer casa do tabuleiro.'
    },
    {
        id: 31, name: 'PCE — Cenários', type: 'property', group: 'PCE', side: 4,
        color: 'var(--color-pce)', price: 640, rent: 64, sipatMultiplier: 1,
        desc: 'Identificação de possíveis situações de emergência no ambiente.',
        legal: 'NR-23, item 23.1',
        levels: [
            '',
            'Identificação superficial dos cenários de emergência.',
            'Mapeamento dos principais cenários possíveis.',
            'Análise detalhada com avaliação de impacto e probabilidade.',
            'Análise integrada com gestão de riscos e planos preventivos.'
        ]
    },
    {
        id: 32, name: 'PCE — Abandono', type: 'property', group: 'PCE', side: 4,
        color: 'var(--color-pce)', price: 720, rent: 72, sipatMultiplier: 1,
        desc: 'Definição de rotas de fuga e procedimentos de evacuação.',
        legal: 'NR-23, item 23.3',
        levels: [
            '',
            'Plano simples, pouco conhecido pelos trabalhadores.',
            'Plano definido com rotas de fuga sinalizadas.',
            'Plano bem estruturado e divulgado a todos.',
            'Plano otimizado, testado e constantemente atualizado.'
        ]
    },
    {
        id: 33, name: 'Carta SST', type: 'card', icon: '✉️', side: 4
    },
    {
        id: 34, name: 'PCE — Treinam.', type: 'property', group: 'PCE', side: 4,
        color: 'var(--color-pce)', price: 800, rent: 80, sipatMultiplier: 1,
        desc: 'Treinamento dos trabalhadores para resposta a emergências.',
        legal: 'NR-23, item 23.1.1',
        levels: [
            '',
            'Treinamentos esporádicos e pouco efetivos.',
            'Treinamentos periódicos com participação razoável.',
            'Simulados realistas com boa participação dos trabalhadores.',
            'Treinamentos contínuos, com alto engajamento e melhoria constante.'
        ]
    },
    {
        id: 35, name: 'SisGestão — Aud.', type: 'property', group: 'SIST.GESTÃO', side: 4,
        color: 'var(--color-gestao)', price: 840, rent: 84, sipatMultiplier: 1,
        desc: 'Avaliação interna da eficácia das ações de SST.',
        legal: 'NR-01, item 1.5.7 (monitoramento e melhoria)',
        levels: [
            '',
            'Auditorias realizadas apenas para cumprimento formal.',
            'Auditorias estruturadas com identificação de falhas.',
            'Auditorias completas com planos de ação definidos.',
            'Auditorias estratégicas focadas em melhoria contínua.'
        ]
    },
    {
        id: 36, name: 'Brigada Emergência', type: 'sesmt', side: 4,
        color: '#78909c', icon: '🧯', price: 600, rent: 100,
        sesmt_key: 'brigada',
        sesmt_benefit: 'Reduz em 50% cartas de Acidente. Sai da Interdição automaticamente em 1 rodada.'
    },
    {
        id: 37, name: 'Auditoria Interna', type: 'tax', icon: '🕵️', side: 4,
        desc: 'Pague 10% do valor total de suas propriedades sem monopólio.'
    },
    {
        id: 38, name: 'Carta SST', type: 'card', icon: '✉️', side: 4
    },
    {
        id: 39, name: 'SisGestão — Cert.', type: 'property', group: 'SIST.GESTÃO', side: 4,
        color: 'var(--color-gestao)', price: 1040, rent: 104, sipatMultiplier: 1,
        desc: 'Reconhecimento formal da gestão de SST conforme padrões internacionais.',
        legal: 'ISO 45001',
        levels: [
            '',
            'Empresa sem certificação formal.',
            'Processo de adequação para certificação.',
            'Certificação obtida e mantida.',
            'Certificação consolidada com reconhecimento e melhoria contínua.'
        ]
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