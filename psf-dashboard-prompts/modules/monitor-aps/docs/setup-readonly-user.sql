-- =================================================================
-- Monitor APS: Criação de usuário somente-leitura no banco eSUS PEC
-- Execute este script UMA VEZ como superusuário (postgres)
-- Banco alvo: esus (banco do e-SUS APS PEC)
-- =================================================================

-- 1. Criar role de leitura
CREATE ROLE monitor_aps_reader;

-- 2. Permissões de conexão e schema
GRANT CONNECT ON DATABASE esus TO monitor_aps_reader;
GRANT USAGE ON SCHEMA public TO monitor_aps_reader;

-- 3. SELECT em todas as tabelas existentes
GRANT SELECT ON ALL TABLES IN SCHEMA public TO monitor_aps_reader;

-- 4. SELECT automático em tabelas criadas no futuro (updates do PEC)
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO monitor_aps_reader;

-- 5. Criar o usuário de aplicação
--    ⚠️ ALTERAR a senha antes de executar em produção
CREATE USER monitor_aps WITH PASSWORD 'SenhaSegura123!';
GRANT monitor_aps_reader TO monitor_aps;

-- 6. Verificação: listar permissões concedidas
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'monitor_aps_reader'
ORDER BY table_name
LIMIT 20;

-- =================================================================
-- Para REVOGAR o acesso (quando necessário):
-- =================================================================
-- REVOKE monitor_aps_reader FROM monitor_aps;
-- DROP USER monitor_aps;
-- DROP ROLE monitor_aps_reader;
