import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addDays, addMonths, addWeeks, eachDayOfInterval, endOfMonth, endOfWeek, format,
  isSameMonth, parseISO, startOfMonth, startOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/router';
import { api } from '../../../services/api';
import { cleanPhone } from '../../helpers/formatt/phone';
import InputSelectClient from '../../inputs/inputSelectClient';
import SelectPesquisavel from '../../inputs/selectPesquisavel';
import { Banner } from '../../ui/banner';
import { Button } from '../../ui/button';
import { CampoSelecao, CampoTexto } from '../../ui/campos';
import { Dialogo, DialogoCabecalho, DialogoRodape } from '../../ui/dialogo';

const ISO = 'yyyy-MM-dd';
const iso = (d) => format(d, ISO);
const FORM_VAZIO = { date: '', client: null, phone: '', departure_location: '', destination_location: '', time: '', companions: [], companion_of: null, paiNome: '' };

const STATUS_AGENDA = {
  agendado: { rotulo: 'Agendado', borda: 'border-l-blue-500', ponto: 'bg-blue-500' },
  confirmado: { rotulo: 'Confirmado', borda: 'border-l-green-500', ponto: 'bg-green-500' },
  cancelado: { rotulo: 'Cancelado', borda: 'border-l-red-500', ponto: 'bg-red-500' },
  concluido: { rotulo: 'Concluído', borda: 'border-l-gray-500', ponto: 'bg-gray-500' },
};

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

const msgErro = (e, padrao) => {
  const erros = e?.response?.data?.errors;
  const primeiro = erros ? Object.values(erros)[0]?.[0] : null;
  return primeiro || e?.response?.data?.message || padrao;
};

/** Agenda de viagens: passageiros (e acompanhantes) por data, antes de terem uma viagem. */
export default function TripScheduleAgenda() {
  const router = useRouter();
  const diaSel = typeof router.query.dia === 'string' && DATA_ISO.test(router.query.dia) ? router.query.dia : null;
  const [modo, setModo] = useState('week');
  const [cursor, setCursor] = useState(new Date());
  const [remocao, setRemocao] = useState(null); // entrada aguardando confirmação de remoção
  const [entries, setEntries] = useState([]);
  const [selecionados, setSelecionados] = useState([]);
  const [aviso, setAviso] = useState(null);
  const [erroForm, setErroForm] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const [form, setForm] = useState(null); // null = fechado
  const [iniciais, setIniciais] = useState([]);
  const [salvando, setSalvando] = useState(false);

  const [envio, setEnvio] = useState(null); // { ids, tipo: 'existente'|'nova', ... }
  const [opcoes, setOpcoes] = useState({ trips: [], routes: [], vehicles: [], drivers: [] });

  useEffect(() => {
    const base = router.query.dia || router.query.ref;
    if (typeof base === 'string' && DATA_ISO.test(base)) setCursor(parseISO(base));
  }, [router.query.dia, router.query.ref]);

  const intervalo = useMemo(() => {
    if (diaSel) return { from: parseISO(diaSel), to: parseISO(diaSel) };
    if (modo === 'week') return { from: startOfWeek(cursor), to: endOfWeek(cursor) };
    return { from: startOfWeek(startOfMonth(cursor)), to: endOfWeek(endOfMonth(cursor)) };
  }, [modo, cursor, diaSel]);
  const dias = useMemo(() => eachDayOfInterval({ start: intervalo.from, end: intervalo.to }), [intervalo]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const { data } = await api.get('/trip-schedule', { params: { from: iso(intervalo.from), to: iso(intervalo.to) } });
      setEntries(Array.isArray(data) ? data : []);
    } catch (e) {
      setAviso({ tom: 'perigo', texto: msgErro(e, 'Não foi possível carregar a agenda.') });
    } finally {
      setCarregando(false);
    }
  }, [intervalo]);

  useEffect(() => { carregar(); }, [carregar]);

  const porDia = useMemo(() => {
    const mapa = {};
    entries.forEach((e) => { (mapa[e.scheduled_date] = mapa[e.scheduled_date] || []).push(e); });
    return mapa;
  }, [entries]);

  const navegar = (sentido) => setCursor((c) => (modo === 'week' ? addWeeks(c, sentido) : addMonths(c, sentido)));
  const titulo = modo === 'week'
    ? `${format(intervalo.from, "d 'de' MMM", { locale: ptBR })} - ${format(intervalo.to, "d 'de' MMM 'de' yyyy", { locale: ptBR })}`
    : format(cursor, "MMMM 'de' yyyy", { locale: ptBR });

  // ---------- agendar ----------
  const abrirForm = async (data, extra = {}) => {
    setErroForm(null);
    setForm({ ...FORM_VAZIO, date: data, ...extra });
    try {
      const { data: lista } = await api.get('/clients/select', { params: { limit: 50, somente_nome: 1 } });
      setIniciais(Array.isArray(lista) ? lista : []);
    } catch (e) {
      setIniciais([]);
    }
  };
  const abrirAcompanhante = (pax) => abrirForm(pax.scheduled_date, {
    companion_of: pax.id,
    paiNome: pax.client?.name || '',
    phone: pax.phone || '',
    departure_location: pax.departure_location || '',
    destination_location: pax.destination_location || '',
    time: pax.time || '',
  });

  const salvar = async () => {
    if (!form?.client?.id) return;
    setSalvando(true);
    setErroForm(null);
    try {
      const payload = {
        client_id: form.client.id,
        phone: cleanPhone(form.phone) || null,
        departure_location: form.departure_location || null,
        destination_location: form.destination_location || null,
        time: form.time || null,
      };
      if (form.companion_of) payload.companion_of = form.companion_of;
      else {
        payload.scheduled_date = form.date;
        payload.companions = form.companions.map((c) => ({ client_id: c.id }));
      }
      await api.post('/trip-schedule', payload);
      setForm(null);
      setAviso({ tom: 'sucesso', texto: 'Agendado com sucesso.' });
      await carregar();
    } catch (e) {
      setErroForm(msgErro(e, 'Não foi possível agendar.'));
    } finally {
      setSalvando(false);
    }
  };

  // ---------- ações de linha ----------
  const alternarStatus = async (e) => {
    try {
      await api.put(`/trip-schedule/${e.id}`, { status: e.status === 'confirmado' ? 'agendado' : 'confirmado' });
      await carregar();
    } catch (err) {
      setAviso({ tom: 'perigo', texto: msgErro(err, 'Não foi possível alterar o status.') });
    }
  };
  // Cancelar, concluir ou reabrir o passageiro leva os acompanhantes dele junto.
  const definirStatus = async (e, status) => {
    try {
      const ids = [e.id, ...entries.filter((x) => x.companion_of === e.id).map((x) => x.id)];
      await Promise.all(ids.map((id) => api.put(`/trip-schedule/${id}`, { status })));
      await carregar();
    } catch (err) {
      setAviso({ tom: 'perigo', texto: msgErro(err, 'Não foi possível alterar o status.') });
    }
  };
  const confirmarRemocao = async () => {
    const e = remocao;
    setRemocao(null);
    if (!e) return;
    try {
      await api.delete(`/trip-schedule/${e.id}`);
      setSelecionados((s) => s.filter((id) => id !== e.id));
      await carregar();
    } catch (err) {
      setAviso({ tom: 'perigo', texto: msgErro(err, 'Não foi possível remover.') });
    }
  };
  const marcar = (id) => setSelecionados((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  // ---------- enviar para viagem ----------
  const abrirEnvio = async (ids) => {
    if (ids.length === 0) return;
    const primeira = entries.find((e) => e.id === ids[0]);
    const data = primeira?.scheduled_date || iso(new Date());
    setEnvio({ ids, tipo: 'existente', trip_id: '', route_id: '', vehicle_id: '', driver_id: '', departure_date: data, departure_time: '' });
    const pega = (p) => p.then((r) => (Array.isArray(r.data) ? r.data : r.data?.data || [])).catch(() => []);
    const [trips, routes, vehicles, drivers] = await Promise.all([
      pega(api.get('/trips', { params: { date_begin: data, date_end: data } })),
      pega(api.get('/routes')),
      pega(api.get('/vehicles')),
      pega(api.get('/trips/drivers-options')),
    ]);
    setOpcoes({ trips, routes, vehicles, drivers });
  };

  const enviar = async () => {
    setSalvando(true);
    try {
      const corpo = { entry_ids: envio.ids };
      if (envio.tipo === 'existente') corpo.trip_id = Number(envio.trip_id);
      else {
        corpo.new_trip = {
          route_id: Number(envio.route_id),
          departure_date: envio.departure_date,
          departure_time: envio.departure_time || null,
          vehicle_id: envio.vehicle_id ? Number(envio.vehicle_id) : null,
          driver_id: envio.driver_id ? Number(envio.driver_id) : null,
        };
      }
      await api.post('/trip-schedule/send', corpo);
      setEnvio(null);
      setSelecionados([]);
      setAviso({ tom: 'sucesso', texto: 'Enviado para a viagem. Os acompanhantes foram junto.' });
      await carregar();
    } catch (e) {
      setAviso({ tom: 'perigo', texto: msgErro(e, 'Não foi possível enviar para a viagem.') });
    } finally {
      setSalvando(false);
    }
  };

  const envioValido = envio && (envio.tipo === 'existente' ? envio.trip_id : envio.route_id && envio.departure_date);

  // ---------- peças visuais ----------
  const Linha = ({ e }) => {
    const acomp = e.person_type === 'companion';
    return (
      <div
        className={`rounded-md border border-border bg-card px-2 py-1.5 text-xs border-l-4 ${(STATUS_AGENDA[e.status] || STATUS_AGENDA.agendado).borda} ${e.status === 'cancelado' ? 'opacity-60' : ''}`}
        style={acomp ? { marginLeft: 10 } : undefined}
      >
        <div className="flex items-start gap-2">
          {!acomp && (
            <input type="checkbox" aria-label={`Selecionar ${e.client?.name}`} checked={selecionados.includes(e.id)} onChange={() => marcar(e.id)} className="mt-0.5" />
          )}
          <div className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{acomp ? '↳ ' : ''}{String(e.client?.name || '').toUpperCase()}</span>
            <span className="block text-muted-foreground">
              {acomp ? 'Acompanhante' : 'Passageiro'}{e.time ? ` · ${e.time}` : ''}{e.destination_location ? ` · ${e.destination_location}` : ''}
            </span>
          </div>
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          {(e.status === 'agendado' || e.status === 'confirmado') && (
            <Button type="button" size="xs" variant="outline" onClick={() => alternarStatus(e)}>{e.status === 'confirmado' ? 'Desconfirmar' : 'Confirmar'}</Button>
          )}
          {(e.status === 'agendado' || e.status === 'confirmado') && !acomp && (
            <Button type="button" size="xs" variant="outline" onClick={() => definirStatus(e, 'cancelado')}>Cancelar</Button>
          )}
          {e.status === 'confirmado' && !acomp && (
            <Button type="button" size="xs" variant="outline" onClick={() => definirStatus(e, 'concluido')}>Concluir</Button>
          )}
          {(e.status === 'cancelado' || e.status === 'concluido') && !acomp && (
            <Button type="button" size="xs" variant="outline" onClick={() => definirStatus(e, 'agendado')}>Reabrir</Button>
          )}
          {!acomp && <Button type="button" size="xs" variant="outline" onClick={() => abrirAcompanhante(e)}>+ Acompanhante</Button>}
          <Button type="button" size="xs" variant="outline" onClick={() => setRemocao(e)}>Remover</Button>
        </div>
      </div>
    );
  };

  // Bloco compacto do calendário: só nomes, fonte pequena, cortados na largura; excedente vira "+N".
  const Resumo = ({ lista, max }) => (
    <div className="flex min-w-0 flex-1 flex-col gap-0.5 overflow-hidden">
      {lista.slice(0, max).map((e) => (
        <span key={e.id} title={e.client?.name} className={`block truncate border-l-2 pl-1 text-[10px] leading-tight ${(STATUS_AGENDA[e.status] || STATUS_AGENDA.agendado).borda} ${e.status === 'cancelado' ? 'line-through opacity-60' : ''}`}>
          {e.person_type === 'companion' ? '↳ ' : ''}{String(e.client?.name || '').toUpperCase()}
        </span>
      ))}
      {lista.length > max && <span className="text-[10px] font-medium text-primary">+{lista.length - max} mais</span>}
    </div>
  );
  const abrirDia = (d) => router.push({ pathname: router.pathname, query: { dia: d } });
  const voltarCalendario = () => router.push({ pathname: router.pathname, query: { ref: diaSel } });

  const rotasOpc = opcoes.routes.map((r) => ({ id: r.id, name: `${r.origin} X ${r.destination}`, destination: r.destination }));
  const veicOpc = opcoes.vehicles.map((v) => ({ id: v.id, name: `${v.license_plate} - ${v.brand} ${v.model} CAPACIDADE ${v.capacity} LUGARES` }));
  const motOpc = opcoes.drivers.map((d) => ({ id: d.id, name: d.name }));

  return (
    <div>
      {aviso && <div className="mb-3"><Banner tom={aviso.tom}>{aviso.texto}</Banner></div>}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {diaSel ? (
          <>
            <Button type="button" size="sm" variant="outline" onClick={voltarCalendario}>← Calendário</Button>
            <span className="text-sm font-medium capitalize">{format(parseISO(diaSel), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
          </>
        ) : (
          <>
            <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
              <Button type="button" size="sm" variant={modo === 'week' ? 'default' : 'ghost'} onClick={() => setModo('week')}>Semana</Button>
              <Button type="button" size="sm" variant={modo === 'month' ? 'default' : 'ghost'} onClick={() => setModo('month')}>Mês</Button>
            </div>
            <div className="inline-flex items-center rounded-lg border border-border bg-card">
              <Button type="button" size="sm" variant="ghost" aria-label="Anterior" onClick={() => navegar(-1)}>‹</Button>
              <span className="min-w-[200px] px-2 text-center text-sm font-medium capitalize">{titulo}</span>
              <Button type="button" size="sm" variant="ghost" aria-label="Próximo" onClick={() => navegar(1)}>›</Button>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => setCursor(new Date())}>Hoje</Button>
          </>
        )}
        <div className="ml-auto flex gap-2">
          {diaSel && (
            <Button type="button" variant="outline" disabled={(porDia[diaSel] || []).filter((e) => e.person_type === 'passenger').length === 0}
              onClick={() => setSelecionados((porDia[diaSel] || []).filter((e) => e.person_type === 'passenger').map((e) => e.id))}>
              Selecionar todos
            </Button>
          )}
          <Button type="button" variant="outline" disabled={selecionados.length === 0} onClick={() => abrirEnvio(selecionados)}>
            Enviar para viagem ({selecionados.length})
          </Button>
          <Button type="button" onClick={() => abrirForm(diaSel || iso(cursor))}>+ Agendar</Button>
        </div>
      </div>

      {diaSel ? (
        <div className="grid max-w-3xl gap-1.5">
          {(porDia[diaSel] || []).length === 0 && !carregando && <p className="text-sm text-muted-foreground">Ninguém agendado neste dia.</p>}
          {(porDia[diaSel] || []).map((e) => <Linha key={e.id} e={e} />)}
        </div>
      ) : modo === 'week' ? (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-7">
          {dias.map((d) => {
            const lista = porDia[iso(d)] || [];
            const hoje = iso(d) === iso(new Date());
            return (
              <div key={iso(d)} role="button" tabIndex={0} aria-label={`Abrir ${format(d, "d 'de' MMMM", { locale: ptBR })}`}
                onClick={() => abrirDia(iso(d))} onKeyDown={(ev) => { if (ev.key === 'Enter') abrirDia(iso(d)); }}
                className={`flex h-[220px] cursor-pointer flex-col overflow-hidden rounded-lg border bg-card hover:bg-hover ${hoje ? 'border-primary' : 'border-border'}`}>
                <div className={`flex items-center justify-between border-b px-2 py-1.5 text-xs font-medium capitalize ${hoje ? 'border-primary text-primary' : 'border-border text-muted-foreground'}`}>
                  <span>{format(d, "EEE., d 'de' MMM", { locale: ptBR })}</span>
                  <button type="button" aria-label="Agendar neste dia" onClick={(ev) => { ev.stopPropagation(); abrirForm(iso(d)); }} className="rounded px-1.5 text-sm leading-none hover:bg-border">+</button>
                </div>
                <div className="flex min-h-0 flex-1 flex-col gap-1.5 p-2">
                  <button type="button" onClick={(ev) => { ev.stopPropagation(); abrirForm(iso(d)); }} className="rounded-md border border-dashed border-border py-1 text-xs text-muted-foreground hover:bg-hover">+ Agendar</button>
                  <Resumo lista={lista} max={10} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {dias.map((d) => {
            const lista = porDia[iso(d)] || [];
            return (
              <button
                key={iso(d)}
                type="button"
                onClick={() => abrirDia(iso(d))}
                className={`flex h-[110px] min-w-0 flex-col overflow-hidden rounded-md border border-border p-1.5 text-left text-xs hover:bg-hover ${isSameMonth(d, cursor) ? 'bg-card' : 'opacity-50'}`}
              >
                <span className="font-medium">{format(d, 'd')}</span>
                <Resumo lista={lista} max={4} />
              </button>
            );
          })}
        </div>
      )}
      {carregando && <p className="mt-2 text-xs text-muted-foreground">Carregando...</p>}

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        {Object.entries(STATUS_AGENDA).map(([chave, s]) => (
          <span key={chave}><span className={`mr-1 inline-block size-2.5 rounded-sm ${s.ponto}`} />{s.rotulo}</span>
        ))}
      </div>

      <Dialogo aberto={Boolean(remocao)} aoFechar={() => setRemocao(null)} alerta tamanho="sm">
        <DialogoCabecalho>Remover da agenda</DialogoCabecalho>
        <p className="text-sm">Remover <strong>{String(remocao?.client?.name || 'esta pessoa').toUpperCase()}</strong> da agenda?{remocao?.person_type === 'passenger' ? ' Os acompanhantes dela também saem.' : ''}</p>
        <DialogoRodape>
          <Button type="button" variant="outline" onClick={() => setRemocao(null)}>Cancelar</Button>
          <Button type="button" onClick={confirmarRemocao}>Remover</Button>
        </DialogoRodape>
      </Dialogo>

      {/* Dialogo: agendar passageiro (+ acompanhantes) ou só um acompanhante */}
      <Dialogo aberto={Boolean(form)} aoFechar={() => setForm(null)} tamanho="lg">
        <DialogoCabecalho>{form?.companion_of ? `Acompanhante de ${String(form.paiNome).toUpperCase()}` : 'Agendar passageiro'}</DialogoCabecalho>
        {form && (
          <div className="grid gap-4">
            {erroForm && <Banner tom="perigo">{erroForm}</Banner>}
            {!form.companion_of && (
              <CampoTexto id="ag-data" label="Data" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            )}
            {form.client ? (
              <CampoTexto id="ag-cliente" label={form.companion_of ? 'Acompanhante' : 'Passageiro'} value={form.client.name || ''} readOnly
                dica="Para trocar, feche e abra novamente." />
            ) : (
              <InputSelectClient label={form.companion_of ? 'SELECIONE O ACOMPANHANTE' : 'SELECIONE O PASSAGEIRO'} clients={iniciais} somenteNome value="" setClient={(c) => setForm((f) => ({ ...f, client: c?.id ? c : null }))} wd="100%" />
            )}
            <div className="grid gap-4 md:grid-cols-3">
              <CampoTexto id="ag-tel" label="Telefone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} maxLength={20} />
              <CampoTexto id="ag-saida" label="Local de saída" value={form.departure_location} onChange={(e) => setForm((f) => ({ ...f, departure_location: e.target.value }))} maxLength={50} className="uppercase" />
              <CampoTexto id="ag-destino" label="Local de destino" value={form.destination_location} onChange={(e) => setForm((f) => ({ ...f, destination_location: e.target.value }))} maxLength={50} className="uppercase" />
            </div>
            <div className="max-w-[200px]">
              <CampoTexto id="ag-hora" label="Horário do compromisso" type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} />
            </div>

            {!form.companion_of && (
              <div className="grid gap-2">
                <InputSelectClient key={form.companions.length} label="ADICIONAR ACOMPANHANTE (opcional)" clients={iniciais} somenteNome value="" wd="100%"
                  setClient={(c) => { if (c?.id && c.id !== form.client?.id && !form.companions.some((x) => x.id === c.id)) setForm((f) => ({ ...f, companions: [...f.companions, c] })); }} />
                {form.companions.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-md border border-border px-3 py-1.5 text-sm" style={{ marginLeft: 10 }}>
                    <span>↳ {String(c.name).toUpperCase()}</span>
                    <Button type="button" size="xs" variant="outline" onClick={() => setForm((f) => ({ ...f, companions: f.companions.filter((x) => x.id !== c.id) }))}>Tirar</Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <DialogoRodape>
          <Button type="button" variant="outline" onClick={() => setForm(null)}>Cancelar</Button>
          <Button type="button" onClick={salvar} disabled={salvando || !form?.client?.id || (!form?.companion_of && !form?.date)}>{salvando ? 'Salvando...' : 'Agendar'}</Button>
        </DialogoRodape>
      </Dialogo>

      {/* Dialogo: enviar selecionados para uma viagem */}
      <Dialogo aberto={Boolean(envio)} aoFechar={() => setEnvio(null)} tamanho="lg">
        <DialogoCabecalho>Enviar para viagem</DialogoCabecalho>
        {envio && (
          <div className="grid gap-4">
            <p className="text-sm text-muted-foreground">Os acompanhantes de cada passageiro vão junto e saem da agenda.</p>
            <CampoSelecao id="env-tipo" label="Destino do envio" value={envio.tipo} onChange={(e) => setEnvio((x) => ({ ...x, tipo: e.target.value }))}>
              <option value="existente">Viagem já cadastrada</option>
              <option value="nova">Criar uma nova viagem</option>
            </CampoSelecao>
            {envio.tipo === 'existente' ? (
              <CampoSelecao id="env-viagem" label="Viagem (do dia do agendamento)" value={envio.trip_id} onChange={(e) => setEnvio((x) => ({ ...x, trip_id: e.target.value }))}
                dica={opcoes.trips.length === 0 ? 'Nenhuma viagem cadastrada nesse dia. Escolha "Criar uma nova viagem".' : undefined}>
                <option value="">Selecione</option>
                {opcoes.trips.map((t) => (
                  <option key={t.id} value={t.id}>{`#${t.id} - ${t.route?.origin || ''} X ${t.route?.destination || ''} ${String(t.departure_time || '').slice(0, 5)}`}</option>
                ))}
              </CampoSelecao>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <CampoTexto id="env-data" label="Data da viagem" type="date" value={envio.departure_date} onChange={(e) => setEnvio((x) => ({ ...x, departure_date: e.target.value }))} />
                  <CampoTexto id="env-hora" label="Horário de saída" type="time" value={envio.departure_time} onChange={(e) => setEnvio((x) => ({ ...x, departure_time: e.target.value }))} />
                </div>
                <SelectPesquisavel label="SELECIONE A ROTA" name="route_id" value={envio.route_id} store={rotasOpc} chaveBusca={(r) => r.destination} changeItem={({ target }) => setEnvio((x) => ({ ...x, route_id: target.value }))} />
                <SelectPesquisavel label="SELECIONE O VEICULO" name="vehicle_id" value={envio.vehicle_id} store={veicOpc} changeItem={({ target }) => setEnvio((x) => ({ ...x, vehicle_id: target.value }))} />
                <SelectPesquisavel label="SELECIONE O MOTORISTA" name="driver_id" value={envio.driver_id} store={motOpc} changeItem={({ target }) => setEnvio((x) => ({ ...x, driver_id: target.value }))} />
              </>
            )}
          </div>
        )}
        <DialogoRodape>
          <Button type="button" variant="outline" onClick={() => setEnvio(null)}>Cancelar</Button>
          <Button type="button" onClick={enviar} disabled={salvando || !envioValido}>{salvando ? 'Enviando...' : 'Enviar'}</Button>
        </DialogoRodape>
      </Dialogo>
    </div>
  );
}
