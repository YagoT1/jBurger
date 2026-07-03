import { describe, expect, it } from 'vitest';
import { MenuService } from './index.js';
describe('MenuService', () => {
  it('publishes and pauses scheduled restaurant menus', () => {
    const service = new MenuService();
    const menu = service.create(
      {
        name: 'Lunch',
        type: 'lunch',
        sections: [],
        visibility: [{ channel: 'in_store', visible: true }],
        schedule: { daysOfWeek: [1] },
      },
      'tenant',
    );
    expect(service.publish(menu.id, 'tenant').status).toBe('published');
    expect(service.pause(menu.id, 'tenant').status).toBe('paused');
  });
});
