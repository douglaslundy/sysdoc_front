import { useState } from 'react';

let contador = 0;

/** Id estável por instância (o React 17 não tem `useId`). Muda entre servidor e cliente: use só em ids de ligação (label/aria), não em chaves de lista. */
export function useUid(prefixo = 'uid') {
  const [id] = useState(() => `${prefixo}-${++contador}`);
  return id;
}
