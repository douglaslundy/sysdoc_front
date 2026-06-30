import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import BaseCard from "../baseCard/BaseCard";
import ConfirmDialog from "../confirmDialog";
import { api } from "../../services/api";
import {
  modalBackdropSx,
  modalFormRootSx,
  modalPrimaryButtonSx,
  modalSecondaryButtonSx,
  modalShellSx,
} from "../modal/_shared/modalFormStyles";

export default function DuplicateCleanupModal({ open, onClose, onReload }) {
  const [loading, setLoading] = useState(false);
  const [duplicateType, setDuplicateType] = useState("all");
  const [groups, setGroups] = useState([]);
  const [summary, setSummary] = useState({ groups: 0, deletable_candidates: 0 });
  const [selectedIds, setSelectedIds] = useState([]);
  const [alertState, setAlertState] = useState({ visible: false, type: "info", message: "" });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    subTitle: "",
    onConfirm: null,
  });

  const resetState = () => {
    setSelectedIds([]);
    setAlertState({ visible: false, type: "info", message: "" });
  };

  const loadCandidates = async (type = duplicateType) => {
    setLoading(true);

    try {
      const { data } = await api.get("/clients/duplicates", { params: { type } });
      const nextGroups = data?.groups || [];
      const nextSummary = data?.summary || { groups: 0, deletable_candidates: 0 };

      setGroups(nextGroups);
      setSummary(nextSummary);
      setSelectedIds([]);
      setAlertState({
        visible: true,
        type: nextSummary.deletable_candidates > 0 ? "info" : "warning",
        message: nextSummary.deletable_candidates > 0
          ? `Foram encontrados ${nextSummary.deletable_candidates} candidatos seguros para exclusao.`
          : "Nenhum candidato seguro para exclusao foi encontrado com o filtro atual.",
      });
    } catch (error) {
      setAlertState({
        visible: true,
        type: "error",
        message: error?.response?.data?.message || "Nao foi possivel carregar os duplicados de clients.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = async () => {
    resetState();
    await loadCandidates(duplicateType);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleTypeChange = async (event) => {
    const value = event.target.value;
    setDuplicateType(value);
    await loadCandidates(value);
  };

  const toggleSelectedId = (id) => {
    setSelectedIds((current) => (
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    ));
  };

  const handleDelete = () => {
    if (!selectedIds.length) {
      setAlertState({
        visible: true,
        type: "warning",
        message: "Selecione ao menos um client duplicado para excluir.",
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: `Deseja excluir ${selectedIds.length} client(s) duplicado(s)?`,
      subTitle: "A rotina excluira apenas os registros sem vinculos operacionais.",
      onConfirm: async () => {
        setLoading(true);
        try {
          await api.delete("/clients/duplicates", { data: { ids: selectedIds } });
          setAlertState({
            visible: true,
            type: "success",
            message: "Clients duplicados excluidos com sucesso.",
          });
          await loadCandidates(duplicateType);
          if (typeof onReload === "function") {
            onReload();
          }
        } catch (error) {
          setAlertState({
            visible: true,
            type: "error",
            message: error?.response?.data?.message || "Nao foi possivel excluir os clients duplicados selecionados.",
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        onTransitionEnter={handleOpen}
        slotProps={{ backdrop: { sx: modalBackdropSx } }}
      >
        <Box sx={{ ...modalShellSx, ...modalFormRootSx, width: "1200px", maxWidth: "96vw" }}>
          <BaseCard title="Limpeza de Clients Duplicados">
            <Stack spacing={2.2}>
              {alertState.visible && (
                <Alert
                  severity={alertState.type}
                  onClose={() => setAlertState({ visible: false, type: "info", message: "" })}
                >
                  {alertState.message}
                </Alert>
              )}

              <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                <FormControl sx={{ minWidth: 220 }}>
                  <InputLabel id="duplicate-type-label">Filtro</InputLabel>
                  <Select
                    labelId="duplicate-type-label"
                    value={duplicateType}
                    label="Filtro"
                    onChange={handleTypeChange}
                  >
                    <MenuItem value="all">CPF e CNS</MenuItem>
                    <MenuItem value="cpf">Somente CPF</MenuItem>
                    <MenuItem value="cns">Somente CNS valido</MenuItem>
                  </Select>
                </FormControl>

                <Chip label={`${summary.groups || 0} grupos`} color="info" variant="outlined" />
                <Chip label={`${summary.deletable_candidates || 0} candidatos seguros`} color="warning" variant="outlined" />
                <Chip label={`${selectedIds.length} selecionados`} color="success" variant="outlined" />
              </Box>

              <Box sx={{ maxHeight: "58vh", overflow: "auto", pr: 0.5 }}>
                <Stack spacing={1.6}>
                  {groups.length ? groups.map((group) => (
                    <Box
                      key={`${group.identifier_type}-${group.identifier_value}`}
                      sx={{
                        border: "0.5px solid var(--lg-border)",
                        borderRadius: "14px",
                        background: "var(--queue-row-bg)",
                        p: 2,
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {group.identifier_type.toUpperCase()}: {group.identifier_value}
                      </Typography>
                      <Typography color="textSecondary" sx={{ fontSize: "13px", mb: 1.2 }}>
                        Registro principal: #{group.keeper?.id} - {group.keeper?.name}
                      </Typography>

                      <Stack spacing={1}>
                        {group.deletable_candidates.map((candidate) => (
                          <Box
                            key={candidate.id}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.4,
                              justifyContent: "space-between",
                              border: "0.5px solid var(--lg-border)",
                              borderRadius: "12px",
                              p: 1.2,
                              background: "var(--queue-row-hover)",
                            }}
                          >
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                              <Checkbox
                                checked={selectedIds.includes(candidate.id)}
                                onChange={() => toggleSelectedId(candidate.id)}
                              />
                              <Box>
                                <Typography sx={{ fontWeight: 700 }}>
                                  #{candidate.id} - {candidate.name}
                                </Typography>
                                <Typography color="textSecondary" sx={{ fontSize: "13px" }}>
                                  CPF: {candidate.cpf || "-"} | CNS: {candidate.cns || "-"}
                                </Typography>
                              </Box>
                            </Box>
                            <Chip
                              label={candidate.active ? "Ativo" : "Inativo"}
                              color={candidate.active ? "success" : "default"}
                              size="small"
                            />
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  )) : (
                    <Typography color="textSecondary">
                      Nenhum grupo duplicado seguro para tratamento automatico foi encontrado.
                    </Typography>
                  )}
                </Stack>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.2 }}>
                <Button onClick={handleClose} variant="outlined" sx={modalSecondaryButtonSx}>
                  Fechar
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="contained"
                  sx={modalPrimaryButtonSx}
                  disabled={!selectedIds.length || loading}
                >
                  Excluir selecionados
                </Button>
              </Box>
            </Stack>
          </BaseCard>
        </Box>
      </Modal>

      <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
    </>
  );
}