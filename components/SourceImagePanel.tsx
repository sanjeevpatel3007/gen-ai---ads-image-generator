import React, { useRef, useState } from 'react';
import { generateVariation } from '../services/geminiService';

interface SourceImagePanelProps {
  sourceImage: string | null;
  baseDescription: string;
  hasVariations: boolean; // Prop to check if we can delete safely
  onSetSource: (image: string, description: string) => void;
  onDescriptionChange: (desc: string) => void;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const SourceImagePanel: React.FC<SourceImagePanelProps> = ({
  sourceImage,
  baseDescription,
  hasVariations,
  onSetSource,
  onDescriptionChange,
  onShowToast
}) => {
  const refImageInputRef = useRef<HTMLInputElement>(null);
  
  // Local state for the generation form
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const alertUser = (msg: string, type: 'success' | 'error' | 'info' = 'error') => {
    if (onShowToast) {
      onShowToast(msg, type);
    } else {
      alert(msg);
    }
  };

  const handleRefImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setReferenceImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateClick = async () => {
    if (!generationPrompt.trim()) {
      alertUser("Please enter a prompt.", 'error');
      return;
    }
    setIsGenerating(true);
    try {
      const imageUrl = await generateVariation(generationPrompt, referenceImage);
      onSetSource(imageUrl, generationPrompt);
    } catch (e) {
      console.error(e);
      alertUser("Failed to generate source image.", 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteSource = () => {
    if (hasVariations) {
      if (!confirm("Deleting the source will not delete existing variations, but you won't be able to generate new ones until you add a new source. Continue?")) {
        return;
      }
    }
    onSetSource("", "");
    setReferenceImage(null);
    setGenerationPrompt("");
  };

  const handleRegenerateSource = () => {
    if (confirm("Regenerate a new source? This will take you back to the prompt screen.")) {
      // Preserve the current description as the prompt for the next iteration
      setGenerationPrompt(baseDescription);
      // Clear the source image to show the input form again
      onSetSource("", baseDescription); 
    }
  };

  // ------------------------------------------
  // RENDER: FILLED STATE (Source Exists)
  // ------------------------------------------
  if (sourceImage) {
    return (
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-white/10 bg-slate-950/80 backdrop-blur-xl h-full z-10 relative shadow-2xl">
        <div className="p-4 border-b border-white/5 bg-gradient-to-r from-emerald-950/30 to-transparent">
          <div className="flex items-center gap-2 mb-1">
             <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse"></div>
             <h2 className="text-xs font-bold tracking-widest text-emerald-100">SOURCE ACTIVE</h2>
          </div>
          <p className="text-[10px] text-emerald-500/70 truncate">Source locked for generation</p>
        </div>

        <div className="p-5 flex flex-col gap-5 flex-1 overflow-y-auto">
          {/* Main Image Display */}
          <div className="relative group rounded-2xl overflow-hidden border border-slate-700 bg-black shadow-2xl aspect-square">
            <img src={sourceImage} alt="Source" className="w-full h-full object-contain" />
            
            {/* Overlay Actions */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
              <button 
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = sourceImage;
                  link.download = 'source_image.png';
                  link.click();
                }}
                className="px-5 py-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur text-xs font-bold border border-white/20 transition-all hover:scale-105"
              >
                Download Image
              </button>
            </div>
          </div>

          {/* Context Display (Editable) */}
          <div className="space-y-2 bg-slate-900/50 p-3 rounded-lg border border-white/5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-2">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              AI Context
            </label>
            <textarea
              value={baseDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="e.g. Yellow JCB Excavator"
              className="w-full h-20 bg-transparent border-none text-xs text-slate-200 focus:ring-0 outline-none resize-none p-0 leading-relaxed"
            />
          </div>

          <div className="mt-auto grid grid-cols-2 gap-3">
            <button 
              onClick={handleDeleteSource}
              className="py-3 rounded-xl border border-red-900/30 bg-red-950/10 text-red-400 text-xs font-bold hover:bg-red-950/30 hover:text-red-300 transition-all"
            >
              Delete Source
            </button>
            <button 
              onClick={handleRegenerateSource}
              className="py-3 rounded-xl border border-cyan-900/30 bg-cyan-950/10 text-cyan-400 text-xs font-bold hover:bg-cyan-950/30 hover:text-cyan-300 transition-all"
            >
              Regenerate
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------
  // RENDER: EMPTY STATE (Prompt / Generate)
  // ------------------------------------------
  return (
    <div className="w-80 flex-shrink-0 flex flex-col border-r border-white/10 bg-slate-900/50 backdrop-blur-xl h-full z-10">
      <div className="p-4 border-b border-white/5">
        <h2 className="text-xs font-bold tracking-widest text-slate-300">1. CREATE SOURCE</h2>
        <p className="text-[10px] text-slate-500 mt-1">Generate the base asset.</p>
      </div>

      <div className="flex-1 p-5 flex flex-col overflow-y-auto">
          <div className="flex flex-col gap-5 h-full">
            <div className="space-y-2">
               <label className="text-[10px] font-bold text-slate-400">PROMPT</label>
               <textarea
                value={generationPrompt}
                onChange={(e) => setGenerationPrompt(e.target.value)}
                placeholder="Describe the image (e.g. Futuristic red sports car in neon studio)"
                className="w-full h-32 bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white resize-none focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-600 focus:bg-slate-800/80"
              />
            </div>

            <div className="space-y-2">
               <div className="flex justify-between items-center">
                 <label className="text-[10px] font-bold text-slate-400">REFERENCE GUIDE (OPTIONAL)</label>
                 {referenceImage && <button onClick={() => setReferenceImage(null)} className="text-[9px] text-red-400 hover:underline">Remove</button>}
               </div>
               
               <div 
                 onClick={() => refImageInputRef.current?.click()}
                 className={`border border-dashed rounded-xl p-3 cursor-pointer transition-all flex items-center gap-3 relative overflow-hidden group ${referenceImage ? 'border-cyan-500/50 bg-cyan-900/5' : 'border-slate-700 hover:border-slate-500 bg-slate-800/30'}`}
               >
                 {referenceImage ? (
                   <>
                     <img src={referenceImage} alt="Ref" className="w-10 h-10 object-cover rounded bg-black border border-white/10" />
                     <div className="overflow-hidden relative z-10">
                       <p className="text-[10px] text-cyan-200 font-bold">Image Attached</p>
                       <p className="text-[9px] text-slate-500 truncate">Using as structure guide</p>
                     </div>
                   </>
                 ) : (
                   <>
                     <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-600 transition-colors">
                       <span className="text-slate-400 text-xs">+</span>
                     </div>
                     <p className="text-[10px] text-slate-500 group-hover:text-slate-300">Add sketch or photo...</p>
                   </>
                 )}
                 <input type="file" ref={refImageInputRef} className="hidden" accept="image/*" onChange={handleRefImageChange} />
               </div>
            </div>
            
            <button
              onClick={handleGenerateClick}
              disabled={isGenerating || !generationPrompt.trim()}
              className={`mt-4 w-full py-3.5 rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all
                ${isGenerating 
                  ? 'bg-slate-800 text-slate-400 cursor-wait' 
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-900/30 hover:scale-[1.02]'}
              `}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Generating Source...
                </>
              ) : 'GENERATE SOURCE'}
            </button>
          </div>
      </div>
    </div>
  );
};