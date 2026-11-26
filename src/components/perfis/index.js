import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ActionCreateFab, ActionDeleteButton, ActionEditButton } from '../actions';
import { getAllProfiles, getAllPages, getAllPageCategories, addProfileFetch, editProfileFetch, removeProfileFetch } from '../../store/fetchActions/accessProfiles';
import AlertModal from '../messagesModal';
import { Button } from '../ui/button';
import { CampoTexto } from '../ui/campos';
import { CaixaDeMarcacao } from '../ui/caixa-de-marcacao';
import { Dialogo, DialogoCabecalho, DialogoRodape } from '../ui/dialogo';
import { Interruptor } from '../ui/interruptor';
import { PaginaDeLista } from '../ui/pagina-de-lista';
import { Pilula } from '../ui/pilula';
import { usePaginacaoLocal } from '../../lib/usePaginacaoLocal';
import { api } from '../../services/api';

const FORM_INICIAL = {
    nome: '',
    slug: '',
    descricao: '',
    ativo: true,
    chat_enabled: false,
    almoxarifado_create_enabled: true,
    almoxarifado_approve_enabled: false,
    almoxarifado_deliver_enabled: false,
    client_trips_view_enabled: false,
    client_report_view_enabled: false,
    client_history_view_enabled: false,
    os_encaminhar_enabled: false,
    // Protocolo: null = sem restrição de tipo/status; visibilidades null = só privado.
    protocol_allowed_types: null,
    protocol_allowed_statuses: null,
    protocol_allowed_visibilities: null,
    protocol_can_change_visibility: false,
    // Unidades para onde o perfil pode enviar protocolo (cada uma vale com as subunidades); vazio = qualquer destino.
    protocol_destino_unit_ids: [],
    page_ids: [],
};

/** Árvore de unidades achatada com o nível, para listar com recuo. */
const achatarUnidades = (nos, nivel = 0) => (Array.isArray(nos) ? nos : []).flatMap((n) => [{ ...n, nivel }, ...achatarUnidades(n.children, nivel + 1)]);

const STATUS_PROTOCOLO = [
    ['novo', 'Novo'], ['recebido', 'Recebido'], ['encaminhado', 'Encaminhado'],
    ['encerrado', 'Encerrado'], ['concluido', 'Concluído'], ['cancelado', 'Cancelado'],
];

const PERMISSOES_OPERACIONAIS = [
    ['chat_enabled', 'Permitir acesso ao chat'],
    ['almoxarifado_create_enabled', 'Criar requisições do almoxarifado'],
    ['almoxarifado_approve_enabled', 'Aprovar requisições do almoxarifado'],
    ['almoxarifado_deliver_enabled', 'Separar e entregar requisições'],
    ['client_trips_view_enabled', 'Ver viagens do cliente (Cidadãos)'],
    ['client_report_view_enabled', 'Ver relatório detalhado do cliente'],
    ['client_history_view_enabled', 'Ver histórico do cidadão (auditoria)'],
    ['os_encaminhar_enabled', 'Ordem de serviço: abrir para qualquer secretaria e encaminhar a outra secretaria ou técnico'],
];

function agruparPorCategoria(pages, pageCategoryById) {
    return pages.reduce((acc, page) => {
        const cat = (page?.category_id && pageCategoryById.get(String(page.category_id))?.nome) || page?.category?.nome || page.categoria || 'Outros';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(page);
        return acc;
    }, {});
}

const COLUNAS_FILA = [
    ['can_view', 'Ver'],
    ['can_edit', 'Editar'],
    ['can_insert', 'Inserir paciente'],
];

export default function Perfis() {
    const dispatch = useDispatch();
    const { profiles, pages, pageCategories } = useSelector((state) => state.accessProfiles);

    const [openModal, setOpenModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(FORM_INICIAL);
    const [busca, setBusca] = useState('');
    const [tiposProtocolo, setTiposProtocolo] = useState([]);
    // Acesso às filas por especialidade (definido no perfil; admin sempre acessa tudo).
    const [filas, setFilas] = useState([]);
    const [filasCarregadas, setFilasCarregadas] = useState(false);
    // Lista de filas só é gravada se o perfil já tinha Filas ao abrir: senão sobrescreveria a liberação automática.
    const [tinhaFila, setTinhaFila] = useState(false);
    // A lista de filas é longa: começa oculta e o botão alterna.
    const [mostrarFilas, setMostrarFilas] = useState(false);
    const [mostrarDestinos, setMostrarDestinos] = useState(false);
    const [mostrarPaginas, setMostrarPaginas] = useState(false);
    const [mostrarOperacionais, setMostrarOperacionais] = useState(false);
    const [mostrarCadastroProtocolo, setMostrarCadastroProtocolo] = useState(false);
    const [unidades, setUnidades] = useState([]);

    const alternarFila = (specialityId, campo) => setFilas((atual) => atual.map((item) => {
        if (item.speciality_id !== specialityId) return item;
        const prox = { ...item, [campo]: !item[campo] };
        if ((campo === 'can_edit' || campo === 'can_insert') && prox[campo]) prox.can_view = true;
        if (campo === 'can_view' && !prox.can_view) { prox.can_edit = false; prox.can_insert = false; }
        return prox;
    }));

    const alternarTodasFilas = (campo) => setFilas((atual) => {
        const ligar = !(atual.length > 0 && atual.every((item) => item[campo]));
        return atual.map((item) => {
            const prox = { ...item, [campo]: ligar };
            if ((campo === 'can_edit' || campo === 'can_insert') && ligar) prox.can_view = true;
            if (campo === 'can_view' && !ligar) { prox.can_edit = false; prox.can_insert = false; }
            return prox;
        });
    });

    useEffect(() => {
        api.get('/protocolos/tipos')
            .then(({ data }) => setTiposProtocolo((Array.isArray(data) ? data : []).filter((t) => t.ativo !== false)))
            .catch(() => {});
        // Todas as secretarias: o perfil pode liberar destino em outra secretaria.
        api.get('/protocolos/unidades-organizacionais', { params: { todas: 1 } })
            .then(({ data }) => setUnidades(achatarUnidades(data)))
            .catch(() => {});
    }, []);

    // null = sem restrição; lista = só esses valores ao cadastrar protocolo.
    const alternarRestricao = (nome, todos, ligado) => setForm((f) => ({ ...f, [nome]: ligado ? todos : null }));
    const alternarItem = (nome, valor, marcado) => setForm((f) => {
        const atual = Array.isArray(f[nome]) ? f[nome] : [];
        return { ...f, [nome]: marcado ? [...atual, valor] : atual.filter((v) => v !== valor) };
    });

    useEffect(() => {
        dispatch(getAllProfiles());
        dispatch(getAllPages());
        dispatch(getAllPageCategories());
    }, [dispatch]);

    const pageCategoryById = useMemo(() => {
        return new Map((Array.isArray(pageCategories) ? pageCategories : []).map((category) => [String(category.id), category]));
    }, [pageCategories]);

    const campo = (name, value) => setForm((f) => ({ ...f, [name]: value }));

    const handleNovo = () => {
        setEditId(null);
        setForm(FORM_INICIAL);
        setFilas([]);
        setFilasCarregadas(false);
        setOpenModal(true);
    };

    const handleEditar = (profile) => {
        setEditId(profile.id);
        setTinhaFila(Boolean(profile.pages?.some((p) => p.path === '/queue')));
        setFilas([]);
        setFilasCarregadas(false);
        if (profile.slug !== 'admin') {
            api.get(`/access-profiles/${profile.id}/speciality-permissions`)
                .then(({ data }) => { setFilas(Array.isArray(data) ? data : []); setFilasCarregadas(true); })
                .catch(() => {});
        }
        setForm({
            nome: profile.nome,
            slug: profile.slug,
            descricao: profile.descricao || '',
            ativo: profile.ativo,
            chat_enabled: Boolean(profile.chat_enabled),
            almoxarifado_create_enabled: Boolean(profile.almoxarifado_create_enabled),
            almoxarifado_approve_enabled: Boolean(profile.almoxarifado_approve_enabled),
            almoxarifado_deliver_enabled: Boolean(profile.almoxarifado_deliver_enabled),
            client_trips_view_enabled: Boolean(profile.client_trips_view_enabled),
            client_report_view_enabled: Boolean(profile.client_report_view_enabled),
            client_history_view_enabled: Boolean(profile.client_history_view_enabled),
            os_encaminhar_enabled: Boolean(profile.os_encaminhar_enabled),
            protocol_allowed_types: Array.isArray(profile.protocol_allowed_types) ? profile.protocol_allowed_types : null,
            protocol_allowed_statuses: Array.isArray(profile.protocol_allowed_statuses) ? profile.protocol_allowed_statuses : null,
            protocol_allowed_visibilities: Array.isArray(profile.protocol_allowed_visibilities) ? profile.protocol_allowed_visibilities : null,
            protocol_can_change_visibility: Boolean(profile.protocol_can_change_visibility),
            protocol_destino_unit_ids: Array.isArray(profile.protocol_destino_unit_ids) ? profile.protocol_destino_unit_ids : [],
            page_ids: profile.pages?.map((p) => p.id) || [],
        });
        setOpenModal(true);
    };

    const handleTogglePage = (pageId) => {
        setForm((f) => ({
            ...f,
            page_ids: f.page_ids.includes(pageId)
                ? f.page_ids.filter((id) => id !== pageId)
                : [...f.page_ids, pageId],
        }));
    };

    const handleSave = () => {
        const aoConcluir = async () => {
            if (editId && filasCarregadas && tinhaFila && temFila) {
                await api.put(`/access-profiles/${editId}/speciality-permissions`, {
                    permissions: filas.map((f) => ({ speciality_id: f.speciality_id, can_view: f.can_view, can_edit: f.can_edit, can_insert: f.can_insert })),
                }).catch(() => {});
            }
            setOpenModal(false);
            dispatch(getAllProfiles());
        };
        if (editId) {
            dispatch(editProfileFetch(editId, form, aoConcluir));
        } else {
            dispatch(addProfileFetch(form, aoConcluir));
        }
    };

    const categorias = agruparPorCategoria(pages, pageCategoryById);
    // Só perfil com a página de Filas tem acesso às filas por especialidade.
    const paginaFilaId = pages.find((p) => p.path === '/queue')?.id;
    const temFila = paginaFilaId != null && form.page_ids.includes(paginaFilaId);
    const termo = busca.toLowerCase();
    const perfisFiltrados = profiles.filter((profile) =>
        profile.nome?.toLowerCase().includes(termo) ||
        profile.slug?.toLowerCase().includes(termo) ||
        profile.descricao?.toLowerCase().includes(termo)
    );
    const { fatia, propsDaPaginacao } = usePaginacaoLocal(perfisFiltrados);

    const colunas = [
        {
            chave: 'nome',
            titulo: 'Nome / Slug',
            render: (profile) => (
                <>
                    <span className="block font-semibold">{profile.nome}</span>
                    <span className="block text-xs text-muted-foreground">{profile.slug}</span>
                </>
            ),
        },
        { chave: 'descricao', titulo: 'Descrição', render: (profile) => profile.descricao || '-' },
        { chave: 'paginas', titulo: 'Páginas', render: (profile) => <Pilula tom="info">{`${profile.pages?.length || 0} páginas`}</Pilula> },
        { chave: 'status', titulo: 'Status', render: (profile) => <Pilula tom={profile.ativo ? 'sucesso' : 'perigo'}>{profile.ativo ? 'Ativo' : 'Inativo'}</Pilula> },
        {
            chave: 'acoes',
            titulo: 'Ações',
            render: (profile) => (
                <div className="flex gap-2">
                    <ActionEditButton title="Editar perfil" onClick={() => handleEditar(profile)} />
                    <ActionDeleteButton title="Remover perfil" onClick={() => dispatch(removeProfileFetch(profile.id))} />
                </div>
            ),
        },
    ];

    return (
        <PaginaDeLista
            titulo="Perfis de Acesso"
            subtitulo={`Você possui ${profiles.length} Perfis de Acesso Cadastrados`}
            busca={{ rotulo: 'Buscar perfis', placeholder: 'Buscar por nome, slug ou descrição...', maxLength: 80, value: busca, onChange: (e) => setBusca(e.target.value) }}
            barra={<ActionCreateFab title="Novo Perfil" onClick={handleNovo} />}
            colunas={colunas}
            linhas={fatia}
            chaveDaLinha={(profile) => profile.id}
            vazio="Nenhum perfil encontrado"
            rotuloDaTabela="perfis"
            paginacao={{ ...propsDaPaginacao, opcoes: [10, 25] }}
        >
            <AlertModal />
            <Dialogo aberto={openModal} aoFechar={() => setOpenModal(false)} tamanho="xl">
                <AlertModal />
                <DialogoCabecalho>{editId ? 'Editar Perfil de Acesso' : 'Novo Perfil de Acesso'}</DialogoCabecalho>
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <div className="grid gap-4 md:grid-cols-2">
                        <CampoTexto id="perfil-nome" label="Nome do Perfil" obrigatorio maxLength={60} value={form.nome} onChange={(e) => campo('nome', e.target.value)} />
                        <CampoTexto
                            id="perfil-slug"
                            label="Slug (identificador)"
                            obrigatorio
                            maxLength={60}
                            dica="Apenas letras minúsculas, números e hífens"
                            value={form.slug}
                            onChange={(e) => campo('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                        />
                        <div className="md:col-span-2">
                            <CampoTexto id="perfil-descricao" label="Descrição" maxLength={200} value={form.descricao} onChange={(e) => campo('descricao', e.target.value)} />
                        </div>
                        <div className="md:col-span-2">
                            <Interruptor id="perfil-ativo" marcado={form.ativo} aoMudar={(v) => campo('ativo', v)}>Perfil ativo</Interruptor>
                        </div>
                    </div>

                    <div className="mb-3 mt-6 flex items-center justify-between gap-3">
                        <h3 className="font-display text-base font-bold">Permissões operacionais</h3>
                        <Button type="button" size="sm" variant="outline" aria-expanded={mostrarOperacionais} onClick={() => setMostrarOperacionais((v) => !v)}>
                            {mostrarOperacionais ? 'Ocultar permissões' : 'Mostrar permissões'}
                        </Button>
                    </div>
                    <div className={mostrarOperacionais ? 'grid gap-3 md:grid-cols-2' : 'hidden'}>
                        {PERMISSOES_OPERACIONAIS.map(([nome, rotulo]) => (
                            <Interruptor key={nome} id={`perfil-${nome}`} marcado={form[nome]} aoMudar={(v) => campo(nome, v)}>{rotulo}</Interruptor>
                        ))}
                    </div>

                    <div className="mb-3 mt-6 flex items-center justify-between gap-3">
                        <h3 className="font-display text-base font-bold">Protocolos: o que este perfil pode cadastrar</h3>
                        <Button type="button" size="sm" variant="outline" aria-expanded={mostrarCadastroProtocolo} onClick={() => setMostrarCadastroProtocolo((v) => !v)}>
                            {mostrarCadastroProtocolo ? 'Ocultar regras' : 'Mostrar regras'}
                        </Button>
                    </div>
                    <div className={mostrarCadastroProtocolo ? 'grid gap-2 rounded-lg border border-border p-3' : 'hidden'}>
                        <Interruptor
                            id="perfil-restringir-tipos"
                            marcado={Array.isArray(form.protocol_allowed_types)}
                            aoMudar={(ligado) => alternarRestricao('protocol_allowed_types', tiposProtocolo.map((t) => t.codigo), ligado)}
                        >
                            Restringir tipos de protocolo
                        </Interruptor>
                        {Array.isArray(form.protocol_allowed_types) && tiposProtocolo.map((t) => (
                            <CaixaDeMarcacao key={t.codigo} id={`perfil-tipo-${t.codigo}`} marcado={form.protocol_allowed_types.includes(t.codigo)} aoMudar={(m) => alternarItem('protocol_allowed_types', t.codigo, m)}>
                                {t.nome}
                            </CaixaDeMarcacao>
                        ))}
                        <Interruptor
                            id="perfil-restringir-status"
                            marcado={Array.isArray(form.protocol_allowed_statuses)}
                            aoMudar={(ligado) => alternarRestricao('protocol_allowed_statuses', ['novo'], ligado)}
                        >
                            Restringir status ao cadastrar
                        </Interruptor>
                        {Array.isArray(form.protocol_allowed_statuses) && STATUS_PROTOCOLO.map(([valor, rotulo]) => (
                            <CaixaDeMarcacao key={valor} id={`perfil-status-${valor}`} marcado={form.protocol_allowed_statuses.includes(valor)} aoMudar={(m) => alternarItem('protocol_allowed_statuses', valor, m)}>
                                {rotulo}
                            </CaixaDeMarcacao>
                        ))}
                        <span className="text-sm font-medium">Visibilidade ao cadastrar (padrão: só privado)</span>
                        {[['private', 'Privado (só quem tem acesso ao protocolo)'], ['public', 'Público (todos os usuários veem)']].map(([valor, rotulo]) => {
                            const atuais = Array.isArray(form.protocol_allowed_visibilities) ? form.protocol_allowed_visibilities : ['private'];
                            return (
                                <CaixaDeMarcacao
                                    key={valor}
                                    id={`perfil-visibilidade-${valor}`}
                                    marcado={atuais.includes(valor)}
                                    aoMudar={(marcado) => setForm((f) => {
                                        const lista = marcado ? [...atuais, valor] : atuais.filter((v) => v !== valor);
                                        // Sempre sobra ao menos uma opção: sem nenhuma, vale o padrão (privado).
                                        return { ...f, protocol_allowed_visibilities: lista.length > 0 ? lista : ['private'] };
                                    })}
                                >
                                    {rotulo}
                                </CaixaDeMarcacao>
                            );
                        })}
                        <Interruptor id="perfil-alterar-visibilidade" marcado={Boolean(form.protocol_can_change_visibility)} aoMudar={(v) => campo('protocol_can_change_visibility', v)}>
                            Pode alterar a visibilidade de um protocolo já cadastrado
                        </Interruptor>
                    </div>

                    <div className="mb-3 mt-6 flex items-center justify-between gap-3">
                        <h3 className="font-display text-base font-bold">Filas por especialidade</h3>
                        <Button type="button" size="sm" variant="outline" aria-expanded={mostrarFilas} onClick={() => setMostrarFilas((v) => !v)}>
                            {mostrarFilas ? 'Ocultar filas' : 'Mostrar filas'}
                        </Button>
                    </div>
                    {!mostrarFilas ? null : !editId ? (
                        <p className="text-sm text-muted-foreground">Grave o perfil primeiro; depois edite-o para definir o acesso às filas.</p>
                    ) : form.slug === 'admin' ? (
                        <p className="text-sm text-muted-foreground">O administrador acessa todas as filas.</p>
                    ) : !temFila ? (
                        <p className="text-sm text-muted-foreground">Este perfil não tem acesso à página de Filas.</p>
                    ) : !tinhaFila ? (
                        <p className="text-sm text-muted-foreground">Grave o perfil com a página de Filas; depois edite-o para ajustar as especialidades.</p>
                    ) : !filasCarregadas ? (
                        <p className="text-sm text-muted-foreground">Carregando especialidades...</p>
                    ) : filas.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhuma especialidade cadastrada.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="py-2 pr-3 font-semibold">Especialidade</th>
                                        {COLUNAS_FILA.map(([campo, rotulo]) => (
                                            <th key={campo} className="px-2 py-2 text-center font-semibold">
                                                <div className="flex flex-col items-center gap-1">
                                                    {rotulo}
                                                    <CaixaDeMarcacao
                                                        aria-label={`${rotulo}: todas`}
                                                        marcado={filas.length > 0 && filas.every((item) => Boolean(item[campo]))}
                                                        aoMudar={() => alternarTodasFilas(campo)}
                                                    />
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filas.map((item) => (
                                        <tr key={item.speciality_id} className="border-b border-border last:border-0">
                                            <td className="py-2 pr-3">{item.speciality_name}</td>
                                            {COLUNAS_FILA.map(([campo, rotulo]) => (
                                                <td key={campo} className="px-2 py-2">
                                                    <div className="flex justify-center">
                                                        <CaixaDeMarcacao
                                                            aria-label={`${rotulo}: ${item.speciality_name}`}
                                                            marcado={Boolean(item[campo])}
                                                            aoMudar={() => alternarFila(item.speciality_id, campo)}
                                                        />
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="mb-3 mt-6 flex items-center justify-between gap-3">
                        <h3 className="font-display text-base font-bold">Protocolos: destinos permitidos</h3>
                        <Button type="button" size="sm" variant="outline" aria-expanded={mostrarDestinos} onClick={() => setMostrarDestinos((v) => !v)}>
                            {mostrarDestinos ? 'Ocultar destinos' : 'Mostrar destinos'}
                        </Button>
                    </div>
                    {mostrarDestinos ? (
                        <div className="grid gap-1">
                            <p className="mb-1 text-sm text-muted-foreground">
                                Marque a secretaria, o departamento ou o subdepartamento para onde este perfil pode enviar protocolo; cada item vale com tudo o que está abaixo dele. Nenhum marcado: pode enviar para qualquer destino.
                            </p>
                            {unidades.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Nenhuma unidade cadastrada.</p>
                            ) : unidades.map((u) => (
                                <div key={u.id} style={{ paddingLeft: `${u.nivel * 1.25}rem` }}>
                                    <CaixaDeMarcacao
                                        id={`perfil-destino-${u.id}`}
                                        marcado={form.protocol_destino_unit_ids.includes(u.id)}
                                        aoMudar={(marcado) => setForm((f) => ({
                                            ...f,
                                            protocol_destino_unit_ids: marcado
                                                ? [...f.protocol_destino_unit_ids, u.id]
                                                : f.protocol_destino_unit_ids.filter((id) => id !== u.id),
                                        }))}
                                    >
                                        {u.nome}
                                    </CaixaDeMarcacao>
                                </div>
                            ))}
                        </div>
                    ) : null}

                    <div className="mb-3 mt-6 flex items-center justify-between gap-3">
                        <h3 className="font-display text-base font-bold">Páginas com Acesso</h3>
                        <Button type="button" size="sm" variant="outline" aria-expanded={mostrarPaginas} onClick={() => setMostrarPaginas((v) => !v)}>
                            {mostrarPaginas ? 'Ocultar páginas' : 'Mostrar páginas'}
                        </Button>
                    </div>
                    <div className={mostrarPaginas ? 'grid gap-4' : 'hidden'}>
                        {Object.entries(categorias).map(([categoria, catPages]) => (
                            <fieldset key={categoria} className="min-w-0 border-0 p-0">
                                <legend className="mb-2 text-sm font-semibold text-primary-text">{categoria}</legend>
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                    {catPages.map((pg) => (
                                        <CaixaDeMarcacao key={pg.id} id={`perfil-pagina-${pg.id}`} marcado={form.page_ids.includes(pg.id)} aoMudar={() => handleTogglePage(pg.id)}>
                                            {pg.titulo}
                                        </CaixaDeMarcacao>
                                    ))}
                                </div>
                            </fieldset>
                        ))}
                    </div>

                    <DialogoRodape>
                        <Button type="button" variant="outline" onClick={() => setOpenModal(false)}>Cancelar</Button>
                        <Button type="submit">Gravar</Button>
                    </DialogoRodape>
                </form>
            </Dialogo>
        </PaginaDeLista>
    );
}
