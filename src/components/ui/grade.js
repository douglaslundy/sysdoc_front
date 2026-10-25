import { cn } from '../../lib/cn';

// Classes escritas por extenso para o Tailwind enxergá-las.
const SPAN = {
  base: ['col-span-1', 'col-span-2', 'col-span-3', 'col-span-4', 'col-span-5', 'col-span-6', 'col-span-7', 'col-span-8', 'col-span-9', 'col-span-10', 'col-span-11', 'col-span-12'],
  sm: ['sm:col-span-1', 'sm:col-span-2', 'sm:col-span-3', 'sm:col-span-4', 'sm:col-span-5', 'sm:col-span-6', 'sm:col-span-7', 'sm:col-span-8', 'sm:col-span-9', 'sm:col-span-10', 'sm:col-span-11', 'sm:col-span-12'],
  md: ['md:col-span-1', 'md:col-span-2', 'md:col-span-3', 'md:col-span-4', 'md:col-span-5', 'md:col-span-6', 'md:col-span-7', 'md:col-span-8', 'md:col-span-9', 'md:col-span-10', 'md:col-span-11', 'md:col-span-12'],
  lg: ['lg:col-span-1', 'lg:col-span-2', 'lg:col-span-3', 'lg:col-span-4', 'lg:col-span-5', 'lg:col-span-6', 'lg:col-span-7', 'lg:col-span-8', 'lg:col-span-9', 'lg:col-span-10', 'lg:col-span-11', 'lg:col-span-12'],
  xl: ['xl:col-span-1', 'xl:col-span-2', 'xl:col-span-3', 'xl:col-span-4', 'xl:col-span-5', 'xl:col-span-6', 'xl:col-span-7', 'xl:col-span-8', 'xl:col-span-9', 'xl:col-span-10', 'xl:col-span-11', 'xl:col-span-12'],
};

const GAP = { 0: 'gap-0', 1: 'gap-2', 1.5: 'gap-3', 2: 'gap-4', 2.5: 'gap-5', 3: 'gap-6', 4: 'gap-8' };

const span = (ponto, n) => (n >= 1 && n <= 12 ? SPAN[ponto][n - 1] : null);

/**
 * Grade de 12 colunas (mesma ideia do Grid antigo): `container` abre a grade, `item` ocupa
 * `xs|sm|md|lg|xl` colunas a partir de cada largura (xs = celular). `mb`/`mt` em múltiplos de 8px.
 */
export function Grade({ container = false, item = false, spacing = 2, xs, sm, md, lg, xl, mb, mt, className, style, children }) {
  const margem = { ...(mb ? { marginBottom: mb * 8 } : null), ...(mt ? { marginTop: mt * 8 } : null), ...style };
  if (container) {
    return <div style={margem} className={cn('grid grid-cols-12', GAP[spacing] || 'gap-4', className)}>{children}</div>;
  }
  return (
    <div
      style={margem}
      className={cn(
        item && (xs ? span('base', xs) : 'col-span-12'),
        item && span('sm', sm),
        item && span('md', md),
        item && span('lg', lg),
        item && span('xl', xl),
        'min-w-0',
        className,
      )}
    >
      {children}
    </div>
  );
}
