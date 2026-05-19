# context/project.md — Contexto Completo do Projeto Monitor APS

## Identificação do Sistema Existente

O módulo será acoplado a um sistema de gestão municipal em uso pela **Secretaria Municipal de Saúde de Ilicínea – MG** (SMS Ilicínea). O sistema existente possui:
- Autenticação de usuários (login/senha)
- Menu lateral de navegação
- Layout com sidebar + conteúdo principal
- Conexão própria ao banco de dados municipal

**Importante**: O módulo Monitor APS **não altera nada** no sistema existente. Ele se integra como uma nova entrada no menu de navegação e carrega suas próprias rotas e componentes.

---

## Contexto do Município

- **Município**: Ilicínea – MG
- **IBGE**: A verificar
- **Porte**: Município de pequeno porte (regra IED se aplica)
- **CNES da UBS**: 2794454
- **Órgão gestor**: SMS Ilicínea

O sistema deve ser configurável para qualquer município, mas os padrões iniciais refletem Ilicínea.

---

## Sobre o e-SUS APS PEC

### O que é
O Prontuário Eletrônico do Cidadão (PEC) do e-SUS APS é o sistema federal de registro de informações na Atenção Primária. Ele roda localmente em servidor municipal (instalação Java, porta padrão 8080) com banco PostgreSQL.

### Banco de Dados
- **SGBD**: PostgreSQL (versão 9.6+, geralmente 14 ou 15 em instalações recentes)
- **Host padrão**: localhost ou IP do servidor da SMS
- **Porta padrão PostgreSQL**: 5432
- **Porta padrão da aplicação PEC**: 8080 ou 443 (HTTPS)
- **Banco principal**: `esus`
- **Schema de produção**: `public` (tabelas operacionais com prefixo `tb_`)
- **Schema DW**: tabelas com prefixo `fat_` (fatos) e `dim_` (dimensões) e `vw_` (visualizações)

### Estrutura DW PEC (principal para este projeto)
Documentada em: https://integracao.esusaps.bridge.ufsc.tech/dw/

Principais tabelas de fato relevantes:
- `fat_cad_individual` — cadastros individuais (cidadãos)
- `fat_cad_domiciliar` — cadastros domiciliares
- `fat_atendimento_individual` — atendimentos individuais (consultas)
- `fat_atendimento_odontologico` — atendimentos odontológicos
- `fat_visita_domiciliar` — visitas domiciliares (ACS)
- `fat_ativ_coletiva` — atividades coletivas
- `fat_procedimento_individual` — procedimentos realizados
- `fat_marcador_consumo_alimentar` — marcadores de saúde

Principais dimensões:
- `dim_equipe` — equipes (INE, nome, tipo: eSF/eAP/eSB/eMulti)
- `dim_unidade_saude` — unidades de saúde (CNES)
- `dim_cbo` — categorias profissionais (CBO)
- `dim_cid10` — diagnósticos CID-10
- `dim_ciap2` — diagnósticos CIAP-2
- `dim_tempo` — dimensão temporal (data, mês, quadrimestre, ano)
- `dim_municipio` — municípios (IBGE)

Visualizações (dados consolidados, sem histórico):
- `vw_acompanhamento_saude_crianca`
- `vw_acompanhamento_pre_natal`
- `vw_acompanhamento_hipertensao`
- `vw_acompanhamento_diabetes`
- `vw_acompanhamento_saude_idoso`
- `vw_cobertura_cadastral`

### Acesso seguro (somente leitura)
```sql
-- Criar usuário de leitura para o módulo (executar UMA VEZ pelo DBA)
CREATE ROLE monitor_aps_reader;
ALTER ROLE monitor_aps_reader LOGIN;
GRANT CONNECT ON DATABASE esus TO monitor_aps_reader;
GRANT USAGE ON SCHEMA public TO monitor_aps_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA "public" TO monitor_aps_reader;
CREATE USER monitor_aps WITH PASSWORD 'senha_segura_aqui';
GRANT monitor_aps_reader TO monitor_aps;
```

---

## Comportamento Esperado do Sistema

### Página de Configuração (acesso restrito: admin)
O usuário configura UMA VEZ:
- Host/IP do servidor PostgreSQL do eSUS PEC
- Porta (padrão: 5432)
- Nome do banco (padrão: esus)
- Usuário e senha de leitura
- Quadrimestre de avaliação ativo
- CNES/INEs das equipes do município

### Dashboard Principal
Exibe, em visão geral:
- Scorecard municipal: % de indicadores no verde (ótimo/bom) vs. amarelo/vermelho
- Valor estimado do repasse mensal atual vs. máximo possível
- Alertas de equipes com risco de bloqueio financeiro
- Cards por componente (Fixo, Vínculo, Qualidade)

### Página de Vínculo e Acompanhamento
- Total de cadastros individuais e domiciliares por equipe
- % de cadastros atualizados (últimos 12 meses)
- Cobertura de grupos prioritários: crianças, idosos, BPC, Bolsa Família
- Comparação com o parâmetro de referência e teto máximo

### Página de Indicadores de Qualidade
- 15 indicadores dispostos em cards com gauge/velocímetro
- Para cada indicador: numerador, denominador, % atual, meta para "bom" e "ótimo"
- Filtro por equipe (INE) ou visão consolidada
- Filtro por período (quadrimestre)

### Página por Equipe
- Seleção de equipe específica
- Visão completa de todos os componentes para aquela equipe
- Classificação atual (ótimo/bom/suficiente/regular) por componente
- Histórico quadrimestral (linha do tempo)

---

## Mapeamento Indicador → Query DW PEC

### Indicador 2: Cuidado Longitudinal da Criança
```sql
-- Crianças com ≥9 consultas até 2 anos de vida
SELECT
  de.no_equipe,
  de.nu_ine,
  COUNT(DISTINCT fai.co_cidadao) AS numerador,
  (SELECT COUNT(*) FROM fat_cad_individual fci
   JOIN dim_equipe de2 ON fci.co_dim_equipe = de2.co_seq_dim_equipe
   WHERE de2.nu_ine = de.nu_ine
   AND EXTRACT(YEAR FROM AGE(fci.dt_nascimento)) < 2) AS denominador
FROM fat_atendimento_individual fai
JOIN dim_equipe de ON fai.co_dim_equipe = de.co_seq_dim_equipe
JOIN dim_cbo dc ON fai.co_dim_cbo = dc.co_seq_dim_cbo
WHERE dc.nu_cbo IN ('225125','225142','2235','2236') -- médico e enfermeiro
  AND fai.dt_atendimento BETWEEN :data_inicio AND :data_fim
GROUP BY de.no_equipe, de.nu_ine;
```

### Indicador 4: Hipertensão
```sql
-- Usando visualização consolidada
SELECT * FROM vw_acompanhamento_hipertensao
WHERE nu_ine = :ine
  AND nu_competencia BETWEEN :competencia_inicio AND :competencia_fim;
```

---

## Estimativa de Repasse

O sistema deve calcular a **estimativa de repasse mensal** com base em:

```
Repasse Estimado = Componente_Fixo(IED) 
                 + Componente_Vinculo(Classificacao_Equipe) 
                 + Componente_Qualidade(Classificacao_Equipe)
                 + Componentes_Programas (fixos se cadastrados)
```

Tabela de valores (Portaria 3.493/2024):
- Componente Fixo por IED: R$ 12.000 (IED4) a R$ 18.000 (IED1) por eSF
- Componente Vínculo "bom": R$ 6.000/equipe
- Componente Qualidade "bom": R$ 6.000/equipe
- Classificação "ótimo" = R$ 8.000 por componente
- Classificação "suficiente" = R$ 4.000
- Classificação "regular" = R$ 2.000
