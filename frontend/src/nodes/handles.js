// Resolve a node config's handles declaration into a flat array with computed
// top-% positions.  Supports both static arrays and dynamic resolvers
// (functions that derive handles from node data).

/**
 * @typedef  {Object} HandleDef
 * @property {'source'|'target'} type
 * @property {'left'|'right'}    side
 * @property {string}            id       Suffix appended to the node's id
 * @property {string}            [label]
 */

/**
 * Resolve a config's handles (array | function) into a flat, ordered array.
 *
 * Vertical positioning is no longer computed here: handles render inside their
 * own labeled rows in the node's ports band (see BaseNode), so React Flow
 * derives each anchor from the handle's real DOM box. We only need the stable
 * fullId, the React Flow type, the side, and the label.
 *
 * @param {HandleDef[]|((data:object)=>HandleDef[])} handles
 * @param {object}  data   The node's current data
 * @param {string}  nodeId Used to build the full handle id
 * @returns {{ fullId:string, type:string, position:'Left'|'Right', label?:string }[]}
 */
export function resolveHandles(handles, data, nodeId) {
  const raw = typeof handles === 'function' ? handles(data) : handles;
  if (!raw || raw.length === 0) return [];

  return raw.map((h) => ({
    fullId: `${nodeId}-${h.id}`,
    type: h.type,
    position: h.side === 'left' ? 'Left' : 'Right',
    label: h.label,
  }));
}
