
import React, { useEffect } from 'react';
import { Variation } from '../types';

interface ImagePreviewModalProps {
  variation: Variation | null;
  onClose: () => void;
  onEdit: (variation: Variation) => void;
  // Navigation props
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ 
  variation, 
  onClose, 
  onEdit,
  onNext,
  onPrev,
  hasNext,
  hasPrev
}) => {
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!variation) return;
      
      switch(e.key) {
        case 'ArrowRight':
          if (hasNext && onNext) onNext();
          break;
        case 'ArrowLeft':
          if (hasPrev && onPrev) onPrev();
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [variation, hasNext, hasPrev, onNext, onPrev, onClose]);

  if (!variation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-6 animate-in fade-in duration-200" onClick={onClose}>
      {/* Navigation Buttons (Left) */}
      {hasPrev && (
        <button 
          onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
          className="absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/50 hover:bg-white/10 text-slate-400 hover:text-white transition-all z-50 border border-white/5 hover:border-white/20"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Navigation Buttons (Right) */}
      {hasNext && (
        <button 
          onClick={(e) => { e.stopPropagation(); onNext?.(); }}
          className="absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/50 hover:bg-white/10 text-slate-400 hover:text-white transition-all z-50 border border-white/5 hover:border-white/20"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      <div 
        className="relative w-full max-w-6xl h-full flex flex-col gap-4" 
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex justify-between items-start text-white bg-black/40 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
           <div>
             <h2 className="text-2xl font-bold tracking-tight text-white mb-1">{variation.label}</h2>
             <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs">Node: {variation.fromNodeId}</span>
                <span>•</span>
                <span className="opacity-70">{new Date(variation.timestamp).toLocaleTimeString()}</span>
             </div>
           </div>
           
           <div className="flex items-center gap-3">
             {/* Edit Button */}
             <button 
               onClick={() => onEdit(variation)}
               className="group flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-bold transition-all shadow-lg shadow-cyan-900/20 hover:shadow-cyan-500/30"
               title="Edit this variation"
             >
               <svg className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
               </svg>
               <span>Edit / Remix</span>
             </button>

             <div className="w-px h-8 bg-white/20 mx-1"></div>

             {/* Close Button */}
             <button 
               onClick={onClose}
               className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
             >
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
           </div>
        </div>

        {/* Image Container */}
        <div className="flex-1 rounded-2xl overflow-hidden border border-slate-800 bg-[#050505] flex items-center justify-center relative shadow-2xl group">
           {/* Checkerboard background for transparency */}
           <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
           }}></div>
           
           <img 
             src={variation.imageUrl} 
             alt={variation.label} 
             className="relative max-w-full max-h-full object-contain shadow-2xl transition-transform duration-200"
           />
        </div>
      </div>
    </div>
  );
};
