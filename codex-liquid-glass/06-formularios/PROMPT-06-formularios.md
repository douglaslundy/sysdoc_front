# PROMPT 06 — Componentes de Formulário Globais
## Dependência: PROMPT-01 ao 05 concluídos.

---

## Sua tarefa

Atualize todos os componentes de formulário reutilizáveis do projeto
para o estilo Liquid Glass. Estes estilos se aplicam **globalmente**,
em todas as telas — não apenas na tela de Usuários.

Componentes a atualizar:
- Input de texto genérico
- Select / Dropdown genérico
- Textarea genérico
- Checkbox
- Toggle / Switch (versão global, fora do modal)
- Label de campo

---

## CSS a aplicar

### Input de texto global

```css
input[type="text"],
input[type="email"],
input[type="password"],
input[type="number"],
input[type="tel"],
input[type="date"],
input[type="search"],
.form-input,
[class*="input-field"] {
  background: var(--lg-glass-input);
  border: 0.5px solid var(--lg-border-input);
  border-radius: 10px;
  color: var(--lg-text-primary);
  font-size: 13px;
  padding: 10px 13px;
  outline: none;
  transition: all 0.15s ease;
  width: 100%;
  backdrop-filter: var(--lg-blur-input);
  -webkit-backdrop-filter: var(--lg-blur-input);
  box-shadow: 0 1px 0 rgba(255,255,255,0.08) inset;
}
input::placeholder,
.form-input::placeholder {
  color: var(--lg-text-muted);
}
input:focus,
.form-input:focus {
  border-color: var(--lg-border-input-focus);
  background: var(--lg-glass-input-focus);
  box-shadow: var(--lg-focus-ring);
}
input:disabled,
.form-input:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
```

### Select global

```css
select,
.form-select,
[class*="select-field"] {
  background: var(--lg-glass-input);
  border: 0.5px solid var(--lg-border-input);
  border-radius: 10px;
  color: var(--lg-text-primary);
  font-size: 13px;
  padding: 10px 13px;
  outline: none;
  appearance: none;
  cursor: pointer;
  width: 100%;
  transition: all 0.15s ease;
}
select:focus {
  border-color: var(--lg-border-input-focus);
  background: var(--lg-glass-input-focus);
  box-shadow: var(--lg-focus-ring);
}
select option {
  background: #1a2a50;
  color: #ffffff;
}
[data-theme="light"] select option {
  background: #ffffff;
  color: #0F172A;
}
```

### Textarea global

```css
textarea,
.form-textarea {
  background: var(--lg-glass-input);
  border: 0.5px solid var(--lg-border-input);
  border-radius: 10px;
  color: var(--lg-text-primary);
  font-size: 13px;
  padding: 10px 13px;
  outline: none;
  width: 100%;
  resize: vertical;
  min-height: 80px;
  transition: all 0.15s ease;
  font-family: inherit;
}
textarea:focus {
  border-color: var(--lg-border-input-focus);
  background: var(--lg-glass-input-focus);
  box-shadow: var(--lg-focus-ring);
}
textarea::placeholder { color: var(--lg-text-muted); }
```

### Checkbox

```css
input[type="checkbox"],
.form-checkbox {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 0.5px solid var(--lg-border-input);
  background: var(--lg-glass-input);
  accent-color: var(--lg-accent);
  cursor: pointer;
  flex-shrink: 0;
}
```

### Label global

```css
label,
.form-label,
[class*="field-label"] {
  font-size: 11px;
  font-weight: 600;
  color: var(--lg-text-muted);
  letter-spacing: 0.07em;
  text-transform: uppercase;
  display: block;
  margin-bottom: 5px;
}
```

### Grupo de campo (field group)

```css
.form-group,
.field-group,
[class*="form-field"] {
  margin-bottom: 14px;
}
```

### Toggle / Switch global

```css
/* Wrapper */
.form-toggle,
[class*="toggle-wrapper"],
[class*="switch-wrapper"] {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 13px;
  background: rgba(var(--lg-accent-rgb), 0.04);
  border: 0.5px solid var(--lg-border-input);
  border-radius: 10px;
  cursor: pointer;
}

/* Label */
.form-toggle__label {
  font-size: 13px;
  color: var(--lg-text-secondary);
  text-transform: none;
  letter-spacing: normal;
  font-weight: 400;
  margin: 0;
}

/* Track */
.form-toggle__track {
  width: 38px;
  height: 21px;
  border-radius: 11px;
  background: var(--lg-toggle-off);
  position: relative;
  flex-shrink: 0;
  transition: background 0.2s ease;
}
.form-toggle__track.active,
.form-toggle.is-on .form-toggle__track {
  background: linear-gradient(90deg, var(--lg-accent), #7C3AED);
}

/* Thumb */
.form-toggle__track::after {
  content: '';
  position: absolute;
  width: 15px;
  height: 15px;
  background: #ffffff;
  border-radius: 50%;
  top: 3px;
  left: 3px;
  transition: transform 0.2s ease;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
}
.form-toggle__track.active::after,
.form-toggle.is-on .form-toggle__track::after {
  transform: translateX(17px);
}
```

### Card de formulário (quando formulário fica dentro de card)

```css
.form-card,
[class*="form-container"],
[class*="form-panel"] {
  background: var(--lg-glass-panel);
  backdrop-filter: var(--lg-blur-panel);
  -webkit-backdrop-filter: var(--lg-blur-panel);
  border: 0.5px solid var(--lg-border);
  border-top: 1px solid var(--lg-border-strong);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--lg-shadow-panel);
}
```

---

## Checklist de validação

Teste em pelo menos 3 telas que tenham formulários:

- [ ] Inputs com fundo glass e borda sutil
- [ ] Placeholder na cor muted
- [ ] Focus com ring azul visível
- [ ] Select com mesmo estilo do input
- [ ] Textarea com resize vertical e estilo glass
- [ ] Labels em maiúscula pequena e cor muted
- [ ] Toggle com thumb branco e gradiente azul quando ativo
- [ ] Todos os campos funcionam em dark e light
- [ ] Nenhuma validação existente foi quebrada

Quando terminar, confirme e aguarde o próximo prompt.
