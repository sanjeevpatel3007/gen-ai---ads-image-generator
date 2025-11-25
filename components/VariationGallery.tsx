import React from 'react';
import { Variation } from '../types';

interface VariationGalleryProps {
  variations: Variation[];
  onSelect: (variation: Variation) => void;
  onOpenSlideshow: () => void;
}

export const VariationGallery: React.FC<VariationGalleryProps> = ({ variations, onSelect, onOpenSlideshow }) => {
  // Hide the gallery completely if no variations exist
  if (!variations || variations.length === 0) {
    return null;
  }

  return (
    <div className="h-48 flex-shrink-0 bg-slate-900 border-t border-white/10 flex flex-col z-20 animate-in slide-in-from-bottom-10 duration-500 ease-out">
      <div className="flex items-center justify-between px-6 py-2 bg-black/20">
        <h2 className="text-xs font-bold tracking-widest text-slate-400 flex items-center gap-2">
          GENERATED VARIATIONS 
          <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px]">{variations.length}</span>
        </h2>
        <div className="flex gap-3">
          <button 
            onClick={onOpenSlideshow}
            className="flex items-center gap-1.5 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors bg-cyan-950/30 hover:bg-cyan-950/50 px-3 py-1 rounded-full border border-cyan-500/30"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            PLAY SLIDESHOW
          </button>
          <div className="flex gap-2 text-[10px] text-slate-500 items-center">
            <span>Scroll to view more</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 py-3 flex gap-4 pb-4">
        {variations.map((v) => (
          <div 
            key={v.id}
            onClick={() => onSelect(v)}
            className="group relative flex-shrink-0 w-48 h-full rounded-lg overflow-hidden border border-slate-700 bg-slate-800 cursor-pointer hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all duration-200"
          >
            <img 
              src={v.imageUrl} 
              alt={v.label} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3 pt-6">
              <p className="text-xs font-bold text-white truncate">{v.label}</p>
              <p className="text-[10px] text-slate-400">From: {v.fromNodeId}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};