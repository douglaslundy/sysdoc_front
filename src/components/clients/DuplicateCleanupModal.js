import React, { useEffect, useState } from "react";
import ConfirmDialog from "../confirmDialog";
import { api } from "../../services/api";
import { Banner } from "../ui/banner";
import { Button } from "../ui/button";
import { CaixaDeMarcacao } from "../ui/caixa-de-marcacao";
import { CampoSelecao } from "../ui/campos";
import { Dialogo, DialogoCabecalho, DialogoRodape } from "../ui/dialogo";
import { Pilula } from "../ui/pilula";

const TOM_DO_AVISO = { info: "info", warning: "alerta", error: "perigo", success: "sucesso" };

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

  // Carrega os candidatos sempre que o painel abre.
  useEffect(() => {
    if (!open) return;
    resetState();
    loadCandidates(duplicateType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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
      <Dialogo aberto={Boolean(open)} aoFechar={handleClose} tamanho="xl">
        <DialogoCabecalho>Limpeza de Clients Duplicados</DialogoCabecalho>
        <div className="space-y-4">
          {alertState.visible && (
            <Banner tom={TOM_DO_AVISO[alertState.type]} onDispensar={() => setAlertState({ visible: false, type: "info", message: "" })}>
              {alertState.message}
            </Banner>
          )}

          <div className="flex flex-wrap items-end gap-3">
            <div className="w-full sm:w-56">
              <CampoSelecao id="duplicados-filtro" label="Filtro" value={duplicateType} onChange={handleTypeChange}>
                <option value="all">CPF e CNS</option>
                <option value="cpf">Somente CPF</option>
                <option value="cns">Somente CNS valido</option>
              </CampoSelecao>
            </div>
            <Pilula tom="info" contorno>{`${summary.groups || 0} grupos`}</Pilula>
            <Pilula tom="alerta" contorno>{`${summary.deletable_candidates || 0} candidatos seguros`}</Pilula>
            <Pilula tom="sucesso" contorno>{`${selectedIds.length} selecionados`}</Pilula>
          </div>

          <div className="max-h-[55dvh] space-y-3 overflow-y-auto pr-1">
            {groups.length ? groups.map((group) => (
              <div key={`${group.identifier_type}-${group.identifier_value}`} className="rounded-lg border border-border bg-surface p-3">
                <p className="font-display text-base font-bold">
                  {group.identifier_type.toUpperCase()}: {group.identifier_value}
                </p>
                <p className="mb-3 text-xs text-muted-foreground">
                  Registro principal: #{group.keeper?.id} - {group.keeper?.name}
                </p>

                <div className="space-y-2">
                  {group.deletable_candidates.map((candidate) => (
                    <div key={candidate.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card p-3">
                      <CaixaDeMarcacao id={`dup-${candidate.id}`} marcado={selectedIds.includes(candidate.id)} aoMudar={() => toggleSelectedId(candidate.id)}>
                        <span>
                          <span className="block font-semibold">#{candidate.id} - {candidate.name}</span>
                          <span className="block text-xs text-muted-foreground">CPF: {candidate.cpf || "-"} | CNS: {candidate.cns || "-"}</span>
                        </span>
                      </CaixaDeMarcacao>
                      <Pilula tom={candidate.active ? "sucesso" : "neutro"}>{candidate.active ? "Ativo" : "Inativo"}</Pilula>
                    </div>
                  ))}
                </div>

                {!!group.blocked_records?.length && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs text-muted-foreground">Registros preservados por vinculo operacional</p>
                    <div className="space-y-2">
                      {group.blocked_records.map((record) => {
                        const reasons = Object.entries(record.references || {})
                          .filter(([, count]) => Number(count) > 0)
                          .map(([key, count]) => `${key}: ${count}`)
                          .join(" | ");

                        return (
                          <div key={record.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card p-3">
                            <div>
                              <p className="font-semibold">#{record.id} - {record.name}</p>
                              <p className="text-xs text-muted-foreground">{reasons || "Possui vinculos operacionais"}</p>
                            </div>
                            <Pilula tom="info">Preservado</Pilula>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">Nenhum grupo duplicado seguro para tratamento automatico foi encontrado.</p>
            )}
          </div>

          <DialogoRodape>
            <Button variant="outline" onClick={handleClose}>Fechar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={!selectedIds.length || loading}>Excluir selecionados</Button>
          </DialogoRodape>
        </div>
      </Dialogo>

      <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
    </>
  );
}
