import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { detailed_client_report } from "../../../../store/fetchActions/clients";
import { clearClientReport } from "../../../../store/ducks/clients";
import { Carregando } from "../../../ui/carregando";
import { Dialogo, DialogoCabecalho } from "../../../ui/dialogo";
import ClientReportContent, { deriveReportData, hasClientData } from "../_shared/ClientReportContent";

// detailed_client_report (store/fetchActions/clients) agora devolve a
// Promise da chamada HTTP (resolve para o cliente ou null). Aguardamos essa
// Promise para saber exatamente quando o carregamento terminou, em vez de
// aproximar com um microtask. Os dados em si continuam lidos via Redux
// (state.clients.clientReport), igual à página /client_report.
export default function ClientReportModal({ client, onClose }) {
  const dispatch = useDispatch();
  const { clientReport } = useSelector((state) => state.clients);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!client?.id) {
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    dispatch(clearClientReport());
    dispatch(detailed_client_report(client.id)).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
      dispatch(clearClientReport());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client?.id]);

  const reportData = deriveReportData(clientReport);
  const hasData = hasClientData(reportData);

  return (
    <Dialogo aberto aoFechar={onClose} tamanho="xl">
      <DialogoCabecalho>Relatório de {client?.name || `Cliente #${client?.id ?? ""}`}</DialogoCabecalho>

      {loading ? (
        <Carregando>Carregando relatório do cliente...</Carregando>
      ) : hasData ? (
        <ClientReportContent reportData={reportData} />
      ) : (
        <p className="py-2 text-sm text-muted-foreground">Nenhum cliente encontrado para este registro.</p>
      )}
    </Dialogo>
  );
}
