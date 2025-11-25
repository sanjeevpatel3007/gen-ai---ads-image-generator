import React, { useState } from 'react';
import { Variation } from '../types';

interface EditDrawerProps {
  variation: Variation | null;
  onClose: () => void;
  onApplyEdit: (variation: Variation, instruction: string) => Promise<void>;
}

export const EditDrawer: React.FC<EditDrawerProps> = ({ variation, onClose, onApplyEdit }) => {
  const [instruction, setInstruction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!variation) return null;

  const handleApply = async () => {
    if (!instruction.trim()) return;
    setIsProcessing(true);
    await onApplyEdit(variation, instruction);
    setIsProcessing(false);
    setInstruction(''); // Reset
  };

  return (
    <div className="absolute top-0 right-0 h-full w-96 bg-slate-900/90 backdrop-blur-xl border-l border-white/10 shadow-2xl z-30 flex flex-col transform transition-transform duration-300">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="font-bold text-lg text-white">Edit Variation</h2>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-white">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        <div className="rounded-xl overflow-hidden border border-slate-700 shadow-lg bg-black">
          <img src={variation.imageUrl} alt="Editing" className="w-full h-auto" />
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase font-bold text-cyan-400 tracking-wider">Instructions</label>
          <p className="text-xs text-slate-400">Describe what you want to change (e.g., "Change background to a snowy mountain", "Make it look like a sketch").</p>
          <textarea 
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            className="w-full h-32 bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-white focus:border-cyan-500 focus:outline-none resize-none"
            placeholder="Enter edit instructions..."
          />
        </div>

        <button
          onClick={handleApply}
          disabled={isProcessing || !instruction.trim()}
          className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2
            ${isProcessing || !instruction.trim() 
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/25'}
          `}
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing Edit...
            </>
          ) : (
            'Generate Edit'
          )}
        </button>
      </div>
    </div>
  );
};