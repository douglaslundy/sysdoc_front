import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import AlertModal from "../messagesModal";
import PosteDialog from "../modal/iluminacao/PosteDialog";
import { ultimos30Dias } from "../../lib/periodo";
import { addMessage, turnAlert } from "../../store/ducks/Layout";
import { getPostes } from "../../store/fetchActions/iluminacaoPostes";
import { ActionCreateFab } from "../actions";
import { Banner } from "../ui/banner";
import { CampoTexto, SelectNativo } from "../ui/campos";
import { PaginaDeLista } from "../ui/pagina-de-lista";
import { StatusPoste } from "./StatusPoste";

const PER_PAGE_OPTIONS = [15, 30, 50, 100];
const TITULOS = { cadastro: "Postes — Cadastro", servico: "Postes — Serviço" };

const formatarData = (iso) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "—");

const enderecoDo = (p) => `${p.logradouro}${p.numero ? `, ${p.numero}` : ""} · ${p.bairro}`;

/**
 * Lista de postes. modo "cadastro" (cadastrador, com botão Novo poste) ou "servico" (empresa).
 * Abre sempre em Pendentes + últimos 30 dias: o estado é local e some ao sair da página.
 */
export default function ListaPostes({ modo = "cadastro" }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const { postes, pagination } = useSelector((state) => state.iluminacaoPostes);

  const [padrao] = useState(ultimos30Dias);
  const [status, setStatus] = useState("pendentes");
  const [de, setDe] = useState(padrao.de);
  const [ate, setAte] = useState(padrao.ate);
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(15);
  const [dialogAberto, setDialogAberto] = useState(false);

  const periodoInvertido = Boolean(de && ate && de > ate);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaAplicada(busca.trim());
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [busca]);

  useEffect(() => {
    if (periodoInvertido) return;
    dispatch(getPostes({ status, de: de || undefined, ate: ate || undefined, busca: buscaAplicada || undefined, page: page + 1, per_page: perPage }));
  }, [status, de, ate, buscaAplicada, page, perPage]);

  const recarregar = () =>
    dispatch(getPostes({ status, de: de || undefined, ate: ate || undefined, busca: buscaAplicada || undefined, page: page + 1, per_page: perPage }));

  const aoCadastrar = (poste) => {
    setDialogAberto(false);
    dispatch(addMessage(`Poste ${poste?.protocolo || ""} cadastrado com sucesso!`.replace("  ", " ")));
    dispatch(turnAlert());
    recarregar();
  };

  const mudar = (setter) => ({ target: { value } }) => {
    setter(value);
    setPage(0);
  };

  const colunas = [
    { chave: "protocolo", titulo: "Protocolo", render: (p) => <span className="font-bold">{p.protocolo || "—"}</span> },
    { chave: "ponto", titulo: "Ponto de referência", render: (p) => p.ponto_referencia },
    { chave: "endereco", titulo: "Endereço", render: (p) => <span>{enderecoDo(p)}</span> },
    { chave: "data", titulo: "Cadastrado em", render: (p) => formatarData(p.created_at) },
    { chave: "por", titulo: "Cadastrado por", render: (p) => p.cadastrado_por?.name || "—" },
    { chave: "status", titulo: "Status", render: (p) => <StatusPoste status={p.status} /> },
  ];

  const barra = (
    <div className="flex w-full flex-wrap items-end gap-3">
      <div className="w-full sm:w-44">
        <SelectNativo aria-label="Status" value={status} onChange={mudar(setStatus)}>
          <option value="pendentes">Pendentes</option>
          <option value="concluidos">Concluídos</option>
          <option value="todos">Todos</option>
        </SelectNativo>
      </div>
      <div className="w-[calc(50%-6px)] sm:w-40">
        <CampoTexto id="poste-de" type="date" label="De" value={de} onChange={mudar(setDe)} />
      </div>
      <div className="w-[calc(50%-6px)] sm:w-40">
        <CampoTexto id="poste-ate" type="date" label="Até" value={ate} onChange={mudar(setAte)} />
      </div>
      {modo === "cadastro" ? <ActionCreateFab title="Novo poste" className="min-h-11" onClick={() => setDialogAberto(true)} /> : null}
      {periodoInvertido ? (
        <div className="w-full"><Banner tom="perigo">A data inicial não pode ser maior que a final.</Banner></div>
      ) : null}
    </div>
  );

  return (
    <PaginaDeLista
      titulo={TITULOS[modo]}
      subtitulo={pagination ? `${pagination.total} ${pagination.total === 1 ? "poste" : "postes"}` : undefined}
      busca={{ rotulo: "Pesquisar postes", placeholder: "Protocolo, referência, rua ou bairro", value: busca, onChange: ({ target: { value } }) => setBusca(value) }}
      barra={barra}
      colunas={colunas}
      linhas={postes}
      chaveDaLinha={(p) => p.id}
      vazio="Nenhum poste encontrado."
      aoAbrir={(p) => router.push(`/iluminacao/${modo}/${p.id}`)}
      paginacao={{ total: pagination?.total || 0, pagina: page, porPagina: perPage, opcoes: PER_PAGE_OPTIONS, aoMudarPagina: setPage, aoMudarPorPagina: (n) => { setPerPage(n); setPage(0); } }}
    >
      <AlertModal />
      {modo === "cadastro" ? <PosteDialog open={dialogAberto} onClose={() => setDialogAberto(false)} onSuccess={aoCadastrar} /> : null}
    </PaginaDeLista>
  );
}
