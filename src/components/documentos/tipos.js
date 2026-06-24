import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import BaseCard from '../baseCard/BaseCard';
import ConfirmDialog from '../confirmDialog';
import { modalFormRootSx, modalPrimaryButtonSx, modalSecondaryButtonSx } from '../modal/_shared/modalFormStyles';
import { api } from '../../services/api';

const initialForm = { id: null, codigo: '', nome: '', descricao: '', ordem: 0, ativo: true };

export default function DocumentosTipos() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [open, setOpen] = useState(false);
  const [alertState, setAlertState] = useState({ visible: false, type: 'success', message: '' });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', subTitle: '', onConfirm: null });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/documentos/tipos');
      setTypes(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    try {
      if (form.id) {
        await api.put(`/documentos/tipos/${form.id}`, form);
      } else {
        await api.post('/documentos/tipos', form);
      }
      setAlertState({ visible: true, type: 'success', message: 'Tipo salvo com sucesso.' });
      setOpen(false);
      setForm(initialForm);
      await load();
    } catch (error) {
      setAlertState({ visible: true, type: 'error', message: error?.response?.data?.message || 'Não foi possível salvar o tipo.' });
    }
  };

  const edit = (type) => {
    setForm({
      id: type.id,
      codigo: type.codigo || '',
      nome: type.nome || '',
      descricao: type.descricao || '',
      ordem: type.ordem ?? 0,
      ativo: type.ativo !== false,
    });
    setOpen(true);
  };

  const askDelete = (type) => {
    setConfirmDialog({
      isOpen: true,
      title: `Excluir tipo "${type.nome}"`,
      subTitle: 'Esta ação não poderá ser desfeita.',
      onConfirm: async () => {
        await api.delete(`/documentos/tipos/${type.id}`);
        setAlertState({ visible: true, type: 'success', message: 'Tipo removido com sucesso.' });
        await load();
      },
    });
  };

  return (
    <Box sx={modalFormRootSx}>
      <BaseCard title="Tipos de Documentos">
        {alertState.visible && (
          <Alert sx={{ mb: 2 }} variant="filled" severity={alertState.type} onClose={() => setAlertState({ visible: false, type: 'success', message: '' })}>
            {alertState.message}
          </Alert>
        )}

        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Button variant="contained" onClick={() => setOpen(true)}>Novo tipo</Button>
          <Button variant="outlined" href="/documentos">Voltar para documentos</Button>
        </Stack>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Nome</TableCell>
                <TableCell>Ordem</TableCell>
                <TableCell>Ativo</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {types.map((type) => (
                <TableRow key={type.id} hover>
                  <TableCell>{type.codigo}</TableCell>
                  <TableCell>{type.nome}</TableCell>
                  <TableCell>{type.ordem}</TableCell>
                  <TableCell>{type.ativo ? 'Sim' : 'Não'}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="outlined" onClick={() => edit(type)}>Editar</Button>
                      <Button size="small" color="error" variant="outlined" onClick={() => askDelete(type)}>Excluir</Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && types.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary">Nenhum tipo cadastrado.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </BaseCard>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{form.id ? 'Editar tipo' : 'Novo tipo'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Código" value={form.codigo} onChange={(e) => setForm((prev) => ({ ...prev, codigo: e.target.value }))} />
            <TextField label="Nome" value={form.nome} onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))} />
            <TextField label="Descrição" multiline minRows={3} value={form.descricao} onChange={(e) => setForm((prev) => ({ ...prev, descricao: e.target.value }))} />
            <TextField label="Ordem" type="number" value={form.ordem} onChange={(e) => setForm((prev) => ({ ...prev, ordem: Number(e.target.value) }))} />
            <FormControlLabel control={<Switch checked={form.ativo} onChange={(e) => setForm((prev) => ({ ...prev, ativo: e.target.checked }))} />} label="Ativo" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} variant="outlined" sx={modalSecondaryButtonSx}>Cancelar</Button>
          <Button onClick={save} variant="contained" sx={modalPrimaryButtonSx}>Gravar</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
    </Box>
  );
}
