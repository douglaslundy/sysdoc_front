import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

let mockRouter = { pathname: '/', asPath: '/', push: jest.fn() };
jest.mock('next/router', () => ({ useRouter: () => mockRouter }));

// eslint-disable-next-line import/first
import { AuthContext } from '../../../contexts/AuthContext';
// eslint-disable-next-line import/first
import AuthGuard from '../index';

function renderGuard({ pathname, asPath, profile = 'manager', myPermissions = [], permissionsLoaded = true }) {
  mockRouter = { pathname, asPath: asPath ?? pathname, push: jest.fn() };
  return render(
    <AuthContext.Provider value={{ profile, myPermissions, permissionsLoaded }}>
      <AuthGuard><div>CONTEUDO PROTEGIDO</div></AuthGuard>
    </AuthContext.Provider>,
  );
}

const bloqueado = () => screen.queryByText('Acesso Não Autorizado');
const liberado = () => screen.queryByText('CONTEUDO PROTEGIDO');

test('gerente com /protocolo/novo acessa a pagina catch-all de criar protocolo', () => {
  renderGuard({
    pathname: '/protocolo/[...slug]',
    asPath: '/protocolo/novo',
    myPermissions: ['/protocolo/caixa-entrada', '/protocolo/novo'],
  });
  expect(liberado()).toBeInTheDocument();
  expect(bloqueado()).not.toBeInTheDocument();
});

test('quem so tem a caixa de entrada ainda abre o detalhe do protocolo (acesso a secao)', () => {
  renderGuard({
    pathname: '/protocolo/[...slug]',
    asPath: '/protocolo/123',
    myPermissions: ['/protocolo/caixa-entrada'],
  });
  expect(liberado()).toBeInTheDocument();
});

test('sem nenhuma permissao de protocolo o acesso e negado', () => {
  renderGuard({
    pathname: '/protocolo/[...slug]',
    asPath: '/protocolo/novo',
    myPermissions: ['/laboratorio/exames'],
  });
  expect(bloqueado()).toBeInTheDocument();
  expect(liberado()).not.toBeInTheDocument();
});

test('rota dinamica comum continua herdando do menu pai (sem regressao)', () => {
  renderGuard({
    pathname: '/laboratorio/exames/[id]/campos',
    asPath: '/laboratorio/exames/5/campos',
    myPermissions: ['/laboratorio/exames'],
  });
  expect(liberado()).toBeInTheDocument();
});

test('admin sempre passa', () => {
  renderGuard({
    pathname: '/protocolo/[...slug]',
    asPath: '/protocolo/novo',
    profile: 'admin',
    myPermissions: [],
  });
  expect(liberado()).toBeInTheDocument();
});

test('enquanto as permissoes carregam, mostra o spinner (nao nega)', () => {
  renderGuard({
    pathname: '/protocolo/[...slug]',
    asPath: '/protocolo/novo',
    myPermissions: [],
    permissionsLoaded: false,
  });
  expect(bloqueado()).not.toBeInTheDocument();
  expect(liberado()).not.toBeInTheDocument();
});
