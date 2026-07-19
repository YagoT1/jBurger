-- Identity link: public.users.id ES el id de auth.users (patrón estándar Supabase).
-- Evita una doble identidad aplicación/auth y mantiene los contratos de @jburger/domain-auth sin cambios.
alter table public.users alter column id drop default;
alter table public.users add constraint users_id_auth_fkey foreign key (id) references auth.users(id) on delete cascade;

-- session_tracking registra metadatos de sesión; el hash de refresh token queda diferido
-- a la iteración de rotación/revocación por token (deuda registrada en ADR-021).
alter table public.session_tracking alter column refresh_token_hash drop not null;
