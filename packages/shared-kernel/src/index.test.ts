import { describe, expect, it } from 'vitest';
import { success } from './index.js';
describe('Result', () => { it('creates success results', () => expect(success(1).ok).toBe(true)); });
