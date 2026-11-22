import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Banner } from "../ui/banner";
import { SelectNativo } from "../ui/campos";
import { PaginaDeLista } from "../ui/pagina-de-lista";
import { listarManifestacoes } from "../../services/ouvidoria";
import { STATUS_OUVIDORIA, StatusOuvidoria } from "./StatusOuvidoria";

const TIPOS = {
  reclamacao: "Reclamação", sugestao: "Sugestão", elogio: "Elogio",
  denuncia: "Denúncia", solicitacao: "Solicitação", informacao: "Pedido de informação",
};

const formatarData = (iso) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "—");

/** Lista da ouvidoria: o back já devolve só o que a secretaria ativa pode ver (sem dados pessoais). */
export default function ListaOuvidoria() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [tipo, setTipo] = useState("");
  const [vencidas, setVencidas] = useState(false);
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [pagina, setPagina] = useState(1);
  const [dados, setDados] = useState({ data: [], total: 0 });
  const [erro, setErro] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => { setBuscaAplicada(busca.trim()); setPagina(1); }, 400);
    return () => clearTimeout(timer);
  }, [busca]);

  useEffect(() => {
    listarManifestacoes({ status: status || undefined, tipo: tipo || undefined, vencidas: vencidas ? 1 : undefined, busca: buscaAplicada || undefined, page: pagina })
      .then((r) => { setDados(r); setErro(""); })
      .catch(() => setErro("Não foi possível carregar as manifestações."));
  }, [status, tipo, vencidas, buscaAplicada, pagina]);

  const colunas = [
    { chave: "protocolo", titulo: "Protocolo", render: (m) => <span className="font-bold">{m.protocolo}</span> },
    { chave: "tipo", titulo: "Tipo", render: (m) => m.tipo_rotulo },
    { chave: "assunto", titulo: "Assunto", render: (m) => m.assunto },
    { chave: "secretaria", titulo: "Secretaria", render: (m) => m.secretaria || "—" },
    { chave: "responsavel", titulo: "Responsável", render: (m) => m.responsavel || "—" },
    { chave: "prazo", titulo: "Prazo", render: (m) => <span className={m.vencida ? "font-bold text-danger" : undefined}>{formatarData(m.prazo_em)}{m.vencida ? " (vencida)" : ""}</span> },
    { chave: "status", titulo: "Status", render: (m) => <StatusOuvidoria status={m.status} /> },
  ];

  const barra = (
    <div className="flex w-full flex-wrap items-end gap-3">
      <div className="w-full sm:w-48">
        <SelectNativo aria-label="Status" value={status} onChange={({ target: { value } }) => { setStatus(value); setPagina(1); }}>
          <option value="">Todos os status</option>
          {Object.entries(STATUS_OUVIDORIA).map(([valor, { rotulo }]) => <option key={valor} value={valor}>{rotulo}</option>)}
        </SelectNativo>
      </div>
      <div className="w-full sm:w-48">
        <SelectNativo aria-label="Tipo" value={tipo} onChange={({ target: { value } }) => { setTipo(value); setPagina(1); }}>
          <option value="">Todos os tipos</option>
          {Object.entries(TIPOS).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
        </SelectNativo>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={vencidas} onChange={(e) => { setVencidas(e.target.checked); setPagina(1); }} />
        Só vencidas
      </label>
      {erro ? <div className="w-full"><Banner tom="perigo">{erro}</Banner></div> : null}
    </div>
  );

  return (
    <PaginaDeLista
      titulo="Ouvidoria"
      subtitulo={`${dados.total || 0} ${dados.total === 1 ? "manifestação" : "manifestações"}`}
      busca={{ rotulo: "Pesquisar manifestações", placeholder: "Protocolo ou assunto", value: busca, onChange: ({ target: { value } }) => setBusca(value) }}
      barra={barra}
      colunas={colunas}
      linhas={dados.data}
      chaveDaLinha={(m) => m.id}
      vazio="Nenhuma manifestação encontrada."
      aoAbrir={(m) => router.push(`/sistema/ouvidoria/${m.id}`)}
      paginacao={{ total: dados.total || 0, pagina: pagina - 1, porPagina: 20, opcoes: [20], aoMudarPagina: (p) => setPagina(p + 1), aoMudarPorPagina: () => {} }}
    />
  );
}
