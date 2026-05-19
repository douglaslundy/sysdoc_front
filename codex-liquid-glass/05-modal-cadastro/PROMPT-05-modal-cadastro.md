# PROMPT 05 — Modal de Cadastro de Usuário
## Dependência: PROMPT-01 ao 04 concluídos.

---

## Sua tarefa

Atualize o **Modal / Dialog de Cadastro de Usuário** para o estilo Liquid Glass.
O modal é acionado pelo botão + da tela de Usuários e contém:

- Select de Perfil do Usuário
- Input de Nome
- Input de Email
- Input de CPF
- Toggle "Dirige veículo oficial"
- Input de Senha
- Input de Confirmar Senha
- Botão Gravar
- Botão Cancelar

---

## CSS a aplicar

### Overlay (fundo escurecido)

```css
.modal-overlay,
.dialog-overlay,
[class*="modal-backdrop"],
[class*="overlay"] {
  background: var(--lg-overlay-bg);
  backdrop-filter: var(--lg-blur-overlay);
  -webkit-backdrop-filter: var(--lg-blur-overlay);
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### Container do modal

```css
.modal,
.dialog,
[class*="modal-container"],
[class*="dialog-content"] {
  background: var(--lg-glass-modal);
  backdrop-filter: var(--lg-blur-modal);
  -webkit-backdrop-filter: var(--lg-blur-modal);
  border: 0.5px solid var(--lg-border);
  border-top: 1px solid var(--lg-border-strong);
  border-radius: 20px;
  padding: 26px;
  width: 400px;
  max-width: 95vw;
  box-shadow: var(--lg-shadow-modal);
}
```

### Título do modal

```css
.modal__title,
.dialog__title,
[class*="modal-title"] {
  font-size: 16px;
  font-weight: 600;
  color: var(--lg-text-primary);
  margin-bottom: 20px;
}
```

### Label dos campos

```css
.modal .field-label,
.modal label,
.dialog label {
  font-size: 10px;
  font-weight: 700;
  color: var(--lg-text-muted);
  letter-spacing: 0.07em;
  text-transform: uppercase;
  display: block;
  margin-bottom: 5px;
}
```

### Inputs e Selects dentro do modal

```css
.modal input,
.modal select,
.modal textarea,
.dialog input,
.dialog select {
  width: 100%;
  padding: 10px 13px;
  background: var(--lg-glass-input);
  border: 0.5px solid var(--lg-border-input);
  border-radius: 10px;
  color: var(--lg-text-primary);
  font-size: 13px;
  outline: none;
  transition: all 0.14s ease;
  appearance: none;
  box-shadow: 0 1px 3px rgba(var(--lg-accent-rgb), 0.05),
              0 1px 0 rgba(255,255,255,0.1) inset;
}
.modal input::placeholder,
.dialog input::placeholder {
  color: var(--lg-text-muted);
}
.modal input:focus,
.modal select:focus,
.dialog input:focus {
  border-color: var(--lg-border-input-focus);
  background: var(--lg-glass-input-focus);
  box-shadow: var(--lg-focus-ring);
}
```

### Toggle — Dirige veículo oficial

```css
/* Container do toggle */
.toggle-row,
[class*="toggle-container"],
[class*="switch-container"] {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 13px;
  background: rgba(var(--lg-accent-rgb), 0.04);
  border: 0.5px solid var(--lg-border-input);
  border-radius: 10px;
  margin-bottom: 12px;
}

/* Label do toggle */
.toggle-row label,
[class*="toggle-label"] {
  font-size: 13px;
  color: var(--lg-text-secondary);
  text-transform: none;
  letter-spacing: normal;
  font-weight: 400;
  margin: 0;
}

/* Track do toggle */
.toggle-track,
[class*="switch-track"],
input[type="checkbox"][class*="toggle"] + span {
  width: 38px;
  height: 21px;
  border-radius: 11px;
  background: var(--lg-toggle-off);
  position: relative;
  cursor: pointer;
  transition: background 0.2s ease;
  flex-shrink: 0;
  display: inline-block;
}

/* Toggle ativo */
.toggle-track.is-on,
input[type="checkbox"]:checked + .toggle-track,
[class*="switch"].is-active .toggle-track {
  background: linear-gradient(90deg, var(--lg-accent), #7C3AED);
}

/* Thumb do toggle */
.toggle-track::after,
input[type="checkbox"] + .toggle-track::after {
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
.toggle-track.is-on::after,
input[type="checkbox"]:checked + .toggle-track::after {
  transform: translateX(17px);
}
```

### Botão Gravar (primário)

```css
.modal .btn-primary,
.modal .btn-submit,
.dialog .btn-primary {
  flex: 1;
  padding: 11px;
  background: linear-gradient(135deg, var(--lg-accent), #6D28D9);
  border: none;
  border-radius: 10px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: var(--lg-shadow-btn);
  transition: opacity 0.14s ease, transform 0.14s ease;
  width: 100%;
}
.modal .btn-primary:hover,
.dialog .btn-primary:hover {
  opacity: 0.92;
  transform: translateY(-1px);
}
```

### Botão Cancelar (secundário)

```css
.modal .btn-cancel,
.modal .btn-secondary,
.dialog .btn-cancel {
  padding: 11px 18px;
  background: var(--lg-glass-input);
  border: 0.5px solid var(--lg-border-input);
  border-radius: 10px;
  color: var(--lg-text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: background 0.14s ease, color 0.14s ease;
}
.modal .btn-cancel:hover,
.dialog .btn-cancel:hover {
  background: var(--lg-glass-input-focus);
  color: var(--lg-text-primary);
}

/* Wrapper dos botões */
.modal__actions,
.dialog__actions,
[class*="modal-footer"] {
  display: flex;
  gap: 8px;
  margin-top: 18px;
}
```

---

## Checklist de validação

- [ ] Overlay tem efeito blur sobre o conteúdo ao fundo
- [ ] Container do modal é translúcido glass com borda superior reflexo
- [ ] Labels dos campos em maiúscula pequena e cor muted
- [ ] Inputs com fundo glass, borda sutil e focus ring azul
- [ ] Select com mesmo estilo dos inputs
- [ ] Toggle com track glass e thumb branco, gradiente azul→roxo quando ativo
- [ ] Botão Gravar com gradiente e sombra colorida
- [ ] Botão Cancelar com estilo glass secundário
- [ ] Modal funciona em dark e light
- [ ] Abertura e fechamento do modal não apresentam regressões

Quando terminar, confirme e aguarde o próximo prompt.
