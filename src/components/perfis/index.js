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
    page_ids: [],
};

const PERMISSOES_OPERACIONAIS = [
    ['chat_enabled', 'Permitir acesso ao chat'],
    ['almoxarifado_create_enabled', 'Criar requisições do almoxarifado'],
    ['almoxarifado_approve_enabled', 'Aprovar requisições do almoxarifado'],
    ['almoxarifado_deliver_enabled', 'Separar e entregar requisições'],
    ['client_trips_view_enabled', 'Ver viagens do cliente (Cidadãos)'],
    ['client_report_view_enabled', 'Ver relatório detalhado do cliente'],
    ['client_history_view_enabled', 'Ver histórico do cidadão (auditoria)'],
];

function agruparPorCategoria(pages, pageCategoryById) {
    return pages.reduce((acc, page) => {
        const cat = (page?.category_id && pageCategoryById.get(String(page.category_id))?.nome) || page?.category?.nome || page.categoria || 'Outros';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(page);
        return acc;
    }, {});
}

export default function Perfis() {
    const dispatch = useDispatch();
    const { profiles, pages, pageCategories } = useSelector((state) => state.accessProfiles);

    const [openModal, setOpenModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(FORM_INICIAL);
    const [busca, setBusca] = useState('');

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
        setOpenModal(true);
    };

    const handleEditar = (profile) => {
        setEditId(profile.id);
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
        const aoConcluir = () => { setOpenModal(false); dispatch(getAllProfiles()); };
        if (editId) {
            dispatch(editProfileFetch(editId, form, aoConcluir));
        } else {
            dispatch(addProfileFetch(form, aoConcluir));
        }
    };

    const categorias = agruparPorCategoria(pages, pageCategoryById);
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

                    <h3 className="mb-3 mt-6 font-display text-base font-bold">Permissões operacionais</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                        {PERMISSOES_OPERACIONAIS.map(([nome, rotulo]) => (
                            <Interruptor key={nome} id={`perfil-${nome}`} marcado={form[nome]} aoMudar={(v) => campo(nome, v)}>{rotulo}</Interruptor>
                        ))}
                    </div>

                    <h3 className="mb-3 mt-6 font-display text-base font-bold">Páginas com Acesso</h3>
                    <div className="grid gap-4">
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
