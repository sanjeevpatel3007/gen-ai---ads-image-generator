import React from 'react';

interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  return (
    <div className="relative w-full h-screen bg-[#05080f] overflow-hidden flex flex-col items-center justify-center font-sans text-white selection:bg-cyan-500/30">
      
      {/* Clean Background Pattern (Dots) - Dark Mode */}
      <div className="absolute inset-0 h-full w-full pointer-events-none opacity-20" style={{
          backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)',
          backgroundSize: '24px 24px'
      }}></div>
      
      {/* Floating Glows (Subtle) */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>

      {/* Main Card Container */}
      <div className="z-10 relative bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl p-12 md:p-20 text-center max-w-3xl mx-6 animate-in fade-in zoom-in duration-700 slide-in-from-bottom-4">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 text-[11px] font-bold tracking-widest uppercase mb-8 hover:bg-cyan-900/40 transition-colors cursor-default">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          Gen 2.5 Model
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 drop-shadow-sm">
          Unleash <span className="text-cyan-400 underline decoration-4 underline-offset-8 decoration-cyan-500/30">Creative</span> Power
        </h1>
        
        {/* Subtext */}
        <p className="text-lg md:text-xl text-slate-400 max-w-lg mx-auto leading-relaxed mb-10 font-medium">
          Transform your assets instantly. Rotate, zoom, and reimagine product visuals with zero latency.
        </p>

        {/* CTA Button */}
        <button 
          onClick={onEnter}
          className="group relative inline-flex items-center justify-center px-10 py-4 text-base font-bold text-slate-900 transition-all duration-300 bg-white rounded-full hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:-translate-y-1 focus:outline-none"
        >
          <span className="relative flex items-center gap-3">
            ENTER STUDIO
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </button>
        
        {/* Footer Micro-copy */}
        <div className="mt-12 pt-8 border-t border-white/10 flex justify-center gap-8 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
           <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-slate-600 rounded-full"></div> Fast Render</span>
           <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-slate-600 rounded-full"></div> High Res</span>
           <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-slate-600 rounded-full"></div> Secure</span>
        </div>
      </div>
    </div>
  );
};