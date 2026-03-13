import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/storage/database/supabase-client';

// PUT - 重命名标签
export async function PUT(request: NextRequest) {
  try {
    const { oldName, newName } = await request.json();

    if (!oldName || !newName) {
      return NextResponse.json(
        { success: false, error: '原标签名和新标签名不能为空' },
        { status: 400 }
      );
    }

    if (oldName === newName) {
      return NextResponse.json(
        { success: false, error: '新标签名与原标签名相同' },
        { status: 400 }
      );
    }

    const client = getDbClient();

    // 获取所有文章
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
      return tags && Array.isArray(tags) && tags.includes(oldName);
    });

    // 更新每篇文章中的标签
    if (articles && articles.length > 0) {
      for (const article of articles as Record<string, unknown>[]) {
        const oldTags = article.tags as string[] | null;
        const newTags = (oldTags || []).map(t => t === oldName ? newName : t);
        
        await client
          .from('knowledge_articles')
          .update({ tags: newTags })
          .eq('id', article.id);
      }
    }

    // 更新独立存储的标签名称
    const { error: updateError } = await client
      .from('knowledge_tags')
      .update({ name: newName })
      .eq('name', oldName);

    if (updateError) {
      console.error('更新标签失败:', updateError);
      // 不返回错误，因为文章中的标签可能已经更新成功
    }

    return NextResponse.json({
      success: true,
      message: `已将 ${articles?.length || 0} 篇文章中的标签「${oldName}」重命名为「${newName}」`,
    });
  } catch (error) {
    console.error('重命名标签异常:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
