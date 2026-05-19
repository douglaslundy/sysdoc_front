# PROMPT 08 — Toggle Dark / Light no Topbar
## Dependência: PROMPT-01 ao 07 concluídos.

---

## Sua tarefa

Implemente o **botão de alternância de tema** (dark ↔ light) dentro do Topbar.
O tema é controlado pelo atributo `data-theme` no elemento `<html>` ou `<body>`.
A preferência do usuário deve ser salva no `localStorage`.

---

## Onde adicionar

No componente Topbar / Header, ao lado do chip do usuário logado,
adicione um botão de ícone para alternar o tema.

---

## HTML / Template do botão

Adicione este elemento dentro do Topbar, antes do avatar chip:

```html
<!-- React / JSX -->
<button
  className="btn-icon btn-icon--default theme-toggle-btn"
  onClick={toggleTheme}
  aria-label="Alternar tema"
  title="Alternar entre dark e light"
>
  <i className={`ti ${isDark ? 'ti-sun' : 'ti-moon'}`} aria-hidden="true" />
</button>

<!-- Vue template -->
<button
  class="btn-icon btn-icon--default theme-toggle-btn"
  @click="toggleTheme"
  aria-label="Alternar tema"
  :title="isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'"
>
  <i :class="`ti ${isDark ? 'ti-sun' : 'ti-moon'}`" aria-hidden="true" />
</button>

<!-- HTML puro -->
<button
  class="btn-icon btn-icon--default theme-toggle-btn"
  id="theme-toggle"
  aria-label="Alternar tema"
>
  <i class="ti ti-moon" aria-hidden="true" id="theme-icon" />
</button>
```

---

## Lógica JavaScript

### Implementação para React

```jsx
// hook useTheme.js (ou .ts)
import { useState, useEffect } from 'react';

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('lg-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('lg-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  return { isDark, toggleTheme };
}

// Uso no Topbar.jsx
import { useTheme } from '../hooks/useTheme';

export function Topbar() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="topbar">
      {/* ... conteúdo existente ... */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          className="btn-icon btn-icon--default theme-toggle-btn"
          onClick={toggleTheme}
          aria-label="Alternar tema"
        >
          <i className={`ti ${isDark ? 'ti-sun' : 'ti-moon'}`} aria-hidden="true" />
        </button>
        {/* chip do usuário existente */}
      </div>
    </header>
  );
}
```

### Implementação para Vue 3

```js
// composable useTheme.js
import { ref, watch } from 'vue';

const isDark = ref(
  localStorage.getItem('lg-theme')
    ? localStorage.getItem('lg-theme') === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches
);

watch(isDark, (val) => {
  document.documentElement.setAttribute('data-theme', val ? 'dark' : 'light');
  localStorage.setItem('lg-theme', val ? 'dark' : 'light');
}, { immediate: true });

export function useTheme() {
  const toggleTheme = () => { isDark.value = !isDark.value; };
  return { isDark, toggleTheme };
}
```

### Implementação para HTML puro / jQuery

```js
(function() {
  const STORAGE_KEY = 'lg-theme';
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  const icon = document.getElementById('theme-icon');

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    if (icon) {
      icon.className = theme === 'dark' ? 'ti ti-sun' : 'ti ti-moon';
    }
  }

  function getInitialTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  applyTheme(getInitialTheme());

  if (btn) {
    btn.addEventListener('click', function() {
      const current = root.getAttribute('data-theme');
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }
})();
```

---

## CSS do botão toggle de tema

```css
.theme-toggle-btn {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  border: 0.5px solid var(--lg-border-input);
  background: var(--lg-glass-input);
  color: var(--lg-text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 17px;
  transition: all 0.14s ease;
  backdrop-filter: blur(8px);
}
.theme-toggle-btn:hover {
  background: var(--lg-glass-input-focus);
  color: var(--lg-text-primary);
  transform: scale(1.07);
}
```

---

## Inicialização ao carregar a página

Adicione este script o mais cedo possível no `<head>` do HTML principal
para evitar flash de tema errado (FOUC):

```html
<script>
  (function() {
    var saved = localStorage.getItem('lg-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  })();
</script>
```

---

## Checklist de validação

- [ ] Botão de tema aparece no topbar ao lado do chip do usuário
- [ ] Ícone mostra sol (tema dark ativo) ou lua (tema light ativo)
- [ ] Clique alterna o tema visualmente de imediato
- [ ] Preferência é salva no localStorage
- [ ] Ao recarregar a página, o tema salvo é aplicado
- [ ] Não há flash de tema errado no carregamento (FOUC)
- [ ] Botão respeita o estilo glass dos demais icon buttons

Quando terminar, confirme e aguarde o próximo prompt.
