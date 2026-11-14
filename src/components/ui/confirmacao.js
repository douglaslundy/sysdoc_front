import { useCallback, useRef, useState } from 'react';
import { Button } from './button';
import { Dialogo, DialogoCabecalho, DialogoRodape } from './dialogo';

/**
 * Substitui window.confirm: `const [confirmar, dialogo] = useConfirmacao();`
 * `if (!(await confirmar({ titulo, mensagem }))) return;` e renderize `{dialogo}` no JSX.
 */
export function useConfirmacao() {
  const [pedido, setPedido] = useState(null);
  const resolver = useRef(null);

  const confirmar = useCallback((opcoes) => new Promise((resolve) => {
    resolver.current = resolve;
    setPedido(typeof opcoes === 'string' ? { mensagem: opcoes } : opcoes);
  }), []);

  const responder = (valor) => {
    setPedido(null);
    resolver.current?.(valor);
    resolver.current = null;
  };

  const dialogo = (
    <Dialogo aberto={Boolean(pedido)} aoFechar={() => responder(false)} alerta tamanho="sm">
      <DialogoCabecalho>{pedido?.titulo || 'Confirmar'}</DialogoCabecalho>
      <p className="text-sm">{pedido?.mensagem}</p>
      <DialogoRodape>
        <Button type="button" variant="outline" onClick={() => responder(false)}>Cancelar</Button>
        <Button type="button" onClick={() => responder(true)}>{pedido?.confirmar || 'Confirmar'}</Button>
      </DialogoRodape>
    </Dialogo>
  );

  return [confirmar, dialogo];
}
