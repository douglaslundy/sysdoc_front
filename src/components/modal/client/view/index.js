import React from 'react';
import { format, parseISO } from 'date-fns';
import { Button } from '../../../ui/button';
import { Carregando } from '../../../ui/carregando';
import { Dado } from '../../../ui/dado';
import { Dialogo, DialogoCabecalho, DialogoRodape } from '../../../ui/dialogo';
import { Pilula } from '../../../ui/pilula';
import { AcoesDoCidadao } from './AcoesDoCidadao';

const fieldLabel = {
  id: 'ID',
  name: 'Nome',
  mother: 'Nome da mãe',
  father: 'Nome do pai',
  cpf: 'CPF',
  cns: 'CNS',
  phone: 'Telefone',
  email: 'E-mail',
  obs: 'Observações',
  born_date: 'Data de nascimento',
  sexo: 'Sexo',
  raca_cor: 'Raça/Cor',
  data_obito: 'Data do óbito',
  active: 'Situação',
  st_falecido: 'Falecido',
  created_at: 'Criado em',
  updated_at: 'Atualizado em',
};

const formatValue = (key, value) => {
  if (value == null || value === '') return 'Não informado';
  if (key === 'sexo') {
    if (value === 'FEMININE') return 'Feminino';
    if (value === 'MASCULINE') return 'Masculino';
  }
  if (key === 'active') return value ? 'Ativo' : 'Inativo';
  if (key === 'st_falecido') return value ? 'Sim' : 'Não';
  if (key === 'born_date' || key === 'data_obito') {
    try {
      return format(parseISO(String(value)), 'dd/MM/yyyy');
    } catch {
      return String(value);
    }
  }
  if (key === 'created_at' || key === 'updated_at') {
    try {
      return format(parseISO(String(value)), 'dd/MM/yyyy HH:mm:ss');
    } catch {
      return String(value);
    }
  }
  return String(value);
};

const isDisplayField = (key, value) => (
  !['addresses', 'pivot', 'queue', 'trips', 'pedidosExame'].includes(key)
  && (typeof value !== 'object' || value === null)
);

const getFieldEntries = (client) => Object.entries(client || {})
  .filter(([key, value]) => isDisplayField(key, value));

export default function ClientViewModal({ open, client, loading, error, onClose }) {
  const address = client?.addresses || {};
  const fields = getFieldEntries(client);
  const showDeathInfo = client?.st_falecido === true && !!client?.data_obito;
  const naoInformado = (valor) => valor || 'Não informado';

  return (
    <Dialogo aberto={Boolean(open)} aoFechar={onClose} tamanho="xl">
      <DialogoCabecalho>{client?.id ? `Visualizar Cliente ${client.name || `#${client.id}`}` : 'Visualizar Cliente'}</DialogoCabecalho>
      {loading ? (
        <Carregando>Carregando dados do cliente...</Carregando>
      ) : error ? (
        <p role="alert" className="py-4 text-sm text-danger">{error}</p>
      ) : client?.id ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-display text-lg font-bold">{client.name || 'Cliente sem nome'}</p>
            <Pilula tom={client.active ? 'sucesso' : 'neutro'} contorno>{client.active ? 'Ativo' : 'Inativo'}</Pilula>
          </div>

          <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-3">
            {fields
              .filter(([key]) => showDeathInfo || (key !== 'st_falecido' && key !== 'data_obito'))
              .map(([key, value]) => (
                <Dado key={key} rotulo={fieldLabel[key] || key}>{formatValue(key, value)}</Dado>
              ))}
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="mb-3 font-display text-base font-bold">Endereço</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Dado rotulo="CEP">{naoInformado(address.zip_code)}</Dado>
              <Dado rotulo="Rua">{naoInformado(address.street)}</Dado>
              <Dado rotulo="Número">{naoInformado(address.number)}</Dado>
              <Dado rotulo="Bairro">{naoInformado(address.district)}</Dado>
              <Dado rotulo="Cidade">{naoInformado(address.city)}</Dado>
              <Dado rotulo="Complemento">{naoInformado(address.complement)}</Dado>
            </div>
          </div>

          <AcoesDoCidadao cliente={client} />

          <DialogoRodape>
            <Button variant="outline" onClick={onClose}>Voltar</Button>
          </DialogoRodape>
        </div>
      ) : (
        <p className="py-4 text-sm text-muted-foreground">Nenhum cliente selecionado.</p>
      )}
    </Dialogo>
  );
}
