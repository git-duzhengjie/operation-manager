import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/storage/database/supabase-client';

// GET - 获取标签列表及统计
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get('keyword') || '';

    const client = getDbClient();

    // 获取所有已发布文章的标签
    const { data: articles, error } = await client
      .from('knowledge_articles')
      .select('tags');

    if (error) {
      console.error('查询文章标签失败:', error);
      return NextResponse.json(
        { success: false, error: '查询标签失败' },
        { status: 500 }
      );
    }

    // 统计标签出现次数
    const tagCountMap: Record<string, number> = {};
    
    (articles || []).forEach((article: Record<string, unknown>) => {
      const tags = article.tags as string[] | null;
      if (tags && Array.isArray(tags)) {
        tags.forEach(tag => {
          if (tag) {
            tagCountMap[tag] = (tagCountMap[tag] || 0) + 1;
          }
        });
      }
    });

    // 转换为数组并排序
    let tags = Object.entries(tagCountMap).map(([name, count], index) => ({
      id: String(index + 1),
      name,
      count,
    }));

    // 按关键词筛选
    if (keyword) {
      tags = tags.filter(tag => 
        tag.name.toLowerCase().includes(keyword.toLowerCase())
      );
    }

    // 按文章数量降序排序
    tags.sort((a, b) => b.count - a.count);

    // 统计总数
    const totalTags = tags.length;
    const totalArticles = (articles || []).length;
    const hotTag = tags.length > 0 ? tags[0].name : '-';

    return NextResponse.json({
      success: true,
      data: {
        tags,
        stats: {
          totalTags,
          totalArticles,
          hotTag,
        },
      },
    });
  } catch (error) {
    console.error('获取标签列表异常:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// POST - 添加新标签（通过创建/更新文章时自动添加）
// DELETE - 删除标签（从所有文章中移除该标签）
export async function DELETE(request: NextRequest) {
  try {
    const { tagName } = await request.json();

    if (!tagName) {
      return NextResponse.json(
        { success: false, error: '标签名称不能为空' },
        { status: 400 }
      );
    }

    const client = getDbClient();

    // 获取所有包含该标签的文章
    const { data: allArticles, error: fetchError } = await client
      .from('knowledge_articles')
      .select('id, tags');

    if (fetchError) {
      console.error('查询文章失败:', fetchError);
      return NextResponse.json(
        { success: false, error: '查询文章失败' },
        { status: 500 }
      );
    }

    // 过滤包含该标签的文章
    const articles = (allArticles || []).filter((article: Record<string, unknown>) => {
      const tags = article.tags as string[] | null;
      return tags && Array.isArray(tags) && tags.includes(tagName);
    });

    // 从每篇文章中移除该标签
    if (articles && articles.length > 0) {
      for (const article of articles as Record<string, unknown>[]) {
        const oldTags = article.tags as string[] | null;
        const newTags = (oldTags || []).filter(t => t !== tagName);
        
        await client
          .from('knowledge_articles')
          .update({ tags: newTags })
          .eq('id', article.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: `已从 ${articles?.length || 0} 篇文章中移除标签「${tagName}」`,
    });
  } catch (error) {
    console.error('删除标签异常:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
