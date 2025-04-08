import { differenceInYears, parseISO, format } from 'date-fns';

function sanitizeNumber(value, length) {
  const onlyDigits = String(value || '').replace(/\D/g, '');
  return onlyDigits.padStart(length, '0').substring(0, length);
}

function sanitizeText(value, length) {
  const text = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '');
  return text.padEnd(length, ' ').substring(0, length);
}

export default function generateBPAIFile(trips) {
  const CNES = '2794454';
  const ORGAO_ORIGEM_NOME = sanitizeText('SMS ILICINEA', 30);
  const CNPJ_RESPONSAVEL = sanitizeNumber('31305018239608', 14) + '000139';
  const ORGAO_DESTINO_NOME = sanitizeText('SECRETARIA DE ESTADO DA SAUDE MG', 40);
  const ORGAO_DESTINO_INDICADOR = 'E';
  const VERSAO_SISTEMA = 'D04.09';
  const CNS_PROFISSIONAL = sanitizeNumber('704008832247760', 15);
  const CBO = sanitizeNumber('225125', 6);
  const COMPETENCIA = '202503';

  let linhas = [];
  let linhaSequencial = 1;
  let folha = 1;

  trips.forEach((trip) => {
    const dataAtendimento = trip.departure_date.replace(/-/g, '');
    const confirmados = trip.clients.filter((c) => c.pivot?.is_confirmed);

    confirmados.forEach((client) => {
      const procedimento = client.pivot.person_type?.toUpperCase() === 'PASSENGER' ? '0803010125' : '0803010109';
      const quantidade = sanitizeNumber(Math.round((trip.route.distance * 2) / 50), 6);

      const nome = sanitizeText(client.name, 30);
      const cpf = sanitizeNumber(client.cpf, 11);
      const cns = sanitizeNumber(client.cns, 15);
      const sexo = client.sexo === 'FEMININE' ? 'F' : 'M';
      const nascimento = client.born_date ? parseISO(client.born_date) : new Date();
      const dataNascimento = format(nascimento, 'yyyyMMdd');
      const idade = sanitizeNumber(differenceInYears(parseISO(trip.departure_date), nascimento), 3);
      const codIBGE = sanitizeNumber(client.addresses?.ibge_code || '313050', 6);

      const cep = sanitizeNumber(client.addresses?.cep, 8).padEnd(8, ' ');
      const logradouro = sanitizeNumber(client.addresses?.logradouro_code || '0', 3);
      const endereco = sanitizeText(client.addresses?.street || 'RUA DESCONHECIDA', 30);
      const complemento = sanitizeText(client.addresses?.complement || '', 10);
      const numero = sanitizeNumber(client.addresses?.number || '', 5);
      const bairro = sanitizeText(client.addresses?.neighborhood || '', 30);
      const telefone = sanitizeNumber(client.phone || '', 11).padEnd(11, ' ');
      const email = sanitizeText(client.email || '', 40);

      const linha =
        '03' +
        sanitizeNumber(CNES, 7) +
        COMPETENCIA +
        CNS_PROFISSIONAL +
        CBO +
        dataAtendimento +
        String(folha).padStart(3, '0') +
        String(linhaSequencial).padStart(2, '0') +
        procedimento +
        idade +
        quantidade +
        '01' +
        nome +
        cpf +
        cns +
        sexo +
        codIBGE +
        dataNascimento +
        ''.padEnd(4, ' ') + // CID
        ''.padEnd(3, ' ') + // nacionalidade
        ''.padEnd(3, ' ') + // serviço
        ''.padEnd(3, ' ') + // classificação
        ''.padEnd(8, ' ') + // equipe seq
        ''.padEnd(4, ' ') + // equipe área
        ''.padEnd(14, ' ') + // CNPJ manutenção
        cep +
        logradouro +
        endereco +
        complemento +
        numero +
        bairro +
        telefone +
        email +
        ''.padEnd(10, ' ') + // INE
        cpf + // CPF responsável
        'N';

      linhas.push(linha);
      linhaSequencial++;
    });
  });

  const totalRegistros = String(linhas.length || 1).padStart(6, '0');
  const totalFolhas = '000001';
  const controle = '1552';

  const cabecalho =
    '01#BPA#' +
    COMPETENCIA +
    totalRegistros +
    totalFolhas +
    controle +
    ORGAO_ORIGEM_NOME +
    CNPJ_RESPONSAVEL +
    ORGAO_DESTINO_NOME +
    ORGAO_DESTINO_INDICADOR +
    VERSAO_SISTEMA.padEnd(8, ' ');

  const rodape = '02';

  const textoFinal = [cabecalho, ...linhas, rodape].join('\r\n');

  const blob = new Blob([textoFinal], { type: 'text/plain;charset=ascii' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'bpa-i.txt';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
