import React, { useState, useEffect, useContext } from 'react';
import AlertModal from '../../messagesModal';
import { useDispatch, useSelector } from 'react-redux';
import CpfCnpj from '../../inputs/textFields/cpfCnpj';
import Phone from '../../inputs/textFields/phone';
import { Banner } from '../../ui/banner';
import { FotoAvatar } from '../../ui/foto-avatar';
import { Button } from '../../ui/button';
import { CampoSelecao, CampoTexto } from '../../ui/campos';
import { CaixaDeMarcacao } from '../../ui/caixa-de-marcacao';
import { ComboboxMultiplo } from '../../ui/combobox-multiplo';
import { Dialogo, DialogoCabecalho, DialogoRodape } from '../../ui/dialogo';
import { Interruptor } from '../../ui/interruptor';
import { showUser } from '../../../store/ducks/users';
import { editUserFetch, addUserFetch } from '../../../store/fetchActions/user';
import { turnUserModal, changeTitleAlert, addAlertMessage } from '../../../store/ducks/Layout';
import { AuthContext } from '../../../contexts/AuthContext';
import { getAllProfiles } from '../../../store/fetchActions/accessProfiles';
import { api } from '../../../services/api';

const flattenProtocolUnits = (items, level = 0) =>
  (Array.isArray(items) ? items : []).flatMap((item) => [
    { ...item, level },
    ...flattenProtocolUnits(item.children, level + 1),
  ]);

export default function UserModal(props) {
  const [form, setForm] = useState({
    profile: '',
    name: '',
    preferred_name: '',
    phone: '',
    email: '',
    cpf: '',
    is_driver: false,
    is_rt_psf: false,
    rt_all_teams: false,
    chat_access_override: '',
    protocol_unit_ids: [],
    extra_profiles: [],
    secretaria_ids: [],
    password: '',
    password2: '',
  });

  const [equipesRt, setEquipesRt] = useState([]);
  const [equipesOpcoes, setEquipesOpcoes] = useState([]);
  const [loadingEquipes, setLoadingEquipes] = useState(false);
  const [protocolUnits, setProtocolUnits] = useState([]);

  const { user } = useSelector((state) => state.users);
  const { isOpenUserModal } = useSelector((state) => state.layout);
  const { profiles: dbProfiles } = useSelector((state) => state.accessProfiles);
  const { lista: secretariasPermitidas } = useSelector((state) => state.secretaria);
  const dispatch = useDispatch();
  const { user: userId, profile: userProfile } = useContext(AuthContext);

  const { profile, name, preferred_name, phone, email, cpf, is_driver, password, password2 } = form;
  const [texto, setTexto] = useState();
  const [filtroUnidade, setFiltroUnidade] = useState('');
  const [filtroEquipe, setFiltroEquipe] = useState('');

  const changeItem = ({ target }) => {
    setForm({
      ...form,
      [target.name]: target.name === 'preferred_name'
        ? target.value.toUpperCase()
        : target.value,
    });
  };

  const cleanForm = () => {
    setForm({
      profile: '',
      name: '',
      preferred_name: '',
      phone: '',
      email: '',
      cpf: '',
      is_driver: false,
      is_rt_psf: false,
      rt_all_teams: false,
      chat_access_override: '',
      protocol_unit_ids: [],
      extra_profiles: [],
      secretaria_ids: [],
      password: '',
      password2: '',
    });
    setTexto('');
    setEquipesRt([]);
    setEquipesOpcoes([]);
    setProtocolUnits([]);
    dispatch(turnUserModal());
    dispatch(showUser({}));
  };

  const gestor = userProfile === 'gestor';
  const gestorEditando = gestor && Boolean(user && user.id);

  const alternarSecretaria = (id, marcado) =>
    setForm((current) => ({
      ...current,
      secretaria_ids: marcado ? [...current.secretaria_ids, id] : current.secretaria_ids.filter((x) => x !== id),
    }));

  const handleSaveData = async () => {
    // Exige >=1 secretaria no cadastro e na edição de quem já tinha; legado sem secretaria segue editável (campo omitido).
    const tinhaSecretaria = Boolean(user?.secretarias?.length);
    if (form.secretaria_ids.length === 0 && (!(user && user.id) || tinhaSecretaria)) {
      setTexto('Informe ao menos uma secretaria');
      return;
    }
    setTexto('');
    password && password !== password2
      ? dispatch(addAlertMessage('As senhas precisam ser iguais'))
      : user && user.id
        ? handlePutData()
        : handlePostData();
  };

  const handlePostData = async () => {
    dispatch(changeTitleAlert(`O usuário ${form.name} foi cadastrado com sucesso!`));
    dispatch(addUserFetch(form, cleanForm));
  };

  const handlePutData = async () => {
    if (password && password !== password2) {
      return;
    }

    // Wrap cleanForm so that equipes are saved before the modal closes.
    // editUserFetch calls the second argument synchronously in .then(),
    // so we pass an async wrapper that fires the PUT calls first.
    const cleanFormWithEquipes = async () => {
      if (userProfile === 'admin' && user?.id) {
        await api.put(`/users/${user.id}/equipe-aps`, {
          is_rt_psf: form.is_rt_psf,
          rt_all_teams: form.rt_all_teams,
          equipes: form.is_rt_psf && !form.rt_all_teams ? equipesRt : [],
        }).catch(() => {});
      }
      cleanForm();
    };

    dispatch(changeTitleAlert(`O usuário ${form.name} foi atualizado com sucesso!`));
    const { secretaria_ids, ...resto } = form;
    dispatch(editUserFetch(secretaria_ids.length ? form : resto, cleanFormWithEquipes));
  };

  const handleIsDriver = (isDriver) => {
    setForm({
      ...form,
      is_driver: isDriver,
    });
  };

  const handleClose = () => {
    cleanForm();
  };

  // Load user data when editing an existing user
  useEffect(() => {
    if (user && user.id) {
      const { secretarias, ...dados } = user;
      setForm({
        ...dados,
        secretaria_ids: (secretarias || []).map((x) => x.id),
        preferred_name: user.preferred_name ?? '',
        phone: user.phone ?? '',
        is_driver: user.is_driver === true || Number(user.is_driver) === 1,
        is_rt_psf: Boolean(user.is_rt_psf),
        rt_all_teams: Boolean(user.rt_all_teams),
        chat_access_override: user.chat_access_override ?? '',
        protocol_unit_ids: Array.isArray(user.protocol_unit_ids) ? user.protocol_unit_ids : [],
        extra_profiles: Array.isArray(user.extra_profiles) ? user.extra_profiles : [],
      });
    }
  }, [user]);

  // Busca equipe-aps quando o usuario editado muda.
  // Guard de cancelamento evita que uma resposta atrasada de um usuario visto
  // anteriormente sobrescreva, silenciosamente, o que o admin acabou de marcar/
  // desmarcar para o usuario atual (ex: trocar de usuario rapido no modal global do header).
  useEffect(() => {
    let cancelled = false;

    if (user && user.id && userProfile === 'admin') {
      api.get(`/users/${user.id}/equipe-aps`)
        .then(r => { if (!cancelled) setEquipesRt(r.data.equipes ?? []); })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [user?.id, userProfile]);

  // Load equipes options when RT toggle is turned on
  useEffect(() => {
    if (!form.is_rt_psf || equipesOpcoes.length > 0) return;
    setLoadingEquipes(true);
    api.get('/monitor-aps/config/equipes')
      .then(r => setEquipesOpcoes(r.data.equipes ?? []))
      .catch(() => {})
      .finally(() => setLoadingEquipes(false));
  }, [form.is_rt_psf, equipesOpcoes.length]);

  useEffect(() => {
    if (isOpenUserModal && (userProfile === 'admin' || userProfile === 'gestor') && dbProfiles.length === 0) {
      dispatch(getAllProfiles());
    }
  }, [isOpenUserModal, userProfile, dbProfiles.length, dispatch]);

  useEffect(() => {
    if (!isOpenUserModal || userProfile !== 'admin' || protocolUnits.length > 0) return;
    api.get('/protocolos/unidades-organizacionais')
      .then(({ data }) => setProtocolUnits(flattenProtocolUnits(data).filter((unit) => unit.ativo !== false)))
      .catch(() => {});
  }, [isOpenUserModal, userProfile, protocolUnits.length]);

  const minusculas = (valor) => String(valor || '').toLowerCase();
  const unidadesFiltradas = protocolUnits.filter((unit) => minusculas(unit.nome).includes(minusculas(filtroUnidade)));
  const equipesFiltradas = equipesOpcoes.filter((equipe) => minusculas(equipe.no_equipe).includes(minusculas(filtroEquipe)));

  return (
    <div>
      {props.children}
      <Dialogo aberto={Boolean(isOpenUserModal)} aoFechar={handleClose} tamanho="lg">
        <AlertModal />
        <DialogoCabecalho>{user && user.id ? 'Editar Usuário' : 'Cadastrar Usuário'}</DialogoCabecalho>
        {texto && <div className="mb-4"><Banner tom="alerta">{texto}</Banner></div>}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSaveData();
          }}
        >
          {user && user.id ? <FotoAvatar tipo="users" id={user.id} nome={user.name} className="mb-4" /> : null}
          <p className="mb-4 font-display text-[10px] font-bold uppercase tracking-[0.07em] text-muted-foreground">Dados do usuário</p>

          <div className="grid gap-4">
            {(userProfile === 'admin' || gestor) && (
              <CampoSelecao
                id="profile"
                label="Perfil do Usuário"
                obrigatorio
                name="profile"
                value={profile}
                onChange={changeItem}
                disabled={Boolean(user && user.id === userId)}
              >
                <option value="">Selecione</option>
                {dbProfiles
                  .filter((p) => p.ativo !== false && p.slug !== 'admin')
                  .map((p) => (
                    <option key={p.id} value={p.slug}>{p.nome}</option>
                  ))}
              </CampoSelecao>
            )}

            {userProfile === 'admin' && (
              <div>
                <p className="mb-2 text-[13px] text-muted-foreground">Perfis adicionais (somam as permissões do perfil principal)</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {dbProfiles
                    .filter((p) => p.ativo !== false && p.slug !== 'admin' && p.slug !== profile)
                    .map((p) => (
                      <CaixaDeMarcacao
                        key={p.id}
                        id={`extra-${p.slug}`}
                        marcado={form.extra_profiles.includes(p.slug)}
                        aoMudar={(marcado) => setForm((f) => ({
                          ...f,
                          extra_profiles: marcado ? [...f.extra_profiles, p.slug] : f.extra_profiles.filter((x) => x !== p.slug),
                        }))}
                      >
                        {p.nome}
                      </CaixaDeMarcacao>
                    ))}
                </div>
              </div>
            )}

            {!gestorEditando && (
              <>
            <CampoTexto id="name" label="Nome" name="name" value={name || ''} onChange={changeItem} obrigatorio className="uppercase" />

            <CampoTexto
              id="preferred_name"
              label="Como gostaria de ser chamado"
              name="preferred_name"
              value={preferred_name || ''}
              onChange={changeItem}
              dica="Se não preencher, o chat exibirá o nome do usuário."
              className="uppercase"
            />

            <CampoTexto id="email" label="@Email" type="email" name="email" value={email || ''} onChange={changeItem} obrigatorio />

            <div className="grid gap-4 md:grid-cols-2">
              <Phone value={phone || ''} label="Telefone" name="phone" changeItem={changeItem} />
              <CpfCnpj value={cpf || ''} label="CPF" name="cpf" changeItem={changeItem} disabled={Boolean(user && user.id)} />
            </div>

            <Interruptor id="is_driver" marcado={is_driver} aoMudar={handleIsDriver}>
              {is_driver ? 'DIRIGE VEÍCULO OFICIAL' : 'NÃO DIRIGE VEÍCULO OFICIAL'}
            </Interruptor>

              </>
            )}

            <div className="grid gap-1.5">
              <p className="text-sm font-medium">Secretarias *</p>
              {secretariasPermitidas.map((sec) => (
                <CaixaDeMarcacao
                  key={sec.id}
                  id={`secretaria_${sec.id}`}
                  marcado={form.secretaria_ids.includes(sec.id)}
                  aoMudar={(marcado) => alternarSecretaria(sec.id, marcado)}
                >
                  {sec.nome}
                </CaixaDeMarcacao>
              ))}
            </div>

            {userProfile === 'admin' && (
              <>
                <CampoSelecao
                  id="chat_access_override"
                  label="Acesso individual ao chat"
                  value={String(form.chat_access_override)}
                  onChange={({ target }) => setForm((current) => ({
                    ...current,
                    chat_access_override: target.value === '' ? '' : target.value === 'true',
                  }))}
                >
                  <option value="">Herdar configuração do perfil</option>
                  <option value="true">Permitir</option>
                  <option value="false">Bloquear</option>
                </CampoSelecao>

                <div className="grid gap-1.5">
                  <label htmlFor="protocol_units" className="text-sm font-medium">Secretaria / unidade organizacional</label>
                  <ComboboxMultiplo
                    id="protocol_units"
                    rotulo="Secretaria / unidade organizacional"
                    opcoes={unidadesFiltradas}
                    selecionadas={protocolUnits.filter((unit) => form.protocol_unit_ids.includes(unit.id))}
                    aoMudar={(selected) => setForm((current) => ({ ...current, protocol_unit_ids: selected.map((unit) => unit.id) }))}
                    aoDigitar={setFiltroUnidade}
                    rotuloDaOpcao={(option) => `${'— '.repeat(option.level || 0)}${option.nome}`}
                    chaveDaOpcao={(option) => option.id}
                  />
                </div>

                <Interruptor
                  id="is_rt_psf"
                  marcado={form.is_rt_psf}
                  aoMudar={(marcado) => setForm((f) => ({ ...f, is_rt_psf: marcado, rt_all_teams: false }))}
                >
                  É Responsável Técnico de Equipe PSF
                </Interruptor>

                {form.is_rt_psf && (
                  <CaixaDeMarcacao id="rt_all_teams" marcado={form.rt_all_teams} aoMudar={(marcado) => setForm((f) => ({ ...f, rt_all_teams: marcado }))}>
                    Acesso a todas as equipes
                  </CaixaDeMarcacao>
                )}

                {form.is_rt_psf && !form.rt_all_teams && (
                  <div className="grid gap-1.5">
                    <label htmlFor="equipes_rt" className="text-sm font-medium">Equipes autorizadas</label>
                    <ComboboxMultiplo
                      id="equipes_rt"
                      rotulo="Equipes autorizadas"
                      opcoes={equipesFiltradas}
                      selecionadas={equipesRt}
                      aoMudar={setEquipesRt}
                      aoDigitar={setFiltroEquipe}
                      rotuloDaOpcao={(opt) => opt.no_equipe ?? ''}
                      chaveDaOpcao={(opt) => opt.nu_ine}
                      vazio={loadingEquipes ? 'Carregando...' : 'Nenhum resultado.'}
                    />
                  </div>
                )}

              </>
            )}

            {!gestorEditando && (
            <div className="grid gap-4 md:grid-cols-2">
              <CampoTexto id="password" label="Senha" type="password" name="password" value={password || ''} onChange={changeItem} obrigatorio autoComplete="new-password" />
              <CampoTexto id="password2" label="Repita a Senha" type="password" name="password2" value={password2 || ''} onChange={changeItem} obrigatorio autoComplete="new-password" />
            </div>
            )}
          </div>

          <DialogoRodape>
            <Button type="button" variant="outline" onClick={cleanForm}>Cancelar</Button>
            <Button type="submit">Gravar</Button>
          </DialogoRodape>
        </form>
      </Dialogo>
    </div>
  );
}
