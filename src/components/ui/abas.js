import { cn } from '../../lib/cn';

/**
 * Abas horizontais (rolam no celular). itens: [{ chave, rotulo }]; `valor` é a chave ativa.
 * O conteúdo da aba fica por conta da tela (role="tabpanel").
 */
export function Abas({ itens, valor, aoMudar, rotulo = 'Seções' }) {
  return (
    <div role="tablist" aria-label={rotulo} className="flex gap-1 overflow-x-auto border-b border-border">
      {itens.map((item) => {
        const ativa = item.chave === valor;
        return (
          <button
            key={item.chave}
            type="button"
            role="tab"
            aria-selected={ativa}
            onClick={() => aoMudar(item.chave)}
            className={cn(
              '-mb-px shrink-0 border-b-2 px-4 py-3 text-[15px] whitespace-nowrap outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-primary/25',
              ativa ? 'border-primary font-semibold text-primary-text' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {item.rotulo}
          </button>
        );
      })}
    </div>
  );
}
