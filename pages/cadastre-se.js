import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { parseCookies } from 'nookies';
import { api } from '../src/services/api';
import AuthCard from '../src/components/auth/AuthCard';
import { Banner } from '../src/components/ui/banner';
import { Button } from '../src/components/ui/button';
import { Campo, CampoSelecao, CampoTexto, Input } from '../src/components/ui/campos';

const DESTAQUE = {
    titulo: 'Solicite seu acesso ao sistema.',
    texto: 'Preencha seus dados e escolha a secretaria. Um gestor analisará o pedido.',
    beneficios: [
        'Análise por um gestor da sua secretaria.',
        'Você é avisado quando o pedido for analisado.',
    ],
};

const MSG_SUCESSO = 'Informações salvas e registradas com sucesso. Aguarde a autorização de um gestor.';
const OPCOES = { publica: true }; // sem token nem X-Secretaria-Id (ver api.js)
const VAZIO = {
    name: '', preferred_name: '', cpf: '', email: '', phone: '', password: '', password_confirmation: '',
    secretaria_id: '', cargo: '', observacao: '', captcha_resposta: '', website: '',
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

export default function CadastreSe() {
    const [form, setForm] = useState(VAZIO);
    const [secretarias, setSecretarias] = useState([]);
    const [desafio, setDesafio] = useState(null);
    const [indisponivel, setIndisponivel] = useState(false);
    const [mostrar, setMostrar] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [sucesso, setSucesso] = useState(false);
    const [erro, setErro] = useState('');
    const [erros, setErros] = useState({});

    const travado = useRef(false); // anti duplo clique mesmo antes do re-render
    const [falhaCarga, setFalhaCarga] = useState(false);

    // 403/404 = flag desligada (mensagem neutra); qualquer outra falha permite tentar de novo.
    const falhou = useCallback((err) => {
        if ([403, 404].includes(err?.response?.status)) setIndisponivel(true);
        else setFalhaCarga(true);
    }, []);

    const carregarDesafio = useCallback(async () => {
        try {
            const { data } = await api.get('/public/cadastro/desafio', OPCOES);
            setDesafio(data);
        } catch (err) {
            setDesafio(null);
            falhou(err);
        }
    }, [falhou]);

    const carregarTudo = useCallback(() => {
        setFalhaCarga(false);
        api.get('/public/cadastro/secretarias', OPCOES)
            .then(({ data }) => setSecretarias(Array.isArray(data) ? data : []))
            .catch(falhou);
        carregarDesafio();
    }, [carregarDesafio, falhou]);

    useEffect(() => { carregarTudo(); }, [carregarTudo]);

    const mudar = (campo, mascara) => ({ target }) => {
        const valor = mascara ? mascara(target.value) : target.value; // lê antes do updater (o DOM é restaurado)
        setForm((f) => ({ ...f, [campo]: valor }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (travado.current) return;
        setErro('');
        setErros({});
        if (form.password !== form.password_confirmation) {
            setErros({ password_confirmation: 'As senhas não coincidem.' });
            return;
        }
        travado.current = true;
        setEnviando(true);
        try {
            await api.post('/public/cadastro', {
                name: form.name,
                preferred_name: form.preferred_name,
                cpf: form.cpf,
                email: form.email,
                phone: soDigitos(form.phone),
                password: form.password,
                password_confirmation: form.password_confirmation,
                secretaria_id: Number(form.secretaria_id),
                cargo: form.cargo,
                observacao: form.observacao,
                captcha_token: desafio?.token || '',
                captcha_resposta: form.captcha_resposta,
                website: form.website, // honeypot: humano nunca preenche; o back rejeita se vier preenchido
            }, OPCOES);
            setSucesso(true);
            setDesafio(null); // token já queimado; novo pedido busca outro
            setForm(VAZIO);
            return;
        } catch (err) {
            const status = err?.response?.status;
            if (status === 429) setErro('Muitas tentativas. Tente novamente mais tarde.');
            else if ([403, 404].includes(status)) setIndisponivel(true);
            else if (status === 422) {
                const e = err.response.data?.errors || {};
                const msgs = Object.fromEntries(Object.entries(e).map(([k, v]) => [k, [].concat(v)[0]]));
                setErros(msgs);
                const destacado = Object.keys(msgs).some((k) => k in VAZIO && k !== 'website');
                setErro(destacado ? 'Revise os campos destacados.' : Object.values(msgs)[0] || 'Não foi possível validar os dados. Revise e tente novamente.');
            } else setErro('Não foi possível enviar agora. Tente novamente.');
            setForm((f) => ({ ...f, captcha_resposta: '', password: '', password_confirmation: '' }));
        } finally {
            travado.current = false;
            setEnviando(false);
        }
        carregarDesafio(); // o token é de uso único: após erro, sempre pede outro
    };

    const texto = (id, label, campo, extra = {}) => (
        <CampoTexto
            id={id}
            label={label}
            name={campo}
            value={form[campo]}
            onChange={mudar(campo, extra.mascara)}
            erro={erros[campo]}
            {...{ ...extra, mascara: undefined }}
        />
    );

    return (
        <AuthCard
            titulo="Cadastre-se"
            descricao="Solicite seu acesso ao sistema."
            destaque={DESTAQUE}
            rodape={
                <Link href="/login">
                    <a className="inline-flex items-center gap-1.5 text-sm text-primary-text underline-offset-4 hover:underline">
                        <ArrowLeft className="size-4" aria-hidden /> Voltar para o login
                    </a>
                </Link>
            }
        >
            {indisponivel ? (
                <Banner tom="info">Cadastro indisponível no momento.</Banner>
            ) : sucesso ? (
                <div className="space-y-4">
                    <Banner tom="sucesso" rotulo="Cadastro enviado">{MSG_SUCESSO}</Banner>
                    <Button type="button" variant="ghost" onClick={() => { setSucesso(false); carregarDesafio(); }}>
                        Fazer novo pedido
                    </Button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                    {erro ? <Banner tom="perigo">{erro}</Banner> : null}
                    {falhaCarga ? (
                        <Banner tom="perigo">
                            Não foi possível carregar o formulário.{' '}
                            <button type="button" className="underline" onClick={carregarTudo}>Tentar novamente</button>
                        </Banner>
                    ) : null}

                    {texto('name', 'Nome completo', 'name', { obrigatorio: true, maxLength: 50, required: true, autoComplete: 'name' })}
                    {texto('preferred_name', 'Nome preferido', 'preferred_name', { maxLength: 50 })}
                    {texto('cpf', 'CPF', 'cpf', { obrigatorio: true, maxLength: 14, inputMode: 'numeric', required: true, mascara: mascaraCpf })}
                    {texto('email', 'E-mail', 'email', { obrigatorio: true, type: 'email', maxLength: 100, required: true, autoComplete: 'email' })}
                    {texto('phone', 'Telefone', 'phone', { inputMode: 'tel', maxLength: 15, mascara: mascaraTelefone })}

                    <Campo id="password" label="Senha" obrigatorio erro={erros.password} dica="Mínimo de 8 caracteres.">
                        {(a11y) => (
                            <div className="relative">
                                <Input
                                    {...a11y}
                                    name="password"
                                    type={mostrar ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    className="pr-11"
                                    minLength={8}
                                    maxLength={72}
                                    value={form.password}
                                    onChange={mudar('password')}
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="absolute top-1/2 right-1 -translate-y-1/2"
                                    aria-label={mostrar ? 'Ocultar senha' : 'Mostrar senha'}
                                    onClick={() => setMostrar((v) => !v)}
                                >
                                    {mostrar ? <EyeOff /> : <Eye />}
                                </Button>
                            </div>
                        )}
                    </Campo>
                    {texto('password_confirmation', 'Confirmar senha', 'password_confirmation', {
                        obrigatorio: true, type: mostrar ? 'text' : 'password', autoComplete: 'new-password', maxLength: 72, required: true,
                    })}

                    <CampoSelecao
                        id="secretaria_id"
                        label="Secretaria"
                        obrigatorio
                        name="secretaria_id"
                        value={form.secretaria_id}
                        onChange={mudar('secretaria_id')}
                        erro={erros.secretaria_id}
                        required
                    >
                        <option value="">Selecione</option>
                        {secretarias.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
                    </CampoSelecao>

                    {texto('cargo', 'Cargo', 'cargo', { obrigatorio: true, maxLength: 80, required: true })}

                    <CampoTexto
                        id="observacao"
                        label="Observação"
                        multiline
                        rows={3}
                        name="observacao"
                        maxLength={200}
                        value={form.observacao}
                        onChange={mudar('observacao')}
                        erro={erros.observacao}
                        dica={`${form.observacao.length}/200`}
                    />

                    {/* Honeypot: fora da tela (display:none seria ignorado por bots), inacessível a humanos e leitores de tela. */}
                    <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
                        <input type="text" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={mudar('website')} />
                    </div>

                    {desafio ? (
                        <div className="space-y-1">
                            <p className="text-sm font-medium">{desafio.pergunta}</p>
                            {texto('captcha_resposta', 'Resposta', 'captcha_resposta', { obrigatorio: true, inputMode: 'numeric', maxLength: 10, required: true })}
                        </div>
                    ) : null}

                    <Button type="submit" size="lg" className="w-full" disabled={enviando || !desafio}>
                        {enviando ? 'Enviando...' : 'Solicitar cadastro'}
                    </Button>
                </form>
            )}
        </AuthCard>
    );
}

export async function getServerSideProps(context) {
    const cookies = parseCookies(context);
    if (cookies['sysvendas.id'] && cookies['sysvendas.profile']) {
        return { redirect: { destination: '/', permanent: false } };
    }
    return { props: {} };
}
