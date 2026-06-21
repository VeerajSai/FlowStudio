import '@testing-library/jest-dom';
import { vi } from 'vitest';

globalThis.jest = vi;

if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = (val) => JSON.parse(JSON.stringify(val));
}
