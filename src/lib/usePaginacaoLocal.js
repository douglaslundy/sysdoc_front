import { useEffect, useState } from 'react';

/** Paginação no navegador para listas já carregadas. Volta à primeira página quando a lista muda de tamanho (ex.: busca). */
export function usePaginacaoLocal(lista, porPaginaInicial = 10) {
  const [pagina, setPagina] = useState(0);
  const [porPagina, setPorPagina] = useState(porPaginaInicial);

  useEffect(() => {
    setPagina(0);
  }, [lista.length]);

  return {
    fatia: lista.slice(pagina * porPagina, pagina * porPagina + porPagina),
    propsDaPaginacao: {
      total: lista.length,
      pagina,
      porPagina,
      aoMudarPagina: setPagina,
      aoMudarPorPagina: (n) => {
        setPorPagina(n);
        setPagina(0);
      },
    },
  };
}
