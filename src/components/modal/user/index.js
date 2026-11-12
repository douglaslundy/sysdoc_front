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

const STATUS_PROTOCOLO = [
  ['novo', 'Novo'], ['recebido', 'Recebido'], ['encaminhado', 'Encaminhado'],
  ['encerrado', 'Encerrado'], ['concluido', 'Concluído'], ['cancelado', 'Cancelado'],
];

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
    secretaria_ids: [],
    password: '',
    password2: '',
  });

  const [tiposProtocolo, setTiposProtocolo] = useState([]);
  const [equipesRt, setEquipesRt] = useState([]);
  const [equipesOpcoes, setEquipesOpcoes] = useState([]);
  const [loadingEquipes, setLoadingEquipes] = useState(false);
  const [protocolUnits, setProtocolUnits] = useState([]);
  const [specialityPermissions, setSpecialityPermissions] = useState([]);
  const [specialityPermissionsLoaded, setSpecialityPermissionsLoaded] = useState(false);

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
      secretaria_ids: [],
      password: '',
      password2: '',
    });
    setTexto('');
    setEquipesRt([]);
    setEquipesOpcoes([]);
    setProtocolUnits([]);
    setSpecialityPermissions([]);
    setSpecialityPermissionsLoaded(false);
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

    // Wrap cleanForm so that equipes and speciality permissions are saved before the modal closes.
    // editUserFetch calls the second argument synchronously in .then(),
    // so we pass an async wrapper that fires the PUT calls first.
    const cleanFormWithEquipes = async () => {
      if (userProfile === 'admin' && user?.id) {
        await api.put(`/users/${user.id}/equipe-aps`, {
          is_rt_psf: form.is_rt_psf,
          rt_all_teams: form.rt_all_teams,
          equipes: form.is_rt_psf && !form.rt_all_teams ? equipesRt : [],
        }).catch(() => {});

        if (specialityPermissionsLoaded) {
          await api.put(`/users/${user.id}/speciality-permissions`, {
            permissions: specialityPermissions.map((item) => ({
              speciality_id: item.speciality_id,
              can_view: item.can_view,
              can_edit: item.can_edit,
              can_insert: item.can_insert,
            })),
          }).catch(() => {});
        }
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

  const toggleSpecialityPermission = (specialityId, field) => {
    setSpecialityPermissions((current) => current.map((item) => {
      if (item.speciality_id !== specialityId) return item;

      const next = { ...item, [field]: !item[field] };

      if ((field === 'can_edit' || field === 'can_insert') && next[field]) {
        next.can_view = true;
      }

      if (field === 'can_view' && !next.can_view) {
        next.can_edit = false;
        next.can_insert = false;
      }

      return next;
    }));
  };

  const toggleAllSpecialityPermissions = (field) => {
    setSpecialityPermissions((current) => {
      const allChecked = current.length > 0 && current.every((item) => item[field]);
      const nextValue = !allChecked;

      return current.map((item) => {
        const next = { ...item, [field]: nextValue };

        if ((field === 'can_edit' || field === 'can_insert') && nextValue) {
          next.can_view = true;
        }

        if (field === 'can_view' && !nextValue) {
          next.can_edit = false;
          next.can_insert = false;
        }

        return next;
      });
    });
  };

  const perfilTemAcessoAFila = dbProfiles.some(
    (p) => p.slug === profile && (p.pages || []).some((pg) => pg.path === '/queue')
  );

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
      });
    }
  }, [user]);

  // Busca equipe-aps e permissoes por especialidade quando o usuario editado muda.
  // Guard de cancelamento evita que uma resposta atrasada de um usuario visto
  // anteriormente sobrescreva, silenciosamente, o que o admin acabou de marcar/
  // desmarcar para o usuario atual (ex: trocar de usuario rapido no modal global do header).
  useEffect(() => {
    let cancelled = false;

    setSpecialityPermissions([]);
    setSpecialityPermissionsLoaded(false);

    if (user && user.id && userProfile === 'admin') {
      api.get(`/users/${user.id}/equipe-aps`)
        .then(r => { if (!cancelled) setEquipesRt(r.data.equipes ?? []); })
        .catch(() => {});
      api.get(`/users/${user.id}/speciality-permissions`)
        .then(r => {
          if (cancelled) return;
          setSpecialityPermissions(r.data ?? []);
          setSpecialityPermissionsLoaded(true);
        })
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

  useEffect(() => {
    if (!isOpenUserModal || userProfile !== 'admin' || tiposProtocolo.length > 0) return;
    api.get('/protocolos/tipos')
      .then(({ data }) => setTiposProtocolo((Array.isArray(data) ? data : []).filter((t) => t.ativo !== false)))
      .catch(() => {});
  }, [isOpenUserModal, userProfile, tiposProtocolo.length]);

  // null = sem restrição; lista = só esses valores ao cadastrar protocolo.
  const alternarRestricao = (campo, todos, ligado) => setForm((f) => ({ ...f, [campo]: ligado ? todos : null }));
  const alternarItem = (campo, valor, marcado) => setForm((f) => {
    const atual = Array.isArray(f[campo]) ? f[campo] : [];
    return { ...f, [campo]: marcado ? [...atual, valor] : atual.filter((v) => v !== valor) };
  });

  const minusculas = (valor) => String(valor || '').toLowerCase();
  const unidadesFiltradas = protocolUnits.filter((unit) => minusculas(unit.nome).includes(minusculas(filtroUnidade)));
  const equipesFiltradas = equipesOpcoes.filter((equipe) => minusculas(equipe.no_equipe).includes(minusculas(filtroEquipe)));

  const colunasDePermissao = [
    ['can_view', 'Ver'],
    ['can_edit', 'Editar'],
    ['can_insert', 'Inserir paciente'],
  ];

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

                <div className="grid gap-2 rounded-lg border border-border p-3">
                  <span className="text-sm font-medium">Protocolos: o que este usuário pode cadastrar</span>
                  <Interruptor
                    id="restringir_tipos_protocolo"
                    marcado={Array.isArray(form.protocol_allowed_types)}
                    aoMudar={(ligado) => alternarRestricao('protocol_allowed_types', tiposProtocolo.map((t) => t.codigo), ligado)}
                  >
                    Restringir tipos de protocolo
                  </Interruptor>
                  {Array.isArray(form.protocol_allowed_types) && tiposProtocolo.map((t) => (
                    <CaixaDeMarcacao
                      key={t.codigo}
                      id={`tipo_protocolo_${t.codigo}`}
                      marcado={form.protocol_allowed_types.includes(t.codigo)}
                      aoMudar={(marcado) => alternarItem('protocol_allowed_types', t.codigo, marcado)}
                    >
                      {t.nome}
                    </CaixaDeMarcacao>
                  ))}
                  <Interruptor
                    id="restringir_status_protocolo"
                    marcado={Array.isArray(form.protocol_allowed_statuses)}
                    aoMudar={(ligado) => alternarRestricao('protocol_allowed_statuses', ['novo'], ligado)}
                  >
                    Restringir status ao cadastrar
                  </Interruptor>
                  {Array.isArray(form.protocol_allowed_statuses) && STATUS_PROTOCOLO.map(([valor, rotulo]) => (
                    <CaixaDeMarcacao
                      key={valor}
                      id={`status_protocolo_${valor}`}
                      marcado={form.protocol_allowed_statuses.includes(valor)}
                      aoMudar={(marcado) => alternarItem('protocol_allowed_statuses', valor, marcado)}
                    >
                      {rotulo}
                    </CaixaDeMarcacao>
                  ))}
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

                {Boolean(user && user.id) && specialityPermissionsLoaded && specialityPermissions.length > 0 && perfilTemAcessoAFila && (
                  <div>
                    <p className="mb-2 font-display text-[10px] font-bold uppercase tracking-[0.07em] text-muted-foreground">Permissões por especialidade da Fila</p>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="py-2 pr-3 font-semibold">Especialidade</th>
                            {colunasDePermissao.map(([campo, rotulo]) => (
                              <th key={campo} className="px-2 py-2 text-center font-semibold">
                                <div className="flex flex-col items-center gap-1">
                                  {rotulo}
                                  <CaixaDeMarcacao
                                    aria-label={`${rotulo}: todas`}
                                    marcado={specialityPermissions.length > 0 && specialityPermissions.every((item) => Boolean(item[campo]))}
                                    aoMudar={() => toggleAllSpecialityPermissions(campo)}
                                  />
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {specialityPermissions.map((item) => (
                            <tr key={item.speciality_id} className="border-b border-border last:border-0">
                              <td className="py-2 pr-3">{item.speciality_name}</td>
                              {colunasDePermissao.map(([campo, rotulo]) => (
                                <td key={campo} className="px-2 py-2">
                                  <div className="flex justify-center">
                                    <CaixaDeMarcacao
                                      aria-label={`${rotulo}: ${item.speciality_name}`}
                                      marcado={Boolean(item[campo])}
                                      aoMudar={() => toggleSpecialityPermission(item.speciality_id, campo)}
                                    />
                                  </div>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
