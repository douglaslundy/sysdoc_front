import { format } from 'date-fns';
import { ListPlus, Plane, UserPlus } from 'lucide-react';
import { parseCookies } from 'nookies';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../../../contexts/AuthContext';
import { api } from '../../../../services/api';
import { Banner } from '../../../ui/banner';
import { Button } from '../../../ui/button';
import { CampoSelecao, CampoTexto } from '../../../ui/campos';
import { Dialogo, DialogoCabecalho, DialogoRodape } from '../../../ui/dialogo';

const mensagemDeErro = (e, padrao) => {
  const erros = e?.response?.data?.errors;
  const primeiro = erros ? Object.values(erros)[0]?.[0] : null;
  return primeiro || e?.response?.data?.message || padrao;
};

const dataBr = (iso) => {
  try {
    return format(new Date(`${String(iso).substring(0, 10)}T12:00:00`), 'dd/MM/yyyy');
  } catch {
    return String(iso || '');
  }
};

/** Carrega uma lista ao abrir o diálogo. `erro` vira aviso no diálogo. */
function useLista(aberto, carregar) {
  const [itens, setItens] = useState([]);
  const [erro, setErro] = useState('');
  useEffect(() => {
    if (!aberto) return undefined;
    let cancelado = false;
    setErro('');
    carregar()
      .then((lista) => { if (!cancelado) setItens(lista); })
      .catch((e) => { if (!cancelado) setErro(mensagemDeErro(e, 'Não foi possível carregar as opções.')); });
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);
  return [itens, erro];
}

function DialogoDeAcao({ aberto, aoFechar, titulo, enviando, erro, aoConfirmar, rotuloConfirmar, desabilitado, children }) {
  return (
    <Dialogo aberto={aberto} aoFechar={aoFechar} tamanho="md" elevado>
      <DialogoCabecalho>{titulo}</DialogoCabecalho>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); aoConfirmar(); }}>
        {erro ? <Banner tom="alerta">{erro}</Banner> : null}
        {children}
        <DialogoRodape>
          <Button type="button" variant="outline" onClick={aoFechar} disabled={enviando}>Cancelar</Button>
          <Button type="submit" disabled={enviando || desabilitado}>{enviando ? 'Salvando...' : rotuloConfirmar}</Button>
        </DialogoRodape>
      </form>
    </Dialogo>
  );
}

function useEnvio(aoSucesso) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const enviar = async (fn, padrao) => {
    setEnviando(true);
    setErro('');
    try {
      const resultado = await fn();
      aoSucesso(resultado);
    } catch (e) {
      setErro(mensagemDeErro(e, padrao));
    } finally {
      setEnviando(false);
    }
  };
  return { enviando, erro, enviar, limpar: () => setErro('') };
}

function ColocarNaFila({ aberto, aoFechar, cliente, aoSucesso }) {
  const [especialidades, erroLista] = useLista(aberto, async () => {
    const { data } = await api.get('/queues/specialities-options');
    return (Array.isArray(data) ? data : []).filter((s) => s.can_insert);
  });
  const [form, setForm] = useState({ speciality: '', urgency: '0', obs: '' });
  const { enviando, erro, enviar } = useEnvio(aoSucesso);

  const confirmar = () => enviar(async () => {
    const usuario = parseCookies()['sysvendas.id'];
    await api.post('/queues', {
      id_client: cliente.id,
      id_specialities: Number(form.speciality),
      id_user: usuario,
      urgency: form.urgency === '1',
      obs: form.obs || null,
      done: false,
    });
    return `${cliente.name} foi colocado(a) na fila.`;
  }, 'Não foi possível colocar na fila.');

  return (
    <DialogoDeAcao aberto={aberto} aoFechar={aoFechar} titulo="Colocar na fila" enviando={enviando} erro={erro || erroLista} aoConfirmar={confirmar} rotuloConfirmar="Colocar na fila" desabilitado={!form.speciality}>
      <p className="text-sm text-muted-foreground">Cidadão: <strong className="text-foreground">{cliente.name}</strong></p>
      <CampoSelecao id="acao-fila-especialidade" label="Especialidade" obrigatorio value={form.speciality} onChange={(e) => setForm({ ...form, speciality: e.target.value })}>
        <option value="">Selecione...</option>
        {especialidades.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </CampoSelecao>
      <CampoSelecao id="acao-fila-urgencia" label="Urgência" value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })}>
        <option value="0">Normal</option>
        <option value="1">Urgente</option>
      </CampoSelecao>
      <CampoTexto id="acao-fila-obs" label="Observações" multiline rows={3} maxLength={1000} value={form.obs} onChange={(e) => setForm({ ...form, obs: e.target.value })} />
    </DialogoDeAcao>
  );
}

/** Dados do cidadão usados para pré-preencher telefone e locais na viagem. */
const dadosDaViagem = (cliente, hora) => ({
  client_id: cliente.id,
  phone: cliente.phone || null,
  time: hora,
});

function CamposDoPassageiro({ form, setForm }) {
  return (
    <>
      <CampoSelecao id="acao-viagem-tipo" label="Participa como" value={form.person_type} onChange={(e) => setForm({ ...form, person_type: e.target.value })}>
        <option value="passenger">Passageiro</option>
        <option value="companion">Acompanhante</option>
      </CampoSelecao>
      <CampoTexto id="acao-viagem-hora" label="Horário" type="time" obrigatorio value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
      <CampoTexto id="acao-viagem-saida" label="Local de saída" maxLength={50} value={form.departure_location} onChange={(e) => setForm({ ...form, departure_location: e.target.value })} />
      <CampoTexto id="acao-viagem-destino" label="Local de destino" maxLength={50} value={form.destination_location} onChange={(e) => setForm({ ...form, destination_location: e.target.value })} />
    </>
  );
}

const PASSAGEIRO_VAZIO = { person_type: 'passenger', time: '07:00', departure_location: '', destination_location: '' };
const pessoaDoForm = (cliente, form) => ({
  ...dadosDaViagem(cliente, form.time),
  person_type: form.person_type,
  departure_location: form.departure_location || null,
  destination_location: form.destination_location || null,
});

function NovaViagem({ aberto, aoFechar, cliente, aoSucesso }) {
  const [rotas, erroLista] = useLista(aberto, async () => (await api.get('/routes')).data || []);
  const [viagem, setViagem] = useState({ route_id: '', departure_date: format(new Date(), 'yyyy-MM-dd'), obs: '' });
  const [passageiro, setPassageiro] = useState(PASSAGEIRO_VAZIO);
  const { enviando, erro, enviar } = useEnvio(aoSucesso);

  const confirmar = () => enviar(async () => {
    const { data: criada } = await api.post('/trips', {
      route_id: Number(viagem.route_id),
      departure_date: viagem.departure_date,
      departure_time: passageiro.time,
      obs: viagem.obs || null,
      user_id: parseCookies()['sysvendas.id'],
    });
    const idViagem = criada?.id ?? criada?.trip?.id ?? criada?.data?.id;
    await api.post('/trip-clients', { trip_id: idViagem, ...pessoaDoForm(cliente, passageiro) });
    return `Viagem de ${dataBr(viagem.departure_date)} criada com ${cliente.name}.`;
  }, 'Não foi possível criar a viagem.');

  return (
    <DialogoDeAcao aberto={aberto} aoFechar={aoFechar} titulo="Nova viagem" enviando={enviando} erro={erro || erroLista} aoConfirmar={confirmar} rotuloConfirmar="Criar viagem" desabilitado={!viagem.route_id || !viagem.departure_date || !passageiro.time}>
      <p className="text-sm text-muted-foreground">Cidadão: <strong className="text-foreground">{cliente.name}</strong></p>
      <CampoSelecao id="acao-viagem-rota" label="Rota" obrigatorio value={viagem.route_id} onChange={(e) => setViagem({ ...viagem, route_id: e.target.value })}>
        <option value="">Selecione...</option>
        {rotas.map((r) => <option key={r.id} value={r.id}>{`${r.origin}/${r.origin_state} → ${r.destination}/${r.destination_state}`}</option>)}
      </CampoSelecao>
      <CampoTexto id="acao-viagem-data" label="Data da viagem" type="date" obrigatorio value={viagem.departure_date} onChange={(e) => setViagem({ ...viagem, departure_date: e.target.value })} />
      <CamposDoPassageiro form={passageiro} setForm={setPassageiro} />
      <CampoTexto id="acao-viagem-obs" label="Observações da viagem" multiline rows={2} maxLength={300} value={viagem.obs} onChange={(e) => setViagem({ ...viagem, obs: e.target.value })} />
    </DialogoDeAcao>
  );
}

function EntrarEmViagem({ aberto, aoFechar, cliente, aoSucesso }) {
  const [viagens, erroLista] = useLista(aberto, async () => {
    const { data } = await api.get('/trips', { params: { date_begin: format(new Date(), 'yyyy/MM/dd'), date_end: '2999/12/31' } });
    const lista = Array.isArray(data) ? data : data?.data || [];
    return lista.filter((v) => !(v.clients || []).some((c) => c.id === cliente.id));
  });
  const [idViagem, setIdViagem] = useState('');
  const [passageiro, setPassageiro] = useState(PASSAGEIRO_VAZIO);
  const { enviando, erro, enviar } = useEnvio(aoSucesso);

  const confirmar = () => enviar(async () => {
    await api.post('/trip-clients', { trip_id: Number(idViagem), ...pessoaDoForm(cliente, passageiro) });
    return `${cliente.name} foi incluído(a) na viagem como ${passageiro.person_type === 'companion' ? 'acompanhante' : 'passageiro(a)'}.`;
  }, 'Não foi possível incluir na viagem.');

  const rotulo = (v) => `${dataBr(v.departure_date)} — ${v.route ? `${v.route.origin} → ${v.route.destination}` : 'sem rota'}${v.driver?.name ? ` (${v.driver.name})` : ''}`;

  return (
    <DialogoDeAcao aberto={aberto} aoFechar={aoFechar} titulo="Incluir em viagem existente" enviando={enviando} erro={erro || erroLista} aoConfirmar={confirmar} rotuloConfirmar="Incluir" desabilitado={!idViagem || !passageiro.time}>
      <p className="text-sm text-muted-foreground">Cidadão: <strong className="text-foreground">{cliente.name}</strong></p>
      <CampoSelecao id="acao-viagem-existente" label="Viagem" obrigatorio value={idViagem} onChange={(e) => setIdViagem(e.target.value)} dica={viagens.length === 0 ? 'Nenhuma viagem futura disponível.' : undefined}>
        <option value="">Selecione...</option>
        {viagens.map((v) => <option key={v.id} value={v.id}>{rotulo(v)}</option>)}
      </CampoSelecao>
      <CamposDoPassageiro form={passageiro} setForm={setPassageiro} />
    </DialogoDeAcao>
  );
}

/** Botões do "Visualizar cidadão": fila, nova viagem, entrar em viagem. Só aparecem para quem tem a página. */
export function AcoesDoCidadao({ cliente }) {
  const { profile, myPermissions } = useContext(AuthContext);
  const [aberto, setAberto] = useState(null);
  const [aviso, setAviso] = useState('');

  const tem = (pagina) => profile === 'admin' || (myPermissions || []).includes(pagina);
  const fila = tem('/queue');
  const viagens = tem('/trips');
  if (!fila && !viagens) return null;

  const concluir = (mensagem) => {
    setAberto(null);
    setAviso(mensagem);
  };
  const comum = { cliente, aoFechar: () => setAberto(null), aoSucesso: concluir };

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <h3 className="font-display text-base font-bold">Ações</h3>
      {aviso ? <Banner tom="sucesso">{aviso}</Banner> : null}
      <div className="flex flex-wrap gap-2">
        {fila ? <Button type="button" variant="outline" onClick={() => setAberto('fila')}><ListPlus className="size-4" aria-hidden /> Colocar na fila</Button> : null}
        {viagens ? <Button type="button" variant="outline" onClick={() => setAberto('nova')}><Plane className="size-4" aria-hidden /> Nova viagem</Button> : null}
        {viagens ? <Button type="button" variant="outline" onClick={() => setAberto('existente')}><UserPlus className="size-4" aria-hidden /> Incluir em viagem</Button> : null}
      </div>
      {fila ? <ColocarNaFila aberto={aberto === 'fila'} {...comum} /> : null}
      {viagens ? <NovaViagem aberto={aberto === 'nova'} {...comum} /> : null}
      {viagens ? <EntrarEmViagem aberto={aberto === 'existente'} {...comum} /> : null}
    </div>
  );
}
