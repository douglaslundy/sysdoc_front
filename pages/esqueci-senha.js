import React, { useState } from 'react';
import Image from 'next/image';
import { parseCookies } from 'nookies';
import FeatherIcon from 'feather-icons-react';
import { api } from '../src/services/api';
import LogoDark from '../assets/images/logos/logo.png';
import styles from '../styles/login-split.module.css';

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
                setErro('Nao foi possivel enviar o e-mail no momento por indisponibilidade do servico de envio. Tente novamente em instantes.');
            } else {
                setErro(err?.response?.data?.message || 'Erro ao enviar e-mail. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className={styles.loginPage}>
            <div className={`${styles.orb} ${styles.orbTopLeft}`} aria-hidden="true" />
            <div className={`${styles.orb} ${styles.orbBottomRight}`} aria-hidden="true" />
            <div className={`${styles.ambient} ${styles.ambientLeft}`} aria-hidden="true" />
            <div className={`${styles.ambient} ${styles.ambientRight}`} aria-hidden="true" />

            <section className={styles.loginCopy} aria-labelledby="recovery-copy-title">
                <span className={styles.eyebrow}>Recuperacao de acesso</span>

                <h1 id="recovery-copy-title">
                    Redefina sua senha<br />
                    sem sair do <span>mesmo ambiente.</span>
                </h1>

                <p className={styles.copyDescription}>
                    Informe o e-mail cadastrado para receber o link de redefinicao. O processo
                    mantem o mesmo padrao visual da tela de login e preserva a experiencia do sistema.
                </p>

                <div className={styles.benefits} aria-label="Como funciona a recuperacao">
                    <article className={styles.benefit}>
                        <div className={styles.benefitIcon} aria-hidden="true">
                            <FeatherIcon icon="mail" width="24" height="24" />
                        </div>
                        <div>
                            <h2>Envio imediato</h2>
                            <p>O link e enviado ao e-mail cadastrado assim que o formulario e validado.</p>
                        </div>
                    </article>

                    <article className={styles.benefit}>
                        <div className={styles.benefitIcon} aria-hidden="true">
                            <FeatherIcon icon="shield" width="24" height="24" />
                        </div>
                        <div>
                            <h2>Fluxo seguro</h2>
                            <p>A solicitacao segue o mesmo padrao visual e de protecao usado no login.</p>
                        </div>
                    </article>

                    <article className={styles.benefit}>
                        <div className={styles.benefitIcon} aria-hidden="true">
                            <FeatherIcon icon="arrow-left" width="24" height="24" />
                        </div>
                        <div>
                            <h2>Retorno rapido</h2>
                            <p>Apos redefinir a senha, voce volta ao login com apenas um clique.</p>
                        </div>
                    </article>
                </div>
            </section>

            <section className={styles.loginPanel} aria-label="Recuperacao de senha">
                <form className={styles.loginCard} onSubmit={handleSubmit}>
                    <header className={styles.cardHeader}>
                        <Image
                            className={styles.brandLogo}
                            src={LogoDark}
                            alt="DL Sistemas Solucoes em TI"
                            width={270}
                            height={70}
                            style={{ display: 'block' }}
                        />
                        <h2>Esqueceu a senha?</h2>
                        <p>Digite o e-mail cadastrado para receber o link de redefinicao.</p>
                    </header>

                    {sucesso ? (
                        <div className={styles.statusMessage} role="status" aria-live="polite">
                            <div className={styles.statusIcon} aria-hidden="true">
                                <FeatherIcon icon="check-circle" width="20" height="20" />
                            </div>
                            <div>
                                <strong>E-mail enviado</strong>
                                <p>
                                    Se o endereco estiver cadastrado, voce recebera as instrucoes em
                                    breve. Verifique tambem a caixa de spam.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.recoveryFormWrap}>
                            {erro ? (
                                <div className={`${styles.statusMessage} ${styles.statusError}`} role="alert">
                                    <div className={styles.statusIcon} aria-hidden="true">
                                        <FeatherIcon icon="alert-triangle" width="20" height="20" />
                                    </div>
                                    <div>
                                        <strong>Nao foi possivel enviar</strong>
                                        <p>{erro}</p>
                                    </div>
                                </div>
                            ) : null}

                            <div className={styles.fieldGroup}>
                                <label htmlFor="email">E-mail</label>
                                <div className={styles.inputShell}>
                                    <span aria-hidden="true">@</span>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        inputMode="email"
                                        autoComplete="email"
                                        placeholder="Digite seu e-mail cadastrado"
                                        value={email}
                                        onChange={event => setEmail(event.target.value)}
                                        autoFocus
                                        required
                                    />
                                </div>
                            </div>

                            <button className={styles.submitButton} type="submit" disabled={loading}>
                                {loading ? 'Enviando...' : 'Enviar link de redefinicao'}
                            </button>
                        </div>
                    )}

                    <div className={styles.recoveryFooter}>
                        <a href="/login" className={styles.backLink}>
                            <FeatherIcon icon="arrow-left" width="16" height="16" />
                            Voltar para o login
                        </a>
                    </div>
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
