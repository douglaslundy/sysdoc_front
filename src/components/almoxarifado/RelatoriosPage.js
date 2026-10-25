import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { CabecalhoDePagina } from '../ui/cabecalho-de-pagina';
import { StatCard } from '../ui/stat-card';

export default function RelatoriosPage() {
  const [kpi, setKpi] = useState({ produtos: 0, estoques: 0, requisicoes: 0, pendentes: 0 });

  useEffect(() => {
    let mounted = true;
    Promise.all([
      api.get('/almoxarifado/produtos', { params: { per_page: 1, page: 1 } }),
      api.get('/almoxarifado/estoque', { params: { per_page: 1, page: 1 } }),
      api.get('/almoxarifado/requisicoes', { params: { per_page: 1, page: 1 } }),
      api.get('/almoxarifado/requisicoes', { params: { per_page: 1, page: 1, status: 'recebida' } }),
    ]).then(([produtos, estoque, requisicoes, pendentes]) => {
      if (!mounted) return;
      setKpi({
        produtos: Number(produtos.data?.total ?? 0),
        estoques: Number(estoque.data?.total ?? 0),
        requisicoes: Number(requisicoes.data?.total ?? 0),
        pendentes: Number(pendentes.data?.total ?? 0),
      });
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  return (
    <div>
      <CabecalhoDePagina titulo="Relatórios" subtitulo="Resumo do almoxarifado." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard titulo="Produtos" valor={kpi.produtos} />
        <StatCard titulo="Saldos" valor={kpi.estoques} />
        <StatCard titulo="Requisições" valor={kpi.requisicoes} />
        <StatCard titulo="Pendentes" valor={kpi.pendentes} />
      </div>
    </div>
  );
}
