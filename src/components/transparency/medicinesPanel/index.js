import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import PublicThemeToggle from '../PublicThemeToggle';

const HEADER_HEIGHT = 124;
const COLUMN_HEADER_HEIGHT = 56;
const PANEL_CONTENT_OFFSET = HEADER_HEIGHT + COLUMN_HEADER_HEIGHT + 40;
const SCROLL_DURATION_SECONDS = 240;

const getColumnAnimation = (itemsCount) => {
  if (itemsCount <= 8) return 'none';
  const duration = Math.max(60, Math.round((SCROLL_DURATION_SECONDS * itemsCount) / 40));
  return `rolagem-coluna ${duration}s linear infinite`;
};

const formatDate = (value) => {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export default function MedicinesPanel() {
  const [data, setData] = useState({ items: [], reference_date: '', last_update_at: null });

  const loadData = () => {
    api.get('/public/pharmacy/medicines/panel')
      .then((res) => setData(res.data))
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 60000);
    return () => clearInterval(timer);
  }, []);

  const sortedItems = [...data.items].sort((a, b) => {
    const first = `${a.active_ingredient || ''} ${a.concentration || ''}`;
    const second = `${b.active_ingredient || ''} ${b.concentration || ''}`;
    return first.localeCompare(second, 'pt-BR', { sensitivity: 'base' });
  });

  const availableItems = sortedItems.filter((item) => item.availability_status === 'available');
  const unavailableItems = sortedItems.filter((item) => item.availability_status !== 'available');
  const columns = [
    { title: 'Medicamentos disponíveis', items: availableItems, texto: 'text-success', borda: 'border-l-success' },
    { title: 'Medicamentos indisponíveis', items: unavailableItems, texto: 'text-danger', borda: 'border-l-danger' },
  ];

  const renderMedicineCard = (item, borda) => (
    <div className={`rounded-lg border border-l-4 border-border bg-card px-3 py-2 ${borda}`}>
      <p className="text-base leading-tight font-bold">
        {item.active_ingredient} {item.concentration}
      </p>
      <p className="text-xs leading-tight text-muted-foreground">
        {item.pharmaceutical_form} - {item.presentation}
      </p>
    </div>
  );

  return (
    <div className="ui-reset h-screen overflow-hidden">
      <PublicThemeToggle />
      <header
        className="relative z-[2] flex flex-col justify-end border-b border-border bg-surface px-6 pt-6 pb-[5px]"
        style={{ height: `${HEADER_HEIGHT}px` }}
      >
        <h1 className="mb-2 pr-12 font-display text-3xl leading-tight font-extrabold">
          Painel de Disponibilidade de Medicamentos
        </h1>
        <p className="text-base leading-tight text-muted-foreground">
          Data de referência: {formatDate(data.reference_date)} | Última atualização: {formatDateTime(data.last_update_at)}
        </p>
      </header>

      <div className="overflow-hidden px-6 pt-[5px] pb-6" style={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}>
        <div className="relative z-[2] grid grid-cols-1 items-center gap-4 bg-background md:grid-cols-2" style={{ height: `${COLUMN_HEADER_HEIGHT}px` }}>
          {columns.map((column) => (
            <h2 key={column.title} className={`font-display text-2xl font-bold ${column.texto}`}>
              {column.title} ({column.items.length})
            </h2>
          ))}
        </div>

        <div className="overflow-hidden" style={{ height: `calc(100vh - ${PANEL_CONTENT_OFFSET}px)` }}>
          <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-2">
            {columns.map((column) => {
              const shouldLoop = column.items.length > 8;
              const loopItems = shouldLoop ? [...column.items, ...column.items] : column.items;

              return (
                <div key={column.title} className="h-full overflow-hidden">
                  {column.items.length === 0 ? (
                    <div className="rounded-lg border border-border bg-card p-3 text-muted-foreground">Nenhum registro.</div>
                  ) : (
                    <div
                      className="grid gap-2"
                      style={{ animation: getColumnAnimation(column.items.length), willChange: shouldLoop ? 'transform' : 'auto' }}
                    >
                      {loopItems.map((item, index) => (
                        <div key={`${item.medicine_id}-${index}`}>
                          {renderMedicineCard(item, column.borda)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
