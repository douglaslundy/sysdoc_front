import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api } from '../../services/api';
import { IconeDinamico } from '../ui/icone-dinamico';
import { Esqueleto } from '../ui/esqueleto';

/** Aba "Início": botões de atalho para páginas do sistema (configurados pelo admin). */
export default function AtalhosDashboard() {
  const router = useRouter();
  const [atalhos, setAtalhos] = useState(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    api.get('/dashboard/atalhos').then((r) => setAtalhos(r.data)).catch(() => setErro(true));
  }, []);

  const abrir = (url) => {
    if (/^https?:\/\//i.test(url)) window.open(url, '_blank', 'noopener,noreferrer');
    else router.push(url);
  };

  if (erro) return <p className="text-sm text-danger">Não foi possível carregar os atalhos.</p>;
  if (!atalhos) return <Esqueleto className="h-32 w-full" />;
  if (atalhos.length === 0) return <p className="text-sm text-muted-foreground">Nenhum atalho disponível.</p>;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {atalhos.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={() => abrir(a.url)}
          className="flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-5 text-center transition-colors hover:bg-hover focus-visible:ring-[3px] focus-visible:ring-primary/25 focus-visible:outline-none"
        >
          <IconeDinamico nome={a.icone} className="size-9 text-primary" />
          <span className="text-sm font-semibold">{a.titulo}</span>
        </button>
      ))}
    </div>
  );
}
