import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AlertModal from '../../messagesModal';
import Phone from '../../inputs/textFields/phone';
import CpfCnpj from '../../inputs/textFields/cpfCnpj';
import BasicDatePicker from '../../inputs/datePicker';
import { Banner } from '../../ui/banner';
import { FotoAvatar } from '../../ui/foto-avatar';
import { Button } from '../../ui/button';
import { CampoSelecao, CampoTexto } from '../../ui/campos';
import { Dialogo, DialogoCabecalho, DialogoDescricao, DialogoRodape, DialogoTitulo } from '../../ui/dialogo';
import { showClient } from '../../../store/ducks/clients';
import { editClientFetch, addClientFetch } from '../../../store/fetchActions/clients';
import { closeClientModal, changeTitleAlert } from '../../../store/ducks/Layout';

const FORM_VAZIO = {
  name: '',
  mother: '',
  cpf: '',
  cns: '',
  phone: '',
  email: '',
  obs: '',
  born_date: '',
  sexo: '',
  raca_cor: '',
  data_obito: '',
  zip_code: '',
  city: '',
  street: '',
  number: '',
  district: '',
  complement: '',
};

const restantes = (valor, max) => (valor?.length > 0 ? `${max - valor.length} caracteres restantes` : undefined);

export default function ClientModal(props) {
  const [form, setForm] = useState(FORM_VAZIO);

  const { client } = useSelector((state) => state.clients);
  const { isOpenClientModal } = useSelector((state) => state.layout);
  const dispatch = useDispatch();

  const {
    name, mother, cpf, cns, phone, email, obs, born_date, sexo, zip_code, city, street, number, district, complement, raca_cor, data_obito,
  } = form;
  const [texto, setTexto] = useState();
  const [confirmObito, setConfirmObito] = useState(false);

  const changeItem = ({ target: { name, value } }) => {
    setForm((atual) => ({ ...atual, [name]: value }));
  };

  const cleanForm = () => {
    setForm(FORM_VAZIO);
    setTexto('');
    dispatch(closeClientModal());
    dispatch(showClient({}));
  };

  const handleSaveData = () => {
    const clienteAtivo = !(client?.id) || client?.active;
    if (form.data_obito && clienteAtivo) {
      setConfirmObito(true);
      return;
    }
    client && client.id ? handlePutData() : handlePostData();
  };

  const handleConfirmarObito = () => {
    setConfirmObito(false);
    client && client.id ? handlePutData() : handlePostData();
  };

  const handlePostData = async () => {
    dispatch(changeTitleAlert(`O cliente ${form.name} foi cadastrado com sucesso!`));
    dispatch(addClientFetch(form, cleanForm));
  };

  const handlePutData = async () => {
    dispatch(changeTitleAlert(`O cliente ${form.name} foi atualizado com sucesso!`));
    dispatch(editClientFetch(form, cleanForm));
  };

  useEffect(() => {
    if (client && client.id) {
      setForm({ ...client, ...client?.addresses });
    }
  }, [client]);

  const obitoReadOnly = !!(client?.id && !client?.active && client?.data_obito);

  const texto_ = (id, label, campo, max, extra = {}) => (
    <CampoTexto
      id={id}
      label={label}
      name={campo}
      value={form[campo] || ''}
      onChange={changeItem}
      maxLength={max}
      dica={restantes(form[campo], max)}
      className="uppercase"
      {...extra}
    />
  );

  return (
    <div>
      {props.children}
      <Dialogo aberto={Boolean(isOpenClientModal)} aoFechar={cleanForm} tamanho="xl">
        <AlertModal />
        <DialogoCabecalho>{client && client.id ? 'Editar Cliente' : 'Cadastrar Cliente'}</DialogoCabecalho>
        {texto ? <div className="mb-4"><Banner tom="alerta">{texto}</Banner></div> : null}

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveData();
          }}
        >
          {client && client.id ? <FotoAvatar tipo="clients" id={client.id} nome={client.name} /> : null}
          <p className="text-xs font-semibold tracking-[0.07em] text-muted-foreground uppercase">Dados do cliente</p>

          {texto_('cliente-nome', 'Nome Completo', 'name', 100, { required: true })}
          {texto_('cliente-mae', 'Nome da Mãe', 'mother', 50)}

          <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
            {texto_('cliente-email', 'E-mail', 'email', 100, { type: 'email' })}
            <BasicDatePicker label="Data de Nascimento" name="born_date" value={born_date} setValue={(v) => setForm((atual) => ({ ...atual, born_date: v }))} required />
            <CampoSelecao id="cliente-sexo" label="Sexo" value={sexo || ''} onChange={(e) => setForm((atual) => ({ ...atual, sexo: e.target.value }))}>
              <option value="" disabled hidden />
              <option value="MASCULINE">Masculino</option>
              <option value="FEMININE">Feminino</option>
            </CampoSelecao>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <CampoSelecao id="cliente-raca" label="Raça/Cor" value={raca_cor || ''} onChange={(e) => setForm((atual) => ({ ...atual, raca_cor: e.target.value }))}>
              <option value="">— Não selecionado —</option>
              <option value="Branca">Branca</option>
              <option value="Preta">Preta</option>
              <option value="Amarela">Amarela</option>
              <option value="Parda">Parda</option>
              <option value="Indígena">Indígena</option>
              <option value="Não informado">Não informado</option>
            </CampoSelecao>
            {client?.id && (
              <BasicDatePicker
                label={obitoReadOnly ? 'Data do Óbito (registrada pelo e-SUS)' : 'Data do Óbito'}
                name="data_obito"
                value={data_obito}
                setValue={(v) => setForm((atual) => ({ ...atual, data_obito: v }))}
                disabled={obitoReadOnly}
              />
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <CpfCnpj value={cpf} label="CPF" name="cpf" required changeItem={changeItem} />
            {texto_('cliente-cns', 'Cartão do SUS', 'cns', 15)}
            <Phone value={phone} label="Telefone" name="phone" changeItem={changeItem} />
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_3fr_1fr]">
            {texto_('cliente-cep', 'CEP', 'zip_code', 10)}
            {texto_('cliente-rua', 'Rua', 'street', 100)}
            {texto_('cliente-numero', 'Nº', 'number', 6)}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {texto_('cliente-complemento', 'Complemento', 'complement', 50)}
            {texto_('cliente-bairro', 'Bairro', 'district', 100)}
            {texto_('cliente-cidade', 'Cidade', 'city', 30)}
          </div>

          <CampoTexto
            id="cliente-obs"
            label="Observações"
            name="obs"
            multiline
            rows={2}
            maxLength={500}
            dica={restantes(obs, 500)}
            className="uppercase"
            value={obs || ''}
            onChange={changeItem}
          />

          <DialogoRodape>
            <Button type="button" variant="outline" onClick={cleanForm}>Cancelar</Button>
            <Button type="submit">Gravar</Button>
          </DialogoRodape>
        </form>
      </Dialogo>

      <Dialogo aberto={confirmObito} aoFechar={() => setConfirmObito(false)} tamanho="sm" alerta elevado>
        <DialogoTitulo>Confirmar registro de óbito</DialogoTitulo>
        <DialogoDescricao className="mt-3">
          Informar a data do óbito irá <strong>inativar o cadastro e todas as filas abertas</strong> deste cliente. Deseja continuar?
        </DialogoDescricao>
        <DialogoRodape>
          <Button variant="outline" onClick={() => setConfirmObito(false)}>Cancelar</Button>
          <Button variant="destructive" onClick={handleConfirmarObito}>Confirmar</Button>
        </DialogoRodape>
      </Dialogo>
    </div>
  );
}
