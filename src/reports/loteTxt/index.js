import { differenceInYears, parseISO } from 'date-fns';

// =============================================================================
// LAYOUT VALIDADO CONTRA LOTE REAL DO BPA MAGNÉTICO — DATASUS
//
// Este arquivo foi corrigido com base na análise byte-a-byte de um lote
// real exportado pelo sistema BPA Magnético (BPAMAG) do DATASUS.
//
// CABEÇALHO: 130 chars + CRLF
// LINHA BPA-I: 328 chars + CRLF   ← tamanho confirmado no lote real
//
// Correções aplicadas em relação às versões anteriores:
//   1. Cabeçalho começa com '01' + '#BPA#' (pos 001-007) — layout de exportação
//   2. cbc-sgl (pos 060-065): usa os 6 primeiros dígitos do CNES, não texto livre
//   3. Linha BPA-I encerra no email (pos 289-328) — sem INE, CPF resp. ou flag 'I'
//   4. Campo reservado de 2 espaços entre origem e nome removido — origem vai
//      de 110 a 112 e nome começa em 113 sem gap
// =============================================================================


// =============================================================================
// SEÇÃO 1 — UTILITÁRIOS DE FORMATAÇÃO POSICIONAL
//
// Arquivo de largura FIXA — cada campo ocupa exatamente N bytes na posição
// correta. Um byte errado causa "cabeçalho corrompido" na importação.
//
//   NUM  → apenas dígitos 0-9, zeros à ESQUERDA
//   ALFA → apenas A-Z 0-9 espaço (sem acentos), espaços à DIREITA
//   CHR  → bytes de controle ASCII literais (CR+LF)
// =============================================================================

/**
 * Formata campo NUMÉRICO: remove não-dígitos, preenche com zeros à esquerda.
 * @param {*}      value  Valor de entrada
 * @param {number} size   Tamanho exato do campo no layout
 * @returns {string}
 */
function padNum(value, size) {
  return String(value ?? '')
    .replace(/\D/g, '')
    .padStart(size, '0')
    .slice(-size);
}

/**
 * Formata campo ALFANUMÉRICO: remove acentos, maiúsculas, espaços à direita.
 * @param {*}      value  Valor de entrada
 * @param {number} size   Tamanho exato do campo no layout
 * @returns {string}
 */
function padAlfa(value, size) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // decompõe e remove acentos: ã→a, é→e, ç→c…
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')      // remove tudo que não é letra, número ou espaço
    .padEnd(size, ' ')
    .slice(0, size);
}

/** CR+LF obrigatório no fim de cada linha do arquivo BPA */
const CRLF = '\r\n';


// =============================================================================
// SEÇÃO 2 — EXTENSÃO DO ARQUIVO
//
// O arquivo gerado segue o padrão: PA_[CNES].[EXT]
// onde EXT é a abreviação em português do mês da competência (AAAAMM).
//
//   202601 → JAN  202602 → FEV  202603 → MAR  202604 → ABR
//   202605 → MAI  202606 → JUN  202607 → JUL  202608 → AGO
//   202609 → SET  202610 → OUT  202611 → NOV  202612 → DEZ
// =============================================================================

const EXTENSOES_MES = {
  '01': 'JAN', '02': 'FEV', '03': 'MAR', '04': 'ABR',
  '05': 'MAI', '06': 'JUN', '07': 'JUL', '08': 'AGO',
  '09': 'SET', '10': 'OUT', '11': 'NOV', '12': 'DEZ',
};

function extensaoArquivo(competencia) {
  const mes = String(competencia).slice(4, 6);
  return EXTENSOES_MES[mes] ?? 'BPA';
}


// =============================================================================
// SEÇÃO 3 — CAMPO DE CONTROLE (cbc-smt-vrf)
//
// Campo de 4 dígitos que valida o conteúdo do arquivo na importação.
// Valor fixo sempre causa rejeição — deve ser calculado a cada geração.
//
// Algoritmo oficial DATASUS:
//   1. soma = Σ(prd-qt) + Σ(prd-pa sem dígito verificador, ou seja, 9 dígitos)
//   2. Converte soma para string
//   3. Substitui cada dígito pelo mapa: 0→1 1→2 2→2 3→2 4→2 5→1 6→2 7→2 8→2 9→1
//   4. Garante 4 posições (preenche com '1' à esquerda se necessário)
//   Resultado deve estar no domínio [1111..2221]
// =============================================================================

const MAPA_CONTROLE = { 0:1, 1:2, 2:2, 3:2, 4:2, 5:1, 6:2, 7:2, 8:2, 9:1 };

/**
 * Calcula o campo de controle (cbc-smt-vrf) dinamicamente.
 * @param {Array<{procedimento:string, quantidade:number}>} registros
 * @returns {string} 4 dígitos
 */
function calcularCampoControle(registros) {
  const soma = registros.reduce((acc, r) => {
    const qtd    = parseInt(r.quantidade  || 0, 10);
    const codigo = parseInt(String(r.procedimento || '').slice(0, 9), 10) || 0;
    return acc + qtd + codigo;
  }, 0);

  const resultado = String(soma)
    .split('')
    .map(d => MAPA_CONTROLE[parseInt(d, 10)] ?? 1)
    .join('');

  return resultado.padStart(4, '1').slice(-4);
}


// =============================================================================
// SEÇÃO 4 — CABEÇALHO (cbc-hdr)
//
// Uma única linha por arquivo. Layout validado contra lote real do BPA.
//
//   Seq  Campo        Tam  Ini  Fim  Tipo  Descrição
//   1    cbc-hdr-id   002  001  002  NUM   Identificador fixo '01'
//   2    cbc-hdr-mrk  005  003  007  ALFA  Marcador fixo '#BPA#'
//   3    cbc-mvm      006  008  013  NUM   Competência AAAAMM
//   4    cbc-lin      006  014  019  NUM   Total de linhas BPA-I gravadas
//   5    cbc-flh      006  020  025  NUM   Total de folhas gravadas
//   6    cbc-smt-vrf  004  026  029  NUM   Campo de controle calculado
//   7    cbc-rsp      030  030  059  ALFA  Nome do órgão responsável
//   8    cbc-sgl      006  060  065  NUM   6 primeiros dígitos do CNES ← ATENÇÃO
//   9    cbc-cgccpf   014  066  079  NUM   CNPJ/CPF do prestador (14 dígitos)
//   10   cbc-dst      040  080  119  ALFA  Nome do órgão destino
//   11   cbc-dst-in   001  120  120  ALFA  Indicador: 'M'=Municipal 'E'=Estadual
//   12   cbc_versao   010  121  130  ALFA  Versão do sistema (livre)
//        cbc-fim      002  131  132  CHR   CR+LF
//
// NOTA cbc-sgl (pos 060-065):
//   Documentação diz "sigla do órgão", mas o BPA real grava os 6 primeiros
//   dígitos do CNES (sem o dígito verificador). Ex: CNES '4041062' → '404106'.
//   Usar texto como 'SMSIL' causa falha na importação.
// =============================================================================

/**
 * Gera a linha de cabeçalho do arquivo BPA.
 * @param {object} config        Configurações do estabelecimento
 * @param {number} totalLinhas   Total de registros de detalhe
 * @param {number} totalFolhas   Número da última folha utilizada
 * @param {string} campoControle Resultado de calcularCampoControle()
 * @returns {string} Linha de 130 chars + CRLF
 */
function gerarCabecalho(config, totalLinhas, totalFolhas, campoControle) {
  // cbc-sgl: 6 primeiros dígitos do CNES (sem dígito verificador)
  const siglaCnes = padNum(config.cnes, 7).slice(0, 6);

  let linha = '';
  linha += '01';                                    // pos 001-002: identificador fixo
  linha += '#BPA#';                                 // pos 003-007: marcador fixo
  linha += padNum(config.competencia,       6);     // pos 008-013: AAAAMM
  linha += padNum(totalLinhas,              6);     // pos 014-019: total linhas
  linha += padNum(totalFolhas,              6);     // pos 020-025: total folhas
  linha += padNum(campoControle,            4);     // pos 026-029: controle calculado
  linha += padAlfa(config.orgaoResponsavel, 30);    // pos 030-059: nome órgão origem
  linha += siglaCnes;                               // pos 060-065: 6 primeiros dígitos CNES
  linha += padNum(config.cnpjCpf,           14);    // pos 066-079: CNPJ/CPF (14 dígitos exatos)
  linha += padAlfa(config.orgaoDestino,     40);    // pos 080-119: nome órgão destino
  linha += padAlfa(config.indicadorDestino, 1);     // pos 120:     'M' ou 'E'
  linha += padAlfa(config.versaoSistema,    10);    // pos 121-130: versão sistema

  linha += CRLF; // pos 131-132
  return linha;
}


// =============================================================================
// SEÇÃO 5 — LINHA DETALHE BPA-I
//
// Layout validado byte a byte contra lote real do BPA Magnético.
// Tamanho: 328 chars + CRLF = 330 bytes por linha.
//
//   Seq  Campo          Tam  Ini  Fim  Tipo  Descrição
//   1    prd-ident      002  001  002  NUM   Identificador fixo '03'
//   2    prd-cnes       007  003  009  NUM   CNES do estabelecimento
//   3    prd-cmp        006  010  015  NUM   Competência AAAAMM
//   4    prd-cnsmed     015  016  030  NUM   CNS do profissional executante
//   5    prd-cbo        006  031  036  ALFA  CBO do profissional
//   6    prd-dtaten     008  037  044  NUM   Data atendimento AAAAMMDD
//   7    prd-flh        003  045  047  NUM   Número da folha [001..999]
//   8    prd-seq        002  048  049  NUM   Sequência na folha [01..20]
//   9    prd-pa         010  050  059  NUM   Código procedimento c/ dígito verif.
//   10   prd-cnspac     015  060  074  NUM   CNS do paciente
//   11   prd-sexo       001  075  075  ALFA  'M' ou 'F'
//   12   prd-ibge       006  076  081  NUM   IBGE município de residência
//   13   prd-cid        004  082  085  ALFA  CID-10 (brancos se não informado)
//   14   prd-ldade      003  086  088  NUM   Idade em anos completos
//   15   prd-qt         006  089  094  NUM   Quantidade de procedimentos
//   16   prd-crt        002  095  096  NUM   Caráter: 01=Eletivo 02=Urgência
//                                            03=Acid.trabalho 04=Acid.trajeto
//                                            05=Outros acid.trânsito
//                                            06=Outros envenenamentos
//   17   prd-naut       013  097  109  ALFA  Número de autorização (brancos se vazio)
//   18   prd-org        003  110  112  ALFA  Origem: 'BPA' 'EXT' 'PNI' etc.
//   19   prd-nmpac      030  113  142  ALFA  Nome completo do paciente
//   20   prd-dtnasc     008  143  150  NUM   Data nascimento AAAAMMDD
//   21   prd-raca       002  151  152  NUM   Raça/cor: 01=Branca 02=Preta
//                                            03=Parda 04=Amarela 05=Indígena
//                                            99=Sem informação
//   22   prd-etnia      004  153  156  NUM   Etnia (só se raça=05, senão brancos)
//   23   prd-nac        003  157  159  NUM   Nacionalidade (010=Brasileiro)
//   24   prd-srv        003  160  162  NUM   Código do Serviço (brancos se n/a)
//   25   prd-clf        003  163  165  NUM   Código da Classificação (brancos se n/a)
//   26   prd-equipe-seq 008  166  173  NUM   Sequencial da equipe (brancos se n/a)
//   27   prd-equipe-ar  004  174  177  NUM   Área da equipe (brancos se n/a)
//   28   prd-cnpj       014  178  191  NUM   CNPJ manutenção OPM (brancos se n/a)
//   29   prd-cep        008  192  199  NUM   CEP do paciente
//   30   prd-lograd     003  200  202  NUM   Código do tipo de logradouro
//   31   prd-end        030  203  232  ALFA  Nome do logradouro (rua, av…)
//   32   prd-compl      010  233  242  ALFA  Complemento do endereço
//   33   prd-num        005  243  247  ALFA  Número do imóvel ('SN' se sem número)
//   34   prd-bairro     030  248  277  ALFA  Bairro
//   35   prd-tel        011  278  288  NUM   Telefone com DDD (zeros se vazio)
//   36   prd-email      040  289  328  ALFA  E-mail (brancos se vazio)
//        prd-fim        002  329  330  CHR   CR+LF
//
// CAMPOS QUE NÃO EXISTEM no lote real (removidos das versões anteriores):
//   • INE da equipe         (estava como pos 329-338)
//   • CPF do responsável    (estava como pos 339-349)
//   • Flag tipo 'I'/'C'     (estava como pos 350)
// =============================================================================

/**
 * Gera uma linha de detalhe BPA-I.
 * @param {object} item        Dados do atendimento (ver CONFIG e função principal)
 * @param {number} numeroFolha Número da folha atual [001..999]
 * @param {number} sequencia   Sequência dentro da folha [01..20]
 * @returns {string} Linha de 328 chars + CRLF
 */
function gerarLinhaBPAI(item, numeroFolha, sequencia) {
  let linha = '';

  // — Identificação do estabelecimento e profissional —
  linha += '03';                                        // pos 001-002: fixo
  linha += padNum(item.cnes,            7);             // pos 003-009
  linha += padNum(item.competencia,     6);             // pos 010-015
  linha += padNum(item.cnsProfissional, 15);            // pos 016-030
  linha += padAlfa(item.cbo,            6);             // pos 031-036
  linha += padNum(item.dataAtendimento, 8);             // pos 037-044

  // — Controle de folha —
  linha += padNum(numeroFolha,          3);             // pos 045-047
  linha += padNum(sequencia,            2);             // pos 048-049

  // — Procedimento —
  linha += padNum(item.procedimento,    10);            // pos 050-059

  // — Paciente: identificação básica —
  linha += padNum(item.cnsPaciente ?? '',  15);         // pos 060-074
  linha += padAlfa(item.sexo ?? ' ',       1);          // pos 075
  linha += padNum(item.ibge ?? '',         6);          // pos 076-081
  linha += padAlfa(item.cid ?? '    ',     4);          // pos 082-085

  // — Dados do atendimento —
  linha += padNum(item.idade ?? 0,         3);          // pos 086-088
  linha += padNum(item.quantidade,         6);          // pos 089-094
  linha += padNum(item.carater ?? '01',    2);          // pos 095-096: 01=eletivo padrão
  linha += padAlfa(item.naut ?? '',        13);         // pos 097-109: autorização
  linha += padAlfa(item.origem ?? 'BPA',   3);          // pos 110-112

  // — Dados nominais e demográficos do paciente (exclusivos BPA-I) —
  linha += padAlfa(item.nomePaciente ?? '',   30);      // pos 113-142
  linha += padNum(item.dataNascimento ?? '',   8);      // pos 143-150: AAAAMMDD
  linha += padNum(item.racaCor ?? '99',        2);      // pos 151-152: 99=sem info
  linha += padNum(item.etnia ?? '',            4);      // pos 153-156: só se raça=05
  linha += padNum(item.nacionalidade ?? '010', 3);      // pos 157-159: 010=brasileiro

  // — Serviço e classificação (deixar vazio se não se aplica) —
  linha += padNum(item.codigoServico ?? '',      3);    // pos 160-162
  linha += padNum(item.codigoClassificacao ?? '',3);    // pos 163-165

  // — Equipe (deixar vazio se não utiliza) —
  linha += padNum(item.equipeSeq ?? '',   8);           // pos 166-173
  linha += padNum(item.equipeArea ?? '',  4);           // pos 174-177

  // — CNPJ manutenção OPM (só para procedimentos com OPM) —
  linha += padNum(item.cnpjManutencao ?? '', 14);       // pos 178-191

  // — Endereço completo do paciente —
  linha += padNum(item.cep ?? '',               8);     // pos 192-199
  linha += padNum(item.codigoLogradouro ?? '0', 3);     // pos 200-202
  linha += padAlfa(item.endereco ?? '',         30);    // pos 203-232
  linha += padAlfa(item.complemento ?? '',      10);    // pos 233-242
  linha += padAlfa(item.numero ?? 'SN',          5);    // pos 243-247
  linha += padAlfa(item.bairro ?? '',           30);    // pos 248-277

  // — Contato —
  linha += padNum(item.telefone ?? '',  11);            // pos 278-288
  linha += padAlfa(item.email ?? '',    40);            // pos 289-328

  // Linha encerra aqui — 328 chars + CRLF
  // NÃO há INE, CPF responsável ou flag 'I' no layout real do BPA
  linha += CRLF; // pos 329-330
  return linha;
}


// =============================================================================
// SEÇÃO 6 — CONFIGURAÇÕES FIXAS DO ESTABELECIMENTO
//
// Altere os valores abaixo para o seu estabelecimento.
// Em produção, considere mover para variáveis de ambiente ou banco de dados.
// =============================================================================

const CONFIG = {
  // Identificação do estabelecimento
  cnes:             '2794454',   // CNES completo com 7 dígitos
  competencia:      '202503',    // AAAAMM — atualizar a cada competência

  // Dados do profissional executante padrão
  cnsProfissional:  '704008832247760',
  cbo:              '225125',

  // Dados do cabeçalho
  orgaoResponsavel: 'SMS ILICINEA',                         // max 30 chars
  // cbc-sgl é gerado automaticamente dos 6 primeiros dígitos do CNES
  cnpjCpf:          '31305018239608',                       // 14 dígitos exatos
  orgaoDestino:     'SECRETARIA DE ESTADO DA SAUDE MG',     // max 40 chars
  indicadorDestino: 'E',                                    // 'M'=Municipal 'E'=Estadual
  versaoSistema:    'D04.09',                               // max 10 chars
};


// =============================================================================
// SEÇÃO 7 — FUNÇÃO PRINCIPAL
//
// Mantém a mesma assinatura do arquivo original: generateBPAIFile(trips)
//
// Estrutura esperada de cada `trip`:
// {
//   departure_date: string,          // 'YYYY-MM-DD'
//   route: { distance: number },     // distância em km
//   clients: Array<{
//     pivot: {
//       is_confirmed: boolean,
//       person_type:  string,        // 'PASSENGER' ou outro
//     },
//     name:      string,             // nome completo
//     cpf:       string,
//     cns:       string,             // CNS (15 dígitos)
//     sexo:      string,             // 'FEMININE' | outro
//     born_date: string,             // 'YYYY-MM-DD'
//     phone:     string,
//     email:     string,
//     addresses: {
//       ibge_code:       string,     // IBGE 6 dígitos
//       cep:             string,
//       logradouro_code: string,
//       street:          string,
//       number:          string,
//       complement:      string,
//       neighborhood:    string,
//     },
//   }>
// }
// =============================================================================

/**
 * Gera e faz o download do arquivo BPA-I no formato do BPA Magnético DATASUS.
 * @param {Array} trips Array de viagens conforme estrutura acima
 */
export default function generateBPAIFile(trips) {
  const linhasGeradas  = [];
  const resumoControle = []; // dados mínimos para calcular campo de controle
  let numeroFolha = 1;
  let sequencia   = 1;

  trips.forEach((trip) => {
    // Converte 'YYYY-MM-DD' → 'YYYYMMDD'
    const dataAtendimento = trip.departure_date.replace(/-/g, '');

    // Apenas clientes confirmados geram registro
    const confirmados = trip.clients.filter((c) => c.pivot?.is_confirmed);

    confirmados.forEach((client) => {
      // Máximo 20 linhas por folha — ao ultrapassar, abre nova folha
      if (sequencia > 20) {
        sequencia = 1;
        numeroFolha++;
      }

      // Seleção do procedimento pelo tipo do passageiro
      const procedimento =
        client.pivot.person_type?.toUpperCase() === 'PASSENGER'
          ? '0803010125'
          : '0803010109';

      // Quantidade baseada na distância percorrida (fórmula original mantida)
      const quantidade = Math.max(1, Math.round((trip.route.distance * 2) / 50));

      const sexo       = client.sexo === 'FEMININE' ? 'F' : 'M';
      const nascimento = client.born_date ? parseISO(client.born_date) : new Date();
      const dataPartida= parseISO(trip.departure_date);
      const idade      = differenceInYears(dataPartida, nascimento);

      // Data de nascimento no formato AAAAMMDD para prd-dtnasc
      const dataNascimento = client.born_date
        ? client.born_date.replace(/-/g, '')
        : '';

      const addr = client.addresses ?? {};

      const atendimento = {
        // Estabelecimento e profissional
        cnes:            CONFIG.cnes,
        competencia:     CONFIG.competencia,
        cnsProfissional: CONFIG.cnsProfissional,
        cbo:             CONFIG.cbo,
        dataAtendimento,

        // Procedimento
        procedimento,

        // Identificação básica do paciente
        cnsPaciente: client.cns,
        sexo,
        ibge:        addr.ibge_code || '313050', // fallback: Ilicínea/MG
        cid:         '',                          // CID não disponível neste fluxo

        // Atendimento
        idade,
        quantidade,
        carater: '01',   // 01=Eletivo (padrão; ajuste se houver urgências)
        naut:    '',     // sem autorização prévia neste fluxo
        origem:  'BPA', // 'BPA' para produção normal; 'EXT' para sistema externo

        // Dados demográficos — exclusivos BPA-I
        nomePaciente:        client.name,
        dataNascimento,
        racaCor:             '99',   // 99=Sem informação — ajuste se disponível
        etnia:               '',     // preencher apenas se racaCor='05' (Indígena)
        nacionalidade:       '010',  // 010=Brasileiro

        // Serviço/Classificação — vazio se não se aplica ao procedimento
        codigoServico:       '',
        codigoClassificacao: '',

        // Equipe — vazio se o estabelecimento não usa equipe de saúde
        equipeSeq:  '',
        equipeArea: '',

        // CNPJ manutenção OPM — só preencher para procedimentos com OPM
        cnpjManutencao: '',

        // Endereço do paciente
        cep:             addr.cep             || '',
        codigoLogradouro: addr.logradouro_code || '0',
        endereco:        addr.street          || '',
        complemento:     addr.complement      || '',
        numero:          addr.number          || 'SN',
        bairro:          addr.neighborhood    || '',

        // Contato
        telefone: client.phone || '',
        email:    client.email || '',
      };

      linhasGeradas.push(gerarLinhaBPAI(atendimento, numeroFolha, sequencia));
      resumoControle.push({ procedimento, quantidade });
      sequencia++;
    });
  });

  // ---------------------------------------------------------------------------
  // Totais calculados DEPOIS de iterar todos os registros
  // ---------------------------------------------------------------------------
  const totalLinhas   = linhasGeradas.length;
  const totalFolhas   = numeroFolha;
  const campoControle = calcularCampoControle(resumoControle);
  const cabecalho     = gerarCabecalho(CONFIG, totalLinhas, totalFolhas, campoControle);

  // ---------------------------------------------------------------------------
  // Arquivo final: 1 cabeçalho + N linhas BPA-I
  // Cada linha já carrega seu próprio CRLF — não concatenar extra.
  // Não existe rodapé no layout BPA.
  // ---------------------------------------------------------------------------
  const textoFinal = cabecalho + linhasGeradas.join('');

  // ---------------------------------------------------------------------------
  // Download
  // Nome: PA_[CNES].[EXT]   ex: PA_2794454.MAR
  // Encoding: us-ascii — o BPA não aceita UTF-8 nem Latin-1 com acentos
  // ---------------------------------------------------------------------------
  const extensao    = extensaoArquivo(CONFIG.competencia);
  const nomeArquivo = `PA${CONFIG.cnes}.${extensao}`;

  const blob = new Blob([textoFinal], { type: 'text/plain;charset=us-ascii' });
  const link = document.createElement('a');
  link.href     = URL.createObjectURL(blob);
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
