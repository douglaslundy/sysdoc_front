import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AlertModal from "../messagesModal";
import OsDialog from "../modal/ordem-servico/OsDialog";
import { listarOs } from "../../services/ordemServico";
import { ActionCreateFab } from "../actions";
import { Banner } from "../ui/banner";
import { SelectNativo } from "../ui/campos";
import { PaginaDeLista } from "../ui/pagina-de-lista";
import { STATUS_OS, StatusOs } from "./StatusOs";

const formatarData = (iso) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "—");

/** Lista de OS: cada perfil vê só o que lhe cabe (solicitante, técnico atribuído, gestor da secretaria, admin). */
export default function ListaOs() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [pagina, setPagina] = useState(1);
  const [dados, setDados] = useState({ data: [], total: 0 });
  const [erro, setErro] = useState("");
  const [dialogAberto, setDialogAberto] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaAplicada(busca.trim());
      setPagina(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [busca]);

  const carregar = () =>
    listarOs({ status: status || undefined, q: buscaAplicada || undefined, page: pagina })
      .then((r) => { setDados(r); setErro(""); })
      .catch(() => setErro("Não foi possível carregar as ordens de serviço."));

  useEffect(() => { carregar(); }, [status, buscaAplicada, pagina]);

  const colunas = [
    { chave: "numero", titulo: "Número", render: (o) => <span className="font-bold">{o.numero}</span> },
    { chave: "tipo", titulo: "Serviço", render: (o) => o.tipo?.nome || "—" },
    { chave: "local", titulo: "Local", render: (o) => o.local },
    { chave: "secretaria", titulo: "Secretaria", render: (o) => o.secretaria?.nome || "—" },
    { chave: "tecnico", titulo: "Técnico", render: (o) => o.tecnico?.name || "—" },
    { chave: "prazo", titulo: "Prazo", render: (o) => formatarData(o.prazo) },
    { chave: "status", titulo: "Status", render: (o) => <StatusOs status={o.status} /> },
  ];

  const barra = (
    <div className="flex w-full flex-wrap items-end gap-3">
      <div className="w-full sm:w-48">
        <SelectNativo aria-label="Status" value={status} onChange={({ target: { value } }) => { setStatus(value); setPagina(1); }}>
          <option value="">Todos os status</option>
          {Object.entries(STATUS_OS).map(([valor, { rotulo }]) => <option key={valor} value={valor}>{rotulo}</option>)}
        </SelectNativo>
      </div>
      <ActionCreateFab title="Nova OS" className="min-h-11" onClick={() => setDialogAberto(true)} />
      {erro ? <div className="w-full"><Banner tom="perigo">{erro}</Banner></div> : null}
    </div>
  );

  return (
    <PaginaDeLista
      titulo="Ordens de Serviço"
      subtitulo={`${dados.total || 0} ${dados.total === 1 ? "ordem" : "ordens"}`}
      busca={{ rotulo: "Pesquisar OS", placeholder: "Número ou local", value: busca, onChange: ({ target: { value } }) => setBusca(value) }}
      barra={barra}
      colunas={colunas}
      linhas={dados.data}
      chaveDaLinha={(o) => o.id}
      vazio="Nenhuma ordem de serviço encontrada."
      aoAbrir={(o) => router.push(`/ordem-servico/${o.id}`)}
      paginacao={{ total: dados.total || 0, pagina: pagina - 1, porPagina: 20, opcoes: [20], aoMudarPagina: (p) => setPagina(p + 1), aoMudarPorPagina: () => {} }}
    >
      <AlertModal />
      <OsDialog open={dialogAberto} onClose={() => setDialogAberto(false)} onSuccess={(os) => { setDialogAberto(false); router.push(`/ordem-servico/${os.id}`); }} />
    </PaginaDeLista>
  );
}
