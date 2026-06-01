import React, { useState } from 'react';
import Image from 'next/image';
import { parseCookies } from 'nookies';
import { useDispatch } from 'react-redux';
import { loginFetch } from '../src/store/fetchActions/auth';
import AlertModal from '../src/components/messagesModal';
import LogoDark from '../assets/images/logos/logo.png';
import styles from '../styles/login-split.module.css';

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
        <main className={styles.loginPage}>
            <div className={`${styles.orb} ${styles.orbTopLeft}`} aria-hidden="true" />
            <div className={`${styles.orb} ${styles.orbBottomRight}`} aria-hidden="true" />
            <div className={`${styles.ambient} ${styles.ambientLeft}`} aria-hidden="true" />
            <div className={`${styles.ambient} ${styles.ambientRight}`} aria-hidden="true" />

            <section className={styles.loginCopy} aria-labelledby="login-copy-title">
                <span className={styles.eyebrow}>⚡ Tecnologia que transforma</span>

                <h1 id="login-copy-title">
                    Tecnologia que impulsiona<br />
                    o <span>seu negócio.</span>
                </h1>

                <p className={styles.copyDescription}>
                    Há mais de 10 anos entregando soluções inteligentes e inovadoras que
                    otimizam processos, aumentam a produtividade e garantem resultados reais.
                </p>

                <div className={styles.benefits} aria-label="Benefícios DL Sistemas">
                    <article className={styles.benefit}>
                        <div className={styles.benefitIcon} aria-hidden="true">↗</div>
                        <div>
                            <h2>Soluções completas</h2>
                            <p>Sistemas integrados para otimizar processos e aumentar a produtividade.</p>
                        </div>
                    </article>

                    <article className={styles.benefit}>
                        <div className={styles.benefitIcon} aria-hidden="true">⌾</div>
                        <div>
                            <h2>Segurança e confiabilidade</h2>
                            <p>Proteção de dados e infraestrutura robusta para o seu negócio.</p>
                        </div>
                    </article>

                    <article className={styles.benefit}>
                        <div className={styles.benefitIcon} aria-hidden="true">☏</div>
                        <div>
                            <h2>Suporte especializado</h2>
                            <p>Time dedicado para garantir a melhor experiência sempre.</p>
                        </div>
                    </article>
                </div>
            </section>

            <section className={styles.loginPanel} aria-label="Acesso ao sistema">
                <form className={styles.loginCard} onSubmit={handleSubmit}>
                    <header className={styles.cardHeader}>
                        <Image
                            className={styles.brandLogo}
                            src={LogoDark}
                            alt="DL Sistemas Soluções em TI"
                            width={270}
                            height={70}
                            style={{ display: 'block' }}
                        />
                        <h2>Bem-vindo de volta!</h2>
                        <p>Acesse sua conta para continuar.</p>
                    </header>

                    <AlertModal />

                    <div className={styles.fieldGroup}>
                        <label htmlFor="cpf">CPF</label>
                        <div className={styles.inputShell}>
                            <span aria-hidden="true">♙</span>
                            <input
                                id="cpf"
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
                        </div>
                    </div>

                    <div className={styles.fieldGroup}>
                        <label htmlFor="password">Senha</label>
                        <div className={styles.inputShell}>
                            <span aria-hidden="true">▣</span>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                placeholder="Digite sua senha"
                                value={form.password}
                                onChange={changeItem}
                                required
                            />
                            <button
                                className={styles.togglePassword}
                                type="button"
                                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                onClick={() => setShowPassword(v => !v)}
                            >
                                {showPassword ? '◎' : '◉'}
                            </button>
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <label className={styles.remember}>
                            <input type="checkbox" name="remember" />
                            <span>Lembrar-me</span>
                        </label>
                        <a href="/esqueci-senha" className={styles.forgotLink}>
                            Esqueceu a senha?
                        </a>
                    </div>

                    <button className={styles.submitButton} type="submit">
                        Entrar →
                    </button>

                    <div className={styles.safeAccess} aria-hidden="true">
                        <span />
                        <p>Acesso seguro</p>
                        <span />
                    </div>

                    <div className={styles.securityBadge} aria-label="Acesso seguro">⌾</div>
                </form>

                <footer className={styles.loginFooter}>
                    Copyright © DL Sistemas {new Date().getFullYear()} • Todos os direitos reservados.
                </footer>
            </section>
        </main>
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
