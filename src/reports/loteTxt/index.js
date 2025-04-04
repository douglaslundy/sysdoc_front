import { differenceInYears, parseISO } from 'date-fns';

export default function generateBPAIFile(trips) {
  const CNES = '2794454';
  const ORGAO_ORIGEM_NOME = 'CENTRO DE SAUDE MUNICIPAL DE ILICINEA';
  const CBO = '225125';
  const CNS_PROFISSIONAL = '704008832247760';
  const COMPETENCIA = '202503';

  let linhas = [];
  let linhaSequencial = 1;
  let folha = 1;

  trips.forEach((trip) => {
    const { departure_date, route, clients } = trip;
    const dataAtendimento = departure_date.replace(/-/g, ''); // AAAAMMDD

    const confirmados = clients.filter((c) => c.pivot?.is_confirmed);

    confirmados.forEach((client) => {
      const procedimento = client.pivot.person_type?.toUpperCase() === 'PASSENGER' ? '0803010125' : '0803010109';
      const quantidade = String(Math.round((route.distance * 2) / 50)).padStart(6, '0');

      const nome = (client.name || '').toUpperCase().padEnd(30, ' ');
      const cpf = (client.cpf || '0').padStart(11, '0');
      const cns = (client.cns || '0').padStart(15, '0');

      const sexo = client.sex === 'MASCULINE' ? 'M' : client.sex === 'FEMININE' ? 'F' : 'M';
      const nascimento = client.birth_date ? parseISO(client.birth_date) : new Date();
      const idade = String(differenceInYears(parseISO(departure_date), nascimento)).padStart(3, '0');

      const codIBGE = (client.addresses?.ibge_code || '0').padStart(6, '0');
      const cid = ''.padEnd(4, ' ');
      const nacionalidade = ''.padEnd(3, ' ');
      const servico = ''.padEnd(3, ' ');
      const classificacao = ''.padEnd(3, ' ');
      const equipeSeq = ''.padEnd(8, ' ');
      const equipeArea = ''.padEnd(4, ' ');
      const cnpjManutencao = ''.padEnd(14, ' ');
      const cep = (client.addresses?.cep || '0').padStart(8, '0');
      const logradouro = (client.addresses?.logradouro_code || '0').padStart(3, '0');
      const endereco = (client.addresses?.street || '0').toUpperCase().padEnd(30, ' ');
      const complemento = (client.addresses?.complement || '0').toUpperCase().padEnd(10, ' ');
      const numero = (client.addresses?.number || '0').toString().padStart(5, '0');
      const bairro = (client.addresses?.neighborhood || '0').toUpperCase().padEnd(30, ' ');
      const telefone = (client.phone || '0').padStart(11, '0');
      const email = (client.email || '0').padEnd(40, ' ');
      const ine = ''.padEnd(10, ' ');
      const situacaoRua = 'N';

      const linha =
        '03' +
        CNES.padStart(7, '0') +
        COMPETENCIA +
        CNS_PROFISSIONAL.padStart(15, '0') +
        CBO.padStart(6, '0') +
        dataAtendimento +
        String(folha).padStart(3, '0') +
        String(linhaSequencial).padStart(2, '0') +
        procedimento.padStart(10, '0') +
        idade +
        quantidade +
        '01' +
        nome +
        cpf +
        cns +
        sexo +
        codIBGE +
        cid +
        nacionalidade +
        servico +
        classificacao +
        equipeSeq +
        equipeArea +
        cnpjManutencao +
        cep +
        logradouro +
        endereco +
        complemento +
        numero +
        bairro +
        telefone +
        email +
        ine +
        cpf +
        situacaoRua;

      linhas.push(linha);
      linhaSequencial++;
    });
  });

  const textoFinal = linhas.join('\r\n') + '\r\n';
  const blob = new Blob([textoFinal], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'bpa-i.txt';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
