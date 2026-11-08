import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { parseCookies } from 'nookies';
import { useDispatch } from 'react-redux';
import { loginFetch } from '../src/store/fetchActions/auth';
import AlertModal from '../src/components/messagesModal';
import AuthCard from '../src/components/auth/AuthCard';
import { Button } from '../src/components/ui/button';
import { Campo, Input } from '../src/components/ui/campos';

const DESTAQUE = {
    titulo: 'Tecnologia que impulsiona o seu negócio.',
    texto: 'Há mais de 10 anos entregando soluções inteligentes que otimizam processos, aumentam a produtividade e garantem resultados reais.',
    beneficios: [
        'Soluções completas: sistemas integrados para otimizar processos.',
        'Segurança e confiabilidade: proteção de dados e infraestrutura robusta.',
        'Suporte especializado: time dedicado para a melhor experiência.',
    ],
};

export default function SignIn() {
    const dispatch = useDispatch();

    const [form, setForm] = useState({ cpf: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);

    const changeItem = ({ target }) => {
        setForm({ ...form, [target.name]: target.value });
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        dispatch(loginFetch(form));
    };

    return (
        <AuthCard titulo="Bem-vindo de volta!" descricao="Acesse sua conta para continuar." destaque={DESTAQUE}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <AlertModal />

                <Campo id="cpf" label="CPF" obrigatorio>
                    {(a11y) => (
                        <Input
                            {...a11y}
                            name="cpf"
                            type="text"
                            inputMode="numeric"
                            autoComplete="username"
                            placeholder="Digite seu CPF"
                            value={form.cpf}
                            onChange={changeItem}
                            autoFocus
                            required
                        />
                    )}
                </Campo>

                <Campo id="password" label="Senha" obrigatorio>
                    {(a11y) => (
                        <div className="relative">
                            <Input
                                {...a11y}
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                placeholder="Digite sua senha"
                                className="pr-11"
                                value={form.password}
                                onChange={changeItem}
                                required
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="absolute top-1/2 right-1 -translate-y-1/2"
                                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                onClick={() => setShowPassword((v) => !v)}
                            >
                                {showPassword ? <EyeOff /> : <Eye />}
                            </Button>
                        </div>
                    )}
                </Campo>

                <div className="text-right">
                    <Link href="/esqueci-senha">
                        <a className="text-sm text-primary-text underline-offset-4 hover:underline">Esqueceu a senha?</a>
                    </Link>
                </div>

                <Button type="submit" size="lg" className="w-full">
                    Entrar
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                    Não tem acesso?{' '}
                    <Link href="/cadastre-se">
                        <a className="text-primary-text underline-offset-4 hover:underline">Cadastre-se</a>
                    </Link>
                </p>
            </form>
        </AuthCard>
    );
}

export async function getServerSideProps(context) {
    const cookies = parseCookies(context);
    // sysvendas.token é httpOnly e pode persistir brevemente após o logout
    // devido a race conditions no Set-Cookie do browser.
    // sysvendas.id + sysvendas.profile são não-httpOnly e deletados de forma
    // confiável pelo handler server-side e pelo bloco catch do logoutFetch.
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
