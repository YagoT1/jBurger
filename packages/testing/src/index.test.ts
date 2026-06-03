import { describe, expect, it } from 'vitest';
import { createTestId } from './index.js';
describe('testing utilities', () => { it('creates deterministic ids', () => expect(createTestId('user')).toBe('user_test_0001')); });
