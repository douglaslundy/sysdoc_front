# SYSDOC Frontend (`sysdoc_front`)

Aplicacao Next.js do SYSDOC com painis administrativos, laboratorio, vigilancia sanitaria, farmacia, auditoria e fluxos de anexos.

## Requisitos
- Node.js 18+
- npm (ou yarn)

## Setup local
```bash
npm install
npm run dev
```

## Build e execucao
```bash
npm run build
npm run start
```

## Testes
```bash
npm run test
```

## Areas principais
- Autenticacao e controle de acesso por permissao
- Dashboards (fila, tfd, laboratorio, farmacia, vigilancia)
- Laboratorio (exames, pedidos, resultados, consulta publica)
- Vigilancia (estabelecimentos e alvaras)
- Farmacia/transparencia
- Auditoria e configuracoes administrativas
- Upload/download/exclusao de anexos em modulos suportados

## Variaveis de ambiente
Configurar `.env` apontando para a API backend e parametros de autenticacao/cookies conforme ambiente.

## Observacao
README antigo foi substituido para refletir o estado atual do projeto.