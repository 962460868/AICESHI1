
import React, { useState, useRef } from 'react';
import { ToolType, RunningHubTask, startEnhanceTask, startWatermarkTask, startLightingTask, startMattingTask, startVideoRestoreTask, startPoseTask, pollTask } from '../services/runningHubService';
import { useAssets } from '../context/AssetContext';
import { Asset, PerformanceLevel } from '../types';

const TABS = [
    { id: 'enhance', label: '🎨 图像优化', desc: 'WAN 2.x 增强/风格化' },
    { id: 'watermark', label: '🚿 去水印', desc: '自动去除水印干扰' },
    { id: 'lighting', label: '💡 溶图打光', desc: '光影和谐化处理' },
    { id: 'pose', label: '🎭 姿态迁移', desc: '角色动作复刻' },
    { id: 'matting', label: '✂️ 智能抠图', desc: '主体分离透明化' },
    { id: 'video_restore', label: '🎬 视频修复', desc: '画质增强去噪' },
];

export const ArtTools: React.FC = () => {
  const { addAsset } = useAssets();
  const [activeTab, setActiveTab] = useState<ToolType>('enhance');
  const [tasks, setTasks] = useState<RunningHubTask[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form States
  const [files, setFiles] = useState<File[]>([]);
  const [auxFiles, setAuxFiles] = useState<File[]>([]); // For Pose
  const [enhanceVersion, setEnhanceVersion] = useState<'WAN 2.2' | 'WAN 2.1'>('WAN 2.2');
  const [enhanceStyle, setEnhanceStyle] = useState<'默认' | '写实' | '3D卡通'>('默认');
  const [poseStrength, setPoseStrength] = useState(15);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const auxFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isAux = false) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (isAux) setAuxFiles(newFiles);
      else setFiles(newFiles);
    }
  };

  const createTask = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    const newTasks: RunningHubTask[] = [];

    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const tempId = Math.random().toString(36).substr(2, 9);
            
            const task: RunningHubTask = {
                id: tempId,
                type: activeTab,
                status: 'pending',
                inputFile: file,
                createdAt: Date.now()
            };
            
            // Pose special handling
            if (activeTab === 'pose') {
                if (auxFiles[i]) task.auxFile = auxFiles[i];
                else continue; // Skip if no pair
            }

            setTasks(prev => [task, ...prev]);
            newTasks.push(task);
        }

        // Process Sequentially
        for (const task of newTasks) {
            updateTaskStatus(task.id, 'processing');
            try {
                let remoteId = '';
                if (task.type === 'enhance') remoteId = await startEnhanceTask(task.inputFile, enhanceVersion, enhanceStyle);
                else if (task.type === 'watermark') remoteId = await startWatermarkTask(task.inputFile);
                else if (task.type === 'lighting') remoteId = await startLightingTask(task.inputFile);
                else if (task.type === 'matting') remoteId = await startMattingTask(task.inputFile);
                else if (task.type === 'video_restore') remoteId = await startVideoRestoreTask(task.inputFile);
                else if (task.type === 'pose' && task.auxFile) remoteId = await startPoseTask(task.inputFile, task.auxFile, poseStrength);

                updateTask(task.id, { taskId: remoteId });

                // Poll
                const outputs = await pollTask(remoteId, task.type, (status) => {
                    // Optional: update fine-grained status text if needed
                });

                updateTask(task.id, { status: 'completed', result: outputs });

            } catch (e: any) {
                console.error(e);
                updateTask(task.id, { status: 'failed', error: e.message });
            }
        }
    } finally {
        setIsProcessing(false);
        setFiles([]);
        setAuxFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (auxFileInputRef.current) auxFileInputRef.current.value = '';
    }
  };

  const updateTask = (id: string, updates: Partial<RunningHubTask>) => {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const updateTaskStatus = (id: string, status: RunningHubTask['status']) => {
      updateTask(id, { status });
  };

  const saveToLibrary = (task: RunningHubTask) => {
      if (!task.result || task.result.length === 0) return;
      
      task.result.forEach((res, idx) => {
          const newAsset: Asset = {
              id: `art-${task.id}-${idx}`,
              url: res.url,
              fileName: `${task.type}_${task.inputFile.name}_${idx+1}.${res.type === 'video' ? 'mp4' : 'png'}`,
              uploadDate: new Date().toISOString(),
              performanceLevel: PerformanceLevel.UNRATED,
              computedMeta: { width: 0, height: 0, dominantColors: [], aspectRatio: '?', brightness: 0, contrast: 0 },
              analysis: null,
              status: 'processing'
          };
          addAsset({ ...newAsset, status: 'completed' });
      });
      alert('已保存到资产库');
  };

  // CRITICAL LAYOUT FIX: h-full, w-full, overflow-hidden on parent
  // and min-h-0 on flex children allow scrollbars to work correctly.
  return (
    <div className="flex h-full w-full bg-zinc-950 text-zinc-200 overflow-hidden">
        {/* Left: Controls */}
        <div className="w-80 flex-shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full">
            <div className="p-6 border-b border-zinc-800 flex-shrink-0">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    🎨 美术工具箱
                </h2>
                <p className="text-xs text-zinc-500 mt-1">RunningHub AI 驱动</p>
            </div>
            
            {/* Scrollable Controls Area */}
            <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                <div className="grid grid-cols-1 gap-1 p-2">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as ToolType)}
                            className={`text-left p-3 rounded-lg transition-colors border ${
                                activeTab === tab.id 
                                ? 'bg-blue-600/20 border-blue-500/50 text-blue-100' 
                                : 'border-transparent hover:bg-zinc-800 text-zinc-400'
                            }`}
                        >
                            <div className="font-bold text-sm">{tab.label}</div>
                            <div className="text-[10px] opacity-70">{tab.desc}</div>
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t border-zinc-800 space-y-6 pb-20">
                    {/* Dynamic Controls */}
                    {activeTab === 'enhance' && (
                        <div className="space-y-4 animate-in fade-in">
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase">模型版本</label>
                                <div className="flex gap-2 mt-2">
                                    {['WAN 2.2', 'WAN 2.1'].map(v => (
                                        <button key={v} onClick={() => setEnhanceVersion(v as any)} 
                                            className={`flex-1 py-1.5 text-xs rounded border ${enhanceVersion === v ? 'bg-blue-600 border-blue-500 text-white' : 'border-zinc-700 text-zinc-400'}`}>
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase">风格</label>
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                    {['默认', '写实', '3D卡通'].map(s => (
                                        <button key={s} onClick={() => setEnhanceStyle(s as any)} 
                                            className={`py-1.5 text-xs rounded border ${enhanceStyle === s ? 'bg-purple-600 border-purple-500 text-white' : 'border-zinc-700 text-zinc-400'}`}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'pose' && (
                        <div className="space-y-4 animate-in fade-in">
                             <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase">姿态强度 ({poseStrength})</label>
                                <input 
                                    type="range" min="4" max="15" step="1" 
                                    value={poseStrength} onChange={(e) => setPoseStrength(parseInt(e.target.value))}
                                    className="w-full mt-2 accent-blue-500"
                                />
                                <div className="flex justify-between text-[10px] text-zinc-500">
                                    <span>角色相似</span>
                                    <span>姿态相似</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Uploaders */}
                    <div className="space-y-4">
                         <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase">
                                {activeTab === 'pose' ? '1. 上传角色图' : activeTab === 'video_restore' ? '上传视频' : '上传图片'}
                            </label>
                            <input 
                                ref={fileInputRef}
                                type="file" 
                                multiple={activeTab !== 'pose'} 
                                accept={activeTab === 'video_restore' ? 'video/*' : 'image/*'}
                                onChange={(e) => handleFileChange(e)}
                                className="mt-2 block w-full text-xs text-zinc-400
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-xs file:font-semibold
                                file:bg-zinc-800 file:text-zinc-300
                                hover:file:bg-zinc-700"
                            />
                         </div>

                         {activeTab === 'pose' && (
                             <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase">2. 上传姿态参考图</label>
                                <input 
                                    ref={auxFileInputRef}
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, true)}
                                    className="mt-2 block w-full text-xs text-zinc-400
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-xs file:font-semibold
                                    file:bg-zinc-800 file:text-zinc-300
                                    hover:file:bg-zinc-700"
                                />
                             </div>
                         )}
                    </div>

                    <button
                        onClick={createTask}
                        disabled={isProcessing || files.length === 0}
                        className={`w-full py-3 rounded-xl font-bold text-sm shadow-lg transition-all ${
                            isProcessing || files.length === 0
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/25'
                        }`}
                    >
                        {isProcessing ? '处理中...' : '🚀 开始执行'}
                    </button>
                </div>
            </div>
        </div>

        {/* Right: Queue & Results */}
        <div className="flex-1 flex flex-col bg-zinc-950 h-full overflow-hidden">
            <div className="h-16 border-b border-zinc-800 flex items-center px-6 justify-between bg-zinc-900/50 flex-shrink-0">
                <h3 className="font-bold text-zinc-300">任务队列 ({tasks.length})</h3>
                {isProcessing && <div className="text-xs text-blue-400 animate-pulse">⚡ 后台处理中...</div>}
            </div>
            
            {/* Scrollable Tasks Area */}
            <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-6 custom-scrollbar">
                {tasks.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 opacity-50">
                        <div className="text-6xl mb-4">🎨</div>
                        <p>暂无任务，请在左侧上传文件开始创作</p>
                    </div>
                )}

                {tasks.map(task => (
                    <div key={task.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                        <div className="p-3 bg-zinc-800/50 border-b border-zinc-800 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className={`w-2 h-2 rounded-full ${
                                    task.status === 'completed' ? 'bg-green-500' : 
                                    task.status === 'failed' ? 'bg-red-500' : 
                                    'bg-blue-500 animate-pulse'
                                }`} />
                                <span className="text-sm font-medium text-zinc-200 capitalize">
                                    {task.type.replace('_', ' ')}
                                </span>
                                <span className="text-xs text-zinc-500 font-mono">{task.id}</span>
                            </div>
                            <div className="text-xs text-zinc-500">
                                {new Date(task.createdAt).toLocaleTimeString()}
                            </div>
                        </div>
                        
                        <div className="p-4">
                            <div className="flex gap-6">
                                {/* Input */}
                                <div className="w-48 shrink-0 space-y-2">
                                    <div className="text-xs text-zinc-500 uppercase text-center">Original</div>
                                    <div className="aspect-square bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden flex items-center justify-center">
                                        {task.type === 'video_restore' ? (
                                            <div className="text-4xl">🎬</div>
                                        ) : (
                                            <img src={URL.createObjectURL(task.inputFile)} className="max-w-full max-h-full object-contain" />
                                        )}
                                    </div>
                                </div>

                                {/* Arrow */}
                                <div className="flex items-center justify-center text-zinc-600">
                                    →
                                </div>

                                {/* Output */}
                                <div className="flex-1 space-y-2">
                                    <div className="text-xs text-zinc-500 uppercase text-center">Result</div>
                                    
                                    {task.status === 'completed' && task.result ? (
                                        <div className="flex gap-4 overflow-x-auto pb-2">
                                            {task.result.map((res, idx) => (
                                                <div key={idx} className="relative group aspect-square bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden flex items-center justify-center min-w-[200px]">
                                                    {res.type === 'video' ? (
                                                        <video src={res.url} controls className="w-full h-full object-cover" />
                                                    ) : (
                                                        <img src={res.url} className="w-full h-full object-contain" />
                                                    )}
                                                    <a 
                                                        href={res.url} target="_blank" rel="noreferrer"
                                                        className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        下载
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    ) : task.status === 'failed' ? (
                                        <div className="h-32 flex items-center justify-center text-red-400 bg-red-900/10 rounded-lg border border-red-900/20 text-sm px-4 text-center">
                                            Error: {task.error || 'Unknown error'}
                                        </div>
                                    ) : (
                                        <div className="h-32 flex items-center justify-center text-zinc-500 bg-zinc-900/50 rounded-lg border border-zinc-800 animate-pulse">
                                            处理中... 请稍候
                                        </div>
                                    )}
                                </div>
                            </div>

                            {task.status === 'completed' && (
                                <div className="mt-4 flex justify-end">
                                    <button 
                                        onClick={() => saveToLibrary(task)}
                                        className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded border border-zinc-700 transition-colors flex items-center gap-2"
                                    >
                                        <span>💾</span> 保存到资产库
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};
