import { parseVariables } from '../nodes/text/variables';

describe('parseVariables', () => {
  it('extracts simple variables', () => {
    expect(parseVariables('{{ name }}')).toEqual(['name']);
  });

  it('extracts multiple variables in order', () => {
    expect(parseVariables('{{ name }} and {{ age }}')).toEqual(['name', 'age']);
  });

  it('deduplicates repeated variables', () => {
    expect(parseVariables('{{ x }} {{ x }} {{ y }}')).toEqual(['x', 'y']);
  });

  it('allows underscores and dollar signs', () => {
    expect(parseVariables('{{ _private }} {{ $val }}')).toEqual(['_private', '$val']);
  });

  it('allows alphanumeric after first character', () => {
    expect(parseVariables('{{ item2 }}')).toEqual(['item2']);
  });

  it('rejects identifiers starting with digits', () => {
    expect(parseVariables('{{ 1bad }}')).toEqual([]);
  });

  it('rejects hyphens in identifiers', () => {
    expect(parseVariables('{{ input-name }}')).toEqual([]);
  });

  it('handles no-whitespace braces', () => {
    expect(parseVariables('{{name}}')).toEqual(['name']);
  });

  it('ignores triple braces', () => {
    expect(parseVariables('{{{ name }}}')).toEqual(['name']);
  });

  it('returns empty array for empty string', () => {
    expect(parseVariables('')).toEqual([]);
  });

  it('returns empty array for null/undefined', () => {
    expect(parseVariables(null)).toEqual([]);
    expect(parseVariables(undefined)).toEqual([]);
  });

  it('returns empty array for text with no variables', () => {
    expect(parseVariables('Hello world')).toEqual([]);
  });
});
