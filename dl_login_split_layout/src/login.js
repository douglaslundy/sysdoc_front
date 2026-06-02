const form = document.querySelector('#loginForm');
const passwordInput = document.querySelector('#senha');
const togglePassword = document.querySelector('.toggle-password');

togglePassword?.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
  togglePassword.setAttribute('aria-label', isPassword ? 'Ocultar senha' : 'Mostrar senha');
});

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  console.info('Conecte este submit à autenticação existente do projeto.');
});
