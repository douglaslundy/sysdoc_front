import { cn } from '../../lib/cn';

export function Card({ className, size = 'default', ...props }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        'group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl border border-border bg-card py-(--card-spacing) text-sm text-card-foreground [--card-spacing:--spacing(6)] has-data-[slot=card-footer]:pb-0 data-[size=sm]:[--card-spacing:--spacing(4)]',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return <div data-slot="card-header" className={cn('grid auto-rows-min items-start gap-1 px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-(--card-spacing)', className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <div data-slot="card-title" className={cn('font-display text-lg leading-tight font-extrabold group-data-[size=sm]/card:text-base', className)} {...props} />;
}

export function CardDescription({ className, ...props }) {
  return <div data-slot="card-description" className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

export function CardAction({ className, ...props }) {
  return <div data-slot="card-action" className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div data-slot="card-content" className={cn('px-(--card-spacing)', className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return <div data-slot="card-footer" className={cn('flex items-center rounded-b-xl border-t border-border bg-hover/50 p-(--card-spacing)', className)} {...props} />;
}
