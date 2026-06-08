import { mergeConfig } from 'vitest/config';
import base from '../../vitest.base.js';

export default mergeConfig(base, {
  test: {
    environment: 'jsdom',
  },
});
