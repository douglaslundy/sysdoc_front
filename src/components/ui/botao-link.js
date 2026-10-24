import Link from 'next/link';
import { cn } from '../../lib/cn';
import { buttonVariants } from './button';

/** Link com a aparência de um Button (navegação, não ação). */
export function BotaoLink({ href, variant = 'default', size = 'default', className, children, ...props }) {
  return (
    <Link href={href}>
      <a className={cn(buttonVariants({ variant, size }), className)} {...props}>
        {children}
      </a>
    </Link>
  );
}
