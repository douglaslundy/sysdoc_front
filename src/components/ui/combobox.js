import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useUid } from '../../lib/useUid';
import { CLASSE_CAMPO } from './campos';

/**
 * Campo com busca (autocomplete). `opcoes` já filtradas por quem usa (ou pelo servidor, via `aoDigitar`).
 * Teclado: setas, Enter escolhe, Esc fecha. A lista abre abaixo do campo e nunca passa da largura dele.
 */
export function Combobox({
  id,
  rotulo,
  opcoes = [],
  selecionado = null,
  aoSelecionar,
  aoDigitar,
  rotuloDaOpcao = (o) => String(o?.name ?? ''),
  chaveDaOpcao = (o) => o?.id,
  carregando = false,
  vazio = 'Nenhum resultado.',
  placeholder,
  disabled = false,
  className,
}) {
  const idLista = `${useUid('lista')}`;
  const raiz = useRef(null);
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState('');
  const [ativa, setAtiva] = useState(-1);

  // Mostra o texto da opção escolhida enquanto o usuário não estiver digitando.
  useEffect(() => {
    if (!aberto) setTexto(selecionado ? rotuloDaOpcao(selecionado) : '');
  }, [selecionado, aberto]);

  useEffect(() => {
    if (!aberto) return undefined;
    const fora = (e) => {
      if (raiz.current && !raiz.current.contains(e.target)) setAberto(false);
    };
    document.addEventListener('mousedown', fora);
    return () => document.removeEventListener('mousedown', fora);
  }, [aberto]);

  const escolher = (opcao) => {
    aoSelecionar?.(opcao);
    setAberto(false);
  };

  const aoTeclar = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAberto(true);
      setAtiva((i) => Math.min(opcoes.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAtiva((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && aberto && opcoes[ativa]) {
      e.preventDefault();
      escolher(opcoes[ativa]);
    } else if (e.key === 'Escape' && aberto) {
      e.stopPropagation();
      setAberto(false);
    }
  };

  return (
    <div ref={raiz} className={cn('relative', className)}>
      <input
        id={id}
        role="combobox"
        aria-label={rotulo}
        aria-expanded={aberto}
        aria-controls={idLista}
        aria-autocomplete="list"
        aria-activedescendant={aberto && ativa >= 0 ? `${idLista}-${ativa}` : undefined}
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder}
        value={texto}
        className={cn(CLASSE_CAMPO, 'h-[37px] py-0 pr-9')}
        onFocus={() => setAberto(true)}
        onKeyDown={aoTeclar}
        onChange={(e) => {
          setTexto(e.target.value);
          setAberto(true);
          setAtiva(0);
          aoDigitar?.(e.target.value);
        }}
      />
      {carregando ? (
        <Loader2 aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : (
        <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
      )}
      {aberto ? (
        <ul id={idLista} role="listbox" className="absolute inset-x-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-lg border border-border bg-popover py-1 text-sm text-popover-foreground shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
          {opcoes.length === 0 ? (
            <li className="px-3 py-2 text-muted-foreground">{vazio}</li>
          ) : (
            opcoes.map((opcao, i) => (
              <li
                key={chaveDaOpcao(opcao)}
                id={`${idLista}-${i}`}
                role="option"
                aria-selected={i === ativa}
                onMouseEnter={() => setAtiva(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  escolher(opcao);
                }}
                className={cn('cursor-pointer px-3 py-2', i === ativa && 'bg-hover')}
              >
                {rotuloDaOpcao(opcao)}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
