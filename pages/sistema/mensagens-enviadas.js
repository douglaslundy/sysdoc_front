import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "../../src/components/ui/button";
import { CabecalhoDePagina } from "../../src/components/ui/cabecalho-de-pagina";
import { CampoDeBusca } from "../../src/components/ui/campo-de-busca";
import { CampoTexto } from "../../src/components/ui/campos";
import { DataTable } from "../../src/components/ui/data-table";
import { Pilula } from "../../src/components/ui/pilula";
import { getMessageLogs } from "../../src/store/fetchActions/messageLogs";

const CANAIS = [
  { value: "", label: "Todos" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "E-mail" },
];

const formatDate = (value) => (value ? new Date(value).toLocaleString("pt-BR") : "—");

export default function MensagensEnviadasPage() {
  const dispatch = useDispatch();
  const { items, page, lastPage, loading } = useSelector((state) => state.messageLogs);
  const [canal, setCanal] = useState("");
  const [busca, setBusca] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");

  const load = (nextPage = 1) => {
    const params = { page: nextPage };
    if (canal) params.canal = canal;
    if (busca.trim()) params.busca = busca.trim();
    if (de) params.de = de;
    if (ate) params.ate = ate;
    dispatch(getMessageLogs(params));
  };

  useEffect(() => {
    const timer = setTimeout(() => load(1), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canal, busca, de, ate]);

  const colunas = [
    { chave: "data", titulo: "Data", render: (item) => <span className="text-sm whitespace-nowrap">{formatDate(item.created_at)}</span> },
    { chave: "canal", titulo: "Canal", render: (item) => <Pilula tom={item.canal === "whatsapp" ? "sucesso" : "info"} contorno>{item.canal === "whatsapp" ? "WhatsApp" : "E-mail"}</Pilula> },
    {
      chave: "destino",
      titulo: "Destinatário",
      render: (item) => (
        <>
          {item.user?.name ? <span className="block text-sm">{item.user.name}</span> : null}
          <span className="block text-xs text-muted-foreground">{item.destino}</span>
        </>
      ),
    },
    {
      chave: "mensagem",
      titulo: "Mensagem",
      render: (item) => (
        <span className="block max-w-[360px] text-sm whitespace-normal" title={item.mensagem}>
          {item.assunto ? <strong className="block">{item.assunto}</strong> : null}
          {item.mensagem.length > 120 ? `${item.mensagem.slice(0, 120)}…` : item.mensagem}
        </span>
      ),
    },
    { chave: "origem", titulo: "Origem", render: (item) => item.origem || "—" },
    { chave: "status", titulo: "Status", render: (item) => <span title={item.erro || ""}><Pilula tom={item.status === "enviado" ? "sucesso" : "perigo"}>{item.status === "enviado" ? "Enviado" : "Erro"}</Pilula></span> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <CabecalhoDePagina
        titulo="Mensagens enviadas"
        subtitulo="Histórico de mensagens enviadas pelo sistema por WhatsApp e e-mail"
      />

      <div className="flex flex-wrap items-end gap-3">
        <div role="group" aria-label="Canal" className="flex gap-1">
          {CANAIS.map((c) => (
            <Button key={c.value || "todos"} variant={canal === c.value ? "default" : "outline"} aria-pressed={canal === c.value} onClick={() => setCanal(c.value)}>
              {c.label}
            </Button>
          ))}
        </div>
        <CampoDeBusca rotulo="Buscar" placeholder="Buscar" value={busca} onChange={(e) => setBusca(e.target.value)} className="min-w-[220px] flex-[1_1_240px]" />
        <div className="w-[170px]">
          <CampoTexto id="msg-de" type="date" label="De" value={de} onChange={(e) => setDe(e.target.value)} />
        </div>
        <div className="w-[170px]">
          <CampoTexto id="msg-ate" type="date" label="Até" value={ate} onChange={(e) => setAte(e.target.value)} />
        </div>
      </div>

      <DataTable
        rotulo="mensagens enviadas"
        colunas={colunas}
        linhas={items}
        chaveDaLinha={(item) => item.id}
        carregando={loading}
        vazio="Nenhuma mensagem encontrada."
      />

      {lastPage > 1 ? (
        <nav aria-label="Paginação" className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => load(page - 1)}>Anterior</Button>
          <span className="text-sm text-muted-foreground">Página {page} de {lastPage}</span>
          <Button variant="outline" size="sm" disabled={page >= lastPage} onClick={() => load(page + 1)}>Próxima</Button>
        </nav>
      ) : null}
    </div>
  );
}
