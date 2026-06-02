# Implementação — Login Split DL Sistemas

Este pacote contém os arquivos-base para implementar o layout split da tela de login.

Arquivos:
- `assets/reference-layout.png`: imagem de referência aprovada.
- `palette.md`: paleta de cores e tokens visuais.
- `prompts.md`: prompts para Claude Code ou Codex.
- `src/index.html`: estrutura HTML-base.
- `src/styles.css`: estilos completos do layout.
- `src/login.js`: comportamento visual básico, sem autenticação real.

Como integrar:
1. Localize o componente atual da tela de login.
2. Preserve a lógica de autenticação já existente.
3. Adapte o HTML de `src/index.html` ao framework usado.
4. Copie os estilos de `src/styles.css` para o CSS/SCSS da tela.
5. Substitua `assets/logo-dl.png` pelo caminho real da logo do projeto.

Observação: `login.js` serve apenas como exemplo de interação visual. Não substitui o código real de login.
