# Plano de Implementação do Novo Design (SysDoc Front)

Data: 2026-06-01
Projeto: sysdoc_front
Referências visuais:
- docs/ChatGPT Image 31 de mai. de 2026, 22_49_03.png
- docs/ChatGPT Image 31 de mai. de 2026, 22_50_39.png

## Objetivo
Implementar integralmente o novo design em todas as telas renderizadas do sistema, preservando 100% das funcionalidades existentes e sem regressões.

## Escopo de UI
- Rotas em pages/ e subdiretórios.
- Componentes em src/components/ e subdiretórios.
- Layout global em src/layouts/ (sidebar, header, footer, shell).
- Modais em src/components/modal/ e subdiretórios.
- Dashboards e gráficos em src/components/dashboard/ e módulos afins.

## Diagnóstico visual (modelo)
1. Tema dark azul profundo com gradientes e sem preto puro.
2. Estética glass/liquid: superfícies translúcidas com blur, bordas finas brilhantes e sombras suaves.
3. Acentos neon semânticos:
- Azul/ciano para foco, ativo e crescimento.
- Roxo para ações primárias e destaque secundário.
- Laranja em cartões de domínio específico.
- Verde/vermelho para ações editar/excluir.
4. Bordas arredondadas amplas, paddings generosos e grid respirado.
5. Sidebar com item ativo em pill com glow, seção de branding e ornamento inferior.
6. Header com toggle de tema circular e cápsula do usuário.
7. Listagens no padrão card-row (como Clientes) em vez de tabela rígida.
8. Dashboard com:
- tabs superiores de módulo,
- cards KPI coloridos,
- gráfico principal em card glass com linha/área azul e glow.

## Estratégia de implementação
### Etapa 0 - Baseline e inventário
1. Mapear rotas e componentes renderizados por rota.
2. Criar checklist por tela para execução e QA.
3. Capturar screenshots de baseline para comparação.

### Etapa 1 - Shell global (alto impacto)
1. Refatorar sidebar para modelo novo:
- item ativo com glow,
- grupos e ícones consistentes,
- ornamento inferior,
- espaçamentos equivalentes ao print.
2. Refatorar header para modelo novo:
- botão tema,
- cápsula de usuário,
- bordas e sombras glass.
3. Garantir container/padding global corretos.

### Etapa 2 - Tokens e fundamentos
1. Consolidar tokens visuais únicos:
- cor, radius, blur, sombra, borda, tipografia, espaçamento.
2. Fixar padrões funcionais:
- input 48px,
- largura e comportamento de modal,
- botões e estados de hover/foco.
3. Reduzir estilos ad-hoc e conflitos locais.

### Etapa 3 - Componentização visual reutilizável
1. Criar/ajustar componentes base:
- AppCard,
- SectionCard,
- MetricCard,
- SearchField,
- ActionIconButton,
- ListRowCard,
- GlassPagination.
2. Migrar telas para reutilizar padrão em vez de sx disperso.

### Etapa 4 - Modais (cobertura total)
1. Padronizar todos os modais em src/components/modal/** com shell compartilhado.
2. Uniformizar estrutura:
- título,
- corpo,
- ações,
- espaçamento,
- estados.
3. Preservar regras de negócio e fluxos atuais.

### Etapa 5 - Dashboard e gráficos
1. Refatorar dashboard principal para modelo do print.
2. Ajustar cards KPI por semântica de cor.
3. Ajustar gráficos (Apex/afins): eixos, grid, linha/área, tooltip, estado ativo.

### Etapa 6 - Módulos por ondas
Onda A:
- Layout global (sidebar/header) + dashboard principal.

Onda B:
- CRUD administrativos (clientes, usuários, rotas, especialidades, etc.).

Onda C:
- Laboratório, Farmácia, Monitor APS, Transparência.

Onda D:
- Refino visual final e consistência transversal.

### Etapa 7 - QA visual e regressão
1. Validar cada rota em desktop e mobile.
2. Validar contraste e legibilidade.
3. Validar estados:
- loading,
- vazio,
- erro,
- sucesso,
- disable,
- hover/focus.
4. Executar build e smoke por onda.
5. Corrigir desvios antes da próxima onda.

## Critérios de pronto
1. Todas as rotas renderizadas aderentes ao novo design.
2. Sidebar e dashboard no padrão dos prints de referência.
3. Modais com padrão único em todo o sistema.
4. Nenhuma regressão funcional.
5. Build estável e sem erros runtime.

## Riscos e mitigação
1. Risco: divergência por estilos inline antigos.
- Mitigação: migração progressiva para componentes base/tokens e limpeza por módulo.
2. Risco: regressão funcional em telas críticas.
- Mitigação: execução por ondas + smoke após cada entrega.
3. Risco: inconsistência entre módulos.
- Mitigação: checklist visual única e revisão cruzada.

## Entregáveis
1. Refatoração visual global implementada.
2. Checklist de cobertura por rota.
3. Registro de QA por onda.
4. Build final validado.

## Status da implementação (atualizado em 2026-06-01)
### Concluído
1. Shell global:
- Sidebar, header e dashboard principal alinhados ao novo estilo.
2. CRUDs principais:
- Listagens e modais de clientes, usuários, rotas, especialidades, veículos e viagens padronizados.
3. Modais críticos e secundários:
- Padronização aplicada em blocos de Queue, Letters, Ordinance, Farmácia e módulos relacionados.
4. Build:
- Build de produção validado com sucesso após as rodadas de ajustes.

### Parcialmente concluído
1. Onda C (módulos setoriais):
- Boa cobertura visual já aplicada.
- Ainda requer refinos de consistência em algumas telas específicas.

### Pendente para encerramento
1. QA visual completo por rota:
- Desktop e mobile em todas as páginas renderizadas.
2. QA funcional completo:
- CRUD, modais, anexos, filtros, paginação, geração de PDF/recibo.
3. Ajustes finais pixel a pixel:
- Tipografia, espaçamento, densidade e alinhamentos finos entre módulos.
4. Checklist final de aceite:
- Registrar status por tela (`ok`/`ajuste`) e fechar regressão zero.
