import React, { useEffect, useState } from 'react';
import {
    Box, Button, Card, CardContent, FormControlLabel, Stack,
    Switch, TextField, Typography,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { addExameFetch, editExameFetch } from '../../../store/fetchActions/exames';

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

    const change = ({ target }) => setForm(f => ({ ...f, [target.name]: target.value }));

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
        <Card>
            <Box p={2}>
                <Typography variant="h4">{isEdit ? 'Editar Exame' : 'Novo Exame'}</Typography>
            </Box>
            <CardContent>
                <Stack spacing={3} maxWidth={600}>
                    <TextField
                        className="lg-search-field"
                        label="Nome do Exame"
                        name="nome"
                        value={form.nome}
                        onChange={change}
                        required
                        inputProps={{ maxLength: 100, style: { textTransform: 'uppercase' } }}
                    />
                    <Box display="flex" gap={2}>
                        <TextField
                            className="lg-search-field"
                            label="Código"
                            name="codigo"
                            value={form.codigo}
                            onChange={change}
                            required
                            inputProps={{ maxLength: 30, style: { textTransform: 'uppercase' } }}
                            sx={{ flex: 1 }}
                        />
                        <TextField
                            className="lg-search-field"
                            label="Categoria"
                            name="categoria"
                            value={form.categoria}
                            onChange={change}
                            inputProps={{ maxLength: 60 }}
                            sx={{ flex: 2 }}
                        />
                    </Box>
                    <TextField
                        className="lg-search-field"
                        label="Descrição"
                        name="descricao"
                        value={form.descricao}
                        onChange={change}
                        multiline
                        rows={3}
                        inputProps={{ maxLength: 500 }}
                    />
                    <FormControlLabel
                        control={<Switch checked={form.ativo} onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))} />}
                        label="Exame ativo"
                    />
                    <Box display="flex" gap={2}>
                        <Button variant="contained" onClick={handleSubmit}>
                            {isEdit ? 'Salvar e gerenciar campos' : 'Criar e gerenciar campos'}
                        </Button>
                        <Button variant="outlined" onClick={() => router.push('/laboratorio/exames')}>
                            Cancelar
                        </Button>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}
