# PROMPT 04 — Tela de Usuários (listagem)
## Dependência: PROMPT-01, 02 e 03 concluídos.

---

## Sua tarefa

Atualize a tela **Administração → Usuários** para o estilo Liquid Glass.
Esta é a tela principal identificada nos prints do cliente.

Elementos a atualizar nesta tela:
- Campo de busca
- Botão de adicionar usuário (+)
- Tabela de listagem (container, cabeçalho, linhas, hover)
- Avatar com iniciais do usuário
- Badge de perfil (USER / DRIVER / VISA)
- Botões de ação (editar / excluir)
- Paginação

---

## CSS a aplicar

### Campo de busca

```css
.search-input,
.user-search,
[class*="search"] input {
  background: var(--lg-glass-input);
  border: 0.5px solid var(--lg-border-input);
  border-radius: 11px;
  color: var(--lg-text-primary);
  backdrop-filter: var(--lg-blur-input);
  -webkit-backdrop-filter: var(--lg-blur-input);
  padding: 10px 13px 10px 38px;
  font-size: 13px;
  outline: none;
  width: 100%;
  transition: all 0.15s ease;
  box-shadow: 0 1px 3px rgba(var(--lg-accent-rgb), 0.06),
              0 1px 0 rgba(255,255,255,0.12) inset;
}
.search-input::placeholder { color: var(--lg-text-muted); }
.search-input:focus {
  border-color: var(--lg-border-input-focus);
  background: var(--lg-glass-input-focus);
  box-shadow: var(--lg-focus-ring);
}
```

### Botão adicionar (+)

```css
.btn-add-user,
.btn-new,
[class*="btn-add"],
[class*="btn-new"] {
  background: linear-gradient(135deg, var(--lg-accent), #6D28D9);
  border: none;
  border-radius: 12px;
  color: #ffffff;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--lg-shadow-btn);
  transition: transform 0.14s ease, box-shadow 0.14s ease;
  flex-shrink: 0;
}
.btn-add-user:hover {
  transform: translateY(-1px);
  box-shadow: var(--lg-shadow-btn-hover);
}
```

### Container da tabela

```css
.users-table,
.data-table,
[class*="table-container"],
[class*="list-container"] {
  background: var(--lg-glass-panel);
  backdrop-filter: var(--lg-blur-panel);
  -webkit-backdrop-filter: var(--lg-blur-panel);
  border: 0.5px solid var(--lg-border);
  border-top: 1px solid var(--lg-border-strong);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--lg-shadow-panel);
}
```

### Cabeçalho da tabela

```css
.users-table thead,
.users-table .table-head,
.data-table thead,
[class*="table-header"] {
  background: var(--lg-glass-table-head);
  border-bottom: 0.5px solid var(--lg-border-row);
}

.users-table th,
.data-table th,
[class*="table-header"] th {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.09em;
  color: var(--lg-text-muted);
  text-transform: uppercase;
  padding: 10px 18px;
}
```

### Linhas da tabela

```css
.users-table tbody tr,
.data-table tbody tr,
[class*="table-row"] {
  border-bottom: 0.5px solid var(--lg-border-row);
  transition: background 0.12s ease;
  cursor: default;
}
.users-table tbody tr:last-child,
.data-table tbody tr:last-child {
  border-bottom: none;
}
.users-table tbody tr:hover,
.data-table tbody tr:hover {
  background: var(--lg-glass-row-hover);
}

.users-table td,
.data-table td {
  padding: 13px 18px;
  vertical-align: middle;
  color: var(--lg-text-primary);
  font-size: 13px;
}
```

### Avatar com iniciais

Substitua ícones genéricos de usuário por um elemento com as iniciais do nome.
Implemente uma função utilitária que gera iniciais e uma cor de fundo baseada
no nome do usuário:

```js
/* utilitário — getUserAvatar(name) */
function getInitials(name) {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

/* Paleta de cores para avatares — usa hash do nome */
const avatarColors = [
  'linear-gradient(135deg,#10B981,#059669)', /* verde */
  'linear-gradient(135deg,#3B82F6,#2563EB)', /* azul */
  'linear-gradient(135deg,#F59E0B,#D97706)', /* âmbar */
  'linear-gradient(135deg,#EC4899,#DB2777)', /* rosa */
  'linear-gradient(135deg,#8B5CF6,#7C3AED)', /* roxo */
  'linear-gradient(135deg,#14B8A6,#0D9488)', /* teal */
  'linear-gradient(135deg,#F97316,#EA580C)', /* laranja */
];

function getAvatarColor(name) {
  const hash = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return avatarColors[hash % avatarColors.length];
}
```

CSS do avatar:

```css
.user-avatar-initials {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: #ffffff;
  flex-shrink: 0;
  box-shadow: var(--lg-shadow-avatar);
  /* background é definido inline via getAvatarColor(name) */
}
```

### Nome e role na mesma célula

```css
.user-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--lg-text-primary);
  line-height: 1.3;
}
.user-cpf {
  font-size: 12px;
  font-weight: 500;
  color: var(--lg-text-secondary);
}
.user-email {
  font-size: 11px;
  color: var(--lg-text-muted);
  margin-top: 2px;
}
```

### Badges de perfil

```css
.role-badge {
  display: inline-block;
  font-size: 9.5px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 5px;
  letter-spacing: 0.05em;
  margin-top: 3px;
}
.role-badge--user   { background: var(--lg-badge-user-bg);   color: var(--lg-badge-user-color); }
.role-badge--driver { background: var(--lg-badge-driver-bg); color: var(--lg-badge-driver-color); }
.role-badge--visa   { background: var(--lg-badge-visa-bg);   color: var(--lg-badge-visa-color); }
```

Aplique a classe correta com base no valor do campo `role` / `perfil` retornado pela API.

### Botões de ação (editar / excluir)

```css
.btn-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 0.5px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  backdrop-filter: blur(8px);
  transition: background 0.12s ease, transform 0.12s ease;
}
.btn-icon:hover { transform: scale(1.07); }

.btn-icon--edit {
  background: rgba(var(--lg-accent-rgb), 0.08);
  border-color: rgba(var(--lg-accent-rgb), 0.2);
  color: var(--lg-accent);
}
.btn-icon--edit:hover {
  background: rgba(var(--lg-accent-rgb), 0.18);
}

.btn-icon--delete {
  background: rgba(var(--lg-danger-rgb), 0.07);
  border-color: rgba(var(--lg-danger-rgb), 0.2);
  color: var(--lg-danger);
}
.btn-icon--delete:hover {
  background: rgba(var(--lg-danger-rgb), 0.16);
}
```

### Paginação

```css
.pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
  font-size: 12px;
  color: var(--lg-text-secondary);
}
.pagination__btn {
  width: 28px;
  height: 28px;
  background: var(--lg-glass-input);
  border: 0.5px solid var(--lg-border);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 13px;
  color: var(--lg-text-secondary);
  transition: background 0.12s ease, color 0.12s ease;
}
.pagination__btn:hover {
  background: var(--lg-glass-panel-hover);
  color: var(--lg-text-primary);
}
```

---

## Checklist de validação

- [ ] Campo de busca tem efeito glass e placeholder muted
- [ ] Botão + tem gradiente azul→roxo com sombra colorida
- [ ] Container da tabela é translúcido sobre o fundo
- [ ] Cabeçalho da tabela tem fundo levemente diferenciado
- [ ] Hover nas linhas é suave e glass
- [ ] Avatares mostram iniciais coloridas (não ícone genérico)
- [ ] Badges USER / DRIVER / VISA com cores corretas em dark e light
- [ ] Botões editar (azul) e excluir (vermelho) com glass tintado
- [ ] Paginação com botões glass

Quando terminar, confirme e aguarde o próximo prompt.
