import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { Banner } from "../ui/banner";
import { Button } from "../ui/button";
import { CampoSelecao, CampoTexto } from "../ui/campos";
import { Carregando } from "../ui/carregando";
import { Dialogo, DialogoCabecalho, DialogoRodape } from "../ui/dialogo";

const TIPO = "solicitacao_cadastro";
const RE_ID = /Pedido de cadastro #(\d+)/;

// O /kanban não devolve o tipo do protocolo nem o id do pedido; o card traz "Pedido de cadastro #id" na descrição.
export const idDaSolicitacao = (item) => {
  if (!item?.protocol_id) return null;
  const m = RE_ID.exec(item.descricao || "");
  return m && (item.protocol?.tipo === TIPO || item.protocol?.tipo === undefined) ? Number(m[1]) : null;
};

const mensagemDoErro = (e, padrao) => {
  const d = e?.response?.data;
  const campos = d?.errors ? Object.values(d.errors).flat() : [];
  return campos.length ? campos.join(" ") : d?.message || d?.error || padrao;
};

const slugDe = (nome) =>
  nome.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const Dado = ({ rotulo, children }) => (
  <div className="min-w-0">
    <span className="block text-xs text-muted-foreground">{rotulo}</span>
    <p className="text-sm [overflow-wrap:anywhere]">{children || "—"}</p>
  </div>
);

export default function AutorizacaoDialog({ item, aberto, aoFechar, aoDecidir }) {
  const id = idDaSolicitacao(item);
  const [pedido, setPedido] = useState(null);
  const [perfis, setPerfis] = useState([]);
  const [secretarias, setSecretarias] = useState([]);
  const [paginas, setPaginas] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [perfil, setPerfil] = useState("");
  const [selecionadas, setSelecionadas] = useState([]);
  const [modo, setModo] = useState("decidir"); // decidir | perfil | recusar
  const [novo, setNovo] = useState({ nome: "", page_ids: [] });
  const [motivo, setMotivo] = useState("");
  const [erroMotivo, setErroMotivo] = useState("");

  useEffect(() => {
    if (!aberto || !id) return undefined;
    let vivo = true;
    setCarregando(true);
    setErro("");
    setModo("decidir");
    setPerfil("");
    setMotivo("");
    setErroMotivo("");
    Promise.all([
      api.get(`/cadastro-solicitacoes/${id}`),
      api.get("/access-profiles"),
      api.get("/auth/secretarias"),
      api.get("/auth/my-permissions"),
    ])
      .then(([p, pf, sec, perm]) => {
        if (!vivo) return;
        setPedido(p.data);
        setPerfis((Array.isArray(pf.data) ? pf.data : []).filter((x) => x.slug !== "admin" && x.ativo !== false));
        const lista = sec.data?.secretarias || [];
        setSecretarias(lista);
        setSelecionadas(lista.some((s) => s.id === p.data.secretaria?.id) ? [p.data.secretaria.id] : []);
        setPaginas(perm.data?.pages || []);
      })
      .catch((e) => vivo && setErro(mensagemDoErro(e, "Não foi possível carregar o pedido.")))
      .finally(() => vivo && setCarregando(false));
    return () => {
      vivo = false;
    };
  }, [aberto, id]);

  const alternar = (lista, setLista, valor) =>
    setLista(lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor]);

  const enviar = async (url, corpo, falha) => {
    setEnviando(true);
    setErro("");
    try {
      await api.post(url, corpo);
      await aoDecidir?.();
      aoFechar();
    } catch (e) {
      setErro(mensagemDoErro(e, falha));
    } finally {
      setEnviando(false);
    }
  };

  const autorizar = () => {
    if (!perfil) return setErro("Escolha o perfil de acesso.");
    if (!selecionadas.length) return setErro("Escolha ao menos uma secretaria.");
    return enviar(`/cadastro-solicitacoes/${id}/autorizar`, { perfil_slug: perfil, secretaria_ids: selecionadas }, "Não foi possível autorizar o cadastro.");
  };

  const recusar = () => {
    const texto = motivo.trim();
    if (texto.length < 5 || texto.length > 500) return setErroMotivo("Informe o motivo da recusa (de 5 a 500 caracteres).");
    setErroMotivo("");
    return enviar(`/cadastro-solicitacoes/${id}/recusar`, { motivo: texto }, "Não foi possível recusar o cadastro.");
  };

  const salvarPerfil = async () => {
    const nome = novo.nome.trim();
    if (!nome || !slugDe(nome)) return setErro("Informe o nome do perfil.");
    setEnviando(true);
    setErro("");
    try {
      const { data } = await api.post("/access-profiles", { nome, slug: slugDe(nome), page_ids: novo.page_ids });
      setPerfis((atual) => [...atual, data]);
      setPerfil(data.slug);
      setNovo({ nome: "", page_ids: [] });
      setModo("decidir");
    } catch (e) {
      setErro(mensagemDoErro(e, "Não foi possível criar o perfil."));
    } finally {
      setEnviando(false);
    }
  };

  const decidido = pedido && pedido.status !== "pendente";

  return (
    <Dialogo aberto={aberto} aoFechar={aoFechar} tamanho="lg">
      <DialogoCabecalho>Pedido de cadastro</DialogoCabecalho>
      {carregando ? <Carregando>Carregando pedido...</Carregando> : null}
      {erro ? <div className="mb-3"><Banner tom="perigo">{erro}</Banner></div> : null}

      {pedido ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Dado rotulo="Nome">{pedido.nome}</Dado>
            <Dado rotulo="CPF">{pedido.cpf}</Dado>
            <Dado rotulo="E-mail">{pedido.email}</Dado>
            <Dado rotulo="Telefone">{pedido.phone}</Dado>
            <Dado rotulo="Cargo">{pedido.cargo}</Dado>
            <Dado rotulo="Secretaria pedida">{pedido.secretaria?.nome}</Dado>
            <div className="sm:col-span-2"><Dado rotulo="Observação">{pedido.observacao}</Dado></div>
          </div>

          {decidido ? (
            <Banner tom={pedido.status === "aprovada" ? "sucesso" : "alerta"}>
              <p>
                {pedido.status === "aprovada" ? "Pedido aprovado" : "Pedido recusado"}
                {pedido.decidido_por ? ` por ${pedido.decidido_por.name}` : ""}.
              </p>
              {pedido.motivo_recusa ? <p className="font-normal">Motivo: {pedido.motivo_recusa}</p> : null}
            </Banner>
          ) : null}

          {!decidido && modo === "decidir" ? (
            <div className="space-y-3">
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <CampoSelecao id="ac-perfil" label="Perfil" value={perfil} onChange={(e) => setPerfil(e.target.value)} disabled={enviando}>
                    <option value="">Selecione o perfil</option>
                    {perfis.map((p) => <option key={p.slug} value={p.slug}>{p.nome}</option>)}
                  </CampoSelecao>
                </div>
                <Button variant="outline" onClick={() => setModo("perfil")} disabled={enviando}>Criar perfil</Button>
              </div>
              <fieldset className="space-y-1">
                <legend className="text-[13px] text-muted-foreground">Secretarias</legend>
                {secretarias.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={selecionadas.includes(s.id)} disabled={enviando} onChange={() => alternar(selecionadas, setSelecionadas, s.id)} />
                    {s.nome}
                  </label>
                ))}
              </fieldset>
            </div>
          ) : null}

          {!decidido && modo === "perfil" ? (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <CampoTexto id="ac-novo-nome" label="Nome do perfil" value={novo.nome} maxLength={60} disabled={enviando} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} />
              <fieldset className="space-y-1">
                <legend className="text-[13px] text-muted-foreground">Páginas permitidas</legend>
                {paginas.map((pg) => (
                  <label key={pg.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={novo.page_ids.includes(pg.id)} disabled={enviando} onChange={() => alternar(novo.page_ids, (ids) => setNovo({ ...novo, page_ids: ids }), pg.id)} />
                    {pg.titulo}
                  </label>
                ))}
              </fieldset>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setModo("decidir")} disabled={enviando}>Voltar</Button>
                <Button onClick={salvarPerfil} disabled={enviando}>Salvar perfil</Button>
              </div>
            </div>
          ) : null}

          {!decidido && modo === "recusar" ? (
            <CampoTexto id="ac-motivo" label="Motivo da recusa" multiline rows={3} value={motivo} maxLength={500} erro={erroMotivo} disabled={enviando} onChange={(e) => setMotivo(e.target.value)} />
          ) : null}
        </div>
      ) : null}

      <DialogoRodape>
        <Button variant="ghost" onClick={aoFechar} disabled={enviando}>Fechar</Button>
        {pedido && !decidido && modo === "decidir" ? (
          <>
            <Button variant="outline" onClick={() => setModo("recusar")} disabled={enviando}>Recusar</Button>
            <Button onClick={autorizar} disabled={enviando}>Autorizar</Button>
          </>
        ) : null}
        {pedido && !decidido && modo === "recusar" ? (
          <>
            <Button variant="ghost" onClick={() => setModo("decidir")} disabled={enviando}>Voltar</Button>
            <Button onClick={recusar} disabled={enviando}>Confirmar recusa</Button>
          </>
        ) : null}
      </DialogoRodape>
    </Dialogo>
  );
}
