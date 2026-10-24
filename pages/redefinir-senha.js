import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import { api } from '../src/services/api';
import AuthCard from '../src/components/auth/AuthCard';
import { Banner } from '../src/components/ui/banner';
import { Button } from '../src/components/ui/button';
import { Campo, Input } from '../src/components/ui/campos';

const DESTAQUE = {
  titulo: 'Crie uma nova senha.',
  texto: 'Use ao menos 8 caracteres e não repita senhas de outros sistemas.',
};

export default function RedefinirSenha() {
  const router = useRouter();
  const { token, email } = router.query;

  const [form, setForm] = useState({ password: '', password_confirmation: '' });
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  const handleChange = ({ target: { name, value } }) => setForm((current) => ({ ...current, [name]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    if (form.password.length < 8) {
      setErro('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (form.password !== form.password_confirmation) {
      setErro('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/reset-password', { email, token, ...form });
      setSucesso(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err) {
      setErro(err.response?.data?.message || 'Erro ao redefinir senha. O link pode ter expirado.');
    } finally {
      setLoading(false);
    }
  };

  const linkInvalido = !token || !email;

  return (
    <AuthCard
      titulo="Nova senha"
      descricao="Digite a nova senha para concluir a redefinição."
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
        <Banner tom="sucesso" rotulo="Senha redefinida">
          <strong>Senha redefinida com sucesso!</strong> Você será redirecionado para o login em instantes.
        </Banner>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {erro ? <Banner tom="perigo">{erro}</Banner> : null}
          {linkInvalido ? <Banner tom="alerta">Link inválido. Solicite um novo link de redefinição.</Banner> : null}

          <Campo id="password" label="Nova senha" obrigatorio>
            {(a11y) => <Input {...a11y} name="password" type="password" autoComplete="new-password" value={form.password} onChange={handleChange} required />}
          </Campo>
          <Campo id="password_confirmation" label="Confirmar nova senha" obrigatorio>
            {(a11y) => <Input {...a11y} name="password_confirmation" type="password" autoComplete="new-password" value={form.password_confirmation} onChange={handleChange} required />}
          </Campo>

          <Button type="submit" size="lg" className="w-full" disabled={loading || linkInvalido}>
            {loading ? 'Salvando...' : 'Salvar nova senha'}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
