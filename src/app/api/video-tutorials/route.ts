import { NextRequest, NextResponse } from 'next/server';
import { VideoGenerationClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

// 视频教程数据
const videoTutorials = [
  {
    id: 'tutorial-1',
    title: '快速入门：系统概览与导航',
    description: '了解数字政府统一运维管理平台的整体架构和导航方式',
    prompt: 'A professional software interface walkthrough, showing a clean modern dashboard with navigation menus, charts and data panels, smooth camera movement across different sections, blue and white color scheme, business enterprise style',
    duration: 6,
    thumbnail: '/videos/thumb-1.jpg',
    category: 'quick-start',
    categoryTitle: '快速入门',
  },
  {
    id: 'tutorial-2',
    title: '如何提交工单',
    description: '学习如何在平台上提交IT服务工单',
    prompt: 'A user filling out a professional form on a computer screen, typing in text fields, selecting options from dropdown menus, clicking submit button, success message appearing, clean office environment, modern UI design',
    duration: 5,
    thumbnail: '/videos/thumb-2.jpg',
    category: 'quick-start',
    categoryTitle: '快速入门',
  },
  {
    id: 'tutorial-3',
    title: '资产台账管理',
    description: '学习如何管理IT资产台账',
    prompt: 'A professional asset management interface on screen, showing servers and network equipment icons, data tables with asset information, user clicking through different categories, modern enterprise software style',
    duration: 5,
    thumbnail: '/videos/thumb-3.jpg',
    category: 'asset',
    categoryTitle: '资产管理',
  },
  {
    id: 'tutorial-4',
    title: '知识库使用指南',
    description: '学习如何搜索和使用知识库文章',
    prompt: 'A search interface with user typing keywords, search results appearing with document icons, user clicking on an article, content page sliding in smoothly, knowledge management system style',
    duration: 5,
    thumbnail: '/videos/thumb-4.jpg',
    category: 'knowledge',
    categoryTitle: '知识库',
  },
  {
    id: 'tutorial-5',
    title: '监控告警处理',
    description: '学习如何处理系统监控告警',
    prompt: 'A monitoring dashboard with alert notifications popping up, user reviewing alert details, clicking acknowledge button, status changing from red to green, network operations center style with dark theme',
    duration: 6,
    thumbnail: '/videos/thumb-5.jpg',
    category: 'monitor',
    categoryTitle: '监控告警',
  },
  {
    id: 'tutorial-6',
    title: 'AI智能问答使用',
    description: '学习如何使用AI智能助手获取帮助',
    prompt: 'A chat interface with user typing a question, AI assistant responding with helpful text, smooth typing animation, modern conversational AI interface, blue and white theme',
    duration: 5,
    thumbnail: '/videos/thumb-6.jpg',
    category: 'ai',
    categoryTitle: 'AI智能',
  },
];

// 存储已生成的视频URL（内存缓存）
const generatedVideos: Record<string, string> = {};

// GET: 获取视频教程列表
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  // 如果指定了视频ID，返回单个视频
  if (videoId) {
    const tutorial = videoTutorials.find(t => t.id === videoId);
    if (!tutorial) {
      return NextResponse.json({ success: false, error: '视频不存在' }, { status: 404 });
    }

    // 检查是否已生成
    const videoUrl = generatedVideos[videoId];
    return NextResponse.json({
      success: true,
      data: {
        ...tutorial,
        videoUrl: videoUrl || null,
        generated: !!videoUrl,
      },
    });
  }

  // 返回所有视频教程列表
  const tutorials = videoTutorials.map(t => ({
    ...t,
    videoUrl: generatedVideos[t.id] || null,
    generated: !!generatedVideos[t.id],
  }));

  return NextResponse.json({ success: true, data: tutorials });
}

// POST: 生成视频
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId } = body;

    if (!videoId) {
      return NextResponse.json({ success: false, error: '缺少视频ID' }, { status: 400 });
    }

    const tutorial = videoTutorials.find(t => t.id === videoId);
    if (!tutorial) {
      return NextResponse.json({ success: false, error: '视频不存在' }, { status: 404 });
    }

    // 如果已生成，直接返回
    if (generatedVideos[videoId]) {
      return NextResponse.json({
        success: true,
        videoUrl: generatedVideos[videoId],
        message: '视频已存在',
      });
    }

    // 提取请求头
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // 创建视频生成客户端
    const config = new Config();
    const client = new VideoGenerationClient(config, customHeaders);

    // 生成视频
    const content = [
      {
        type: 'text' as const,
        text: tutorial.prompt,
      },
    ];

    const response = await client.videoGeneration(content, {
      model: 'doubao-seedance-1-5-pro-251215',
      duration: tutorial.duration,
      ratio: '16:9',
      resolution: '720p',
      generateAudio: true,
    });

    if (response.videoUrl) {
      generatedVideos[videoId] = response.videoUrl;
      return NextResponse.json({
        success: true,
        videoUrl: response.videoUrl,
        message: '视频生成成功',
      });
    } else {
      return NextResponse.json({
        success: false,
        error: '视频生成失败',
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Video generation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '视频生成失败',
    }, { status: 500 });
  }
}
