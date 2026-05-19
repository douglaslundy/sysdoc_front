# Liquid Glass — DL Sistemas
## Guia de uso dos prompts para o Codex

---

### O que é esta pasta

Cada arquivo `.md` dentro das subpastas é um **prompt autônomo e completo** para o Codex.
Você entrega um arquivo por vez, na ordem numerada, e só avança para o próximo
após o Codex confirmar que terminou e os testes passaram.

---

### Ordem de execução obrigatória

| Ordem | Pasta / Arquivo | O que faz |
|---|---|---|
| 1 | `00-inicio/` | Apresenta o projeto ao Codex. Entregar primeiro. |
| 2 | `01-tokens/` | Cria o arquivo de variáveis CSS globais (theme.css) |
| 3 | `02-sidebar/` | Atualiza o componente Sidebar / NavMenu |
| 4 | `03-topbar/` | Atualiza o Topbar / Header |
| 5 | `04-tabela-usuarios/` | Atualiza a tela de Usuários (listagem) |
| 6 | `05-modal-cadastro/` | Atualiza o Modal de Cadastro de Usuário |
| 7 | `06-formularios/` | Atualiza Input, Select, Toggle globais |
| 8 | `07-badges-botoes/` | Atualiza Badge, IconButton, Button primário |
| 9 | `08-toggle-tema/` | Implementa o botão dark/light no Topbar |
| 10 | `09-demais-telas/` | Aplica o tema nas telas restantes do menu |
| 11 | `10-qa-final/` | Checklist de revisão visual e QA |

---

### Como entregar cada prompt ao Codex

1. Abra o arquivo `.md` da etapa atual
2. Copie o conteúdo **completo**
3. Cole no chat do Codex com a mensagem:

> "Analise e implemente o prompt abaixo no projeto DL Sistemas:"
> [cole o conteúdo do arquivo]

4. Aguarde o Codex confirmar a implementação
5. Teste visualmente a tela afetada
6. Só então abra o próximo arquivo

---

### Regra de ouro

> Nunca pule etapas. O `01-tokens` precisa existir antes de qualquer outro,
> pois todos os demais componentes dependem das variáveis CSS criadas nele.

---

### Dúvidas

Se o Codex pedir esclarecimentos sobre o framework (React, Vue, Angular),
responda com o nome do framework e o sistema de estilização usado
(CSS Modules, Tailwind, SCSS, styled-components, etc).
