import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { resolveHandles } from './handles';
import FieldRenderer from './fields/FieldRenderer';

// Half the 11px handle size; pulls the dot to straddle the card edge.
const EDGE_OFFSET = -5.5;

function BaseNode({ id, data, config }) {
  const Icon = config.icon;
  const catColor = config.accent ?? '#6b7280';
  const handles = resolveHandles(config.handles, data, id);
  const leftHandles = handles.filter((h) => h.position === 'Left');
  const rightHandles = handles.filter((h) => h.position === 'Right');
  const hasPorts = leftHandles.length > 0 || rightHandles.length > 0;

  return (
    <div
      className="flow-node bg-card rounded-node border border-hairline shadow-node hover:shadow-node-hover transition-shadow duration-140 overflow-visible"
      style={{ width: data._nodeWidth ?? config.width ?? 260 }}
    >
      {/* Colored left accent bar */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
        style={{ background: catColor }}
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-hairline/60">
        {Icon && (
          <span className="flex items-center justify-center w-6 h-6 rounded-md" style={{ background: catColor + '18' }}>
            <Icon size={14} style={{ color: catColor }} />
          </span>
        )}
        <span className="text-[13px] font-semibold text-ink leading-none">
          {config.title}
        </span>
      </div>

      {/* Ports band */}
      {hasPorts && (
        <div className="flex justify-between gap-3 py-2">
          <div className="flex flex-col gap-2">
            {leftHandles.map((h) => (
              <div key={h.fullId} className="relative flex items-center h-5">
                <Handle
                  type={h.type}
                  position={Position.Left}
                  id={h.fullId}
                  className="!border-2"
                  style={{ left: EDGE_OFFSET, top: '50%', transform: 'translateY(-50%)' }}
                />
                {h.label && (
                  <span className="pl-3 text-[11px] text-port font-medium select-none pointer-events-none whitespace-nowrap">
                    {h.label}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2 items-end">
            {rightHandles.map((h) => (
              <div key={h.fullId} className="relative flex items-center justify-end h-5">
                {h.label && (
                  <span className="pr-3 text-[11px] text-port font-medium select-none pointer-events-none whitespace-nowrap">
                    {h.label}
                  </span>
                )}
                <Handle
                  type={h.type}
                  position={Position.Right}
                  id={h.fullId}
                  className="!border-2"
                  style={{ right: EDGE_OFFSET, top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom body OR generic fields */}
      {config.body ? (
        <config.body id={id} data={data} config={config} />
      ) : (
        <div className={hasPorts ? '' : 'pt-2.5'}>
          <FieldRenderer fields={config.fields} nodeId={id} data={data} />
        </div>
      )}

      {/* Static label (e.g. LLM description) */}
      {config.description && !config.body && (!config.fields || config.fields.length === 0) && (
        <p className="px-4 pb-3 text-xs text-ink-muted">{config.description}</p>
      )}
    </div>
  );
}

export default memo(BaseNode);
