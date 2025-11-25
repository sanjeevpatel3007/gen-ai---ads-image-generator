import React, { useState, useEffect } from 'react';
import { SourceImagePanel } from './components/SourceImagePanel';
import { NodeGraph } from './components/NodeGraph';
import { VariationGallery } from './components/VariationGallery';
import { EditDrawer } from './components/EditDrawer';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { LandingPage } from './components/LandingPage';
import { AppState, NodeDefinition, Variation } from './types';
import { INITIAL_NODES, NODE_TEMPLATES } from './constants';
import { buildPrompt } from './services/promptService';
import { generateVariation, editImage } from './services/geminiService';

// Toast Component
interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const ToastContainer: React.FC<{ toasts: ToastNotification[]; onDismiss: (id: string) => void }> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div 
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border backdrop-blur-md animate-in slide-in-from-right-10 duration-300
            ${toast.type === 'error' ? 'bg-red-950/80 border-red-500/50 text-red-200' : 
              toast.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200' :
              'bg-slate-900/80 border-slate-700 text-slate-200'}
          `}
        >
          {toast.type === 'error' && (
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {toast.type === 'success' && (
             <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => onDismiss(toast.id)} className="ml-2 hover:opacity-75">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);

  const [state, setState] = useState<AppState>({
    sourceImage: null,
    baseDescription: '',
    variations: [],
    nodes: INITIAL_NODES,
    isGenerating: {},
    selectedVariationId: null, // For drawer (Edit mode)
    viewingVariationId: null, // For modal (View mode)
  });

  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleSetSource = (image: string, description: string) => {
    setState(prev => ({ ...prev, sourceImage: image, baseDescription: description }));
    if (image) showToast("Source image set successfully!", 'success');
  };

  const handleDescriptionChange = (desc: string) => {
    setState(prev => ({ ...prev, baseDescription: desc }));
  };

  // Node Management
  const handleAddNode = (templateId: string, parentId: string) => {
    const parent = state.nodes.find(n => n.id === parentId);
    const template = NODE_TEMPLATES.find(t => t.id === templateId);
    
    if (parent && template) {
      // Calculate optimal position
      const childXOffset = 280; // Horizontal distance
      const childYSpacing = 120; // Vertical distance between siblings

      // Find existing children of this parent
      const existingChildren = state.nodes.filter(n => n.parentId === parentId);
      const newChildIndex = existingChildren.length;
      
      // Basic logic: Place below the last child, or center if first?
      // Better logic: "Fan out"
      // Let's try to place it relative to the parent's Y, but offset by siblings.
      // A simple tree layout approach:
      // New Y = Parent Y + (Index * Spacing) - ((TotalChildren * Spacing) / 2)
      // But since we are adding one by one, we just append to the bottom for now to avoid jumping nodes.
      // However, we can try to be smarter if there are no children yet.
      
      let newY = parent.y;

      if (existingChildren.length > 0) {
        const lastChild = existingChildren[existingChildren.length - 1];
        newY = lastChild.y + childYSpacing;
      } else {
        // First child, place directly to the right (same Y)
        newY = parent.y;
      }

      const newNode: NodeDefinition = {
        id: crypto.randomUUID(),
        label: template.label,
        category: template.category,
        description: template.desc,
        customPrompt: templateId === 'custom' ? '' : undefined,
        parentId: parent.id,
        x: parent.x + childXOffset,
        y: newY
      };

      setState(prev => ({
        ...prev,
        nodes: [...prev.nodes, newNode]
      }));
    }
  };

  const handleRemoveNode = (nodeId: string) => {
    const removeRecursive = (idsToRemove: string[], allNodes: NodeDefinition[]): NodeDefinition[] => {
      const children = allNodes.filter(n => n.parentId && idsToRemove.includes(n.parentId));
      if (children.length === 0) return allNodes.filter(n => !idsToRemove.includes(n.id));
      
      const childIds = children.map(c => c.id);
      return removeRecursive([...idsToRemove, ...childIds], allNodes);
    };

    setState(prev => ({
      ...prev,
      nodes: removeRecursive([nodeId], prev.nodes)
    }));
  };

  const handleUpdateNodePrompt = (nodeId: string, prompt: string) => {
    setState(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, customPrompt: prompt } : n)
    }));
  };

  const handleUpdateNodePosition = (nodeId: string, x: number, y: number) => {
    setState(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, x, y } : n)
    }));
  };

  const handleRunNode = async (node: NodeDefinition) => {
    if (!state.sourceImage) {
      showToast("Please generate or upload a source image first!", "error");
      return;
    }

    setState(prev => ({
      ...prev,
      isGenerating: { ...prev.isGenerating, [node.id]: true }
    }));

    try {
      // Use custom prompt if available, else build from template
      const prompt = node.customPrompt 
        ? node.customPrompt 
        : buildPrompt(node.label === 'Custom Prompt' || node.category === 'custom' ? 'custom' : NODE_TEMPLATES.find(t => t.label === node.label)?.id || 'custom', state.baseDescription);

      if (!prompt.trim()) {
        showToast("Please enter a prompt for this node.", "error");
        setState(prev => ({
            ...prev,
            isGenerating: { ...prev.isGenerating, [node.id]: false }
          }));
        return;
      }

      const imageUrl = await generateVariation(prompt, state.sourceImage);

      const newVariation: Variation = {
        id: crypto.randomUUID(),
        imageUrl,
        label: node.label,
        fromNodeId: node.id,
        timestamp: Date.now()
      };

      setState(prev => ({
        ...prev,
        variations: [newVariation, ...prev.variations],
        nodes: prev.nodes.map(n => n.id === node.id ? { ...n, latestVariationId: newVariation.id } : n),
        isGenerating: { ...prev.isGenerating, [node.id]: false }
      }));
      showToast(`Generated: ${node.label}`, 'success');

    } catch (error) {
      console.error("Failed to generate:", error);
      showToast("Generation failed. See console.", "error");
      setState(prev => ({
        ...prev,
        isGenerating: { ...prev.isGenerating, [node.id]: false }
      }));
    }
  };

  const handleReset = () => {
    if (confirm("Reset Project? This will delete all images and reset the graph.")) {
      setState({
        sourceImage: null,
        baseDescription: '',
        variations: [],
        nodes: INITIAL_NODES.map(n => ({...n, latestVariationId: undefined})),
        isGenerating: {},
        selectedVariationId: null,
        viewingVariationId: null
      });
      showToast("Project reset.", "info");
    }
  };

  // Gallery & Modal Logic
  const handleSelectVariationForView = (v: Variation) => {
    setState(prev => ({ ...prev, viewingVariationId: v.id }));
  };

  const handleOpenSlideshow = () => {
    if (state.variations.length > 0) {
      // Open the first variation
      setState(prev => ({ ...prev, viewingVariationId: prev.variations[0].id }));
    }
  };

  const handleStartEdit = (v: Variation) => {
    setState(prev => ({ 
      ...prev, 
      viewingVariationId: null, // Close modal
      selectedVariationId: v.id // Open drawer
    }));
  };

  const handleCloseDrawer = () => {
    setState(prev => ({ ...prev, selectedVariationId: null }));
  };

  const handleApplyEdit = async (variation: Variation, instruction: string) => {
    try {
      const editedImageUrl = await editImage(variation.imageUrl, instruction);
      
      const newVariation: Variation = {
        id: crypto.randomUUID(),
        imageUrl: editedImageUrl,
        label: `Edit: ${variation.label}`,
        fromNodeId: variation.fromNodeId,
        timestamp: Date.now()
      };

      setState(prev => ({
        ...prev,
        variations: [newVariation, ...prev.variations],
        selectedVariationId: null
      }));
      showToast("Edit applied successfully!", "success");

    } catch (error) {
      console.error("Edit failed:", error);
      showToast("Edit failed. Please try again.", "error");
    }
  };

  // Carousel Logic
  const viewingIndex = state.variations.findIndex(v => v.id === state.viewingVariationId);
  const viewingVariation = viewingIndex >= 0 ? state.variations[viewingIndex] : null;
  const hasNext = viewingIndex > -1 && viewingIndex < state.variations.length - 1;
  const hasPrev = viewingIndex > 0;

  const handleNextVariation = () => {
    if (hasNext) {
      setState(prev => ({ ...prev, viewingVariationId: prev.variations[viewingIndex + 1].id }));
    }
  };

  const handlePrevVariation = () => {
    if (hasPrev) {
      setState(prev => ({ ...prev, viewingVariationId: prev.variations[viewingIndex - 1].id }));
    }
  };

  const selectedVariation = state.variations.find(v => v.id === state.selectedVariationId) || null;

  // LANDING PAGE RENDER
  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  // MAIN APP RENDER
  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-white overflow-hidden font-sans animate-in fade-in duration-700">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(p => p.filter(t => t.id !== id))} />

      {/* Top Bar */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-slate-900/80 backdrop-blur z-20">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-tr from-cyan-400 to-blue-500 shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
          <h1 className="font-bold tracking-wider text-sm text-slate-200">AI GEN: <span className="text-cyan-400">VARIATOR PRO</span></h1>
        </div>
        <div className="flex gap-4">
          <button onClick={handleReset} className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors">Reset Project</button>
          <button className="text-xs font-semibold px-4 py-1.5 rounded bg-cyan-600 text-white hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-900/40">Export All</button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        <SourceImagePanel 
          sourceImage={state.sourceImage} 
          baseDescription={state.baseDescription}
          hasVariations={state.variations.length > 0}
          onSetSource={handleSetSource}
          onDescriptionChange={handleDescriptionChange}
          onShowToast={showToast}
        />
        
        <NodeGraph 
          nodes={state.nodes}
          variations={state.variations}
          sourceImage={state.sourceImage}
          onAddNode={handleAddNode}
          onRemoveNode={handleRemoveNode}
          onUpdateNodePrompt={handleUpdateNodePrompt}
          onUpdateNodePosition={handleUpdateNodePosition}
          onRunNode={handleRunNode}
          isGenerating={state.isGenerating}
        />

        {/* View Modal with Carousel */}
        <ImagePreviewModal 
          variation={viewingVariation}
          onClose={() => setState(prev => ({ ...prev, viewingVariationId: null }))}
          onEdit={handleStartEdit}
          onNext={handleNextVariation}
          onPrev={handlePrevVariation}
          hasNext={hasNext}
          hasPrev={hasPrev}
        />

        {/* Edit Drawer (Prompt box for editing) */}
        <EditDrawer 
          variation={selectedVariation}
          onClose={handleCloseDrawer}
          onApplyEdit={handleApplyEdit}
        />
      </div>

      {/* Bottom Gallery */}
      <VariationGallery 
        variations={state.variations}
        onSelect={handleSelectVariationForView}
        onOpenSlideshow={handleOpenSlideshow}
      />
    </div>
  );
};

export default App;