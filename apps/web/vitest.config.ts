import { mergeConfig } from 'vitest/config';
import base from '../../vitest.base.js';

export default mergeConfig(await base, {
  test: {
    environment: 'jsdom',
  },
});
