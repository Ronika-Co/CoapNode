import React, { useState } from 'react'

export default function App() {
  const [accent, setAccent] = useState('indigo')
  const [clickCount, setClickCount] = useState(0)

  const versions = window.api || {
    node: () => '18.x.x (Fallback)',
    chrome: () => '120.x.x (Fallback)',
    electron: () => '30.x.x (Fallback)'
  }

  // Accent mapping
  const gradientMap = {
    indigo: 'from-indigo-500 to-purple-600 shadow-indigo-500/25',
    emerald: 'from-emerald-400 to-teal-600 shadow-emerald-500/25',
    violet: 'from-violet-500 to-fuchsia-600 shadow-violet-500/25'
  }

  const bgGradientMap = {
    indigo: 'from-slate-950 via-slate-900 to-indigo-950/40',
    emerald: 'from-slate-950 via-slate-900 to-emerald-950/20',
    violet: 'from-slate-950 via-slate-900 to-purple-950/30'
  }

  const borderMap = {
    indigo: 'border-indigo-500/20 hover:border-indigo-500/40',
    emerald: 'border-emerald-500/20 hover:border-emerald-500/40',
    violet: 'border-violet-500/20 hover:border-violet-500/40'
  }

  const textGradientMap = {
    indigo: 'from-indigo-400 via-purple-400 to-pink-400',
    emerald: 'from-emerald-400 via-teal-400 to-cyan-400',
    violet: 'from-violet-400 via-fuchsia-400 to-rose-400'
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgGradientMap[accent]} text-slate-100 flex flex-col justify-between transition-all duration-1000 overflow-hidden relative font-sans`}>
      {/* Decorative Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="p-6 border-b border-white/5 backdrop-blur-md bg-slate-950/20 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold tracking-wider shadow-lg shadow-indigo-500/30">
            C
          </div>
          <span className="font-semibold text-lg tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
            CoapNode Desktop
          </span>
        </div>
        
        {/* Style Accent Selector */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full p-1.5">
          {Object.keys(gradientMap).map((color) => (
            <button
              key={color}
              onClick={() => setAccent(color)}
              className={`w-5 h-5 rounded-full transition-all duration-300 ${
                color === 'indigo' ? 'bg-indigo-500' : color === 'emerald' ? 'bg-emerald-500' : 'bg-violet-500'
              } ${accent === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'opacity-60 hover:opacity-100'}`}
              title={`Switch accent to ${color}`}
            />
          ))}
        </div>
      </header>

      {/* Main Hero & Welcome */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto z-10">
        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs text-slate-300 font-medium">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${accent === 'indigo' ? 'bg-indigo-400' : accent === 'emerald' ? 'bg-emerald-400' : 'bg-violet-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${accent === 'indigo' ? 'bg-indigo-500' : accent === 'emerald' ? 'bg-emerald-500' : 'bg-violet-500'}`}></span>
          </span>
          Environment Ready
        </div>

        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
          Welcome to your{' '}
          <span className={`bg-clip-text text-transparent bg-gradient-to-r ${textGradientMap[accent]} transition-all duration-1000`}>
            Modern Desktop App
          </span>
        </h1>

        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
          Powered by <strong className="text-slate-200">Electron</strong>,{' '}
          <strong className="text-slate-200">React</strong>, and{' '}
          <strong className="text-slate-200">Tailwind CSS</strong>. Custom sandbox environment configured with isolated context.
        </p>

        {/* Dynamic Interactive Button */}
        <div className="mb-12">
          <button
            onClick={() => setClickCount(c => c + 1)}
            className={`px-8 py-3.5 rounded-xl font-semibold text-white tracking-wide shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 bg-gradient-to-r ${gradientMap[accent]}`}
          >
            {clickCount === 0 ? 'Click to interact' : `Interacted ${clickCount} time${clickCount > 1 ? 's' : ''}!`}
          </button>
        </div>

        {/* Tech Stack / Version Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full text-left">
          
          {/* Electron Card */}
          <div className={`p-4 rounded-xl bg-white/5 border ${borderMap[accent]} backdrop-blur-md transition-all duration-300 hover:bg-white/10 flex flex-col justify-between`}>
            <div>
              <span className="text-xs font-semibold text-indigo-400 tracking-wider uppercase">Electron</span>
              <h3 className="text-xl font-bold mt-1 text-slate-100">v{versions.electron()}</h3>
            </div>
            <p className="text-xs text-slate-400 mt-2">Native window & system integration shell</p>
          </div>

          {/* Node.js Card */}
          <div className={`p-4 rounded-xl bg-white/5 border ${borderMap[accent]} backdrop-blur-md transition-all duration-300 hover:bg-white/10 flex flex-col justify-between`}>
            <div>
              <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">Node.js</span>
              <h3 className="text-xl font-bold mt-1 text-slate-100">v{versions.node()}</h3>
            </div>
            <p className="text-xs text-slate-400 mt-2">Secure backend execution environment</p>
          </div>

          {/* Chrome/Renderer Card */}
          <div className={`p-4 rounded-xl bg-white/5 border ${borderMap[accent]} backdrop-blur-md transition-all duration-300 hover:bg-white/10 flex flex-col justify-between`}>
            <div>
              <span className="text-xs font-semibold text-cyan-400 tracking-wider uppercase">Chromium</span>
              <h3 className="text-xl font-bold mt-1 text-slate-100">v{versions.chrome()}</h3>
            </div>
            <p className="text-xs text-slate-400 mt-2">V8 compilation & page rendering engine</p>
          </div>

          {/* React & Tailwind Card */}
          <div className={`p-4 rounded-xl bg-white/5 border ${borderMap[accent]} backdrop-blur-md transition-all duration-300 hover:bg-white/10 flex flex-col justify-between`}>
            <div>
              <span className="text-xs font-semibold text-fuchsia-400 tracking-wider uppercase">Vite + React</span>
              <h3 className="text-xl font-bold mt-1 text-slate-100">Tailwind CSS</h3>
            </div>
            <p className="text-xs text-slate-400 mt-2">Highly responsive reactive component layout</p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center border-t border-white/5 bg-slate-950/30 text-xs text-slate-500 z-10">
        <div>CoapNode Desktop App Template &bull; Built securely with Context Isolation</div>
      </footer>
    </div>
  )
}
