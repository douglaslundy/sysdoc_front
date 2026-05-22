# agents/02-indicators-service-agent.md

## Nome
`indicators-service-agent`

## Papel
Responsável por criar o `MonitorApsController.php` no **sysdoc_back (Laravel)** com todos os cálculos dos 15 indicadores de qualidade, componente de vínculo e estimativa de repasse. Toda a lógica roda em PHP, acessando o PostgreSQL do eSUS PEC via `$this->db()` (herdado de `MonitorApsBaseController`).

## Dependências
- `database-config-agent` completo (`MonitorApsBaseController` funcionando)
- Docker com banco de dev ativo (`docker compose up -d` em `psf-dashboard-prompts/modules/monitor-aps/docker/`)

---

## Estrutura de Saída Padrão

Cada indicador retorna:
```json
{
  "indicador": {
    "id": 2,
    "nome": "Cuidado Longitudinal da Criança",
    "bloco": "eSF_eAP",
    "equipe": { "ine": "0000000001", "nome": "ESF CENTRO" },
    "periodo": { "ano": 2025, "quadrimestre": 2 },
    "resultado": {
      "numerador": 42,
      "denominador": 68,
      "percentual": 61.76,
      "classificacao": "bom",
      "meta_suficiente": 30,
      "meta_bom": 60,
      "meta_otimo": 80
    },
    "subindicadores": [
      { "nome": "≥9 consultas médico/enfermeiro", "valor": 42, "total": 68 },
      { "nome": "≥9 registros peso/altura",       "valor": 38, "total": 68 }
    ]
  }
}
```

---

## Tarefas

### TAREFA 1: Criar `MonitorApsController.php`

Arquivo: `sysdoc_back/app/Http/Controllers/MonitorApsController.php`

Estende `MonitorApsBaseController`. Contém:

**Constantes de thresholds** (definidas como `const THRESHOLDS`):
```php
private const THRESHOLDS = [
    'ind1_acesso_aps'         => ['suficiente' => 20, 'bom' => 40, 'otimo' => 60],
    'ind2_crianca'            => ['suficiente' => 30, 'bom' => 60, 'otimo' => 80],
    'ind3_gestante'           => ['suficiente' => 40, 'bom' => 65, 'otimo' => 85],
    'ind4_hipertensao'        => ['suficiente' => 35, 'bom' => 60, 'otimo' => 80],
    'ind5_diabetes'           => ['suficiente' => 35, 'bom' => 60, 'otimo' => 80],
    'ind6_idoso'              => ['suficiente' => 30, 'bom' => 55, 'otimo' => 75],
    'ind7_saude_mental'       => ['suficiente' => 15, 'bom' => 30, 'otimo' => 50],
    'ind8_visita_acs'         => ['suficiente' => 50, 'bom' => 70, 'otimo' => 85],
    'ind9_vacinacao'          => ['suficiente' => 70, 'bom' => 85, 'otimo' => 95],
    'ind10_interprofissional' => ['suficiente' => 20, 'bom' => 40, 'otimo' => 60],
    'ind13_acesso_bucal'      => ['suficiente' => 20, 'bom' => 40, 'otimo' => 60],
    'ind14_conclusao'         => ['suficiente' => 30, 'bom' => 50, 'otimo' => 70],
    'ind15_coletivas'         => ['suficiente' => 10, 'bom' => 25, 'otimo' => 40],
    'vinculo'                 => ['suficiente' => 40, 'bom' => 65, 'otimo' => 85],
];

private const REPASSE_FIXO_IED = [1 => 18000, 2 => 16000, 3 => 14000, 4 => 12000];
private const REPASSE_CLASS    = ['regular' => 2000, 'suficiente' => 4000, 'bom' => 6000, 'otimo' => 8000];
```

**Endpoints públicos (protegidos por auth:sanctum):**
- `resumo(Request)` — consolidado municipal: equipes, vínculo, repasse estimado
- `vinculo(Request)` — detalhe do componente de vínculo por período/INE
- `qualidade(Request)` — indicadores 1-15 com filtro de bloco (esf/esb) e INE
- `qualidadeIndicador(Request, int $id)` — indicador específico por ID
- `repasse(Request)` — estimativa de repasse por equipe
- `historico(Request)` — histórico quadrimestral de um indicador por equipe

**Métodos privados de cálculo:**
- `calcularVinculo(int $ano, int $quad, ?string $ine)` — query em `fat_cad_individual` + `fat_cad_domiciliar`
- `calcularRepasseEstimado(array $equipes, int $estrato)` — aplica tabela de valores por classificação
- `calcularESF(string $ine, int $ano, int $quad)` — itera indicadores 1-10
- `calcularESB(string $ine, int $ano, int $quad)` — itera indicadores 13-15
- `calcularInd1` a `calcularInd10`, `calcularInd13` a `calcularInd15` — um método por indicador

### TAREFA 2: Indicadores eSF/eAP (1-10) — queries principais

**Ind 1 — Mais Acesso à APS**: `fat_atendimento_individual`, agrupa por `co_dim_tipo_atendimento` (1=programado, 2=espontâneo, 3=escuta, 4=consulta_dia, 5=urgência). Percentual = tipos com ≥10% do total / 5 tipos.

**Ind 2 — Cuidado Longitudinal Criança**: 4 subindicadores em subqueries:
- ≥9 consultas médico/enfermeiro (CBO: 225142, 225125, 223505) em `fat_atendimento_individual`
- ≥9 registros peso (`nu_peso IS NOT NULL`) em `fat_atendimento_individual`
- ≥2 visitas ACS (CBO: 516220) em `fat_visita_domiciliar`
- Vacinação completa (≥6 vacinas SIGTAP) em `fat_vacinacao`
- Denominador: crianças < 24 meses em `fat_cad_individual`

**Ind 3 — Gestante**: usa `vw_acompanhamento_pre_natal` com `st_pn_adequado = true`

**Ind 4 — Hipertensão**: usa `vw_acompanhamento_hipertensao` com `st_acompanhado = true`

**Ind 5 — Diabetes**: usa `vw_acompanhamento_diabetes` com `st_acompanhado = true`

**Ind 6 — Idoso**: idosos (> 60 anos) com ≥1 atendimento no quadrimestre em `fat_atendimento_individual`

**Ind 7 — Saúde Mental**: atendimentos com CIAP2 P76-P99 ou CID10 F* sobre total de atendimentos

**Ind 8 — Visita ACS**: pessoas com ≥1 visita de ACS (CBO 516220) em `fat_visita_domiciliar`

**Ind 9 — Vacinação**: crianças < 2 anos com ≥4 vacinas do calendário em `fat_vacinacao`

**Ind 10 — Ações Interprofissionais**: participantes em `fat_ativ_coletiva` / total cadastrados

### TAREFA 3: Indicadores eSB (13-15)

**Ind 13 — Acesso Bucal**: `fat_atendimento_odontologico` com `st_primeira_consulta = true` / total cadastrados

**Ind 14 — Conclusão Tratamento**: `fat_atendimento_odontologico` com `st_conclusao_tratamento = true` / total atendimentos odontológicos

**Ind 15 — Ações Coletivas Bucal**: participantes em `fat_ativ_coletiva` (equipe eSB) / total cadastrados

### TAREFA 4: Helper de classificação

```php
private function classificar(float $percentual, array $thresholds): string
{
    if ($percentual >= $thresholds['otimo'])      return 'otimo';
    if ($percentual >= $thresholds['bom'])        return 'bom';
    if ($percentual >= $thresholds['suficiente']) return 'suficiente';
    return 'regular';
}
```

### TAREFA 5: Helper de resultado padronizado

```php
private function resultado(int $id, string $nome, string $bloco, string $ine, string $nomeEquipe,
    int $ano, int $quad, $numerador, $denominador, float $percentual,
    string $thresholdKey, array $subindicadores): array
{
    $t = self::THRESHOLDS[$thresholdKey];
    return ['indicador' => [
        'id' => $id, 'nome' => $nome, 'bloco' => $bloco,
        'equipe'  => ['ine' => $ine, 'nome' => $nomeEquipe],
        'periodo' => ['ano' => $ano, 'quadrimestre' => $quad],
        'resultado' => [
            'numerador'       => $numerador,
            'denominador'     => $denominador,
            'percentual'      => $percentual,
            'classificacao'   => $this->classificar($percentual, $t),
            'meta_suficiente' => $t['suficiente'],
            'meta_bom'        => $t['bom'],
            'meta_otimo'      => $t['otimo'],
        ],
        'subindicadores' => $subindicadores,
    ]];
}
```

---

## Critérios de Aceitação

- [ ] `GET /api/monitor-aps/indicadores/resumo` retorna equipes com classificação e repasse
- [ ] `GET /api/monitor-aps/indicadores/qualidade` retorna os 15 indicadores no formato padrão
- [ ] `GET /api/monitor-aps/indicadores/qualidade/{id}?ine=XXX` retorna indicador específico
- [ ] `GET /api/monitor-aps/indicadores/historico?ine=XXX&indicador_id=2&anos=2025` retorna histórico
- [ ] Classificações (ótimo/bom/suficiente/regular) calculadas corretamente por threshold
- [ ] Erros de SQL retornam JSON com `error` e HTTP 500 (nunca stack trace exposto)
- [ ] Acesso ao banco é somente leitura (sem INSERT/UPDATE/DELETE)
- [ ] Thresholds documentados com fonte (fichas técnicas MS) nos comentários do código
