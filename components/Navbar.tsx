
import React from 'react';
import { ViewState } from '../types';

interface NavbarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setView }) => {
  const navItems = [
    { id: ViewState.UPLOAD, label: '素材导入', icon: '📥' },
    { id: ViewState.GALLERY, label: '资产图库', icon: '🖼️' },
    { id: ViewState.TRENDS, label: '趋势洞察', icon: '📈' },
    { id: ViewState.ART_TOOLS, label: '美术工具', icon: '🎨' },
  ];

  return (
    <div className="w-20 lg:w-20 flex-shrink-0 h-screen bg-zinc-900 text-zinc-400 flex flex-col border-r border-zinc-800 z-50">
      <div className="p-4 flex justify-center border-b border-zinc-800">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-900/20">
          C
        </div>
      </div>

      <nav className="flex-1 py-6 flex flex-col items-center space-y-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            title={item.label}
            className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200 ${
              currentView === item.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            <span className="text-2xl">{item.icon}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-800 flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" title="System Online"></div>
      </div>
    </div>
  );
};