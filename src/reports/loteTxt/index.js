import { differenceInYears, parseISO } from 'date-fns';

// =============================================================================
// REFERÊNCIA DE LAYOUT
//
// Fonte oficial: Layout_Exportacao_BPA.pdf — DATASUS/SIA (dez/2024)
// Validado contra lote real exportado pelo BPA Magnético (BPAMAG).
//
// CABEÇALHO : 130 chars + CRLF  (pos 001–130)
// LINHA BPA-I: 338 chars + CRLF  (pos 001–338) — inclui INE obrigatório
//              a partir da competência 08/2015
// =============================================================================


// =============================================================================
// SEÇÃO 1 — UTILITÁRIOS DE FORMATAÇÃO POSICIONAL
// =============================================================================

/**
 * Formata campo NUMÉRICO.
 * Remove não-dígitos, preenche com zeros à esquerda até `size` caracteres.
 */
function padNum(value, size) {
  return String(value ?? '')
    .replace(/\D/g, '')
    .padStart(size, '0')
    .slice(-size);
}

/**
 * Formata campo ALFANUMÉRICO.
 * Remove acentos, converte para maiúsculas, remove caracteres especiais,
 * preenche com espaços à direita até `size` caracteres.
 */
function padAlfa(value, size) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // ã→a, é→e, ç→c…
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .padEnd(size, ' ')
    .slice(0, size);
}

/** CR+LF obrigatório no fim de cada linha do arquivo BPA */
const CRLF = '\r\n';


// =============================================================================
// SEÇÃO 2 — EXTENSÃO DO ARQUIVO
//
// Padrão de nome: PA_[CNES].[EXT]
// EXT = abreviação em português do mês extraída dos 2 últimos dígitos de AAAAMM.
//   202601→JAN 202602→FEV 202603→MAR 202604→ABR 202605→MAI 202606→JUN
//   202607→JUL 202608→AGO 202609→SET 202610→OUT 202611→NOV 202612→DEZ
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
// Algoritmo oficial DATASUS (Layout_Exportacao_BPA.pdf):
//   1. soma = Σ(prd-qt) + Σ(prd-pa sem dígito verificador = 9 primeiros dígitos)
//   2. resto = soma % 1111
//   3. resultado = resto + 1111
//   Resultado: inteiro no intervalo [1111..2221], 4 dígitos
//
// ATENÇÃO: versões anteriores deste arquivo usavam mapeamento de dígitos.
// O algoritmo correto conforme documento oficial é resto + 1111.
// =============================================================================

/**
 * Calcula o campo de controle dinamicamente.
 * @param {Array<{procedimento:string, quantidade:number}>} registros
 * @returns {string} 4 dígitos no domínio [1111..2221]
 */
function calcularCampoControle(registros) {
  const soma = registros.reduce((acc, r) => {
    const qtd    = parseInt(r.quantidade  || 0, 10);
    const codigo = parseInt(String(r.procedimento || '').slice(0, 9), 10) || 0;
    return acc + qtd + codigo;
  }, 0);

  const resultado = (soma % 1111) + 1111;
  return String(resultado).padStart(4, '0');
}


// =============================================================================
// SEÇÃO 4 — CABEÇALHO (cbc-hdr)
//
// Layout validado contra lote real do BPA Magnético.
//
//   Seq  Campo        Tam  Ini  Fim  Tipo  Descrição
//   1    cbc-hdr-id   002  001  002  NUM   Fixo '01'
//   2    cbc-hdr-mrk  005  003  007  ALFA  Fixo '#BPA#'
//   3    cbc-mvm      006  008  013  NUM   Competência AAAAMM
//   4    cbc-lin      006  014  019  NUM   Total de linhas BPA gravadas
//   5    cbc-flh      006  020  025  NUM   Total de folhas gravadas
//   6    cbc-smt-vrf  004  026  029  NUM   Campo de controle calculado
//   7    cbc-rsp      030  030  059  ALFA  Nome do órgão responsável
//   8    cbc-sgl      006  060  065  NUM   6 primeiros dígitos do CNES *
//   9    cbc-cgccpf   014  066  079  NUM   CNPJ/CPF do prestador (14 dígitos)
//   10   cbc-dst      040  080  119  ALFA  Nome do órgão destino
//   11   cbc-dst-in   001  120  120  ALFA  'M'=Municipal / 'E'=Estadual
//   12   cbc_versao   010  121  130  ALFA  Versão do sistema (livre)
//        cbc-fim      002  131  132  CHR   CR+LF
//
// * cbc-sgl: documentação diz "sigla do órgão", mas o BPA grava os 6
//   primeiros dígitos do CNES (sem o dígito verificador).
//   Ex: CNES '2794454' → cbc-sgl = '279445'
// =============================================================================

function gerarCabecalho(config, totalLinhas, totalFolhas, campoControle) {
  // 6 primeiros dígitos do CNES (sem dígito verificador)
  const siglaCnes = padNum(config.cnes, 7).slice(0, 6);

  let linha = '';
  linha += '01';                                    // pos 001-002: fixo
  linha += '#BPA#';                                 // pos 003-007: fixo
  linha += padNum(config.competencia,       6);     // pos 008-013
  linha += padNum(totalLinhas,              6);     // pos 014-019
  linha += padNum(totalFolhas,              6);     // pos 020-025
  linha += padNum(campoControle,            4);     // pos 026-029
  linha += padAlfa(config.orgaoResponsavel, 30);    // pos 030-059
  linha += siglaCnes;                               // pos 060-065
  linha += padNum(config.cnpjCpf,           14);    // pos 066-079
  linha += padAlfa(config.orgaoDestino,     40);    // pos 080-119
  linha += padAlfa(config.indicadorDestino, 1);     // pos 120
  // versão: permite letras, números e ponto — padAlfa removeria o '.'
  linha += String(config.versaoSistema ?? '').padEnd(10, ' ').slice(0, 10); // pos 121-130
  linha += CRLF;                                    // pos 131-132
  return linha;
}


// =============================================================================
// SEÇÃO 5 — IDENTIFICAÇÃO DO PACIENTE: CNS e CPF
//
// A partir do BPA versão 04.00 (abril/2024), CNS e CPF ocupam campos SEPARADOS:
//
//   prd-cnspac    (pos 060-074, 15 NUM): EXCLUSIVO para CNS
//     Se tem CNS: padNum(cns, 15)  — 15 dígitos com zeros à esquerda
//     Se não tem: '               ' — 15 espaços em branco
//     NÃO gravar CPF aqui: o BPA 04.00 interpreta qualquer conteúdo
//     numérico neste campo como CNS e rejeita ou exibe no campo errado.
//
//   prd-cpf-pcnte (pos 339-349, 11 NUM): campo NOVO no BPA 04.00
//     Se não tem CNS mas tem CPF: padNum(cpf, 11)
//     Se tem CNS (ou sem CPF)   : '           ' — 11 espaços (campo vazio)
//
//   prd-sit-rua   (pos 350, 1 ALFA): pessoa em situação de rua
//     Adicionado no BPA 04.00 junto com o campo CPF.
//     Valores: 'S'=Sim / 'N'=Nao. Sempre gravar 'N'.
//
// Regra de prioridade:
//   1. CNS disponível (>=11 dígitos): cnsPac=CNS,    cpfPac=11 espaços (vazio)
//   2. CPF disponível (11 dígitos) : cnsPac=espaços, cpfPac=CPF
//   3. Nenhum disponível           : linha IGNORADA
//
// Linha BPA-I passa a ter 350 chars + CRLF = 352 bytes (BPA 04.00)
// =============================================================================

/**
 * Resolve CNS e CPF para os campos separados do BPA 04.00.
 * @param {string} cns CNS do paciente
 * @param {string} cpf CPF do paciente
 * @returns {{ cnsPac: string, cpfPac: string }|null}
 *   null se nenhum identificador disponível (linha deve ser ignorada)
 */
function resolverIdentificadorPaciente(cns, cpf) {
  const cnsLimpo = String(cns ?? '').replace(/\D/g, '');
  const cpfLimpo = String(cpf ?? '').replace(/\D/g, '');

  if (cnsLimpo.length >= 11) {
    return {
      cnsPac: padNum(cnsLimpo, 15),  // pos 060-074: CNS com zeros à esquerda
      cpfPac: '           ',         // pos 339-349: 11 espaços (campo vazio, sem CPF)
    };
  }

  if (cpfLimpo.length === 11) {
    return {
      cnsPac: '               ',     // pos 060-074: 15 espaços (sem CNS)
      cpfPac: padNum(cpfLimpo, 11),  // pos 339-349: CPF com zeros à esquerda
    };
  }

  return null; // sem identificador — linha ignorada
}


// =============================================================================
// SEÇÃO 6 — LINHA DETALHE BPA-I
//
// Layout oficial: Layout_Exportacao_BPA.pdf — DATASUS + BPA 04.00 (abr/2024)
// Tamanho: 350 chars + CRLF = 352 bytes por linha
//
//   Seq  Campo              Tam  Ini  Fim  Tipo  Descrição
//   1    prd-ident          002  001  002  NUM   Fixo '03'
//   2    prd-cnes           007  003  009  NUM   CNES do estabelecimento
//   3    prd-cmp            006  010  015  NUM   Competência AAAAMM
//   4    prd-cnsmed         015  016  030  NUM   CNS do profissional
//   5    prd-cbo            006  031  036  ALFA  CBO do profissional
//   6    prd-dtaten         008  037  044  NUM   Data atendimento AAAAMMDD
//   7    prd-flh            003  045  047  NUM   Folha [001..999]
//   8    prd-seq            002  048  049  NUM   Sequência [01..20]
//   9    prd-pa             010  050  059  NUM   Procedimento c/ dígito verif.
//   10   prd-cnspac         015  060  074  NUM   CNS ou CPF do paciente *
//   11   prd-sexo           001  075  075  ALFA  'M' ou 'F'
//   12   prd-ibge           006  076  081  NUM   IBGE município residência
//   13   prd-cid            004  082  085  ALFA  CID-10
//   14   prd-ldade          003  086  088  NUM   Idade [0..130]
//   15   prd-qt             006  089  094  NUM   Quantidade procedimentos
//   16   prd-crt            002  095  096  NUM   Caráter: 01=Eletivo 02=Urgência
//   17   prd-naut           013  097  109  ALFA  Número de autorização
//   18   prd-org            003  110  112  ALFA  Origem: 'BPA','EXT','PNI'…
//   19   prd-nmpac          030  113  142  ALFA  Nome completo do paciente
//   20   prd-dtnasc         008  143  150  NUM   Data nascimento AAAAMMDD
//   21   prd-raca           002  151  152  NUM   Raça/cor (99=sem informação)
//   22   prd-etnia          004  153  156  NUM   Etnia (só se raça='05')
//   23   prd-nac            003  157  159  NUM   Nacionalidade (010=brasileiro)
//   24   prd-srv            003  160  162  NUM   Código do Serviço
//   25   prd-clf            003  163  165  NUM   Código da Classificação
//   26   prd-equipe-seq     008  166  173  NUM   Sequencial da equipe
//   27   prd-equipe-area    004  174  177  NUM   Área da equipe
//   28   prd-cnpj           014  178  191  NUM   CNPJ manutenção OPM
//   29   prd-cep            008  192  199  NUM   CEP **
//   30   prd-lograd         003  200  202  NUM   Código logradouro **
//   31   prd-end            030  203  232  ALFA  Endereço (logradouro)
//   32   prd-compl          010  233  242  ALFA  Complemento ** → sempre 'CASA'
//   33   prd-num            005  243  247  ALFA  Número do imóvel
//   34   prd-bairro         030  248  277  ALFA  Bairro ** → fallback 'CENTRO'
//   35   prd-tel            011  278  288  NUM   Telefone com DDD
//   36   prd-email          040  289  328  ALFA  E-mail
//   37   prd-ine            010  329  338  NUM   INE equipe (obrig. ≥ 08/2015)
//        prd-fim            002  339  340  CHR   CR+LF
//
// * prd-cnspac: prioridade CNS → CPF (zeros à esquerda até 15 dígitos)
//              se nenhum disponível, linha não é gerada (ver seção 5)
//
// ** Campos com valores fixos ou regra específica (ver seção 7):
//   prd-cep    → sempre '37175000'
//   prd-lograd → sempre '081'
//   prd-compl  → sempre 'CASA'
//   prd-bairro → addr.district ou 'CENTRO' se vazio
//
// CAMPO "SITUAÇÃO DE RUA": NÃO existe no layout BPA-I.
//   Existe apenas no SISAIH01 (sistema de AIH hospitalar).
//   Não deve ser inserido no arquivo BPA.
// =============================================================================

function gerarLinhaBPAI(item, numeroFolha, sequencia) {
  let linha = '';

  // — Estabelecimento e profissional —
  linha += '03';                                        // pos 001-002: fixo
  linha += padNum(item.cnes,            7);             // pos 003-009
  linha += padNum(item.competencia,     6);             // pos 010-015
  linha += padNum(item.cnsProfissional, 15);            // pos 016-030
  linha += padAlfa(item.cbo,            6);             // pos 031-036
  linha += padNum(item.dataAtendimento, 8);             // pos 037-044

  // — Folha e sequência —
  linha += padNum(numeroFolha,          3);             // pos 045-047
  linha += padNum(sequencia,            2);             // pos 048-049

  // — Procedimento —
  linha += padNum(item.procedimento,    10);            // pos 050-059

  // — Identificação do paciente —
  // prd-cnspac: EXCLUSIVO para CNS (BPA 04.00). Se sem CNS: 15 espaços.
  linha += item.identificadorPaciente.cnsPac;            // pos 060-074
  linha += padAlfa(item.sexo ?? ' ',    1);             // pos 075
  linha += padNum(item.ibge ?? '',      6);             // pos 076-081
  linha += padAlfa(item.cid ?? '    ',  4);             // pos 082-085

  // — Atendimento —
  linha += padNum(item.idade ?? 0,      3);             // pos 086-088
  linha += padNum(item.quantidade,      6);             // pos 089-094
  linha += padNum(item.carater ?? '01', 2);             // pos 095-096
  linha += padAlfa(item.naut ?? '',     13);            // pos 097-109
  linha += padAlfa(item.origem ?? 'BPA', 3);            // pos 110-112

  // — Dados nominais e demográficos (exclusivos BPA-I) —
  linha += padAlfa(item.nomePaciente ?? '',     30);    // pos 113-142
  linha += padNum(item.dataNascimento ?? '',     8);    // pos 143-150
  linha += padNum(item.racaCor ?? '01',          2);    // pos 151-152: 01=Branca (padrão)
  // etnia: só preencher se raça='05' (Indígena); caso contrário 4 espaços
  const etnia = (item.racaCor === '05' && item.etnia)
    ? padNum(item.etnia, 4)
    : '    ';
  linha += etnia;                                        // pos 153-156
  linha += padNum(item.nacionalidade ?? '010',   3);    // pos 157-159

  // — Serviço / Classificação —
  // Campos opcionais de código: espaços quando não informados (zeros = inválido)
  linha += item.codigoServico       ? padNum(item.codigoServico, 3)       : '   '; // pos 160-162
  linha += item.codigoClassificacao ? padNum(item.codigoClassificacao, 3) : '   '; // pos 163-165

  // — Equipe —
  // Espaços quando não utiliza equipe (zeros causam erro de código inválido)
  linha += item.equipeSeq  ? padNum(item.equipeSeq,  8) : '        '; // pos 166-173
  linha += item.equipeArea ? padNum(item.equipeArea, 4) : '    ';     // pos 174-177

  // — CNPJ manutenção OPM —
  // Espaços quando não há OPM vinculada (zeros não representam CNPJ vazio)
  linha += item.cnpjManutencao ? padNum(item.cnpjManutencao, 14) : '              '; // pos 178-191

  // — Endereço —
  // CEP: fixo '37175000' (8 dígitos, sem traço)
  linha += '37175000';                                  // pos 192-199
  // Código logradouro: fixo '081'
  linha += '081';                                       // pos 200-202
  linha += padAlfa(item.endereco ?? '',          30);   // pos 203-232
  // Complemento: sempre 'CASA', independente do dado recebido
  linha += padAlfa('CASA',                       10);   // pos 233-242
  linha += padAlfa(item.numero ?? 'SN',           5);   // pos 243-247
  // Bairro: usar o dado recebido; se vazio ou ausente, informar 'CENTRO'
  const bairro = String(item.bairro ?? '').trim() || 'CENTRO';
  linha += padAlfa(bairro,                       30);   // pos 248-277

  // — Contato —
  linha += padNum(item.telefone ?? '',           11);   // pos 278-288
  linha += padAlfa(item.email ?? '',             40);   // pos 289-328

  // — INE da equipe de saúde (obrigatório a partir de 08/2015) —
  //
  // REGRA:
  //   Se o procedimento exige equipe no SIGTAP: informar o INE cadastrado no CNES.
  //   Se não há equipe vinculada: 10 ESPAÇOS (campo vazio).
  //
  // ATENCAO: '0000000000' (10 zeros) é interpretado pelo BPA como "código de
  // equipe inválido" e gera erro "EQUIPE INVALIDA OU OBRIGATORIA".
  // Campo sem equipe DEVE ser 10 espaços, nunca zeros.
  const ineValor = String(item.ine ?? '').trim();
  linha += ineValor ? padNum(ineValor, 10) : '          '; // pos 329-338

  // — CPF do paciente (campo NOVO no BPA 04.00) —
  // Preenchido apenas quando o paciente não tem CNS (ver seção 5)
  linha += item.identificadorPaciente.cpfPac;            // pos 339-349

  // — Situação de rua (campo NOVO no BPA 04.00) —
  // 'S'=Sim / 'N'=Nao. Sempre 'N' conforme requisito.
  linha += 'N';                                          // pos 350

  linha += CRLF; // pos 351-352
  return linha;
}


// =============================================================================
// SEÇÃO 7 — CONFIGURAÇÕES FIXAS DO ESTABELECIMENTO
// =============================================================================

const CONFIG = {
  cnes:             '2794454',
  competencia:      '202603',            // AAAAMM — atualizar mensalmente

  cnsProfissional:  '706807245644825',
  cbo:              '225142',

  // INE da equipe de saúde vinculada ao estabelecimento no CNES.
  // Verificar em: CNES > Equipes > INE da equipe responsável pelos procedimentos.
  // Se o procedimento 0803010125/0803010109 exige equipe no SIGTAP,
  // este campo é OBRIGATÓRIO. Deixar vazio ('') apenas se o procedimento
  // não exige equipe — o campo será gravado como 10 espaços no arquivo.
  ine:              '',                  // ex: '0000573280' — INE da equipe no CNES

  orgaoResponsavel: 'SMS ILICINEA',      // max 30 chars
  cnpjCpf:          '31305018239608',    // 14 dígitos numéricos
  orgaoDestino:     'SECRETARIA DE ESTADO DA SAUDE MG', // max 40 chars
  indicadorDestino: 'E',                 // 'M'=Municipal / 'E'=Estadual
  versaoSistema:    'D04.09',            // max 10 chars
};


// =============================================================================
// SEÇÃO 8 — FUNÇÃO PRINCIPAL
//
// Mesma assinatura do arquivo original: generateBPAIFile(trips)
//
// Estrutura esperada de cada `trip`:
// {
//   departure_date: string,          // 'YYYY-MM-DD'
//   route: { distance: number },     // distância em km
//   clients: Array<{
//     pivot: {
//       is_confirmed: boolean,
//       person_type:  string,        // 'PASSENGER' | outro
//     },
//     name:      string,
//     cpf:       string,             // CPF (11 dígitos) — usado se CNS ausente
//     cns:       string,             // CNS (15 dígitos) — preferencial
//     sexo:      string,             // 'FEMININE' | outro
//     born_date: string,             // 'YYYY-MM-DD'
//     phone:     string,
//     email:     string,
//     addresses: {
//       ibge_code:    string,        // IBGE 6 dígitos
//       street:       string,        // nome da rua
//       number:       string,        // número do imóvel
//       district:     string,        // bairro — fallback 'CENTRO' se vazio
//       // cep, logradouro_code e complement são IGNORADOS:
//       // CEP fixo '37175000', logradouro fixo '081', complemento fixo 'CASA'
//     },
//   }>
// }
//
// REGRA DE IDENTIFICAÇÃO DO PACIENTE:
//   CNS disponível → usa CNS (15 dígitos)
//   CNS ausente mas CPF disponível → usa CPF (preenchido até 15 dígitos)
//   Nenhum disponível → cliente IGNORADO (sem geração de registro)
// =============================================================================

export default function generateBPAIFile(trips, professionalConfig = {}) {
  const linhasGeradas  = [];
  const resumoControle = [];
  let numeroFolha = 1;
  let sequencia   = 1;

  // ---------------------------------------------------------------------------
  // COMPETÊNCIA DINÂMICA
  // Derivada da menor departure_date presente no array trips.
  // Extrai AAAA e MM da data mais antiga e monta o formato AAAAMM exigido
  // pelo layout BPA.
  //
  // Exemplo: trips com datas ['2026-03-15', '2026-03-02', '2026-03-20']
  //   → menor data = '2026-03-02'
  //   → competencia = '202603'
  //
  // Fallback: se trips estiver vazio, mantém o valor definido em CONFIG.
  // ---------------------------------------------------------------------------
  const menorData = trips
    .map((t) => t.departure_date)
    .filter(Boolean)
    .sort()[0]; // sort lexicográfico funciona corretamente em datas 'YYYY-MM-DD'

  const competencia = menorData
    ? menorData.slice(0, 4) + menorData.slice(5, 7) // 'YYYY-MM-DD' → 'AAAAMM'
    : CONFIG.competencia;                            // fallback se array vazio

  // Sobrescreve CONFIG localmente — não altera o objeto global
  const config = {
    ...CONFIG,
    ...professionalConfig,
    competencia,
    cnsProfissional: String(professionalConfig.cnsProfissional ?? CONFIG.cnsProfissional).replace(/\D/g, ''),
    cbo: String(professionalConfig.cbo ?? CONFIG.cbo).replace(/\D/g, ''),
  };

  trips.forEach((trip) => {
    const dataAtendimento = trip.departure_date.replace(/-/g, '');
    const confirmados = trip.clients.filter((c) => c.pivot?.is_confirmed);

    confirmados.forEach((client) => {
      // -----------------------------------------------------------------------
      // VALIDAÇÃO: CNS ou CPF obrigatório
      // Se nenhum identificador válido estiver disponível, ignora este cliente
      // -----------------------------------------------------------------------
      const identificadorPaciente = resolverIdentificadorPaciente(
        client.cns,
        client.cpf
      );

      if (identificadorPaciente === null) {
        console.warn(
          `[BPA-I] Cliente ignorado — sem CNS nem CPF valido: "${client.name}"`
        );
        return; // pula este cliente
      }

      // Controle de folha: máximo 20 linhas por folha
      if (sequencia > 20) {
        sequencia = 1;
        numeroFolha++;
      }

      // Seleção do procedimento pelo tipo do passageiro
      const procedimento =
        client.pivot.person_type?.toUpperCase() === 'PASSENGER'
          ? '0803010125'
          : '0803010109';

      // Quantidade baseada na distância (fórmula original mantida; mínimo 1)
      const quantidade = Math.max(1, Math.round((trip.route.distance * 2) / 50));

      const sexo       = client.sexo === 'FEMININE' ? 'F' : 'M';
      const nascimento = client.born_date ? parseISO(client.born_date) : new Date();
      const dataPartida= parseISO(trip.departure_date);
      const idade      = differenceInYears(dataPartida, nascimento);

      const dataNascimento = client.born_date
        ? client.born_date.replace(/-/g, '')
        : '';

      const addr = client.addresses ?? {};

      const atendimento = {
        // Estabelecimento e profissional
        cnes:            config.cnes,
        competencia:     config.competencia, // derivado da menor departure_date
        cnsProfissional: config.cnsProfissional,
        cbo:             config.cbo,
        dataAtendimento,

        // Procedimento
        procedimento,

        // Identificador do paciente (CNS preferencial, CPF fallback)
        identificadorPaciente,
        sexo,
        ibge: addr.ibge_code || '313050', // fallback: Ilicínea/MG
        cid:  '',

        // Atendimento
        idade,
        quantidade,
        carater: '01',  // 01=Eletivo
        naut:    '',
        origem:  'BPA',

        // Dados nominais
        nomePaciente:        client.name,
        dataNascimento,
        racaCor:             '01',   // 01=Branca (padrão; ajuste se disponível no dado)
        etnia:               '',
        nacionalidade:       '010',  // 010=brasileiro
        codigoServico:       '',
        codigoClassificacao: '',
        equipeSeq:           '',
        equipeArea:          '',
        cnpjManutencao:      '',

        // Endereço
        // CEP e código logradouro são inseridos como fixos em gerarLinhaBPAI()
        endereco: addr.street || '',
        numero:   addr.number || 'SN',
        // bairro: vem em addr.district; 'CENTRO' como fallback se vazio
        bairro:   addr.district || '',
        // complemento é ignorado — gerarLinhaBPAI() sempre grava 'CASA'

        // Contato
        telefone: client.phone || '',
        email:    client.email || '',

        // INE — usar CONFIG.ine se houver equipe vinculada; '' = 10 espaços no arquivo
        ine: config.ine || '',
      };

      linhasGeradas.push(gerarLinhaBPAI(atendimento, numeroFolha, sequencia));
      resumoControle.push({ procedimento, quantidade });
      sequencia++;
    });
  });

  // ---------------------------------------------------------------------------
  // TOTAIS E CAMPO DE CONTROLE
  // ---------------------------------------------------------------------------
  const totalLinhas   = linhasGeradas.length;
  const totalFolhas   = numeroFolha;
  const campoControle = calcularCampoControle(resumoControle);
  const cabecalho     = gerarCabecalho(config, totalLinhas, totalFolhas, campoControle);

  // ---------------------------------------------------------------------------
  // ARQUIVO FINAL
  // Estrutura: [1 cabeçalho] + [N linhas BPA-I]
  // Cada linha já carrega seu próprio CRLF. Sem rodapé.
  // ---------------------------------------------------------------------------
  const textoFinal = cabecalho + linhasGeradas.join('');

  // ---------------------------------------------------------------------------
  // DOWNLOAD
  // Nome: PA[CNES].[EXT]   ex: PA2794454.MAR  (sem underscore entre PA e CNES)
  // Extensão derivada da competência calculada dinamicamente.
  // Encoding: us-ascii (BPA não aceita UTF-8 nem Latin-1 com acentos)
  // ---------------------------------------------------------------------------
  const extensao    = extensaoArquivo(config.competencia);
  const nomeArquivo = `PA${config.cnes}.${extensao}`;

  const blob = new Blob([textoFinal], { type: 'text/plain;charset=us-ascii' });
  const link = document.createElement('a');
  link.href     = URL.createObjectURL(blob);
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
