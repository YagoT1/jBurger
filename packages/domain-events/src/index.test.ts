import { describe, expect, it } from 'vitest';
import { InMemoryEventPublisher, createEventMetadata } from './index.js';
describe('domain events', () => { it('publishes typed envelopes', async () => { const publisher = new InMemoryEventPublisher(); await publisher.publish({ metadata: createEventMetadata({ eventName: 'LOGIN_SUCCESS', category: 'audit', schemaVersion: 1 }), action: 'LOGIN_SUCCESS', resource: 'session', payload: {} }); expect(publisher.events).toHaveLength(1); }); });
