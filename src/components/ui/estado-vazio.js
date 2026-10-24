export function EstadoVazio({ titulo, children }) {
  return (
    <div role="status" className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
      <p className="font-display text-base font-semibold">{titulo}</p>
      {children ? <p className="mt-1 text-sm text-muted-foreground">{children}</p> : null}
    </div>
  );
}
