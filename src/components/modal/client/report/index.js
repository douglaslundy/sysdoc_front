import React, { useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import FeatherIcon from "feather-icons-react";
import { useDispatch, useSelector } from "react-redux";

import { detailed_client_report } from "../../../../store/fetchActions/clients";
import { clearClientReport } from "../../../../store/ducks/clients";
import ClientReportContent, { deriveReportData, hasClientData } from "../_shared/ClientReportContent";

// detailed_client_report (store/fetchActions/clients) é uma thunk
// "fire-and-forget": ela não devolve a Promise da chamada HTTP — apenas
// dispatcha addClientReport/clearClientReport internamente quando a
// requisição termina. Por isso não há como "aguardar" o dispatch para saber
// quando o carregamento acabou (a própria página /client_report tem essa
// mesma limitação, no HandleSearchClient). Aqui lemos o resultado de volta
// via Redux (state.clients.clientReport), igual à página, e liberamos o
// spinner logo após disparar a requisição — assim que os dados chegam via
// Redux, o conteúdo entra reativamente no lugar da mensagem de "não
// encontrado".
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
    dispatch(detailed_client_report(client.id));

    Promise.resolve().then(() => {
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
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth className="client-report-modal">
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Relatório de {client?.name || `Cliente #${client?.id ?? ""}`}
        </Typography>
        <IconButton onClick={onClose} aria-label="Fechar">
          <FeatherIcon icon="x" width={20} height={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 4 }}>
            <CircularProgress size={24} />
            <Typography variant="body2" color="textSecondary">
              Carregando relatório do cliente...
            </Typography>
          </Box>
        ) : hasData ? (
          <ClientReportContent reportData={reportData} />
        ) : (
          <Typography sx={{ py: 2 }} color="textSecondary">
            Nenhum cliente encontrado para este registro.
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
