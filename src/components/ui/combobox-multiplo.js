import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useUid } from '../../lib/useUid';
import { CLASSE_CAMPO } from './campos';

/**
 * Campo de busca com várias escolhas (CNAEs, etiquetas). `opcoes` vêm de quem usa (já filtradas);
 * `selecionadas` é a lista atual; as escolhidas aparecem como etiquetas removíveis.
 */
export function ComboboxMultiplo({
  id,
  rotulo,
  opcoes = [],
  selecionadas = [],
  aoMudar,
  aoDigitar,
  textoDigitado,
  rotuloDaOpcao = (o) => String(o?.name ?? ''),
  chaveDaOpcao = (o) => o?.id,
  vazio = 'Nenhum resultado.',
  className,
}) {
  const idLista = useUid('lista-multipla');
  const raiz = useRef(null);
  const [aberto, setAberto] = useState(false);
  const [interno, setInterno] = useState('');
  const texto = textoDigitado ?? interno;

  useEffect(() => {
    if (!aberto) return undefined;
    const fora = (e) => {
      if (raiz.current && !raiz.current.contains(e.target)) setAberto(false);
    };
    document.addEventListener('mousedown', fora);
    return () => document.removeEventListener('mousedown', fora);
  }, [aberto]);

  const chaves = selecionadas.map(chaveDaOpcao);
  const alternar = (opcao) => {
    const chave = chaveDaOpcao(opcao);
    aoMudar(chaves.includes(chave) ? selecionadas.filter((s) => chaveDaOpcao(s) !== chave) : [...selecionadas, opcao]);
  };

  return (
    <div ref={raiz} className={cn('relative', className)}>
      <div className={cn(CLASSE_CAMPO, 'flex min-h-[37px] flex-wrap items-center gap-1.5 py-1.5 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-primary/25')}>
        {selecionadas.map((s) => (
          <span key={chaveDaOpcao(s)} className="inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs">
            <span className="truncate">{rotuloDaOpcao(s)}</span>
            <button type="button" aria-label={`Remover ${rotuloDaOpcao(s)}`} onClick={() => alternar(s)} className="rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-primary/25">
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          role="combobox"
          aria-label={rotulo}
          aria-expanded={aberto}
          aria-controls={idLista}
          autoComplete="off"
          value={texto}
          className="min-w-[8ch] flex-1 bg-transparent outline-none"
          onFocus={() => setAberto(true)}
          onChange={(e) => {
            setInterno(e.target.value);
            setAberto(true);
            aoDigitar?.(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && aberto) {
              e.stopPropagation();
              setAberto(false);
            }
          }}
        />
      </div>
      {aberto ? (
        <ul id={idLista} role="listbox" aria-multiselectable="true" className="absolute inset-x-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-lg border border-border bg-popover py-1 text-sm text-popover-foreground shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
          {opcoes.length === 0 ? (
            <li className="px-3 py-2 text-muted-foreground">{vazio}</li>
          ) : (
            opcoes.map((opcao) => {
              const marcada = chaves.includes(chaveDaOpcao(opcao));
              return (
                <li
                  key={chaveDaOpcao(opcao)}
                  role="option"
                  aria-selected={marcada}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    alternar(opcao);
                  }}
                  className={cn('flex cursor-pointer items-center justify-between gap-2 px-3 py-2 hover:bg-hover', marcada && 'font-semibold text-primary-text')}
                >
                  {rotuloDaOpcao(opcao)}
                  {marcada ? <span aria-hidden>✓</span> : null}
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
