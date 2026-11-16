import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Plus, X } from 'lucide-react';
import { api } from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import { Banner } from '../ui/banner';
import { Button } from '../ui/button';
import { Combobox } from '../ui/combobox';
import { Dialogo, DialogoCabecalho, DialogoRodape } from '../ui/dialogo';
import { Esqueleto } from '../ui/esqueleto';
import { IconeDinamico } from '../ui/icone-dinamico';

const MAXIMO = 9;
const msgErro = (e) => e?.response?.data?.message || 'Não foi possível concluir a operação.';

/** Aba "Início": cada usuário monta seus próprios atalhos (até 9) entre as páginas que ele pode abrir. */
export default function AtalhosDashboard() {
  const router = useRouter();
  const { authorizedPages } = useContext(AuthContext);
  const [atalhos, setAtalhos] = useState(null);
  const [erro, setErro] = useState(null);
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [escolhida, setEscolhida] = useState(null);
  const [erroAdd, setErroAdd] = useState(null);
  const [arrastando, setArrastando] = useState(null);
  const [sobre, setSobre] = useState(null);

  const carregar = useCallback(() => {
    api.get('/dashboard/meus-atalhos').then((r) => setAtalhos(r.data)).catch((e) => setErro(msgErro(e)));
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  // Páginas do menu do usuário, menos as já escolhidas e as abas do próprio dashboard.
  const disponiveis = useMemo(() => {
    const usadas = new Set((atalhos || []).map((a) => a.url));
    return (Array.isArray(authorizedPages) ? authorizedPages : [])
      .filter((p) => p?.ativo && p.path && p.path !== '/dashboard' && !p.path.startsWith('/dashboard/') && !usadas.has(p.path))
      .sort((a, b) => String(a.titulo).localeCompare(String(b.titulo)));
  }, [authorizedPages, atalhos]);

  const termo = busca.trim().toLowerCase();
  const opcoes = disponiveis.filter((p) => !termo || `${p.titulo} ${p.path}`.toLowerCase().includes(termo)).slice(0, 50);

  const fechar = () => { setAberto(false); setBusca(''); setEscolhida(null); setErroAdd(null); };

  const adicionar = async () => {
    setErroAdd(null);
    try {
      await api.post('/dashboard/meus-atalhos', { titulo: escolhida.titulo, url: escolhida.path, icone: escolhida.icone || 'link' });
      fechar();
      carregar();
    } catch (e) {
      setErroAdd(msgErro(e));
    }
  };

  const remover = async (a) => {
    try {
      await api.delete(`/dashboard/meus-atalhos/${a.id}`);
      carregar();
    } catch (e) {
      setErro(msgErro(e));
    }
  };

  // Arrastar um atalho para outra posição: a lista muda na hora e a ordem é gravada no servidor.
  const soltar = async (destino) => {
    const origem = arrastando;
    setArrastando(null);
    setSobre(null);
    if (origem === null || origem === destino) return;
    const nova = [...atalhos];
    nova.splice(destino, 0, nova.splice(origem, 1)[0]);
    setAtalhos(nova);
    try {
      await api.put('/dashboard/meus-atalhos/ordem', { ids: nova.map((a) => a.id) });
    } catch (e) {
      setErro(msgErro(e));
      carregar();
    }
  };

  if (!atalhos) return erro ? <Banner tom="perigo">{erro}</Banner> : <Esqueleto className="h-32 w-full" />;

  const botaoMais = (
    <button
      type="button"
      onClick={() => setAberto(true)}
      className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card p-5 text-center text-muted-foreground transition-colors hover:bg-hover hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-primary/25 focus-visible:outline-none"
    >
      <Plus className="size-8" aria-hidden />
      <span className="text-sm font-medium">{atalhos.length === 0 ? 'Clique aqui e adicione as páginas que você mais acessa.' : 'Adicionar atalho'}</span>
    </button>
  );

  return (
    <div>
      {erro && <div className="mb-4"><Banner tom="perigo" onDispensar={() => setErro(null)}>{erro}</Banner></div>}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {atalhos.map((a, i) => (
          <div
            key={a.id}
            draggable
            onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(a.id)); setArrastando(i); }}
            onDragOver={(e) => { e.preventDefault(); if (sobre !== i) setSobre(i); }}
            onDrop={(e) => { e.preventDefault(); soltar(i); }}
            onDragEnd={() => { setArrastando(null); setSobre(null); }}
            className={`group relative cursor-grab active:cursor-grabbing ${arrastando === i ? 'opacity-40' : ''} ${arrastando !== null && sobre === i && arrastando !== i ? 'rounded-xl ring-2 ring-primary' : ''}`}
          >
            <button
              type="button"
              onClick={() => router.push(a.url)}
              className="flex min-h-[120px] w-full flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-5 text-center transition-colors hover:bg-hover focus-visible:ring-[3px] focus-visible:ring-primary/25 focus-visible:outline-none"
            >
              <IconeDinamico nome={a.icone} className="size-9 text-primary" />
              <span className="text-sm font-semibold">{a.titulo}</span>
            </button>
            <button
              type="button"
              aria-label={`Remover atalho ${a.titulo}`}
              onClick={() => remover(a)}
              className="absolute top-2 right-2 rounded-full p-1 text-muted-foreground hover:bg-border hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-primary/25 focus-visible:outline-none"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ))}
        {atalhos.length < MAXIMO && botaoMais}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{atalhos.length} de {MAXIMO} atalhos.{atalhos.length > 1 && ' Arraste um atalho para mudar a ordem.'}</p>

      <Dialogo aberto={aberto} aoFechar={fechar}>
        <DialogoCabecalho>Adicionar atalho</DialogoCabecalho>
        <div className="grid gap-3">
          {erroAdd && <Banner tom="perigo">{erroAdd}</Banner>}
          <Combobox
            id="atalho-pagina"
            opcoes={opcoes}
            selecionado={escolhida}
            aoSelecionar={setEscolhida}
            aoDigitar={setBusca}
            chaveDaOpcao={(p) => p.id}
            rotuloDaOpcao={(p) => `${p.titulo} — ${p.path}`}
            placeholder="Digite o nome da página"
            vazio="Nenhuma página encontrada."
          />
        </div>
        <DialogoRodape>
          <Button type="button" variant="outline" onClick={fechar}>Cancelar</Button>
          <Button type="button" disabled={!escolhida} onClick={adicionar}>Adicionar</Button>
        </DialogoRodape>
      </Dialogo>
    </div>
  );
}
