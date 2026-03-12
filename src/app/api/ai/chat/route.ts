import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

// AI智能问答接口 - 流式响应
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context } = body;

    if (!message) {
      return new Response(
        JSON.stringify({ error: '消息不能为空' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 提取请求头
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    
    // 创建 LLM 客户端
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 构建系统提示词
    const systemPrompt = `你是一个专业的IT运维助手，负责帮助用户解答运维相关问题。
你可以：
1. 回答运维知识库相关问题
2. 指导用户如何提交工单
3. 提供故障排查建议
4. 解释系统操作流程

请用专业但友好的语气回答问题。`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: message },
    ];

    // 创建可读流
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 使用流式 API
          const llmStream = client.stream(messages, {
            temperature: 0.7,
            streaming: true,
          });

          // 处理流式响应
          for await (const chunk of llmStream) {
            if (chunk.content) {
              const text = chunk.content.toString();
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('AI Chat Error:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'AI服务暂时不可用' })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('AI API Error:', error);
    return new Response(
      JSON.stringify({ error: 'AI服务异常' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
