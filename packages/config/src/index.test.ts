import { describe, expect, it } from 'vitest';
import { parseCsv } from './index.js';
describe('parseCsv', () => { it('parses comma values', () => expect(parseCsv('a,b')).toEqual(['a','b'])); });
