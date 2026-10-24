import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { parseCookies } from 'nookies';
import { api } from '../src/services/api';
import AuthCard from '../src/components/auth/AuthCard';
import { Banner } from '../src/components/ui/banner';
import { Button } from '../src/components/ui/button';
import { Campo, Input } from '../src/components/ui/campos';

const DESTAQUE = {
    titulo: 'Redefina sua senha sem sair do mesmo ambiente.',
    texto: 'Informe o e-mail cadastrado para receber o link de redefinição.',
    beneficios: [
        'Envio imediato: o link vai ao e-mail cadastrado assim que o formulário é validado.',
        'Fluxo seguro: a solicitação segue o mesmo padrão de proteção do login.',
        'Retorno rápido: após redefinir, você volta ao login com um clique.',
    ],
};

export default function EsqueciSenha() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sucesso, setSucesso] = useState(false);
    const [erro, setErro] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErro('');
        setLoading(true);

        try {
            await api.post('/forgot-password', { email });
            setSucesso(true);
        } catch (err) {
            const apiMessage = String(err?.response?.data?.message || '');
            const lower = apiMessage.toLowerCase();

            if (err?.response?.status === 429) {
                setErro('Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.');
            } else if (lower.includes('authentication required') || lower.includes('expected response code "250" but got code "530"')) {
                setErro('Não foi possível enviar o e-mail no momento por indisponibilidade do serviço de envio. Tente novamente em instantes.');
            } else {
                setErro(err?.response?.data?.message || 'Erro ao enviar e-mail. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthCard
            titulo="Esqueceu a senha?"
            descricao="Digite o e-mail cadastrado para receber o link de redefinição."
            destaque={DESTAQUE}
            rodape={
                <Link href="/login">
                    <a className="inline-flex items-center gap-1.5 text-sm text-primary-text underline-offset-4 hover:underline">
                        <ArrowLeft className="size-4" aria-hidden /> Voltar para o login
                    </a>
                </Link>
            }
        >
            {sucesso ? (
                <Banner tom="sucesso" rotulo="E-mail enviado">
                    <strong>E-mail enviado.</strong> Se o endereço estiver cadastrado, você receberá as instruções em breve. Verifique também a caixa de spam.
                </Banner>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {erro ? (
                        <Banner tom="perigo">
                            <strong>Não foi possível enviar.</strong> {erro}
                        </Banner>
                    ) : null}

                    <Campo id="email" label="E-mail" obrigatorio>
                        {(a11y) => (
                            <Input
                                {...a11y}
                                name="email"
                                type="email"
                                inputMode="email"
                                autoComplete="email"
                                placeholder="Digite seu e-mail cadastrado"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                autoFocus
                                required
                            />
                        )}
                    </Campo>

                    <Button type="submit" size="lg" className="w-full" disabled={loading}>
                        {loading ? 'Enviando...' : 'Enviar link de redefinição'}
                    </Button>
                </form>
            )}
        </AuthCard>
    );
}

export async function getServerSideProps(context) {
    const cookies = parseCookies(context);
    const hasSession = cookies['sysvendas.id'] && cookies['sysvendas.profile'];

    if (hasSession) {
        return {
            redirect: {
                destination: '/',
                permanent: false,
            },
        };
    }

    return { props: {} };
}
