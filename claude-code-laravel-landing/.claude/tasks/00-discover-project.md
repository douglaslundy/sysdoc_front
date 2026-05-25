# Task 00 - Discover Project

## Objetivo

Analisar a estrutura geral do projeto Laravel antes de qualquer implementação.

## Passos

1. Identificar versão aproximada do Laravel.
2. Identificar estrutura de diretórios.
3. Ler `routes/web.php`.
4. Ler `routes/api.php`, se existir.
5. Listar controllers.
6. Listar models.
7. Listar migrations.
8. Listar views.
9. Identificar stack frontend.
10. Identificar sistema de autenticação.
11. Identificar a página inicial atual.
12. Registrar achados em `.claude/memory/product-discovery.md`.

## Comandos sugeridos

```bash
php artisan route:list
find app -maxdepth 3 -type f
find resources -maxdepth 4 -type f
find database -maxdepth 3 -type f
```

## Critério de conclusão

A estrutura do projeto deve estar compreendida e documentada antes de seguir para o mapeamento de funcionalidades.
