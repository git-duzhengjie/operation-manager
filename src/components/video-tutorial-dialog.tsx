'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Loader2, AlertCircle, Download, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  duration: number;
  category: string;
  categoryTitle: string;
  videoUrl: string | null;
  generated: boolean;
}

interface VideoTutorialDialogProps {
  video: VideoTutorial | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VideoTutorialDialog({ 
  video, 
  open, 
  onOpenChange,
}: VideoTutorialDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);

  if (!video) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch('/api/video-tutorials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: video.id }),
      });
      const result = await response.json();
      
      if (result.success && result.videoUrl) {
        setCurrentVideoUrl(result.videoUrl);
        toast.success('视频生成成功');
      } else {
        throw new Error(result.error || '视频生成失败');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '生成失败';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const videoUrl = currentVideoUrl || video.videoUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">{video.categoryTitle}</Badge>
            <span className="text-sm text-gray-500">时长: {video.duration}秒</span>
          </div>
          <DialogTitle className="text-xl">{video.title}</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <p className="text-gray-600 mb-4">{video.description}</p>

          {/* 视频播放区域 */}
          <div className={cn(
            'relative bg-black rounded-lg overflow-hidden',
            'aspect-video'
          )}>
            {videoUrl ? (
              <video
                src={videoUrl}
                controls
                className="w-full h-full"
              >
                您的浏览器不支持视频播放
              </video>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-gradient-to-br from-purple-900 to-indigo-900">
                {isGenerating ? (
                  <>
                    <Loader2 className="w-16 h-16 animate-spin mb-4" />
                    <p className="text-lg">正在生成视频...</p>
                    <p className="text-sm text-gray-300 mt-2">预计需要 1-3 分钟，请耐心等待</p>
                  </>
                ) : error ? (
                  <>
                    <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
                    <p className="text-lg text-red-400">{error}</p>
                    <Button 
                      variant="outline" 
                      className="mt-4 bg-white/10 border-white/20 text-white hover:bg-white/20"
                      onClick={handleGenerate}
                    >
                      重试
                    </Button>
                  </>
                ) : (
                  <>
                    <Play className="w-16 h-16 mb-4 opacity-80" />
                    <p className="text-lg mb-2">视频教程</p>
                    <p className="text-sm text-gray-300 mb-4">点击下方按钮生成视频</p>
                    <Button onClick={handleGenerate} className="bg-white/10 border-white/20 hover:bg-white/20">
                      <Play className="w-4 h-4 mr-2" />
                      生成视频教程
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          {videoUrl && (
            <div className="flex gap-3 mt-4">
              <Button 
                variant="outline" 
                onClick={() => window.open(videoUrl, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                新窗口打开
              </Button>
              <Button 
                variant="outline"
                onClick={async () => {
                  try {
                    const response = await fetch(videoUrl);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${video.title}.mp4`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                  } catch {
                    toast.error('下载失败，请尝试在新窗口打开后保存');
                  }
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                下载视频
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
