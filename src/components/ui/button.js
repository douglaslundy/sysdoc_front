import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';

export const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-primary/25 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary font-display font-bold tracking-[0.03em] text-primary-foreground hover:bg-primary-hover',
        outline: 'border-border text-muted-foreground hover:bg-hover hover:text-foreground aria-expanded:bg-hover aria-expanded:text-foreground',
        secondary: 'border-primary/60 bg-primary/12 text-primary-text hover:bg-primary/20 aria-expanded:bg-primary/20',
        ghost: 'text-muted-foreground hover:bg-hover hover:text-foreground aria-expanded:bg-hover aria-expanded:text-foreground',
        destructive: 'border-danger/30 bg-danger/10 text-danger hover:bg-danger-strong hover:text-white',
        success: 'border-success/30 bg-success/10 text-success hover:bg-success-strong hover:text-white',
        link: 'text-primary-text underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-[37px] gap-2 px-5',
        xs: 'h-6 gap-1 rounded-md px-2 text-xs',
        sm: 'h-8 gap-1.5 rounded-md px-4 text-[13px]',
        lg: 'h-11 gap-2 px-7 text-base',
        icon: 'size-9',
        'icon-xs': 'size-6 rounded-md',
        'icon-sm': 'size-8 rounded-md',
        'icon-lg': 'size-11',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

/** Botão do layout CRM. variant: default|outline|secondary|ghost|destructive|success|link. */
export function Button({ className, variant = 'default', size = 'default', ...props }) {
  return <ButtonPrimitive data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
