import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { addExameFetch, editExameFetch } from '../../../store/fetchActions/exames';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { CampoTexto } from '../../ui/campos';
import { Interruptor } from '../../ui/interruptor';

const FORM_INICIAL = { nome: '', codigo: '', categoria: '', descricao: '', ativo: true };

export default function ExameForm() {
    const dispatch = useDispatch();
    const router = useRouter();
    const { exame } = useSelector(state => state.exames);

    const [form, setForm] = useState(FORM_INICIAL);

    useEffect(() => {
        if (exame && exame.id) {
            setForm({
                nome: exame.nome || '',
                codigo: exame.codigo || '',
                categoria: exame.categoria || '',
                descricao: exame.descricao || '',
                ativo: exame.ativo ?? true,
            });
        }
    }, [exame]);

    const change = ({ target: { name, value } }) => setForm(f => ({ ...f, [name]: value }));

    const handleSubmit = () => {
        const onSuccess = (saved) => router.push(`/laboratorio/exames/${saved.id}/campos`);
        if (exame && exame.id) {
            dispatch(editExameFetch(exame.id, form, onSuccess));
        } else {
            dispatch(addExameFetch(form, onSuccess));
        }
    };

    const isEdit = !!(exame && exame.id);

    return (
        <Card className="ui-reset">
            <CardHeader>
                <CardTitle>{isEdit ? 'Editar Exame' : 'Novo Exame'}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid max-w-[600px] gap-5">
                    <CampoTexto id="exame-nome" label="Nome do Exame" name="nome" value={form.nome} onChange={change} required obrigatorio maxLength={100} className="uppercase" />
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="sm:col-span-1">
                            <CampoTexto id="exame-codigo" label="Código" name="codigo" value={form.codigo} onChange={change} required obrigatorio maxLength={30} className="uppercase" />
                        </div>
                        <div className="sm:col-span-2">
                            <CampoTexto id="exame-categoria" label="Categoria" name="categoria" value={form.categoria} onChange={change} maxLength={60} />
                        </div>
                    </div>
                    <CampoTexto id="exame-descricao" label="Descrição" name="descricao" value={form.descricao} onChange={change} multiline rows={3} maxLength={500} />
                    <Interruptor id="exame-ativo" marcado={form.ativo} aoMudar={(v) => setForm(f => ({ ...f, ativo: v }))}>Exame ativo</Interruptor>
                    <div className="flex flex-wrap gap-3">
                        <Button onClick={handleSubmit}>
                            {isEdit ? 'Salvar e gerenciar campos' : 'Criar e gerenciar campos'}
                        </Button>
                        <Button variant="outline" onClick={() => router.push('/laboratorio/exames')}>
                            Cancelar
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
