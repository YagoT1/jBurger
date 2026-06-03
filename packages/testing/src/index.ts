export const testTenantId = 'tenant_test';
export const createTestId = (prefix: string): string => `${prefix}_test_0001`;
export const waitFor = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
