import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { ArrowLeft, ChevronDown, ChevronUp, Plus, SlidersHorizontal } from 'lucide-react';
import { getCamposDoExame, addCampoFetch, editCampoFetch, removeCampoFetch, reordenarCamposFetch } from '../../../store/fetchActions/exameCampos';
import { api } from '../../../services/api';
import { addAlertMessage, addMessage, turnAlert } from '../../../store/ducks/Layout';
import AlertModal from '../../messagesModal';
import { AcoesDeLinha } from '../../ui/acoes-de-linha';
import { Button } from '../../ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { CampoSelecao, CampoTexto } from '../../ui/campos';
import { DataTable } from '../../ui/data-table';
import { Dialogo, DialogoCabecalho, DialogoRodape } from '../../ui/dialogo';
import { Interruptor } from '../../ui/interruptor';
import { Pilula } from '../../ui/pilula';

const CAMPO_INICIAL = { nome: '', descricao: '', tipo_valor: 'numerico', unidade: '', opcoes_selecao: [], obrigatorio: true, ativo: true };
const REF_INICIAL   = { perfil: 'geral', valor_min: '', valor_max: '', valor_texto: '', descricao: '' };

const PERFIS = ['geral', 'adulto_m', 'adulto_f', 'crianca', 'idoso', 'gestante'];
const TIPOS  = ['numerico', 'texto', 'booleano', 'selecao'];

export default function GerenciarCampos() {
    const dispatch = useDispatch();
    const router   = useRouter();
    const { id: exameId } = router.query;
    const { campos } = useSelector(state => state.exameCampos);

    const [campoForm, setCampoForm]     = useState(CAMPO_INICIAL);
    const [campoEditId, setCampoEditId] = useState(null);
    const [openCampo, setOpenCampo]     = useState(false);
    const [openRef, setOpenRef]         = useState(false);
    const [refCampoId, setRefCampoId]   = useState(null);
    const [referencias, setReferencias] = useState([]);
    const [refForm, setRefForm]         = useState(REF_INICIAL);
    const [refEditId, setRefEditId]     = useState(null);

    useEffect(() => {
        if (exameId) dispatch(getCamposDoExame(exameId));
    }, [exameId]);

    const changeCampo = ({ target: { name, value } }) => setCampoForm(f => ({ ...f, [name]: value }));
    const changeRef = ({ target: { name, value } }) => setRefForm(f => ({ ...f, [name]: value }));

    const handleSalvarCampo = () => {
        if (campoEditId) {
            dispatch(editCampoFetch(exameId, campoEditId, campoForm, () => setOpenCampo(false)));
        } else {
            dispatch(addCampoFetch(exameId, campoForm, () => setOpenCampo(false)));
        }
    };

    const handleMoverCampo = (index, dir) => {
        const reordenados = [...campos];
        const alvo = index + dir;
        if (alvo < 0 || alvo >= reordenados.length) return;
        [reordenados[index], reordenados[alvo]] = [reordenados[alvo], reordenados[index]];
        const novaOrdem = reordenados.map(c => c.id);
        dispatch(reordenarCamposFetch(exameId, novaOrdem));
    };

    const abrirReferencias = async (campoId) => {
        setRefCampoId(campoId);
        try {
            const res = await api.get(`/laboratorio/campos/${campoId}/referencias`);
            setReferencias(res.data);
        } catch {
            setReferencias([]);
        }
        setRefForm(REF_INICIAL);
        setRefEditId(null);
        setOpenRef(true);
    };

    const handleSalvarRef = async () => {
        try {
            if (refEditId) {
                const res = await api.put(`/laboratorio/campos/${refCampoId}/referencias/${refEditId}`, refForm);
                setReferencias(refs => refs.map(r => r.id === refEditId ? res.data.referencia : r));
            } else {
                const res = await api.post(`/laboratorio/campos/${refCampoId}/referencias`, refForm);
                setReferencias(refs => [res.data.referencia, ...refs]);
            }
            dispatch(addMessage('Referência salva!'));
            dispatch(turnAlert());
            setRefForm(REF_INICIAL);
            setRefEditId(null);
        } catch (e) {
            dispatch(addAlertMessage(e?.response?.data?.message || 'Erro ao salvar referência'));
        }
    };

    const handleRemoverRef = async (refId) => {
        try {
            await api.delete(`/laboratorio/campos/${refCampoId}/referencias/${refId}`);
            setReferencias(refs => refs.filter(r => r.id !== refId));
        } catch {
            dispatch(addAlertMessage('Erro ao remover referência'));
        }
    };

    const colunasCampos = [
        {
            chave: 'ordem',
            titulo: 'Ordem',
            render: (campo, idx) => (
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon-xs" title="Subir" aria-label="Subir" onClick={() => handleMoverCampo(idx, -1)} disabled={idx === 0}>
                        <ChevronUp />
                    </Button>
                    <Button variant="ghost" size="icon-xs" title="Descer" aria-label="Descer" onClick={() => handleMoverCampo(idx, 1)} disabled={idx === campos.length - 1}>
                        <ChevronDown />
                    </Button>
                </div>
            ),
        },
        {
            chave: 'nome',
            titulo: 'Nome',
            render: (campo) => (
                <>
                    <span className="block font-semibold">{campo.nome}</span>
                    {campo.descricao && <span className="block text-xs text-muted-foreground">{campo.descricao}</span>}
                </>
            ),
        },
        { chave: 'tipo', titulo: 'Tipo', render: (campo) => <Pilula tom="neutro" contorno>{campo.tipo_valor}</Pilula> },
        { chave: 'unidade', titulo: 'Unidade', render: (campo) => campo.unidade || '—' },
        {
            chave: 'status',
            titulo: 'Status',
            render: (campo) => <Pilula tom={campo.ativo ? 'sucesso' : 'perigo'}>{campo.ativo ? 'Ativo' : 'Inativo'}</Pilula>,
        },
        {
            chave: 'acoes',
            titulo: 'Ações',
            render: (campo) => (
                <AcoesDeLinha
                    rotuloEditar="Editar campo"
                    rotuloExcluir="Remover campo"
                    aoEditar={() => {
                        setCampoForm({ nome: campo.nome, descricao: campo.descricao || '', tipo_valor: campo.tipo_valor, unidade: campo.unidade || '', opcoes_selecao: campo.opcoes_selecao || [], obrigatorio: campo.obrigatorio, ativo: campo.ativo });
                        setCampoEditId(campo.id);
                        setOpenCampo(true);
                    }}
                    aoExcluir={() => dispatch(removeCampoFetch(exameId, campo.id))}
                >
                    <Button variant="secondary" size="icon-sm" title="Referências" aria-label="Referências" onClick={() => abrirReferencias(campo.id)}>
                        <SlidersHorizontal />
                    </Button>
                </AcoesDeLinha>
            ),
        },
    ];

    const colunasRefs = [
        { chave: 'perfil', titulo: 'Perfil', render: (ref) => <Pilula tom="neutro" contorno>{ref.perfil}</Pilula> },
        { chave: 'min', titulo: 'Mín', render: (ref) => ref.valor_min ?? '—' },
        { chave: 'max', titulo: 'Máx', render: (ref) => ref.valor_max ?? '—' },
        { chave: 'texto', titulo: 'Texto', render: (ref) => ref.valor_texto || '—' },
        {
            chave: 'acoes',
            titulo: 'Ações',
            render: (ref) => (
                <AcoesDeLinha
                    rotuloEditar="Editar referência"
                    rotuloExcluir="Remover referência"
                    aoEditar={() => {
                        setRefForm({ perfil: ref.perfil, valor_min: ref.valor_min ?? '', valor_max: ref.valor_max ?? '', valor_texto: ref.valor_texto || '', descricao: ref.descricao || '' });
                        setRefEditId(ref.id);
                    }}
                    aoExcluir={() => handleRemoverRef(ref.id)}
                />
            ),
        },
    ];

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex flex-wrap items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={() => router.push('/laboratorio/exames')}>
                            <ArrowLeft /> Voltar
                        </Button>
                        Campos do Exame ({campos.length})
                    </CardTitle>
                    <CardAction>
                        <Button onClick={() => { setCampoForm(CAMPO_INICIAL); setCampoEditId(null); setOpenCampo(true); }}>
                            <Plus /> Novo Campo
                        </Button>
                    </CardAction>
                </CardHeader>
                <CardContent>
                    <DataTable
                        rotulo="campos do exame"
                        colunas={colunasCampos}
                        linhas={campos}
                        chaveDaLinha={(campo) => campo.id}
                        vazio="Nenhum campo cadastrado"
                    />
                </CardContent>
            </Card>

            <Dialogo aberto={openCampo} aoFechar={() => setOpenCampo(false)} tamanho="lg">
                <DialogoCabecalho>{campoEditId ? 'Editar Campo' : 'Novo Campo do Exame'}</DialogoCabecalho>
                <AlertModal />
                <div className="grid gap-4">
                    <CampoTexto id="campo-nome" label="Nome do Campo" name="nome" value={campoForm.nome} onChange={changeCampo} required obrigatorio maxLength={100} />
                    <CampoTexto id="campo-descricao" label="Descrição" name="descricao" value={campoForm.descricao} onChange={changeCampo} maxLength={200} />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <CampoSelecao id="campo-tipo" label="Tipo de Valor" name="tipo_valor" value={campoForm.tipo_valor} onChange={changeCampo}>
                            {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                        </CampoSelecao>
                        <CampoTexto id="campo-unidade" label="Unidade" name="unidade" value={campoForm.unidade} onChange={changeCampo} maxLength={30} />
                    </div>
                    {campoForm.tipo_valor === 'selecao' && (
                        <CampoTexto
                            id="campo-opcoes"
                            label="Opções (separadas por vírgula)"
                            value={campoForm.opcoes_selecao?.join(', ') || ''}
                            onChange={e => setCampoForm(f => ({ ...f, opcoes_selecao: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                        />
                    )}
                    <div className="flex flex-wrap gap-6">
                        <Interruptor id="campo-obrigatorio" marcado={campoForm.obrigatorio} aoMudar={(v) => setCampoForm(f => ({ ...f, obrigatorio: v }))}>Obrigatório</Interruptor>
                        <Interruptor id="campo-ativo" marcado={campoForm.ativo} aoMudar={(v) => setCampoForm(f => ({ ...f, ativo: v }))}>Ativo</Interruptor>
                    </div>
                </div>
                <DialogoRodape>
                    <Button variant="outline" onClick={() => setOpenCampo(false)}>Cancelar</Button>
                    <Button onClick={handleSalvarCampo}>Gravar</Button>
                </DialogoRodape>
            </Dialogo>

            <Dialogo aberto={openRef} aoFechar={() => setOpenRef(false)} tamanho="lg">
                <DialogoCabecalho>Valores de Referência do Campo</DialogoCabecalho>
                <AlertModal />
                <div className="grid gap-4">
                    <div className="grid gap-3 sm:grid-cols-4">
                        <CampoSelecao id="ref-perfil" label="Perfil" name="perfil" value={refForm.perfil} onChange={changeRef}>
                            {PERFIS.map(p => <option key={p} value={p}>{p}</option>)}
                        </CampoSelecao>
                        <CampoTexto id="ref-min" label="Valor Mín" name="valor_min" type="number" value={refForm.valor_min} onChange={changeRef} />
                        <CampoTexto id="ref-max" label="Valor Máx" name="valor_max" type="number" value={refForm.valor_max} onChange={changeRef} />
                        <CampoTexto id="ref-texto" label="Valor Texto" name="valor_texto" value={refForm.valor_texto} onChange={changeRef} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button onClick={handleSalvarRef}>{refEditId ? 'Atualizar Referência' : 'Adicionar Referência'}</Button>
                        {refEditId && (
                            <Button variant="outline" onClick={() => { setRefForm(REF_INICIAL); setRefEditId(null); }}>Cancelar Edição</Button>
                        )}
                    </div>
                    <hr className="border-border" />
                    <DataTable
                        rotulo="valores de referência"
                        colunas={colunasRefs}
                        linhas={referencias}
                        chaveDaLinha={(ref) => ref.id}
                        vazio="Nenhuma referência cadastrada"
                    />
                </div>
                <DialogoRodape>
                    <Button variant="outline" onClick={() => setOpenRef(false)}>Fechar</Button>
                </DialogoRodape>
            </Dialogo>
        </>
    );
}
