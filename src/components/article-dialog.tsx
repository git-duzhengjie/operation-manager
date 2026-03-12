'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GuideArticle } from '@/data/guide-articles';

interface ArticleDialogProps {
  article: GuideArticle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArticleDialog({ article, open, onOpenChange }: ArticleDialogProps) {
  if (!article) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">{article.categoryTitle}</Badge>
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="w-3 h-3 mr-1" />
              {article.readTime}
            </div>
          </div>
          <DialogTitle className="text-2xl">{article.title}</DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* 文章摘要 */}
          <p className="text-gray-600 leading-relaxed text-base border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded-r">
            {article.content}
          </p>

          {/* 文章章节 */}
          {article.sections.map((section, index) => (
            <div key={index} className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                {section.title}
              </h3>
              
              <div className="pl-8 space-y-3">
                <p className="text-gray-700 whitespace-pre-wrap">{section.content}</p>

                {/* 步骤列表 */}
                {section.steps && section.steps.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {section.steps.map((step, stepIndex) => (
                      <div key={stepIndex} className="flex items-start gap-3">
                        <span className="w-5 h-5 bg-blue-500 text-white rounded text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                          {stepIndex + 1}
                        </span>
                        <span className="text-gray-700">{step}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 提示列表 */}
                {section.tips && section.tips.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-amber-700 font-medium mb-2">
                      <BookOpen className="w-4 h-4" />
                      小贴士
                    </div>
                    {section.tips.map((tip, tipIndex) => (
                      <div key={tipIndex} className="flex items-start gap-2 text-amber-800">
                        <span className="text-amber-500">•</span>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* 文章底部 */}
          <div className="pt-4 border-t flex items-center justify-between">
            <p className="text-sm text-gray-500">
              最后更新：2024年1月
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回列表
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
