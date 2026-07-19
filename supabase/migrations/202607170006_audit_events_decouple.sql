-- La auditoría es un registro histórico inmutable: no debe depender referencialmente
-- de entidades que pueden eliminarse. El FK con "on delete set null" además destruía
-- el tenant_id histórico del evento. Se elimina el FK conservando la columna.
alter table public.audit_events drop constraint if exists audit_events_tenant_id_fkey;
