import React, { useState, useRef, useEffect } from 'react';
import { NODE_TEMPLATES } from '../constants';
import { NodeDefinition, NodeCategory, Variation } from '../types';

interface NodeGraphProps {
  nodes: NodeDefinition[];
  variations: Variation[];
  sourceImage: string | null;
  onAddNode: (templateId: string, parentId: string) => void;
  onRemoveNode: (nodeId: string) => void;
  onUpdateNodePrompt: (nodeId: string, prompt: string) => void;
  onUpdateNodePosition: (nodeId: string, x: number, y: number) => void;
  onRunNode: (node: NodeDefinition) => void;
  isGenerating: Record<string, boolean>;
}

export const NodeGraph: React.FC<NodeGraphProps> = ({ 
  nodes, 
  variations,
  sourceImage,
  onAddNode, 
  onRemoveNode, 
  onUpdateNodePrompt,
  onUpdateNodePosition,
  onRunNode, 
  isGenerating 
}) => {
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [addingChildTo, setAddingChildTo] = useState<string | null>(null);
  
  // VIEWPORT STATE
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });

  // DRAGGING NODES STATE
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  
  const graphRef = useRef<HTMLDivElement>(null);

  // Node Dimensions
  const NODE_WIDTH = 200;
  const NODE_HEIGHT = 50; 

  // --- HANDLERS ---

  // Zoom Controls
  const handleZoomIn = () => setScale(s => Math.min(s + 0.1, 2));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.1, 0.4));
  const handleResetView = () => { setScale(1); setPan({x: 0, y: 0}); };

  // Mouse Movement (Pan & Drag)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // 1. Panning
      if (isPanning) {
        setPan({
          x: e.clientX - panStart.current.x,
          y: e.clientY - panStart.current.y
        });
        return;
      }

      // 2. Node Dragging
      if (isDraggingNode && draggingNodeId && graphRef.current) {
        const graphRect = graphRef.current.getBoundingClientRect();
        
        const screenNodeX = e.clientX - dragOffset.current.x;
        const screenNodeY = e.clientY - dragOffset.current.y;

        let x = (screenNodeX - graphRect.left - pan.x) / scale;
        const y = (screenNodeY - graphRect.top - pan.y) / scale;
        
        // Lock Root Node to Left Side
        if (draggingNodeId === 'root-connector') {
             x = Math.min(Math.max(x, 20), 60); // Constrain X between 20 and 60
        }

        onUpdateNodePosition(draggingNodeId, x, y);
      }
    };

    const handleMouseUp = () => {
      setIsPanning(false);
      setIsDraggingNode(false);
      setDraggingNodeId(null);
    };

    if (isPanning || isDraggingNode) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, isDraggingNode, draggingNodeId, pan, scale, onUpdateNodePosition]);

  const handleBackgroundMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    setAddingChildTo(null);
    setEditingNodeId(null);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, node: NodeDefinition) => {
    if (editingNodeId === node.id || addingChildTo === node.id) return;
    e.stopPropagation(); 
    setIsDraggingNode(true);
    setDraggingNodeId(node.id);
    const nodeRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - nodeRect.left,
      y: e.clientY - nodeRect.top
    };
  };

  // Drag and Drop from Sidebar
  const handleDragStartTemplate = (e: React.DragEvent, templateId: string) => {
    e.dataTransfer.setData('templateId', templateId);
  };

  const handleDropOnGraph = (e: React.DragEvent) => {
    e.preventDefault();
    const templateId = e.dataTransfer.getData('templateId');
    if (!templateId || !graphRef.current) return;

    // Determine drop position in graph space
    const graphRect = graphRef.current.getBoundingClientRect();
    const dropX = (e.clientX - graphRect.left - pan.x) / scale;
    const dropY = (e.clientY - graphRect.top - pan.y) / scale;

    // Find nearest parent node to connect to automatically? 
    // Or just add it floating? The app requires a parentId currently.
    // Let's find the closest node to connect to.
    let closestNode = null;
    let minDist = Infinity;

    nodes.forEach(n => {
      const dist = Math.sqrt(Math.pow(n.x - dropX, 2) + Math.pow(n.y - dropY, 2));
      if (dist < minDist) {
        minDist = dist;
        closestNode = n;
      }
    });

    if (closestNode && minDist < 400) { // Only connect if reasonably close
       onAddNode(templateId, closestNode.id);
       // Note: The onAddNode function in App.tsx currently calculates position automatically.
       // Ideally we'd pass the custom position, but for now we stick to the existing interface
       // or we trigger a move immediately after (complex).
       // To keep it simple: Adding via sidebar just connects to closest node and auto-places.
    } else {
       // If dropped far away, maybe connect to Root?
       const root = nodes.find(n => n.id === 'root-connector');
       if (root) onAddNode(templateId, root.id);
    }
  };

  const renderConnections = () => {
    return nodes.map(node => {
      if (!node.parentId) return null;
      const parent = nodes.find(n => n.id === node.parentId);
      if (!parent) return null;

      const startX = parent.x + NODE_WIDTH; 
      const startY = parent.y + (NODE_HEIGHT / 2); 
      const endX = node.x;
      const endY = node.y + (NODE_HEIGHT / 2);

      const dist = Math.abs(endX - startX);
      const cp1X = startX + dist * 0.5;
      const cp1Y = startY;
      const cp2X = endX - dist * 0.5;
      const cp2Y = endY;

      const pathData = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;

      return (
        <g key={`${parent.id}-${node.id}`}>
          <path d={pathData} fill="none" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" className="opacity-15 animate-pulse" />
          <path d={pathData} fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" className="opacity-50" />
        </g>
      );
    });
  };

  const getNodeStyles = (cat: NodeCategory, isRoot: boolean) => {
    if (isRoot) return 'border-emerald-500/50 bg-emerald-950/90 shadow-[0_0_20px_rgba(16,185,129,0.15)]';
    switch(cat) {
      case NodeCategory.TRANSFORM: return 'border-cyan-500/30 bg-[#0f172a]/95 shadow-[0_0_15px_rgba(6,182,212,0.1)]';
      case NodeCategory.STYLE: return 'border-purple-500/30 bg-[#0f172a]/95 shadow-[0_0_15px_rgba(168,85,247,0.1)]';
      case NodeCategory.RENDER: return 'border-amber-500/30 bg-[#0f172a]/95 shadow-[0_0_15px_rgba(245,158,11,0.1)]';
      case NodeCategory.CUSTOM: return 'border-pink-500/30 bg-[#0f172a]/95 shadow-[0_0_15px_rgba(236,72,153,0.1)]';
      default: return 'border-slate-500 bg-slate-900';
    }
  };

  const handleAddSelection = (template: typeof NODE_TEMPLATES[0]) => {
    if (addingChildTo) {
      onAddNode(template.id, addingChildTo);
      setAddingChildTo(null);
    }
  };

  return (
    <div className="flex-1 flex relative overflow-hidden bg-[#05080f]">
      
      {/* GRAPH AREA */}
      <div 
        className="flex-1 relative cursor-grab active:cursor-grabbing shadow-inner overflow-hidden" 
        ref={graphRef}
        onMouseDown={handleBackgroundMouseDown}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDropOnGraph}
      >
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>
        <div className="absolute inset-0 pointer-events-none" style={{ 
            backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', 
            backgroundSize: '32px 32px',
            opacity: 0.2
          }}>
        </div>

        <div 
          className="w-full h-full transform-origin-top-left transition-transform duration-75 ease-linear will-change-transform"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
        >
          <svg className="absolute inset-0 w-[5000px] h-[5000px] pointer-events-none z-0">
            {renderConnections()}
          </svg>

          {nodes.map((node) => {
            const generating = isGenerating[node.id];
            const isRoot = node.id === 'root-connector';
            const isEditing = editingNodeId === node.id;
            const isAddingToThis = addingChildTo === node.id;
            const isCustom = node.category === NodeCategory.CUSTOM;

            const generatedImg = isRoot 
              ? sourceImage 
              : variations.find(v => v.id === node.latestVariationId)?.imageUrl;

            return (
              <div
                key={node.id}
                style={{ transform: `translate(${node.x}px, ${node.y}px)`, width: `${NODE_WIDTH}px`, height: `${NODE_HEIGHT}px` }}
                onMouseDown={(e) => handleNodeMouseDown(e, node)}
                className={`absolute z-10 flex items-center rounded-full border backdrop-blur-md transition-all duration-300 group cursor-default select-none pl-1.5 pr-3
                  ${getNodeStyles(node.category, isRoot)}
                  ${generating ? 'ring-2 ring-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.4)]' : 'hover:border-opacity-80 hover:scale-[1.02]'}
                `}
              >
                {/* Drag Handle (Visible on Hover) */}
                {!isRoot && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-slate-500 cursor-grab">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm-2 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm8-14a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm-2 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm2 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm8-14a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm-2 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm2 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"/></svg>
                  </div>
                )}

                {/* Circular Thumbnail */}
                <div className={`w-12 h-12 rounded-full border-2 overflow-hidden flex-shrink-0 flex items-center justify-center bg-black/40 relative z-10 shadow-lg
                  ${generatedImg ? 'border-white/20' : 'border-dashed border-slate-600'}`}
                >
                  {generatedImg ? (
                    <img src={generatedImg} alt="Thumb" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-[9px] text-slate-500 font-medium text-center leading-tight">
                      {generating ? (
                        <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        isRoot ? 'SRC' : 'WAIT'
                      )}
                    </div>
                  )}
                </div>

                {/* Node Content */}
                <div className="flex-1 ml-3 min-w-0 flex flex-col justify-center h-full py-1">
                  <div className="flex justify-between items-center w-full">
                     <h3 className="font-bold text-[11px] text-white tracking-wide truncate" title={node.label}>
                       {node.label}
                     </h3>
                     {!isRoot && (
                       <button 
                         onClick={(e) => { e.stopPropagation(); onRemoveNode(node.id); }}
                         className="text-slate-600 hover:text-red-400 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                       >
                         ×
                       </button>
                     )}
                  </div>

                  {/* Prompt Input / Description */}
                  {!isRoot && (
                    <div className="mt-0.5" onMouseDown={(e) => e.stopPropagation()}>
                      {isCustom || isEditing ? (
                         <input
                           autoFocus={isEditing}
                           className="w-full text-[9px] bg-black/40 text-cyan-100 px-1.5 py-0.5 rounded border border-slate-600 focus:border-cyan-500 outline-none placeholder:text-slate-600 h-5"
                           value={node.customPrompt || ''}
                           onChange={(e) => onUpdateNodePrompt(node.id, e.target.value)}
                           placeholder="Enter prompt..."
                           onBlur={() => !isCustom && setEditingNodeId(null)}
                         />
                      ) : (
                         <p 
                           onClick={() => setEditingNodeId(node.id)}
                           className="text-[10px] text-slate-400 truncate cursor-text hover:text-cyan-300 transition-colors"
                           title={node.customPrompt || node.description}
                         >
                           {node.customPrompt || node.description}
                         </p>
                      )}
                    </div>
                  )}

                  {isRoot && <p className="text-[9px] text-emerald-500 font-medium tracking-wider mt-0.5">PRIMARY SOURCE</p>}
                </div>

                {/* Hover Actions */}
                {!isRoot && (
                   <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none group-hover:pointer-events-auto scale-90">
                      <button
                        onClick={(e) => { e.stopPropagation(); onRunNode(node); }}
                        className="h-6 px-3 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white text-[9px] font-bold shadow-lg border border-cyan-400/50 flex items-center justify-center whitespace-nowrap"
                      >
                        {generating ? '...' : (generatedImg ? 'RE-GEN' : 'RUN')}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddingChildTo(isAddingToThis ? null : node.id);
                        }}
                        className="h-6 w-6 rounded-full bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold shadow-lg border border-slate-500 flex items-center justify-center"
                      >
                        +
                      </button>
                   </div>
                )}
                {isRoot && (
                   <div className="absolute -right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none group-hover:pointer-events-auto">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddingChildTo(isAddingToThis ? null : node.id);
                        }}
                        className="h-6 w-6 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shadow-lg border border-emerald-400 flex items-center justify-center"
                      >
                        +
                      </button>
                   </div>
                )}

                {/* Add Child Menu */}
                {isAddingToThis && (
                  <div 
                    className="absolute left-full top-0 ml-3 w-40 bg-[#1e293b] border border-slate-600 rounded-lg shadow-2xl overflow-hidden z-50 flex flex-col animate-in fade-in zoom-in-95 duration-100"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className="bg-slate-950 px-3 py-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">Add Next Step</div>
                    <div className="max-h-56 overflow-y-auto custom-scrollbar">
                      {NODE_TEMPLATES.map(t => (
                        <button
                          key={t.id}
                          onClick={() => handleAddSelection(t)}
                          className="w-full text-left px-3 py-2 text-[10px] text-slate-300 hover:bg-cyan-900/30 hover:text-cyan-200 border-b border-slate-800/50 last:border-0 transition-colors"
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* View Controls */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-50">
          <button onClick={handleZoomIn} className="w-8 h-8 rounded-lg bg-slate-800/90 border border-slate-600 text-white hover:bg-slate-700 hover:text-cyan-400 flex items-center justify-center font-bold backdrop-blur-sm">+</button>
          <button onClick={handleZoomOut} className="w-8 h-8 rounded-lg bg-slate-800/90 border border-slate-600 text-white hover:bg-slate-700 hover:text-cyan-400 flex items-center justify-center font-bold backdrop-blur-sm">-</button>
          <button onClick={handleResetView} className="w-8 h-8 rounded-lg bg-slate-800/90 border border-slate-600 text-white hover:bg-slate-700 hover:text-cyan-400 flex items-center justify-center backdrop-blur-sm">R</button>
        </div>
      </div>

      {/* RIGHT SIDEBAR (Node Templates) */}
      <div className="w-48 bg-slate-950 border-l border-white/10 flex flex-col z-20">
        <div className="p-3 border-b border-white/5 bg-slate-900/50">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Node Library</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
           <p className="text-[10px] text-slate-500 mb-2">Drag to graph to add</p>
           {NODE_TEMPLATES.map(template => (
             <div
               key={template.id}
               draggable
               onDragStart={(e) => handleDragStartTemplate(e, template.id)}
               className="p-2 rounded border border-slate-800 bg-slate-900/50 hover:border-cyan-500/50 hover:bg-cyan-900/10 cursor-grab active:cursor-grabbing transition-colors group"
             >
               <div className="flex items-center justify-between">
                 <span className="text-[11px] font-bold text-slate-300 group-hover:text-cyan-200">{template.label}</span>
                 <span className="text-[9px] text-slate-600 border border-slate-700 px-1 rounded">{template.category.substring(0,3)}</span>
               </div>
               <p className="text-[9px] text-slate-500 mt-0.5 line-clamp-1">{template.desc}</p>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};