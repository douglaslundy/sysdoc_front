import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Banner } from '../ui/banner';
import { Button } from '../ui/button';
import { CampoSelecao, CampoTexto } from '../ui/campos';
import { opcoesOuvidoria, registrarOuvidoria } from '../../services/ouvidoria';

const VAZIO = {
    secretaria_id: '', tipo: '', assunto: '', descricao: '', nome: '', email: '', phone: '', cpf: '',
    captcha_resposta: '', website: '',
};

const soDigitos = (v) => String(v).replace(/\D/g, '');
function mascaraCpf(v) {
    const d = soDigitos(v).slice(0, 11);
    return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}
function mascaraTelefone(v) {
    const d = soDigitos(v).slice(0, 11);
    if (d.length <= 2) return d;
    const meio = d.length > 10 ? 7 : 6;
    return `(${d.slice(0, 2)}) ${d.slice(2, meio)}${d.length > meio ? `-${d.slice(meio)}` : ''}`;
}

export default function FormularioPublico() {
    const [form, setForm] = useState(VAZIO);
    const [opcoes, setOpcoes] = useState({ secretarias: [], tipos: [], desafio: null, iniciado: '' });
    const [identificar, setIdentificar] = useState(false);
    const [anexos, setAnexos] = useState([]);
    const [indisponivel, setIndisponivel] = useState(false);
    const [falhaCarga, setFalhaCarga] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [protocolo, setProtocolo] = useState(null);
    const [erro, setErro] = useState('');
    const [erros, setErros] = useState({});
    const travado = useRef(false);

    const carregar = useCallback(async () => {
        setFalhaCarga(false);
        try {
            const dados = await opcoesOuvidoria();
            setOpcoes({ secretarias: dados.secretarias || [], tipos: dados.tipos || [], desafio: dados.desafio || null, iniciado: dados.iniciado || '' });
        } catch (err) {
            if ([403, 404].includes(err?.response?.status)) setIndisponivel(true);
            else setFalhaCarga(true);
        }
    }, []);

    useEffect(() => { carregar(); }, [carregar]);

    const mudar = (campo, mascara) => ({ target }) => {
        const valor = mascara ? mascara(target.value) : target.value;
        setForm((f) => ({ ...f, [campo]: valor }));
    };

    const enviar = async (event) => {
        event.preventDefault();
        if (travado.current) return;
        setErro('');
        setErros({});
        travado.current = true;
        setEnviando(true);
        try {
            const dados = {
                secretaria_id: Number(form.secretaria_id),
                tipo: form.tipo,
                assunto: form.assunto,
                descricao: form.descricao,
                captcha_token: opcoes.desafio?.token || '',
                captcha_resposta: form.captcha_resposta,
                website: form.website, // isca: humano nunca preenche
                iniciado: opcoes.iniciado, // selo de abertura: o servidor mede o tempo de preenchimento
            };
            if (identificar) {
                Object.assign(dados, { identificar: 1, nome: form.nome, email: form.email, phone: soDigitos(form.phone), cpf: form.cpf });
            }
            const resposta = await registrarOuvidoria(dados, anexos);
            setProtocolo(resposta);
            setForm(VAZIO);
            setAnexos([]);
            return;
        } catch (err) {
            const status = err?.response?.status;
            if (status === 429) setErro('Muitos registros deste local. Tente novamente mais tarde.');
            else if ([403, 404].includes(status)) setIndisponivel(true);
            else if (status === 422) {
                const e = err.response.data?.errors || {};
                const msgs = Object.fromEntries(Object.entries(e).map(([k, v]) => [k, [].concat(v)[0]]));
                setErros(msgs);
                setErro(msgs.iniciado || 'Revise os campos destacados.');
            } else setErro('Não foi possível enviar agora. Tente novamente.');
            setForm((f) => ({ ...f, captcha_resposta: '' }));
        } finally {
            travado.current = false;
            setEnviando(false);
        }
        carregar(); // o desafio é de uso único: após erro, sempre pede outro
    };

    if (indisponivel) return <Banner tom="info">A ouvidoria online está indisponível no momento.</Banner>;

    if (protocolo) {
        return (
            <div className="space-y-4">
                <Banner tom="sucesso" rotulo="Manifestação registrada">Manifestação registrada com sucesso.</Banner>
                <div className="rounded-lg border border-input p-4 text-sm">
                    <p>Protocolo: <strong data-testid="protocolo">{protocolo.protocolo}</strong></p>
                    <p>Senha: <strong data-testid="senha">{protocolo.senha}</strong></p>
                </div>
                <Banner tom="alerta">Anote o protocolo e a senha agora: a senha não será mostrada novamente e é a única forma de acompanhar a resposta.</Banner>
                <Link href={`/ouvidoria/consulta?protocolo=${encodeURIComponent(protocolo.protocolo)}`}>
                    <a className="text-sm text-primary-text underline-offset-4 hover:underline">Acompanhar esta manifestação</a>
                </Link>
                <Button type="button" variant="ghost" onClick={() => { setProtocolo(null); carregar(); }}>Registrar outra</Button>
            </div>
        );
    }

    const texto = (id, label, campo, extra = {}) => (
        <CampoTexto id={id} label={label} name={campo} value={form[campo]} onChange={mudar(campo, extra.mascara)} erro={erros[campo]} {...{ ...extra, mascara: undefined }} />
    );

    return (
        <form onSubmit={enviar} className="space-y-4" autoComplete="off">
            {erro ? <Banner tom="perigo">{erro}</Banner> : null}
            {falhaCarga ? (
                <Banner tom="perigo">
                    Não foi possível carregar o formulário.{' '}
                    <button type="button" className="underline" onClick={carregar}>Tentar novamente</button>
                </Banner>
            ) : null}

            <CampoSelecao id="secretaria_id" label="Secretaria" obrigatorio name="secretaria_id" value={form.secretaria_id} onChange={mudar('secretaria_id')} erro={erros.secretaria_id} required>
                <option value="">Selecione</option>
                {opcoes.secretarias.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </CampoSelecao>
            <CampoSelecao id="tipo" label="Tipo de manifestação" obrigatorio name="tipo" value={form.tipo} onChange={mudar('tipo')} erro={erros.tipo} required>
                <option value="">Selecione</option>
                {opcoes.tipos.map((t) => <option key={t.valor} value={t.valor}>{t.rotulo}</option>)}
            </CampoSelecao>
            {texto('assunto', 'Assunto', 'assunto', { obrigatorio: true, maxLength: 160, required: true })}
            <CampoTexto id="descricao" label="Descreva o que aconteceu" obrigatorio multiline rows={6} name="descricao" maxLength={5000} required
                value={form.descricao} onChange={mudar('descricao')} erro={erros.descricao} dica={`${form.descricao.length}/5000`} />

            <div className="space-y-1">
                <label htmlFor="anexos" className="text-[13px] text-muted-foreground">Anexos (até 3 arquivos JPG, PNG ou PDF, 5 MB cada)</label>
                <input id="anexos" type="file" multiple accept=".jpg,.jpeg,.png,.pdf" className="block w-full text-sm"
                    onChange={(e) => setAnexos(Array.from(e.target.files || []).slice(0, 3))} />
                {erros.anexos || erros['anexos.0'] ? <p className="text-xs text-danger">{erros.anexos || erros['anexos.0']}</p> : null}
            </div>

            <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={identificar} onChange={(e) => setIdentificar(e.target.checked)} />
                Quero me identificar (opcional)
            </label>
            {identificar ? (
                <div className="space-y-4" data-testid="campos-identificacao">
                    {texto('nome', 'Nome', 'nome', { obrigatorio: true, maxLength: 120, required: true, autoComplete: 'name' })}
                    {texto('email', 'E-mail', 'email', { type: 'email', maxLength: 160, autoComplete: 'email', dica: 'Informe e-mail ou telefone para receber o aviso da resposta.' })}
                    {texto('phone', 'Telefone', 'phone', { inputMode: 'tel', maxLength: 15, mascara: mascaraTelefone })}
                    {texto('cpf', 'CPF (opcional)', 'cpf', { maxLength: 14, inputMode: 'numeric', mascara: mascaraCpf })}
                </div>
            ) : (
                <p className="text-xs text-muted-foreground">Sem identificação, você acompanha a resposta apenas pelo protocolo e senha.</p>
            )}

            {/* Isca: fora da tela e inacessível a humanos e leitores de tela. */}
            <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
                <input type="text" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={mudar('website')} />
            </div>

            {opcoes.desafio ? (
                <div className="space-y-1">
                    <p className="text-sm font-medium">{opcoes.desafio.pergunta}</p>
                    {texto('captcha_resposta', 'Resposta', 'captcha_resposta', { obrigatorio: true, inputMode: 'numeric', maxLength: 10, required: true })}
                </div>
            ) : null}

            <Button type="submit" size="lg" className="w-full" disabled={enviando || !opcoes.desafio}>
                {enviando ? 'Enviando...' : 'Enviar manifestação'}
            </Button>
        </form>
    );
}
