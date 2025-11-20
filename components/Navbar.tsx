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
  ];

  return (
    <div className="w-64 h-screen bg-white text-slate-800 flex flex-col fixed left-0 top-0 border-r border-slate-200 z-50 shadow-sm">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            C
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">
              灵感情报局
            </h1>
            <p className="text-xs text-slate-500">Creative Hub</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentView === item.id
                ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500 border border-slate-200">
          <p className="font-bold text-slate-700 mb-1">系统状态</p>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>Gemini 2.5 Flash: 在线</span>
          </div>
        </div>
      </div>
    </div>
  );
};