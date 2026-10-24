import React from 'react';
import FeatherIcon from 'feather-icons-react';
import { BotaoLink } from '../ui/botao-link';
import { CabecalhoDePagina } from '../ui/cabecalho-de-pagina';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const AREAS = [
  { title: 'Produtos', href: '/almoxarifado/produtos', icon: 'archive', text: 'Cadastro e consulta de materiais.' },
  { title: 'Categorias', href: '/almoxarifado/categorias', icon: 'tag', text: 'Categorias dos produtos.' },
  { title: 'Espécies', href: '/almoxarifado/especies', icon: 'grid', text: 'Espécies e tipos de item.' },
  { title: 'Unidades', href: '/almoxarifado/unidades-medida', icon: 'maximize', text: 'Unidades de medida.' },
  { title: 'Fornecedores', href: '/almoxarifado/fornecedores', icon: 'truck', text: 'Cadastro de fornecedores.' },
  { title: 'Localizações', href: '/almoxarifado/localizacoes', icon: 'map-pin', text: 'Endereçamento físico.' },
  { title: 'Secretarias', href: '/almoxarifado/secretarias', icon: 'users', text: 'Unidades atendidas pelo estoque.' },
  { title: 'Estoque', href: '/almoxarifado/estoque', icon: 'layers', text: 'Saldo por produto e secretaria.' },
  { title: 'Requisições', href: '/almoxarifado/requisicoes', icon: 'clipboard', text: 'Solicitações, aprovações e entrega.' },
  { title: 'Movimentações', href: '/almoxarifado/movimentacoes', icon: 'refresh-cw', text: 'Entradas, saídas e transferências.' },
  { title: 'Relatórios', href: '/almoxarifado/relatorios', icon: 'bar-chart-2', text: 'Saldos, consumo e rastreabilidade.' },
  { title: 'Configurações', href: '/almoxarifado/configuracoes', icon: 'settings', text: 'Parâmetros do módulo.' },
];

export default function AlmoxarifadoHome() {
  return (
    <div className="ui-reset">
      <CabecalhoDePagina
        titulo="Almoxarifado"
        subtitulo="Estrutura inicial do módulo de almoxarifado. As próximas etapas vão liberar os cadastros e fluxos operacionais."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AREAS.map((area) => (
          <Card key={area.href} size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FeatherIcon icon={area.icon} width="18" height="18" />
                {area.title}
              </CardTitle>
              <CardDescription>{area.text}</CardDescription>
            </CardHeader>
            <CardContent>
              <BotaoLink href={area.href}>Abrir</BotaoLink>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
