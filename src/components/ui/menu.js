import { Menu as MenuPrimitive } from '@base-ui/react/menu';
import { cn } from '../../lib/cn';

export const Menu = MenuPrimitive.Root;
export const MenuTrigger = MenuPrimitive.Trigger;

export function MenuConteudo({ className, align = 'end', sideOffset = 8, children, ...props }) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner align={align} sideOffset={sideOffset} collisionPadding={8} className="z-[200]">
        <MenuPrimitive.Popup
          className={cn('min-w-[180px] rounded-xl border border-border bg-popover p-1 text-sm text-popover-foreground shadow-[0_4px_20px_rgba(0,0,0,0.35)] outline-none', className)}
          {...props}
        >
          {children}
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

export function MenuItem({ className, ...props }) {
  return (
    <MenuPrimitive.Item
      className={cn('flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none select-none data-[highlighted]:bg-hover', className)}
      {...props}
    />
  );
}
