import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockState = {
  users: { user: null },
  layout: { isOpenUserModal: true },
  accessProfiles: {
    profiles: [
      { id: 1, slug: 'atendente', nome: 'Atendente', ativo: true, pages: [{ path: '/queue' }] },
    ],
  },
};

jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
  useSelector: (selector) => selector(mockState),
}));

const apiGet = jest.fn();
jest.mock('../../../../services/api', () => ({
  api: {
    get: (...args) => apiGet(...args),
    put: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: {} }),
  },
}));

jest.mock('../../../messagesModal', () => () => null);
jest.mock('../../../../store/ducks/users', () => ({ showUser: jest.fn(() => ({ type: 'noop' })) }));
jest.mock('../../../../store/fetchActions/user', () => ({
  editUserFetch: jest.fn(() => ({ type: 'noop' })),
  addUserFetch: jest.fn(() => ({ type: 'noop' })),
}));
jest.mock('../../../../store/ducks/Layout', () => ({
  turnUserModal: jest.fn(() => ({ type: 'noop' })),
  changeTitleAlert: jest.fn(() => ({ type: 'noop' })),
  addAlertMessage: jest.fn(() => ({ type: 'noop' })),
}));
jest.mock('../../../../store/fetchActions/accessProfiles', () => ({ getAllProfiles: jest.fn(() => ({ type: 'noop' })) }));

// eslint-disable-next-line import/first
import { AuthContext } from '../../../../contexts/AuthContext';
// eslint-disable-next-line import/first
import UserModal from '../index';

beforeEach(() => {
  apiGet.mockReset();
  apiGet.mockImplementation((url) => {
    if (String(url).includes('/speciality-permissions')) {
      return Promise.resolve({
        data: [
          { speciality_id: 10, speciality_name: 'Fisioterapia', can_view: true, can_edit: true, can_insert: true },
          { speciality_id: 20, speciality_name: 'Psicologia', can_view: true, can_edit: false, can_insert: false },
        ],
      });
    }
    if (String(url).includes('/equipe-aps')) return Promise.resolve({ data: { equipes: [] } });
    if (String(url).includes('/monitor-aps/config/equipes')) return Promise.resolve({ data: { equipes: [] } });
    return Promise.resolve({ data: [] });
  });
  mockState.users.user = {
    id: 42,
    name: 'FULANO DE TAL',
    profile: 'atendente',
    phone: '',
    email: '',
    cpf: '',
  };
});

function renderModal() {
  return render(
    <AuthContext.Provider value={{ user: 999, profile: 'admin' }}>
      <UserModal />
    </AuthContext.Provider>,
  );
}

test('o checkbox "Ver" de uma especialidade da Fila pode ser desmarcado', async () => {
  renderModal();

  await screen.findByText('Permissões por especialidade da Fila');

  const fisioRow = screen.getByText('Fisioterapia').closest('tr');
  const checkboxes = fisioRow.querySelectorAll('input[type="checkbox"]');
  expect(checkboxes).toHaveLength(3);
  expect(checkboxes[0]).toBeChecked();

  fireEvent.click(checkboxes[0]);

  await waitFor(() => expect(checkboxes[0]).not.toBeChecked());
});

test('desmarcar "Ver" tambem desmarca Editar e Inserir da mesma linha', async () => {
  renderModal();
  await screen.findByText('Permissões por especialidade da Fila');

  const fisioRow = screen.getByText('Fisioterapia').closest('tr');
  const [ver, editar, inserir] = fisioRow.querySelectorAll('input[type="checkbox"]');
  expect(ver).toBeChecked();
  expect(editar).toBeChecked();
  expect(inserir).toBeChecked();

  fireEvent.click(ver);

  await waitFor(() => {
    expect(ver).not.toBeChecked();
    expect(editar).not.toBeChecked();
    expect(inserir).not.toBeChecked();
  });
});
