
import { v4 as uuidv4 } from 'uuid';

// --- Constants from Python Script ---
const API_CONFIG = {
  WATERMARK: {
    KEY: "9394a5c6d9454cd2b31e24661dd11c3d",
    ID: "1986469254155403266"
  },
  LIGHTING: {
    KEY: "9394a5c6d9454cd2b31e24661dd11c3d",
    ID: "1985718229576425473"
  },
  POSE: {
    KEY: "9394a5c6d9454cd2b31e24661dd11c3d",
    ID_OLD: "1975745173911154689",
    ID_NEW: "1990654378698838018"
  },
  VIDEO_RESTORE: {
    KEY: "c95f4c4d2703479abfbc55eefeb9bb71",
    ID: "1980134984679854082"
  },
  MATTING: {
    KEY: "c95f4c4d2703479abfbc55eefeb9bb71",
    ID: "1991469920194142210"
  },
  ENHANCE: {
    KEY: "9394a5c6d9454cd2b31e24661dd11c3d",
    ID_V2_2: "1986501194824773634",
    ID_V2_2_REALISTIC: "1990350315130114050",
    ID_V2_2_3D: "1990258505405919234",
    ID_V2_1: "1947599512657453057"
  }
};

// Style Prompts
const STYLE_PROMPTS: Record<string, { positive: string, negative: string }> = {
    "写实": {
        positive: "photorealistic, 8k uhd, raw photo, dslr, soft lighting, high quality, film grain, Fujifilm XT3, sharp focus, detailed skin texture, volumetric fog, cinematic composition, (specific lighting: natural light/golden hour/studio lighting), shot on 35mm/50mm/85mm lens, bokeh, ultra detailed, professional photography",
        negative: "cartoon, cg, 3d render, unreal, anime, illustration, painting, sketch, drawing, artwork, low quality, blurry, pixelated, jpeg artifacts, bad anatomy, deformed, mutated, disfigured, poorly drawn face, extra limbs, duplicate, worst quality, watermark, signature, text"
    },
    "3D卡通": {
        positive: "3d render, pixar style, disney style, octane render, blender, unreal engine 5, cute character design, stylized, volumetric lighting, soft shadows, vibrant colors, high detail, 8k, cartoon aesthetic, smooth surfaces, professional 3d artwork, trending on artstation, perfect topology, clean geometry",
        negative: "realistic, photorealistic, real photo, photograph, 2d, flat, sketch, low poly, low quality, blurry, pixelated, bad anatomy, deformed, poorly modeled, bad topology, artifacts, glitches, worst quality, low detail, amateur, noise, grain, dirty render"
    }
};

export type ToolType = 'enhance' | 'watermark' | 'lighting' | 'pose' | 'matting' | 'video_restore';

export interface TaskResult {
    url: string;
    type: 'image' | 'video';
}

export interface RunningHubTask {
    id: string;
    taskId?: string;
    type: ToolType;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    inputFile: File;
    auxFile?: File; // For Pose (Pose Image)
    result?: TaskResult[]; // Array because Pose returns 2 images
    params?: any;
    error?: string;
    createdAt: number;
}

// --- API Helpers ---

const uploadFile = async (file: File, apiKey: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('apiKey', apiKey);
    formData.append('fileType', file.type.startsWith('video') ? 'video' : 'image');

    const res = await fetch('https://www.runninghub.cn/task/openapi/upload', {
        method: 'POST',
        body: formData
    });
    
    const data = await res.json();
    if (data.code !== 0) throw new Error(data.msg || 'Upload failed');
    return data.data.fileName;
};

const runTask = async (apiKey: string, webappId: string, nodeInfoList: any[], instanceType?: string): Promise<string> => {
    const payload: any = {
        apiKey,
        webappId,
        nodeInfoList
    };
    if (instanceType) payload.instanceType = instanceType;

    const res = await fetch('https://www.runninghub.cn/task/openapi/ai-app/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.code !== 0) throw new Error(data.msg || 'Task start failed');
    return data.data.taskId;
};

export const checkTaskStatus = async (taskId: string, apiKey: string): Promise<'SUCCESS' | 'FAILED' | 'RUNNING' | 'QUEUED' | 'UNKNOWN'> => {
    try {
        const res = await fetch('https://www.runninghub.cn/task/openapi/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey, taskId })
        });
        const data = await res.json();
        if (data.code !== 0) return 'UNKNOWN';
        return data.data; // SUCCESS, FAILED, RUNNING...
    } catch (e) {
        return 'UNKNOWN';
    }
};

const getTaskOutputs = async (taskId: string, apiKey: string): Promise<TaskResult[]> => {
    const res = await fetch('https://www.runninghub.cn/task/openapi/outputs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, taskId })
    });
    const data = await res.json();
    if (data.code !== 0) throw new Error(data.msg || 'Get outputs failed');
    
    return (data.data || []).map((item: any) => ({
        url: item.fileUrl,
        type: item.fileUrl.endsWith('.mp4') ? 'video' : 'image'
    }));
};

// --- Public Methods ---

export const startEnhanceTask = async (file: File, version: 'WAN 2.2' | 'WAN 2.1', style: '默认' | '写实' | '3D卡通'): Promise<string> => {
    const apiKey = API_CONFIG.ENHANCE.KEY;
    const uploadedName = await uploadFile(file, apiKey);
    
    let webappId = API_CONFIG.ENHANCE.ID_V2_2;
    let nodeInfo: any[] = [];
    let instanceType: string | undefined = undefined;

    if (version === 'WAN 2.1') {
        webappId = API_CONFIG.ENHANCE.ID_V2_1;
        nodeInfo = [{ nodeId: "38", fieldName: "image", fieldValue: uploadedName }];
        // Add prompts manually for V2.1 if style is not default
        if (style !== '默认' && STYLE_PROMPTS[style]) {
            nodeInfo.push(
                { nodeId: "60", fieldName: "text", fieldValue: STYLE_PROMPTS[style].positive },
                { nodeId: "4", fieldName: "text", fieldValue: STYLE_PROMPTS[style].negative }
            );
        }
    } else {
        // WAN 2.2
        if (style === '写实') {
            webappId = API_CONFIG.ENHANCE.ID_V2_2_REALISTIC;
            nodeInfo = [{ nodeId: "14", fieldName: "image", fieldValue: uploadedName }];
            instanceType = "plus";
        } else if (style === '3D卡通') {
            webappId = API_CONFIG.ENHANCE.ID_V2_2_3D;
            nodeInfo = [{ nodeId: "38", fieldName: "image", fieldValue: uploadedName }];
        } else {
            // Default 2.2
            webappId = API_CONFIG.ENHANCE.ID_V2_2;
            nodeInfo = [{ nodeId: "14", fieldName: "image", fieldValue: uploadedName }];
             // Add prompts manually for V2.2 Default
             if (style !== '默认' && STYLE_PROMPTS[style]) {
                 nodeInfo.push(
                    { nodeId: "66", fieldName: "text", fieldValue: STYLE_PROMPTS[style].positive },
                    { nodeId: "21", fieldName: "text", fieldValue: STYLE_PROMPTS[style].negative }
                );
             }
        }
    }

    return runTask(apiKey, webappId, nodeInfo, instanceType);
};

export const startWatermarkTask = async (file: File): Promise<string> => {
    const apiKey = API_CONFIG.WATERMARK.KEY;
    const uploadedName = await uploadFile(file, apiKey);
    const nodeInfo = [{ nodeId: "191", fieldName: "image", fieldValue: uploadedName }];
    return runTask(apiKey, API_CONFIG.WATERMARK.ID, nodeInfo);
};

export const startLightingTask = async (file: File): Promise<string> => {
    const apiKey = API_CONFIG.LIGHTING.KEY;
    const uploadedName = await uploadFile(file, apiKey);
    const nodeInfo = [{ nodeId: "437", fieldName: "image", fieldValue: uploadedName }];
    return runTask(apiKey, API_CONFIG.LIGHTING.ID, nodeInfo, "plus");
};

export const startMattingTask = async (file: File): Promise<string> => {
    const apiKey = API_CONFIG.MATTING.KEY;
    const uploadedName = await uploadFile(file, apiKey);
    const nodeInfo = [{ nodeId: "122", fieldName: "image", fieldValue: uploadedName }];
    return runTask(apiKey, API_CONFIG.MATTING.ID, nodeInfo);
};

export const startVideoRestoreTask = async (file: File): Promise<string> => {
    const apiKey = API_CONFIG.VIDEO_RESTORE.KEY;
    const uploadedName = await uploadFile(file, apiKey);
    const nodeInfo = [{ nodeId: "36", fieldName: "video", fieldValue: uploadedName }];
    return runTask(apiKey, API_CONFIG.VIDEO_RESTORE.ID, nodeInfo, "plus");
};

export const startPoseTask = async (charFile: File, poseFile: File, strength: number): Promise<string> => {
    const apiKey = API_CONFIG.POSE.KEY;
    const charName = await uploadFile(charFile, apiKey);
    const poseName = await uploadFile(poseFile, apiKey);
    
    const nodeInfo = [
        { nodeId: "6", fieldName: "image", fieldValue: charName },
        { nodeId: "73", fieldName: "image", fieldValue: poseName },
        { nodeId: "140", fieldName: "value", fieldValue: strength.toString() }
    ];
    
    return runTask(apiKey, API_CONFIG.POSE.ID_NEW, nodeInfo);
};

export const pollTask = async (taskId: string, toolType: ToolType, onStatus: (s: string) => void): Promise<TaskResult[]> => {
    let apiKey = API_CONFIG.WATERMARK.KEY; // Default shared key
    if (toolType === 'video_restore' || toolType === 'matting') apiKey = API_CONFIG.VIDEO_RESTORE.KEY;

    const POLL_INTERVAL = 3000;
    const MAX_ATTEMPTS = 100; // 5 mins

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
        const status = await checkTaskStatus(taskId, apiKey);
        onStatus(status);
        
        if (status === 'SUCCESS') {
            return getTaskOutputs(taskId, apiKey);
        }
        if (status === 'FAILED') {
            throw new Error('Task failed remotely');
        }
        
        await new Promise(r => setTimeout(r, POLL_INTERVAL));
    }
    throw new Error('Task timed out');
};