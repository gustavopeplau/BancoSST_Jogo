// Baralho SST — 240 cartas divididas em 5 tipos conforme o GDD.
// Tipos: 'evento' | 'acidente' | 'adoecimento' | 'fiscalizacao' | 'quiz'
// Cartas de quiz possuem: pergunta, opcoes[], resposta (índice 0-based), tempo (segundos)
// 'profissional' indica qual SESMT pode acionar a Taxa de Consultoria

export const DECK_SST = [

    // ==============================
    // EVENTOS (48 cartas: 24 positivos +$200, 24 negativos -$150)
    // ==============================
    { type: 'evento', title: 'Prêmio CIPA Estadual!', desc: 'A CIPA da empresa foi eleita destaque regional. Bônus de reconhecimento liberado pelo RH.', amount: 200, icon: '🏆' },
    { type: 'evento', title: 'Campanha Maio Amarelo Ouro!', desc: 'A campanha interna gerou branding e prestígio corporativo. Incentivo financeiro aprovado.', amount: 200, icon: '🟡' },
    { type: 'evento', title: 'Fator Ergonômico Aprovado!', desc: 'Fiscalização analisou os AETs e elogiou as melhorias do setor. Crédito MTE aprovado.', amount: 200, icon: '✅' },
    { type: 'evento', title: 'Investimento em Treinamento!', desc: 'A empresa investiu em capacitação de NR-10 e NR-35. Equipe produtiva e segura gera retorno.', amount: 200, icon: '📚' },
    { type: 'evento', title: 'DDS Nota 10!', desc: 'O Diálogo Diário de Segurança da semana foi avaliado como referência nacional. Bônus liberado.', amount: 200, icon: '📣' },
    { type: 'evento', title: 'Semana Interna de Prevenção!', desc: 'A SIPAT superou a meta de participação. Diretoria aprovou bonificação para a equipe de SST.', amount: 200, icon: '🎉' },
    { type: 'evento', title: 'Certificação de Qualidade!', desc: 'Empresa conquista certificação ISO 45001. Clientes reforçam contratos. Receita adicional garantida.', amount: 200, icon: '🎖️' },
    { type: 'evento', title: 'Parceria com Clínica Ocupacional!', desc: 'Acordo com clínica parceira reduz custos de exames periódicos. Reembolso imediato aprovado.', amount: 200, icon: '🤝' },
    { type: 'evento', title: 'Redução do FAP!', desc: 'O Fator Acidentário de Prevenção caiu graças à gestão eficiente de SST. Economia no RAT aprovada.', amount: 200, icon: '📉' },
    { type: 'evento', title: 'Prêmio Zero Acidentes!', desc: 'A empresa completou 365 dias sem acidentes registráveis. Bônus especial da diretoria.', amount: 200, icon: '🥇' },
    { type: 'evento', title: 'Convênio com Universidade!', desc: 'Parceria acadêmica trouxe estagiários de Engenharia de Segurança. Produtividade e inovação.', amount: 200, icon: '🎓' },
    { type: 'evento', title: 'Benchmark em SST!', desc: 'Empresa recebeu visita técnica de concorrentes para conhecer boas práticas. Prestígio no setor.', amount: 200, icon: '🌟' },
    { type: 'evento', title: 'Programa de Ginástica Laboral!', desc: 'Implantação da ginástica laboral reduziu afastamentos em 30%. RH liberou verba extra.', amount: 200, icon: '🤸' },
    { type: 'evento', title: 'Auditoria Interna Exemplar!', desc: 'Auditoria interna de SST não encontrou nenhuma não conformidade. Bonificação da matriz.', amount: 200, icon: '🔍' },
    { type: 'evento', title: 'Inovação em EPI!', desc: 'Fornecedor desenvolveu EPI sob medida para a empresa. Redução de custos e melhor adesão dos trabalhadores.', amount: 200, icon: '💡' },
    { type: 'evento', title: 'Plano de Ação Concluído!', desc: 'Todas as ações do último relatório de auditoria foram concluídas no prazo. Crédito aprovado.', amount: 200, icon: '📝' },
    { type: 'evento', title: 'Campanha Outubro Rosa SST!', desc: 'Campanha de saúde da mulher integrada ao PCMSO superou adesão. Reconhecimento corporativo.', amount: 200, icon: '🎀' },
    { type: 'evento', title: 'Simulado de Evacuação Perfeito!', desc: 'Simulado de abandono de área com 100% de adesão. Tempo recorde de evacuação. Empresa premiada.', amount: 200, icon: '🏃' },
    { type: 'evento', title: 'Tecnologia de Monitoramento!', desc: 'Implantação de sensores IoT para monitorar ruído e temperatura em tempo real. Investimento aprovado.', amount: 200, icon: '📡' },
    { type: 'evento', title: 'Programa de Saúde Mental!', desc: 'Empresa implantou programa de apoio psicossocial. Absenteísmo caiu 25%. Gratificação do RH.', amount: 200, icon: '🧠' },
    { type: 'evento', title: 'Mapa de Riscos Atualizado!', desc: 'CIPA atualizou o mapa de riscos com participação de todos os setores. Fiscalização elogiou.', amount: 200, icon: '🗺️' },
    { type: 'evento', title: 'Palestra SST de Sucesso!', desc: 'Palestrante renomado em segurança do trabalho lotou o auditório. Engajamento recorde.', amount: 200, icon: '🎤' },
    { type: 'evento', title: 'Redução de Absenteísmo!', desc: 'Ações integradas de SST reduziram faltas em 40%. Economia operacional convertida em bônus.', amount: 200, icon: '📊' },
    { type: 'evento', title: 'Certificação OHSAS Renovada!', desc: 'Empresa renovou certificação de gestão de SST sem ressalvas. Contratos internacionais garantidos.', amount: 200, icon: '🌐' },

    { type: 'evento', title: 'Equipamento com Defeito!', desc: 'EPI de proteção auditiva apresentou falha em lote inteiro. Necessária substituição emergencial.', amount: -150, icon: '⚠️' },
    { type: 'evento', title: 'Ausência de DDS!', desc: 'Equipe do setor B ficou 30 dias sem Diálogo de Segurança. Incidente quase ocorreu. Penalidade interna.', amount: -150, icon: '😶' },
    { type: 'evento', title: 'Falta de EPI em Estoque!', desc: 'Setor de compras falhou no reabastecimento de luvas e capacetes. Obra parada por 1 dia.', amount: -150, icon: '📦' },
    { type: 'evento', title: 'Treinamento Cancelado!', desc: 'Fornecedor de treinamento de NR-33 cancelou na última hora. Custos de reagendamento elevados.', amount: -150, icon: '❌' },
    { type: 'evento', title: 'Reclamação Trabalhista!', desc: 'Ex-funcionário abriu reclamação por falta de treinamento de NR-6. Acordo extrajudicial necessário.', amount: -150, icon: '⚖️' },
    { type: 'evento', title: 'Falta de Sinalização!', desc: 'Setor fabril sem demarcação de piso e saídas de emergência. Necessário investimento imediato.', amount: -150, icon: '🚧' },
    { type: 'evento', title: 'PPRA Desatualizado!', desc: 'Documento do Programa de Prevenção está com prazo vencido. Urgência de revisão e atualização.', amount: -150, icon: '📋' },
    { type: 'evento', title: 'Rotatividade Alta no SESMT!', desc: 'Dois técnicos de segurança pediram demissão. Custos de contratação e treinamento absorvidos.', amount: -150, icon: '🔄' },
    { type: 'evento', title: 'Vazamento de Produto Químico!', desc: 'Tambor de solvente vazou no depósito. Necessária descontaminação e descarte adequado.', amount: -150, icon: '☠️' },
    { type: 'evento', title: 'Perda de Certificado NR-10!', desc: 'Três eletricistas com certificado de NR-10 vencido. Retreinamento emergencial necessário.', amount: -150, icon: '🔌' },
    { type: 'evento', title: 'AVCB Vencido!', desc: 'Auto de Vistoria do Corpo de Bombeiros expirou. Empresa opera irregular até renovação. Custo elevado.', amount: -150, icon: '🚒' },
    { type: 'evento', title: 'Máquina sem Manutenção!', desc: 'Equipamento crítico sem manutenção preventiva parou a linha. Risco de acidente identificado.', amount: -150, icon: '🔧' },
    { type: 'evento', title: 'Reclamação Sindical!', desc: 'Sindicato denunciou condições insalubres ao MTE. Empresa precisa se adequar rapidamente.', amount: -150, icon: '📢' },
    { type: 'evento', title: 'EPI Inadequado Distribuído!', desc: 'Lote de luvas com tamanho errado foi distribuído. Necessária recall e recompra. Perda operacional.', amount: -150, icon: '🧤' },
    { type: 'evento', title: 'Acúmulo de Resíduos!', desc: 'Resíduos classe I acumulados além do limite permitido. Coleta emergencial contratada.', amount: -150, icon: '🗑️' },
    { type: 'evento', title: 'Falha no Sistema de Alarme!', desc: 'Sistema de alarme de incêndio apresentou defeito. Manutenção corretiva urgente contratada.', amount: -150, icon: '🔔' },
    { type: 'evento', title: 'Exames Periódicos Atrasados!', desc: 'Setor com 40% dos exames periódicos em atraso. Clínica ocupacional fez mutirão emergencial.', amount: -150, icon: '🏥' },
    { type: 'evento', title: 'Documento ASO Extraviado!', desc: 'Prontuários médicos de 5 colaboradores foram extraviados. Refazer exames gera custo adicional.', amount: -150, icon: '📂' },
    { type: 'evento', title: 'Treinamento não Documentado!', desc: 'DDS realizado sem lista de presença. Fiscalização considerou como não executado. Penalidade.', amount: -150, icon: '✍️' },
    { type: 'evento', title: 'Ordem de Serviço Sem Assinatura!', desc: 'Ordens de serviço de segurança sem reconhecimento do trabalhador. Irregularidade documentada.', amount: -150, icon: '📄' },
    { type: 'evento', title: 'Problema na Central de GLP!', desc: 'Central de gás com vazamento detectado. Área isolada e manutenção emergencial acionada.', amount: -150, icon: '💨' },
    { type: 'evento', title: 'Falha de Ventilação Industrial!', desc: 'Sistema de exaustão do setor químico parou. Trabalhadores removidos e reparo iniciado com urgência.', amount: -150, icon: '🌀' },
    { type: 'evento', title: 'Contaminação do Ar Interior!', desc: 'Ar-condicionado central sem manutenção espalhou fungos pelo escritório. Surto de alergias respiratórias.', amount: -150, icon: '🦠' },
    { type: 'evento', title: 'Queda de Energia na Fábrica!', desc: 'Gerador de emergência não funcionou. Máquinas pararam abruptamente gerando risco de acidentes.', amount: -150, icon: '🔋' },

    // ==============================
    // ACIDENTES (48 cartas: 24 leves -$300, 24 graves -$500)
    // profissional: 'brigada' aciona Taxa de Consultoria
    // ==============================
    { type: 'acidente', title: 'Queda de Mesmo Nível!', desc: 'Funcionário escorregou em piso molhado e se afastou por 3 dias. Investigação iniciada.', amount: -300, icon: '🤕', profissional: 'brigada' },
    { type: 'acidente', title: 'Corte com Ferramenta!', desc: 'Operador sofreu corte profundo por falta de luva de proteção. Atendimento de primeiros socorros realizado.', amount: -300, icon: '🩹', profissional: 'brigada' },
    { type: 'acidente', title: 'Batida de Veículo Interno!', desc: 'Empilhadeira colidiu com estrutura do galpão. Danos materiais e afastamento do operador.', amount: -300, icon: '🚜', profissional: 'brigada' },
    { type: 'acidente', title: 'Queimadura Química Leve!', desc: 'Exposição acidental a reagente sem EPI adequado. Tratamento ambulatorial necessário.', amount: -300, icon: '🧪', profissional: 'brigada' },
    { type: 'acidente', title: 'Esforço Repetitivo Agudo!', desc: 'Funcionário do setor de montagem sofreu crise de tendinite. Adapatação do posto necessária.', amount: -300, icon: '💪', profissional: 'brigada' },
    { type: 'acidente', title: 'Queda de Objeto!', desc: 'Peça desprendeu-se da bancada e atingiu o pé de um colaborador. Botina não estava sendo usada.', amount: -300, icon: '🪨', profissional: 'brigada' },
    { type: 'acidente', title: 'Incêndio de Pequeno Porte!', desc: 'Princípio de incêndio no almoxarifado controlado pela Brigada. Perdas menores registradas.', amount: -300, icon: '🔥', profissional: 'brigada' },
    { type: 'acidente', title: 'Contusão em Manutenção!', desc: 'Eletricista sofreu choque leve ao manipular painel sem LOTO. Afastamento de 5 dias.', amount: -300, icon: '⚡', profissional: 'brigada' },
    { type: 'acidente', title: 'Torção de Tornozelo!', desc: 'Trabalhador pisou em desnível sem sinalização e torceu o tornozelo. Afastamento de 7 dias.', amount: -300, icon: '🦶', profissional: 'brigada' },
    { type: 'acidente', title: 'Projeção de Partículas!', desc: 'Operador de esmeril sem óculos de proteção sofreu lesão ocular leve por fagulha. Tratamento realizado.', amount: -300, icon: '👓', profissional: 'brigada' },
    { type: 'acidente', title: 'Aprisionamento de Dedo!', desc: 'Mão presa entre engrenagens durante ajuste. Lesão leve por uso correto de anel de vedação.', amount: -300, icon: '🖐️', profissional: 'brigada' },
    { type: 'acidente', title: 'Queda em Escada!', desc: 'Colaborador escorregou ao descer escada sem corrimão. Contusão no joelho e braço.', amount: -300, icon: '🪜', profissional: 'brigada' },
    { type: 'acidente', title: 'Respingo de Solda!', desc: 'Soldador sem avental de raspa sofreu queimadura leve no antebraço. Protocolo de socorro ativado.', amount: -300, icon: '🔩', profissional: 'brigada' },
    { type: 'acidente', title: 'Contato com Superfície Quente!', desc: 'Operador encostou em tubulação não isolada termicamente. Queimadura de 1º grau tratada.', amount: -300, icon: '🌡️', profissional: 'brigada' },
    { type: 'acidente', title: 'Picada de Inseto na Obra!', desc: 'Trabalhador rural foi picado por aranha no canteiro. Atendimento de primeiros socorros necessário.', amount: -300, icon: '🕷️', profissional: 'brigada' },
    { type: 'acidente', title: 'Impacto contra Estrutura!', desc: 'Funcionário bateu a cabeça em viga baixa sem sinalização. Protocolo de TCE ativado por precaução.', amount: -300, icon: '🚧', profissional: 'brigada' },
    { type: 'acidente', title: 'Lombalgia Aguda por Carga!', desc: 'Auxiliar de estoque levantou caixa acima do limite ergonômico. Travamento lombar e afastamento.', amount: -300, icon: '📦', profissional: 'brigada' },
    { type: 'acidente', title: 'Inalação de Fumaça!', desc: 'Trabalhador inalou fumaça tóxica durante solda em espaço mal ventilado. Atendimento emergencial.', amount: -300, icon: '💨', profissional: 'brigada' },
    { type: 'acidente', title: 'Corte com Vidro!', desc: 'Vidreiro sofreu corte na mão ao manusear chapa sem luva de proteção adequada.', amount: -300, icon: '🪟', profissional: 'brigada' },
    { type: 'acidente', title: 'Acidente com Serra Circular!', desc: 'Carpinteiro sofreu corte no dedo ao operar serra sem proteção. Afastamento e sutura necessários.', amount: -300, icon: '🪚', profissional: 'brigada' },
    { type: 'acidente', title: 'Entorse no Punho!', desc: 'Operador de linha de montagem forçou o punho em movimento repetitivo. Imobilização e afastamento.', amount: -300, icon: '🤜', profissional: 'brigada' },
    { type: 'acidente', title: 'Contusão por Queda de Caixa!', desc: 'Caixa caiu de prateleira alta e atingiu o ombro de colaborador. Hematoma e afastamento de 3 dias.', amount: -300, icon: '🏷️', profissional: 'brigada' },
    { type: 'acidente', title: 'Acidente com Carrinho de Carga!', desc: 'Carrinho de mão descontrolado atingiu canela de operador. Lesão leve mas necessitou atendimento.', amount: -300, icon: '🛒', profissional: 'brigada' },
    { type: 'acidente', title: 'Queimadura por Vapor!', desc: 'Operador da caldeira sofreu queimadura no braço ao abrir registro sem EPI. Tratamento ambulatorial.', amount: -300, icon: '♨️', profissional: 'brigada' },

    { type: 'acidente', title: 'Queda de Altura Grave!', desc: 'Colaborador caiu de telhado a 5 metros. Fratura e afastamento prolongado. Investigação do MTE.', amount: -500, icon: '😱', profissional: 'brigada' },
    { type: 'acidente', title: 'Acidente com Prensa!', desc: 'Esmagamento de mão em prensa hidráulica por falha de proteção. Sinistro grave registrado.', amount: -500, icon: '🦾', profissional: 'brigada' },
    { type: 'acidente', title: 'Explosão Química!', desc: 'Mistura indevida de produtos causou explosão no laboratório. Dois afastamentos e danos estruturais.', amount: -500, icon: '💥', profissional: 'brigada' },
    { type: 'acidente', title: 'Acidente de Trajeto!', desc: 'Funcionário se envolveu em acidente de trânsito indo ao trabalho. Comunicação de Acidente emitida.', amount: -500, icon: '🚗', profissional: 'brigada' },
    { type: 'acidente', title: 'Incêndio de Grandes Proporções!', desc: 'Incêndio destruiu metade do depósito. Brigada acionada mas danos foram severos.', amount: -500, icon: '🏭', profissional: 'brigada' },
    { type: 'acidente', title: 'Soterramento!', desc: 'Vala de obra desmoronou sobre trabalhador. Resgate realizado mas afastamento longo necessário.', amount: -500, icon: '⛏️', profissional: 'brigada' },
    { type: 'acidente', title: 'Choque Elétrico Grave!', desc: 'Eletricista sofreu parada cardiorrespiratória por choque. Ressuscitado pela Brigada. Sinistro crítico.', amount: -500, icon: '⚡', profissional: 'brigada' },
    { type: 'acidente', title: 'Atropelamento Interno!', desc: 'Funcionário foi atropelado por veículo de carga dentro do pátio. Acidente gravíssimo notificado.', amount: -500, icon: '🏎️', profissional: 'brigada' },
    { type: 'acidente', title: 'Desabamento de Estrutura!', desc: 'Andaime colapsou durante montagem irregular. Dois trabalhadores com fraturas graves hospitalizados.', amount: -500, icon: '🏚️', profissional: 'brigada' },
    { type: 'acidente', title: 'Amputação em Máquina!', desc: 'Operador perdeu falange ao tentar desobstruir máquina ligada. Sinistro gravíssimo e CAT emitida.', amount: -500, icon: '🩸', profissional: 'brigada' },
    { type: 'acidente', title: 'Queda de Ponte Rolante!', desc: 'Carga soltou-se da ponte rolante e atingiu trabalhador. Fratura exposta e internação prolongada.', amount: -500, icon: '🏗️', profissional: 'brigada' },
    { type: 'acidente', title: 'Intoxicação Aguda por Gás!', desc: 'Vazamento de gás tóxico em área confinada. Três trabalhadores resgatados, um em estado grave.', amount: -500, icon: '☣️', profissional: 'brigada' },
    { type: 'acidente', title: 'Explosão de Caldeira!', desc: 'Caldeira explodiu por falta de manutenção da válvula de segurança. Danos materiais e pessoais graves.', amount: -500, icon: '💣', profissional: 'brigada' },
    { type: 'acidente', title: 'Acidente com Guindaste!', desc: 'Lança do guindaste cedeu e carga caiu sobre contêiner ocupado. Resgate com UPA e bombeiros.', amount: -500, icon: '🏗️', profissional: 'brigada' },
    { type: 'acidente', title: 'Queda em Silo!', desc: 'Trabalhador caiu dentro de silo de grãos. Resgate complexo com bombeiros. Afastamento extenso.', amount: -500, icon: '🌾', profissional: 'brigada' },
    { type: 'acidente', title: 'Colisão de Caminhão em Pátio!', desc: 'Caminhão de fornecedor bateu em pilar do galpão ao manobrar. Dois funcionários da doca feridos.', amount: -500, icon: '🚛', profissional: 'brigada' },
    { type: 'acidente', title: 'Acidente com Empilhadeira Tombada!', desc: 'Empilhadeira tombou ao contornar curva com excesso de carga. Operador com lesão na coluna.', amount: -500, icon: '⚠️', profissional: 'brigada' },
    { type: 'acidente', title: 'Queimadura Grave por Arco Elétrico!', desc: 'Arco elétrico atingiu eletricista durante manutenção de subestação. Queimaduras de 3° grau.', amount: -500, icon: '🔥', profissional: 'brigada' },
    { type: 'acidente', title: 'Afogamento em Cisterna!', desc: 'Trabalhador caiu em cisterna sem proteção. Resgate por mergulhadores. Sinistro de alta gravidade.', amount: -500, icon: '🌊', profissional: 'brigada' },
    { type: 'acidente', title: 'Acidente Múltiplo em Obra!', desc: 'Desabamento parcial de laje em construção. Quatro trabalhadores feridos, dois em estado grave.', amount: -500, icon: '🧱', profissional: 'brigada' },
    { type: 'acidente', title: 'Projeção de Disco de Corte!', desc: 'Disco de esmerilhadeira se rompeu a alta rotação e atingiu o abdômen de outro trabalhador. Cirurgia.', amount: -500, icon: '🔴', profissional: 'brigada' },
    { type: 'acidente', title: 'Rompimento de Mangueira HP!', desc: 'Mangueira de alta pressão rompeu e chicoteou trabalhador. Lesão grave na face e tórax.', amount: -500, icon: '💧', profissional: 'brigada' },
    { type: 'acidente', title: 'Acidente Fatal em Espaço Confinado!', desc: 'Trabalhador perdeu a consciência dentro de tanque sem vigia. Resgate tardio. SRTE e MPT acionados.', amount: -500, icon: '🕳️', profissional: 'brigada' },
    { type: 'acidente', title: 'Queda de Andaime em Poço!', desc: 'Andaime desabou durante obra em poço de elevador. Trabalhador com politraumatismo hospitalizado.', amount: -500, icon: '🪜', profissional: 'brigada' },

    // ==============================
    // ADOECIMENTO (48 cartas: -$250)
    // profissional: 'tecEnfermagem' aciona Taxa de Consultoria
    // ==============================
    { type: 'adoecimento', title: 'LER/DORT Identificada!', desc: 'Auxiliar administrativo diagnosticado com lesão por esforço repetitivo. Readaptação exigida.', amount: -250, icon: '🖥️', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'PAIR — Perda Auditiva!', desc: 'Trabalhador do setor de produção com perda auditiva induzida por ruído. Tratamento e afastamento.', amount: -250, icon: '🔊', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Estresse Ocupacional!', desc: 'Equipe de vendas apresenta alto índice de absenteísmo por Burnout. Intervenção psicossocial urgente.', amount: -250, icon: '😤', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Dermatite de Contato!', desc: 'Operadores da linha de pintura com dermatite por exposição a solventes. Luvas inadequadas.', amount: -250, icon: '🧤', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Lombalgia Crônica!', desc: 'Alta incidência de problemas lombares no setor de logística por postura inadequada ao carregar.', amount: -250, icon: '🦴', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Silicose Detectada!', desc: 'Trabalhador da mineração diagnosticado com silicose. Empresa não fornecia respirador adequado.', amount: -250, icon: '🫁', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Intoxicação por Pesticidas!', desc: 'Funcionários do setor agrícola com sintomas de intoxicação por agrotóxico. Exames confirmados.', amount: -250, icon: '🌾', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Síndrome do Túnel do Carpo!', desc: 'Técnico de digitação com compressão do nervo mediano. Afastamento e tratamento cirúrgico necessário.', amount: -250, icon: '⌨️', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Ansiedade Ocupacional!', desc: 'Surto de crises de ansiedade nas equipes de call center. Absenteísmo disparou no mês.', amount: -250, icon: '😰', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Hepatite Ocupacional!', desc: 'Profissional de saúde infectado por HBV sem esquema vacinal completo. Responsabilidade da empresa.', amount: -250, icon: '💉', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Asma Ocupacional!', desc: 'Trabalhador de padaria com asma por exposição à farinha de trigo. Readaptação de função necessária.', amount: -250, icon: '🌬️', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Tendinite no Ombro!', desc: 'Funcionário do setor de embalagem com tendinite por movimentos repetitivos acima da cabeça.', amount: -250, icon: '💊', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Fadiga Crónica!', desc: 'Equipe de turno noturno com diagnóstico de distúrbio do sono. Empresa pagará reavaliação ergónomica.', amount: -250, icon: '😴', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Câncer Ocupacional Suspeito!', desc: 'Ex-funcionário abre processo por exposição a amianto. Empresa arca com perícia médica e honorários.', amount: -250, icon: '🩺', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Crise Hipertensiva!', desc: 'Operador de prensa sofreu crise hipertensiva por estresse extremo. Nexo ocupacional reconhecido.', amount: -250, icon: '❤️', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Problema Visual Ocupacional!', desc: 'Funcionários de controle de qualidade com conjuntivite crônica por iluminação inadequada.', amount: -250, icon: '👁️', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Pneumoconiose Grave!', desc: 'Trabalhador de fundição com depósito de poeira metálica nos pulmões. Afastamento por invalidez parcial.', amount: -250, icon: '🏭', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Depressão Ocupacional!', desc: 'Gestor de equipe desenvolveu depressão por sobrecarga e assédio moral. Nexo causal comprovado.', amount: -250, icon: '😞', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Rinite Ocupacional!', desc: 'Trabalhadores do setor de limpeza com rinite crônica por exposição a produtos químicos aerossóis.', amount: -250, icon: '🤧', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Saturnismo — Intoxicação por Chumbo!', desc: 'Trabalhador de reciclagem de baterias com altos níveis de chumbo no sangue. Afastamento urgente.', amount: -250, icon: '🔋', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Epicondilite Lateral!', desc: 'Mecânico com inflamação no cotovelo por uso repetitivo de chave de torque. Tratamento e afastamento.', amount: -250, icon: '🔧', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Síndrome de Raynaud!', desc: 'Operador de ferramentas vibratórias com dedos brancos e dormência. Suspensão da atividade.', amount: -250, icon: '🥶', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Bissinose — Doença do Algodão!', desc: 'Trabalhadores da fiação com dificuldade respiratória por fibras de algodão. Mudança de setor obrigatória.', amount: -250, icon: '🧵', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Transtorno de Estresse Pós-Traumático!', desc: 'Funcionário que presenciou acidente grave desenvolveu TEPT. Acompanhamento psiquiátrico necessário.', amount: -250, icon: '🧠', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Cervicalgia Ocupacional!', desc: 'Programadores com dor cervical crônica por postura inadequada. Empresa arca com fisioterapia.', amount: -250, icon: '💻', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Bursite no Joelho!', desc: 'Azulejista com bursite por trabalho prolongado ajoelhado. Geniculeiras não foram fornecidas.', amount: -250, icon: '🦵', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Dermatose por Cimento!', desc: 'Pedreiros com lesões na pele por contato frequente com cimento sem luvas. Tratamento dermatológico.', amount: -250, icon: '🧱', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Labirintite Ocupacional!', desc: 'Trabalhador de plataforma offshore com vertigem crônica. Exposição a vibrações de corpo inteiro.', amount: -250, icon: '🌀', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Neuropatia Periférica!', desc: 'Operário com dormência nas mãos por exposição a hexano no setor de colagem de calçados.', amount: -250, icon: '✋', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Mesotelioma Pleural!', desc: 'Trabalhador de demolição com diagnóstico de mesotelioma por exposição a amianto. Processo judicial.', amount: -250, icon: '⚖️', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Distúrbio Vocal — Disfonia!', desc: 'Professora da empresa com disfonia ocupacional por uso excessivo da voz. Fonoterapia necessária.', amount: -250, icon: '🗣️', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Alergia a Látex!', desc: 'Profissional de saúde com alergia grave a luvas de látex. Substituição por luvas de nitrilo e afastamento.', amount: -250, icon: '🧤', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Doença de Vibração Mão-Braço!', desc: 'Operador de martelete com síndrome vibratória. Circulação comprometida nos dedos. Readaptação.', amount: -250, icon: '🔨', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Miopia Ocupacional Progressiva!', desc: 'Microscopistas do setor de qualidade com piora significativa da miopia. Empresa arca com lentes.', amount: -250, icon: '🔬', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Bronquite Ocupacional!', desc: 'Operadores de caldeira com bronquite crônica por inalação de fuligem. Medidas de controle exigidas.', amount: -250, icon: '🫁', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Obesidade e Sedentarismo!', desc: 'Motoristas da frota com obesidade e síndrome metabólica. Programa de qualidade de vida emergencial.', amount: -250, icon: '🚛', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Discopatia Degenerativa!', desc: 'Operadores de máquina pesada com hérnia de disco por vibração de corpo inteiro. Cirurgia indicada.', amount: -250, icon: '🦴', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Síndrome do Pânico no Trabalho!', desc: 'Operador de altura desenvolveu síndrome do pânico após quase-acidente. Readaptação obrigatória.', amount: -250, icon: '😱', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Tendinite de De Quervain!', desc: 'Costureira com dor intensa no polegar por movimentos repetitivos de tesoura. Afastamento e cirurgia.', amount: -250, icon: '✂️', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Catarata Ocupacional!', desc: 'Sopradores de vidro com diagnóstico de catarata precoce por exposição a radiação infravermelha.', amount: -250, icon: '👁️', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Leucemia por Benzeno!', desc: 'Trabalhador de indústria petroquímica diagnosticado com leucemia por exposição crônica a benzeno.', amount: -250, icon: '⛽', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Síndrome do Edifício Doente!', desc: 'Escritório com ventilação inadequada causou surto de cefaleia, fadiga e irritação em 20 funcionários.', amount: -250, icon: '🏢', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Asbestose Confirmada!', desc: 'Ex-trabalhador de fábrica de telhas com fibrose pulmonar por amianto. Indenização judicial iniciada.', amount: -250, icon: '🏚️', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Tenossinovite Crepitante!', desc: 'Montador de peças com inflamação nos tendões do antebraço por esforço excessivo. Readaptação.', amount: -250, icon: '💪', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Surdez Bilateral Ocupacional!', desc: 'Operador de britadeira com surdez bilateral irreversível. Aposentadoria por invalidez solicitada.', amount: -250, icon: '🔇', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Hipoacusia Neurossensorial!', desc: 'Músico de orquestra corporativa com perda auditiva progressiva. Nexo ocupacional comprovado.', amount: -250, icon: '🎵', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Dermatite Alérgica por Cromo!', desc: 'Trabalhador de curtume com dermatite grave por exposição ao cromo hexavalente. Tratamento prolongado.', amount: -250, icon: '🧴', profissional: 'tecEnfermagem' },
    { type: 'adoecimento', title: 'Fibromialgia Ocupacional!', desc: 'Funcionária do setor de costura com dores difusas e fadiga crônica. Nexo com condições de trabalho.', amount: -250, icon: '🩺', profissional: 'tecEnfermagem' },

    // ==============================
    // FISCALIZAÇÃO (48 cartas: -$400)
    // profissional: 'tecSeguranca' aciona Taxa de Consultoria
    // ==============================
    { type: 'fiscalizacao', title: 'Auditoria MTE — NR-35!', desc: 'Auditor Federal flagrou funcionários em trabalho em altura sem plano de resgate obrigatório.', amount: -400, icon: '🕵️', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Auto de Infração — NR-12!', desc: 'Máquinas sem proteção de partes móveis. Embargada a linha de produção até regularização.', amount: -400, icon: '⛔', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Notificação por NR-9!', desc: 'PPRA não foi atualizado nos últimos 12 meses. Fiscalização expediu prazo de 30 dias para regularização.', amount: -400, icon: '📋', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Interdição por NR-26!', desc: 'Substâncias químicas sem rotulagem adequada e FISPQ inexistente. Interdição do setor imediata.', amount: -400, icon: '🧴', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Embargo por NR-18!', desc: 'Canteiro de obras sem PCMAT aprovado. Trabalho embargado até apresentação do documento regularizado.', amount: -400, icon: '🏗️', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Multa por NR-7 Descumprida!', desc: 'PCMSO sem assinatura de médico coordenador. Exames periódicos atrasados. Auto de infração emitido.', amount: -400, icon: '🏥', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Infração por NR-6!', desc: 'Empresa não forneceu EPIs a tempo e documentação de entrega incompleta. Penalidade administrativa.', amount: -400, icon: '🦺', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Auditoria de CIPA — NR-5!', desc: 'CIPA sem eleição há 2 anos e atas inexistentes. Comissão passagem adiada. Multa pesada aplicada.', amount: -400, icon: '🗳️', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Fiscalização Surpresa!', desc: 'Inspetor do MTE chegou sem aviso prévio. Encontrou 3 não conformidades críticas. Multa aplicada.', amount: -400, icon: '😳', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Violação da NR-33!', desc: 'Espaço confinado sem permissão de entrada, vigia e supervisor. Interdição e multa imediata.', amount: -400, icon: '🕳️', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Irregularidade NR-10!', desc: 'Eletricistas sem treinamento atualizado e sem prontuário elétrico. Notificação grave do SRTE.', amount: -400, icon: '🔌', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Descumprimento de NR-17!', desc: 'Posto de trabalho em desacordo com norma ergonômica. Empresa notificada a adaptar 80% dos postos.', amount: -400, icon: '🪑', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'NR-23 — Combate a Incêndio!', desc: 'Extintores vencidos e mangueiras com defeito. Planta de riscos inexistente. Multa lavrada.', amount: -400, icon: '🧯', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Irregularidade em NR-11!', desc: 'Operadores de empilhadeira sem habilitação específica. Risco alto. Interdição do pátio de estocagem.', amount: -400, icon: '🏋️', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Auditoria de Saúde — NR-32!', desc: 'Hospital com descarte irregular de resíduos biológicos. Fiscalização da ANVISA e MTE em simultâneo.', amount: -400, icon: '🏨', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Notificação por GRO!', desc: 'Gerenciamento de Riscos Ocupacionais sem inventário de perigos atualizado. Prazo exigido.', amount: -400, icon: '📊', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Embargo por NR-22!', desc: 'Mina subterrânea sem ventilação adequada e plano de emergência. Embargo total até adequação.', amount: -400, icon: '⛏️', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Infração por NR-20!', desc: 'Área de inflamáveis sem classificação de zona e sem treinamento dos trabalhadores. Interdição.', amount: -400, icon: '🔥', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Auditoria NR-13 — Vasos de Pressão!', desc: 'Caldeiras e vasos de pressão sem inspeção periódica documentada. Auto de interdição lavrado.', amount: -400, icon: '💨', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Notificação NR-24 — Instalações!', desc: 'Vestiários e sanitários em condições precárias. SRTE exigiu reforma em 60 dias sob pena de multa.', amount: -400, icon: '🚿', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Irregularidade NR-15 — Insalubridade!', desc: 'Laudo de insalubridade desatualizado e addicionais não pagos corretamente. Autuação retroativa.', amount: -400, icon: '⚠️', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Multa por NR-16 — Periculosidade!', desc: 'Eletricistas sem adicional de periculosidade documento. Empresa multada com valores retroativos.', amount: -400, icon: '⚡', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Interdição NR-34 — Navios!', desc: 'Trabalho em estaleiro sem condições de segurança para trabalho a quente. Interdição imediata.', amount: -400, icon: '🚢', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Auditoria NR-36 — Abatedouro!', desc: 'Frigorífico sem pausas térmicas e rodízio de funções. Fiscalização pesada do MTE.', amount: -400, icon: '🥩', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Notificação NR-31 — Rural!', desc: 'Fazenda sem fornecimento de EPI e sem sinalização de áreas de risco. Multa aplicada.', amount: -400, icon: '🌿', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Embargo NR-37 — Plataforma!', desc: 'Plataforma offshore sem análise de risco atualizada e Plano de Resposta a Emergência deficiente.', amount: -400, icon: '🛢️', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Irregularidade no PPCI!', desc: 'Plano de Prevenção e Combate a Incêndio não aprovado pelo Corpo de Bombeiros. Operação irregular.', amount: -400, icon: '🚒', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Multa por Trabalho Infantil!', desc: 'Fiscalização flagrou menor em atividade insalubre. Empresa multada e encaminhada ao MPT.', amount: -400, icon: '👦', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Falta de Prontuário de NR-12!', desc: 'Prontuário de máquinas desatualizado e sem inventário completo. Três autos de infração emitidos.', amount: -400, icon: '📑', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Auditoria do MPT — Ergonomia!', desc: 'Ministério Público do Trabalho exigiu AET completa do setor administrativo. Prazo curto sob TAC.', amount: -400, icon: '⚖️', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Notificação por FISPQ!', desc: 'Fichas de Informação de Segurança de Produtos Químicos desatualizadas. Prazo de 15 dias para adequação.', amount: -400, icon: '🧪', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Interdição de Elevador de Carga!', desc: 'Elevador industrial sem inspeção anual e sem certificação. Interditado até laudo técnico favorável.', amount: -400, icon: '🛗', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Multa por Exposição a Benzeno!', desc: 'Trabalhadores de posto de combustível sem PPEOB. Vigilância sanitária e MTE multaram simultaneamente.', amount: -400, icon: '⛽', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Notificação PGR Incompleto!', desc: 'PGR sem plano de ação para riscos identificados e sem cronograma de implantação. Autuação.', amount: -400, icon: '📝', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Interdição por Falta de ART!', desc: 'Obra sem Anotação de Responsabilidade Técnica de engenheiro habilitado. Embargo total.', amount: -400, icon: '📐', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Auditoria ISO 45001 Reprovada!', desc: 'Empresa perdeu a certificação ISO 45001 por falhas no sistema de gestão. Clientes cancelaram contratos.', amount: -400, icon: '🌐', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Multa por Jornada Excessiva!', desc: 'Fiscalização comprovou jornada acima de 10h sem intervalo. Relação com fadiga e risco de acidentes.', amount: -400, icon: '⏰', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Irregularidade NR-25 — Resíduos!', desc: 'Resíduos industriais classe I armazenados irregularmente. IBAMA e MTE atuaram em conjunto.', amount: -400, icon: '♻️', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Notificação NR-21 — Trabalho a Céu Aberto!', desc: 'Trabalhadores sem proteção contra intempéries e insolação. Fiscalização exigiu adequação imediata.', amount: -400, icon: '☀️', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Embargo por Falta de PCMAT!', desc: 'Obra de grande porte sem Programa de Condições e Meio Ambiente. Embargo total até apresentação.', amount: -400, icon: '🏗️', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Auto de Infração — EPI Vencido!', desc: 'Fiscalização encontrou 50% dos EPIs com validade expirada no almoxarifado. Multa aplicada.', amount: -400, icon: '🧤', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Irregularidade NR-14 — Fornos!', desc: 'Forno industrial sem manutenção preventiva e sem sistema de ventilação adequado. Interdição do setor.', amount: -400, icon: '🔥', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Multa por Falta de APR!', desc: 'Atividades de risco realizadas sem Análise Preliminar de Risco documentada. Três autos emitidos.', amount: -400, icon: '📝', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Infração por Falta de DDS!', desc: 'Registros de DDS inexistentes nos últimos 6 meses. MTE considerou negligência e aplicou multa.', amount: -400, icon: '📣', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Notificação por Trabalho Degradante!', desc: 'MPT flagrou condições degradantes de alojamento de trabalhadores. TAC com multa milionária.', amount: -400, icon: '🛏️', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Interdição por Falta de Brigada!', desc: 'Empresa sem brigada de incêndio formada e treinada. Corpo de Bombeiros interditou o prédio.', amount: -400, icon: '🚒', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Auto de Infração — Ergonomia NR-17!', desc: 'Teleatendimento sem pausas e sem análise ergonômica. Multiple autos de infração lavrados.', amount: -400, icon: '📞', profissional: 'tecSeguranca' },
    { type: 'fiscalizacao', title: 'Multa por Falta de Treinamento NR-35!', desc: 'Trabalhadores em altura sem treinamento válido. Fiscalização interditou a atividade e aplicou multa.', amount: -400, icon: '🧗', profissional: 'tecSeguranca' },

    // ==============================
    // QUIZ (48 cartas educativas)
    // acerto: +$200 | erro/timeout: -$100 | tempo: 20 segundos
    // ==============================
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'O que significa a sigla CIPA?',
        opcoes: [
            'Comissão Interna de Prevenção de Acidentes',
            'Comitê de Inspeção e Proteção Ambiental',
            'Centro de Informação e Prevenção de Afastamentos',
            'Comissão Integrada de Políticas de Ação',
            'Conselho Interno de Proteção Ativa'
        ],
        resposta: 0, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'O PGR (Programa de Gerenciamento de Riscos) substitui qual documento?',
        opcoes: ['PCMSO', 'LTCAT', 'PPRA', 'PCMAT', 'AET'],
        resposta: 2, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'Qual NR regulamenta o uso de Equipamentos de Proteção Individual (EPI)?',
        opcoes: ['NR-5', 'NR-7', 'NR-6', 'NR-9', 'NR-12'],
        resposta: 2, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'O que é o SESMT?',
        opcoes: [
            'Serviço Especializado em Saúde e Medicina do Trabalho',
            'Serviço Especializado em Engenharia de Segurança e em Medicina do Trabalho',
            'Sistema de Engenharia e Saúde do Meio do Trabalho',
            'Setor de Segurança, Medicina e Treinamento',
            'Serviço Estadual de Saúde e Medicina do Trabalho'
        ],
        resposta: 1, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'Qual é o prazo máximo para emissão da CAT (Comunicação de Acidente de Trabalho)?',
        opcoes: ['24 horas', '48 horas', '72 horas', 'No mesmo dia', '5 dias úteis'],
        resposta: 0, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'O PCMSO é coordenado obrigatoriamente por qual profissional?',
        opcoes: [
            'Técnico de Segurança do Trabalho',
            'Engenheiro de Segurança',
            'Médico do Trabalho',
            'Fisioterapeuta Ocupacional',
            'Enfermeiro do Trabalho'
        ],
        resposta: 2, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'O que avalia o Laudo Técnico das Condições Ambientais do Trabalho (LTCAT)?',
        opcoes: [
            'A ergonomia dos postos de trabalho',
            'A exposição do trabalhador a agentes nocivos para fins de aposentadoria especial',
            'A qualidade do ar dos ambientes fechados',
            'Os riscos de incêndio no ambiente fabril',
            'As condições de higiene dos refeitórios'
        ],
        resposta: 1, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'Qual NR regulamenta o trabalho em espaços confinados?',
        opcoes: ['NR-10', 'NR-18', 'NR-33', 'NR-35', 'NR-12'],
        resposta: 2, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'A Avaliação Ergonômica Preliminar (AEP) faz parte de qual conjunto de documentos?',
        opcoes: ['PGR', 'PCMSO', 'CIPA', 'LTCAT', 'PCE'],
        resposta: 0, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'No contexto da NR-35, trabalho em altura é todo aquele realizado acima de:',
        opcoes: ['1,0 metro', '1,5 metros', '1,8 metros', '2,0 metros', '2,5 metros'],
        resposta: 3, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'O GRO (Gerenciamento de Riscos Ocupacionais) é composto por quais documentos principais?',
        opcoes: ['PCMSO e LTCAT', 'PGR e PCMSO', 'PGR e Inventário de Riscos', 'CIPA e PPRA', 'AET e PCE'],
        resposta: 2, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'Qual é a responsabilidade do vigia em espaço confinado (NR-33)?',
        opcoes: [
            'Entrar primeiro no espaço para verificar os riscos',
            'Monitorar continuamente o trabalhador dentro do espaço e acionar o resgate se necessário',
            'Elaborar a Permissão de Entrada e Trabalho (PET)',
            'Ministrar treinamento anual aos entrantes',
            'Verificar os EPIs antes de cada turno'
        ],
        resposta: 1, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'A PAIR (Perda Auditiva Induzida por Ruído) é investigada e documentada em qual programa?',
        opcoes: ['PGR', 'LTCAT', 'PCA', 'PCMSO', 'AET'],
        resposta: 2, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'O que é a LOTO (Lockout/Tagout)?',
        opcoes: [
            'Procedimento de bloqueio e etiquetagem de energias perigosas em manutenção',
            'Sistema de controle de acesso a áreas restritas',
            'Técnica de combate a incêndio com substâncias espumosas',
            'Método de avaliação ergonômica de postos de trabalho',
            'Programa de gestão de resíduos perigosos'
        ],
        resposta: 0, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'Segundo a NR-5, qual é o mandato dos membros eleitos da CIPA?',
        opcoes: ['6 meses', '1 ano', '2 anos', '3 anos', 'Indeterminado'],
        resposta: 1, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'O Plano de Controle de Emergências (PCE) inclui obrigatoriamente:',
        opcoes: [
            'Lista de EPIs e fornecedores homologados',
            'Análise ergonômica e mapeamento de calor',
            'Cenários de emergência, recursos disponíveis e treinamento da Brigada',
            'Inventário de agentes químicos e mapa de rotas de fiscalização',
            'Resultados dos exames periódicos do PCMSO'
        ],
        resposta: 2, tempo: 20, acerto: 200, erro: -100
    },
    // ── NOVAS CARTAS QUIZ (32 adicionais) ─────────────────────
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'O que é o FAP (Fator Acidentário de Prevenção)?',
        opcoes: [
            'Índice que ajusta a alíquota do RAT conforme o histórico da empresa',
            'Formulário de registro de acidentes do trabalho',
            'Fórmula de cálculo de aposentadoria especial',
            'Fundo de auxílio a trabalhadores acidentados',
            'Programa de fiscalização do MTE'
        ],
        resposta: 0, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'O que significa a sigla GHE na área de SST?',
        opcoes: [
            'Grupo Homogêneo de Exposição',
            'Gestão de Higiene Empresarial',
            'Guia de Habilitação do Empregado',
            'Grau de Higienização Estrutural',
            'Grupo de Habilitação Ergonômica'
        ],
        resposta: 0, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'Qual NR regulamenta segurança em instalações elétricas?',
        opcoes: ['NR-6', 'NR-10', 'NR-12', 'NR-15', 'NR-33'],
        resposta: 1, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'O que é a Análise Preliminar de Risco (APR)?',
        opcoes: [
            'Laudo pericial para processos judiciais trabalhistas',
            'Avaliação prévia de riscos antes de iniciar uma atividade',
            'Relatório anual de acidentes registrados pelo SESMT',
            'Programa de reabilitação de acidentados',
            'Inventário de máquinas conforme NR-12'
        ],
        resposta: 1, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'O Adicional de Insalubridade pode ser de qual(is) percentual(is) sobre o salário mínimo?',
        opcoes: [
            '10%, 20% ou 40%',
            '10%, 15% ou 30%',
            '20%, 30% ou 40%',
            '5%, 10% ou 20%',
            '15%, 25% ou 35%'
        ],
        resposta: 0, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'Qual é o percentual do Adicional de Periculosidade?',
        opcoes: ['10%', '20%', '25%', '30%', '40%'],
        resposta: 3, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'O que é o ASO (Atestado de Saúde Ocupacional)?',
        opcoes: [
            'Documento que atesta a aptidão ou inaptidão do trabalhador para a função',
            'Autorização para trabalho em espaço confinado',
            'Alvará sanitário da empresa',
            'Certificado de treinamento em NR-6',
            'Laudo de insalubridade emitido pelo engenheiro'
        ],
        resposta: 0, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'Qual agente é considerado risco físico no ambiente de trabalho?',
        opcoes: ['Poeira de sílica', 'Ruído', 'Vírus', 'Solvente orgânico', 'Postura inadequada'],
        resposta: 1, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'O que é a Hierarquia de Controles em SST?',
        opcoes: [
            'Ordem organizacional do SESMT na empresa',
            'Sequência de prioridade: eliminação, substituição, engenharia, administrativa e EPI',
            'Classificação de trabalhadores por nível de risco',
            'Ranking de gravidade de NRs descumpridas',
            'Ordem de atendimento do SAMU em acidentes'
        ],
        resposta: 1, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'O que é a PET (Permissão de Entrada e Trabalho) na NR-33?',
        opcoes: [
            'Documento que autoriza a entrada em espaço confinado',
            'Licença de operação de máquinas pesadas',
            'Permissão para trabalho em altura',
            'Autorização para manuseio de produtos químicos',
            'Cadastro de trabalhadores em área de risco'
        ],
        resposta: 0, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'Qual tipo de extintor é indicado para incêndios de Classe C (equipamentos elétricos)?',
        opcoes: ['Água', 'Espuma', 'CO₂ (Gás Carbônico)', 'Pó químico ABC', 'CO₂ ou Pó químico'],
        resposta: 4, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'O que é o PPR (Programa de Proteção Respiratória)?',
        opcoes: [
            'Programa que define a seleção e uso adequado de respiradores',
            'Plano de prevenção de riscos ambientais',
            'Procedimento de resgate em espaço confinado',
            'Programa de readaptação profissional',
            'Projeto de renovação predial'
        ],
        resposta: 0, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'O limite de tolerância para ruído contínuo em 8 horas de trabalho é de:',
        opcoes: ['75 dB(A)', '80 dB(A)', '85 dB(A)', '90 dB(A)', '95 dB(A)'],
        resposta: 2, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'Qual NR trata das condições de trabalho na indústria da construção?',
        opcoes: ['NR-11', 'NR-12', 'NR-15', 'NR-18', 'NR-22'],
        resposta: 3, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'O que é o nexo técnico epidemiológico (NTEP)?',
        opcoes: [
            'Programa de vacinação obrigatória',
            'Relação estatística entre CID da doença e CNAE da empresa para presumir doença ocupacional',
            'Índice de gravidade de acidentes da empresa',
            'Protocolo de atendimento de primeiros socorros',
            'Método de avaliação de ruído ocupacional'
        ],
        resposta: 1, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'O que são agentes ergonômicos no ambiente de trabalho?',
        opcoes: [
            'Substâncias químicas que causam irritação',
            'Fatores como postura, repetitividade, ritmo excessivo e organização do trabalho',
            'Micro-organismos presentes no ar',
            'Ruído e vibração acima dos limites de tolerância',
            'Radiações ionizantes e não ionizantes'
        ],
        resposta: 1, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'Qual documento registra a investigação de acidente de trabalho?',
        opcoes: ['ASO', 'CAT', 'Relatório de Investigação de Acidente', 'PPRA', 'Ordem de Serviço'],
        resposta: 2, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'O que são EPCs (Equipamentos de Proteção Coletiva)?',
        opcoes: [
            'Equipamentos usados individualmente pelo trabalhador',
            'Dispositivos que protegem um grupo de trabalhadores simultaneamente',
            'Ferramentas para manutenção de máquinas',
            'Materiais para limpeza do ambiente',
            'Sistemas de monitoramento por câmera'
        ],
        resposta: 1, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'O que é o RAT (Riscos Ambientais do Trabalho)?',
        opcoes: [
            'Relatório anual de treinamentos realizados',
            'Contribuição previdenciária calculada sobre o grau de risco da atividade',
            'Registro de avaliação de temperaturas',
            'Roteiro de auditoria técnica',
            'Regulamento de atividades terceirizadas'
        ],
        resposta: 1, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'Qual a periodicidade mínima da SIPAT conforme a NR-5?',
        opcoes: ['Mensal', 'Trimestral', 'Semestral', 'Anual', 'Bienal'],
        resposta: 3, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'O DDS (Diálogo Diário de Segurança) deve durar idealmente:',
        opcoes: ['1 a 5 minutos', '5 a 15 minutos', '15 a 30 minutos', '30 a 60 minutos', 'Não há limite'],
        resposta: 1, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'O que é a FISPQ?',
        opcoes: [
            'Formulário de Inspeção de Segurança e Prevenção de Quedas',
            'Ficha de Informação de Segurança de Produtos Químicos',
            'Ficha de Inspeção do SESMT para Processos de Qualidade',
            'Formulário de Identificação do Sistema de Proteção de Qualidade',
            'Ficha Interna de Saúde e Prevenção Quinzenal'
        ],
        resposta: 1, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'O mapa de riscos da empresa é elaborado por qual órgão?',
        opcoes: ['SESMT', 'CIPA', 'RH', 'Engenharia', 'Diretoria'],
        resposta: 1, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'Qual o tipo de acidente que ocorre no percurso entre casa e trabalho?',
        opcoes: [
            'Acidente típico',
            'Acidente de trajeto',
            'Doença ocupacional',
            'Acidente de trabalho atípico',
            'Incidente de percurso'
        ],
        resposta: 1, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'A NR-1 estabelece disposições gerais sobre SST. Qual sua principal determinação?',
        opcoes: [
            'Obrigatoriedade do uso de capacete em todas as atividades',
            'O empregador deve implementar o GRO e informar os trabalhadores sobre os riscos',
            'Proibição de trabalho noturno para menores de 21 anos',
            'Obrigatoriedade de ginástica laboral em todas as empresas',
            'Realização de exames toxicológicos mensais'
        ],
        resposta: 1, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'Qual é o objetivo principal da Análise Ergonômica do Trabalho (AET)?',
        opcoes: [
            'Verificar o uso correto de EPIs',
            'Avaliar a adequação das condições de trabalho às características do trabalhador',
            'Medir o nível de ruído no posto de trabalho',
            'Controlar a jornada de trabalho dos funcionários',
            'Avaliar a rentabilidade do setor produtivo'
        ],
        resposta: 1, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'O que significa a cor VERMELHA no mapa de riscos da CIPA?',
        opcoes: [
            'Risco químico',
            'Risco biológico',
            'Risco ergonômico',
            'Risco físico',
            'Risco de acidentes/mecânico'
        ],
        resposta: 0, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'Qual a cor que representa risco BIOLÓGICO no mapa de riscos?',
        opcoes: ['Verde', 'Vermelho', 'Marrom', 'Amarelo', 'Azul'],
        resposta: 2, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'A NR-12 trata da segurança de qual tema?',
        opcoes: [
            'Trabalho em altura',
            'Máquinas e equipamentos',
            'Espaços confinados',
            'Instalações elétricas',
            'Movimentação de cargas'
        ],
        resposta: 1, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'O que é o Inventário de Riscos do PGR?',
        opcoes: [
            'Lista de EPIs disponíveis no almoxarifado',
            'Documento que identifica e avalia todos os perigos e riscos ocupacionais',
            'Relação de NRs aplicáveis à empresa',
            'Cadastro de trabalhadores expostos a insalubridade',
            'Inventário de máquinas do setor produtivo'
        ],
        resposta: 1, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'Qual profissional pode emitir o LTCAT?',
        opcoes: [
            'Apenas o Médico do Trabalho',
            'Engenheiro de Segurança ou Médico do Trabalho',
            'Técnico de Segurança do Trabalho',
            'Enfermeiro do Trabalho',
            'Qualquer membro do SESMT'
        ],
        resposta: 1, tempo: 20, acerto: 200, erro: -100
    },
    {
        type: 'quiz', title: 'Quiz SST!', icon: '🎓',
        pergunta: 'Qual a cor que representa risco de ACIDENTES/MECÂNICO no mapa de riscos?',
        opcoes: ['Verde', 'Vermelho', 'Marrom', 'Amarelo', 'Azul'],
        resposta: 3, tempo: 20, acerto: 200, erro: -100
    }
];

// Retorna uma carta aleatória do deck
export function pullRandomCard() {
    const drawIndex = Math.floor(Math.random() * DECK_SST.length);
    return DECK_SST[drawIndex];
}

// Retorna apenas cartas de um tipo específico
export function pullCardByType(type) {
    const filtered = DECK_SST.filter(c => c.type === type);
    return filtered[Math.floor(Math.random() * filtered.length)];
}