# Prompts para Claude Code ou Codex

## Prompt principal
Implemente na tela de login existente um layout split moderno, responsivo e fluido, baseado na referência visual em `assets/reference-layout.png`.

Requisitos:
1. Remover a sensação de “duas páginas”: usar um único background contínuo em azul escuro, com elementos decorativos em neon no canto superior esquerdo e inferior direito.
2. Lado esquerdo: bloco de copy institucional, sem logo. Deve conter badge, título forte, subtítulo e três benefícios com ícones.
3. Lado direito: manter o componente de login com card glassmorphism, logo centralizado no topo do card, campos CPF e senha, checkbox “Lembrar-me”, link “Esqueceu a senha?” e botão principal.
4. Preservar a lógica já existente de autenticação. Alterar apenas estrutura visual, classes e estilos necessários.
5. Usar CSS puro preferencialmente. Caso o projeto use React/Vue/Angular, adaptar a estrutura mantendo as mesmas classes sem alterar a regra de negócio.
6. Layout desktop em duas colunas; em telas menores que 900px, empilhar: copy acima e login abaixo.
7. Garantir acessibilidade básica: labels, foco visível, contraste adequado e botão com estado hover/focus.

## Prompt de integração segura
Analise a tela de login atual e aplique o novo layout sem quebrar o fluxo existente. Antes de alterar, identifique:
- componente/arquivo da tela de login;
- métodos atuais de submit;
- bindings dos campos CPF e senha;
- rota/link de recuperação de senha;
- import atual da logo.
Depois, substitua apenas o markup visual e aplique os estilos fornecidos em `src/styles.css`.

## Prompt de revisão
Revise a implementação verificando:
- responsividade em 1366px, 1024px, 768px e 390px;
- ausência de scroll horizontal;
- card de login alinhado à direita no desktop e centralizado no mobile;
- elemento luminoso superior esquerdo e inferior direito visíveis;
- logo ausente no lado esquerdo e presente apenas no card;
- contraste e foco dos inputs.
