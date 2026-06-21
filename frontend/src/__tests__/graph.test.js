import { isDag } from '../lib/graph';

const nodes = (...ids) => ids.map((id) => ({ id }));
const edges = (...pairs) => pairs.map(([source, target]) => ({ source, target }));

describe('isDag (client)', () => {
  it('treats an empty graph as a DAG', () => {
    expect(isDag([], [])).toBe(true);
  });

  it('accepts a simple chain', () => {
    expect(isDag(nodes('a', 'b', 'c'), edges(['a', 'b'], ['b', 'c']))).toBe(true);
  });

  it('rejects a cycle', () => {
    expect(isDag(nodes('a', 'b', 'c'), edges(['a', 'b'], ['b', 'c'], ['c', 'a']))).toBe(false);
  });

  it('rejects a self-loop', () => {
    expect(isDag(nodes('a'), edges(['a', 'a']))).toBe(false);
  });

  it('accepts disconnected components', () => {
    expect(isDag(nodes('a', 'b', 'c', 'd'), edges(['a', 'b'], ['c', 'd']))).toBe(true);
  });

  it('ignores duplicate (parallel) edges', () => {
    expect(isDag(nodes('a', 'b'), edges(['a', 'b'], ['a', 'b'], ['a', 'b']))).toBe(true);
  });

  it('rejects a two-node cycle', () => {
    expect(isDag(nodes('a', 'b'), edges(['a', 'b'], ['b', 'a']))).toBe(false);
  });

  it('ignores edges referencing unknown nodes', () => {
    expect(isDag(nodes('a', 'b'), edges(['a', 'b'], ['ghost', 'a']))).toBe(true);
  });
});
