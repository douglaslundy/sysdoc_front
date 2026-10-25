import React from 'react';
import { Archive, BarChart2, Clipboard, Grid3x3, Layers, Maximize, MapPin, RefreshCw, Settings, Tag, Truck, Users } from 'lucide-react';
import { BotaoLink } from '../ui/botao-link';
import { CabecalhoDePagina } from '../ui/cabecalho-de-pagina';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const AREAS = [
  { title: 'Produtos', href: '/almoxarifado/produtos', Icone: Archive, text: 'Cadastro e consulta de materiais.' },
  { title: 'Categorias', href: '/almoxarifado/categorias', Icone: Tag, text: 'Categorias dos produtos.' },
  { title: 'Espécies', href: '/almoxarifado/especies', Icone: Grid3x3, text: 'Espécies e tipos de item.' },
  { title: 'Unidades', href: '/almoxarifado/unidades-medida', Icone: Maximize, text: 'Unidades de medida.' },
  { title: 'Fornecedores', href: '/almoxarifado/fornecedores', Icone: Truck, text: 'Cadastro de fornecedores.' },
  { title: 'Localizações', href: '/almoxarifado/localizacoes', Icone: MapPin, text: 'Endereçamento físico.' },
  { title: 'Secretarias', href: '/almoxarifado/secretarias', Icone: Users, text: 'Unidades atendidas pelo estoque.' },
  { title: 'Estoque', href: '/almoxarifado/estoque', Icone: Layers, text: 'Saldo por produto e secretaria.' },
  { title: 'Requisições', href: '/almoxarifado/requisicoes', Icone: Clipboard, text: 'Solicitações, aprovações e entrega.' },
  { title: 'Movimentações', href: '/almoxarifado/movimentacoes', Icone: RefreshCw, text: 'Entradas, saídas e transferências.' },
  { title: 'Relatórios', href: '/almoxarifado/relatorios', Icone: BarChart2, text: 'Saldos, consumo e rastreabilidade.' },
  { title: 'Configurações', href: '/almoxarifado/configuracoes', Icone: Settings, text: 'Parâmetros do módulo.' },
];

export default function AlmoxarifadoHome() {
  return (
    <div>
      <CabecalhoDePagina
        titulo="Almoxarifado"
        subtitulo="Estrutura inicial do módulo de almoxarifado. As próximas etapas vão liberar os cadastros e fluxos operacionais."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AREAS.map((area) => (
          <Card key={area.href} size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <area.Icone className="size-[18px]" aria-hidden />
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
