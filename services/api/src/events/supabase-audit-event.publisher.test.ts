import { describe, expect, it, vi } from 'vitest';
import type { AuditEvent } from '@jburger/domain-events';
import { SupabaseAuditEventPublisher } from './supabase-audit-event.publisher.js';

describe('SupabaseAuditEventPublisher', () => {
  it('persists event envelopes into audit_events through Supabase REST', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 201 }));
    const publisher = new SupabaseAuditEventPublisher({
      supabaseUrl: 'https://example.supabase.co/',
      supabaseAnonKey: 'anon-key',
      fetchImpl,
    });
    const event: AuditEvent = {
      metadata: {
        eventId: 'event-1',
        eventName: 'LOGIN_SUCCESS',
        category: 'audit',
        occurredAt: '2026-06-18T00:00:00.000Z',
        tenantId: '11111111-1111-1111-1111-111111111111',
        branchId: '22222222-2222-2222-2222-222222222222',
        actorId: '33333333-3333-3333-3333-333333333333',
        schemaVersion: 1,
      },
      action: 'LOGIN_SUCCESS',
      resource: 'auth.session',
      resourceId: '44444444-4444-4444-4444-444444444444',
      payload: { sessionId: 'session-1' },
    };

    await publisher.publish(event);

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://example.supabase.co/rest/v1/audit_events',
      expect.objectContaining({ method: 'POST' }),
    );
    const [, init] = fetchImpl.mock.calls[0] ?? [];
    expect(JSON.parse(String(init?.body))).toEqual({
      tenant_id: '11111111-1111-1111-1111-111111111111',
      actor_id: '33333333-3333-3333-3333-333333333333',
      action: 'LOGIN_SUCCESS',
      resource: 'auth.session',
      resource_id: '44444444-4444-4444-4444-444444444444',
      metadata: {
        eventMetadata: event.metadata,
        payload: { sessionId: 'session-1' },
        category: 'audit',
        branchId: '22222222-2222-2222-2222-222222222222',
      },
      occurred_at: '2026-06-18T00:00:00.000Z',
    });
  });

  it('raises a useful error when Supabase rejects the insert', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ message: 'permission denied' }, { status: 403 }));
    const publisher = new SupabaseAuditEventPublisher({
      supabaseUrl: 'https://example.supabase.co',
      supabaseAnonKey: 'anon-key',
      fetchImpl,
    });

    await expect(
      publisher.publish({
        metadata: {
          eventId: 'event-1',
          eventName: 'LOGIN_FAILED',
          category: 'security',
          occurredAt: '2026-06-18T00:00:00.000Z',
          schemaVersion: 1,
        },
        severity: 'warning',
        payload: { reason: 'invalid_credentials' },
      }),
    ).rejects.toThrow('Failed to persist audit event: permission denied');
  });
});
