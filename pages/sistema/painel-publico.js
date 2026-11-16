import React, { useEffect, useState } from "react";
import { Banner } from "../../src/components/ui/banner";
import { Button } from "../../src/components/ui/button";
import { CabecalhoDePagina } from "../../src/components/ui/cabecalho-de-pagina";
import { CampoTexto } from "../../src/components/ui/campos";
import { Card, CardContent } from "../../src/components/ui/card";
import { api } from "../../src/services/api";
import { apontaParaPainelPublico } from "../../src/components/painelPublico/usePainelConfig";

const SUGESTOES = ["/painel-psf", "/painel-esus", "/transparency/medicines-panel", "/attendance/panel", "/showqueue"];
const URL_VALIDA = /^(\/(?!\/)|https?:\/\/)/i;

const msgErro = (e) => e?.response?.data?.message || "Não foi possível salvar.";

const erroUrl = (valor) => {
  if (!URL_VALIDA.test(valor || "")) return "Use um caminho do sistema (/pagina) ou um endereço https://.";
  if (apontaParaPainelPublico(valor)) return "Não pode apontar para o próprio painel público.";
  return null;
};

export default function PainelPublicoAdminPage() {
  const [form, setForm] = useState({ pagina_url: "", esquerda_url: "", direita_url: "", largura_esquerda: 60 });
  const [msg, setMsg] = useState(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    api.get("/public/painel-publico", { publica: true })
      .then((r) => setForm(r.data))
      .catch(() => setMsg({ tom: "perigo", texto: "Não foi possível carregar a configuração." }));
  }, []);

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const erros = { pagina_url: erroUrl(form.pagina_url), esquerda_url: erroUrl(form.esquerda_url), direita_url: erroUrl(form.direita_url) };
  const largura = Number(form.largura_esquerda);
  const larguraInvalida = !Number.isInteger(largura) || largura < 20 || largura > 80;
  const temErro = Object.values(erros).some(Boolean) || larguraInvalida;

  const salvar = async (e) => {
    e.preventDefault();
    setMsg(null);
    setSalvando(true);
    try {
      await api.put("/admin/painel-publico", { ...form, largura_esquerda: largura });
      setMsg({ tom: "sucesso", texto: "Painel público salvo." });
    } catch (err) {
      setMsg({ tom: "perigo", texto: msgErro(err) });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <CabecalhoDePagina
        titulo="Painel público"
        subtitulo="Defina o que a rota /painel-publico mostra, sem login. O padrão é o Painel PSF, com duas colunas."
        acoes={<a href="/painel-publico" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">Abrir /painel-publico</a>}
      />
      {msg && <div className="mb-4"><Banner tom={msg.tom} onDispensar={() => setMsg(null)}>{msg.texto}</Banner></div>}
      <datalist id="sugestoes-painel">{SUGESTOES.map((s) => <option key={s} value={s} />)}</datalist>
      <Card>
        <CardContent>
          <form onSubmit={salvar} className="grid gap-4">
            <CampoTexto id="pp-pagina" label="Página exibida em /painel-publico" list="sugestoes-painel" value={form.pagina_url} onChange={set("pagina_url")} erro={erros.pagina_url}
              dica="Use /painel-psf para as duas colunas, ou outra página do sistema ou site externo." maxLength={500} />
            <CampoTexto id="pp-esq" label="Coluna da esquerda (Painel PSF)" list="sugestoes-painel" value={form.esquerda_url} onChange={set("esquerda_url")} erro={erros.esquerda_url}
              dica="Ex.: /painel-esus?cnes=1234567 abre o painel de senhas já com a unidade." maxLength={500} />
            <CampoTexto id="pp-dir" label="Coluna da direita (Painel PSF)" list="sugestoes-painel" value={form.direita_url} onChange={set("direita_url")} erro={erros.direita_url} maxLength={500} />
            <CampoTexto id="pp-larg" label="Largura da coluna esquerda (%)" type="number" min={20} max={80} value={form.largura_esquerda} onChange={set("largura_esquerda")}
              erro={larguraInvalida ? "Informe um número inteiro de 20 a 80." : null}
              dica={`A direita ocupa o restante: ${larguraInvalida ? "—" : 100 - largura}%. No celular as colunas ficam uma embaixo da outra.`} />
            <Banner tom="info">Sites externos que proíbem ser exibidos dentro de outra página não abrem no painel. Teste o endereço antes de usar.</Banner>
            <div><Button type="submit" disabled={salvando || temErro}>{salvando ? "Salvando..." : "Salvar"}</Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
