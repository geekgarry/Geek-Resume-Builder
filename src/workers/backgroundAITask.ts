/**
 * backgroundAITask.ts
 * Web Worker for AI resume optimization task.
 */
import { aiService } from "../services/ai_optimize";
// import { apiService } from "../services/api";
import { ResumeData } from "../types";

// --- 这个 Worker 的职责是接收来自主线程的 AI 生成新简历任务请求，调用 aiService 进行分析和生成，然后将结果返回给主线程。 ---
// Types
export interface AIResumeTaskPayload {
  jobText: string;
  fileData: any;
  mimeType: string;
  resumeData: any;
  token: string;
}

// 任务结果接口，包含成功标志、生成的新简历数据（如果成功）或错误信息（如果失败）
export interface AIResumeTaskResult {
  success: boolean;
  data?: any;
  error?: string;
}

// Worker 接收消息的类型定义，主线程发送的消息应该包含 type 和 payload 字段，Worker 根据 type 来判断要执行的任务类型
self.onmessage = async (e: MessageEvent) => {
  // 从消息事件中解构出 type 和 payload，type 用于区分不同的任务类型，payload 包含了执行任务所需的数据。当前这个 Worker 主要处理 AI 生成新简历的任务，所以我们会根据 type 来判断是否是 START_AI_RESUME_TASK，然后调用 aiService 的 analyzeContent 方法来进行分析和生成。
  const { type, payload } = e.data;
  // 目前这个 Worker 只处理 AI 生成新简历的任务，如果需要支持更多 AI 相关的任务，可以在这里添加更多的 case 分支来处理不同类型的任务。
  if (type === "START_AI_RESUME_TASK") {
    try {
      const optimizedResume = await aiService.analyzeContent("generate", {
        text: payload.jobText,
        fileData: payload.fileData,
        mimeType: payload.mimeType,
        resumeData: payload.resumeData,
        token: payload.token,
      });
      const aiOptimizedResume: ResumeData = JSON.parse(optimizedResume);
      // console.log("AI优化生成的新简历内容：", aiOptimizedResume);

      // 只返回优化后的简历数据，不在 Worker 中调用 API
      self.postMessage({
        type: "AI_RESUME_TASK_RESULT",
        result: { success: true, data: aiOptimizedResume },
      });
    } catch (error: any) {
      self.postMessage({
        type: "AI_RESUME_TASK_RESULT",
        result: {
          success: false,
          error: error?.message || "AI 生成新简历失败",
        },
      });
    }
  }
};

// --- 以下是一些模拟的服务函数，实际项目中应该替换为真实的 API 调用 ---
// --- Mocked services for demonstration, replace with real services ---
async function fakeAIServiceAnalyzeContent(payload: AIResumeTaskPayload) {
  // Simulate delay
  await new Promise((res) => setTimeout(res, 2000));
  // Return a fake optimized resume
  return {
    ...payload.resumeData,
    optimized: true,
    jobText: payload.jobText,
    fileData: payload.fileData,
    mimeType: payload.mimeType,
  };
}

async function fakeApiServiceCreateResume(name: string, resumeData: any) {
  // Simulate delay
  await new Promise((res) => setTimeout(res, 1000));
  return { id: Date.now(), name, ...resumeData };
}
