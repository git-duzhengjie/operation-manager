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

    // 获取独立存储的标签
    const { data: storedTags, error: tagsError } = await client
      .from('knowledge_tags')
      .select('*');

    // 统计标签出现次数（从文章中）
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

    // 合并独立标签（count 为 0 表示未被文章使用）
    const storedTagsMap: Record<string, { id: string; description: string | null; color: string | null; sortOrder: number }> = {};
    
    if (storedTags && !tagsError) {
      (storedTags as Record<string, unknown>[]).forEach((tag: Record<string, unknown>) => {
        const name = tag.name as string;
        storedTagsMap[name] = {
          id: String(tag.id),
          description: tag.description as string | null,
          color: tag.color as string | null,
          sortOrder: (tag.sort_order as number) || 0,
        };
        // 如果标签未被文章使用，确保它出现在列表中
        if (!tagCountMap[name]) {
          tagCountMap[name] = 0;
        }
      });
    }

    // 转换为数组
    let tags = Object.entries(tagCountMap).map(([name, count], index) => ({
      id: storedTagsMap[name]?.id || String(index + 1),
      name,
      count,
      description: storedTagsMap[name]?.description || null,
      color: storedTagsMap[name]?.color || null,
      sortOrder: storedTagsMap[name]?.sortOrder || 0,
    }));

    // 按关键词筛选
    if (keyword) {
      tags = tags.filter(tag => 
        tag.name.toLowerCase().includes(keyword.toLowerCase())
      );
    }

    // 按文章数量降序排序，count 为 0 的排在后面
    tags.sort((a, b) => {
      if (a.count === 0 && b.count > 0) return 1;
      if (a.count > 0 && b.count === 0) return -1;
      return b.count - a.count;
    });

    // 统计总数
    const totalTags = tags.length;
    const totalArticles = (articles || []).length;
    const hotTag = tags.find(t => t.count > 0)?.name || '-';

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

// POST - 创建新标签
export async function POST(request: NextRequest) {
  try {
    const { name, description, color } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: '标签名称不能为空' },
        { status: 400 }
      );
    }

    const tagName = name.trim();
    const client = getDbClient();

    // 检查标签是否已存在
    const { data: existingTag } = await client
      .from('knowledge_tags')
      .select('id')
      .eq('name', tagName)
      .limit(1);

    if (existingTag && existingTag.length > 0) {
      return NextResponse.json(
        { success: false, error: '标签已存在' },
        { status: 400 }
      );
    }

    // 获取最大排序值
    const { data: maxSortTag } = await client
      .from('knowledge_tags')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1);

    const maxSort = maxSortTag && maxSortTag.length > 0 
      ? (maxSortTag[0] as Record<string, unknown>).sort_order as number 
      : 0;
    const sortOrder = maxSort + 1;

    // 创建标签
    const { data, error } = await client
      .from('knowledge_tags')
      .insert({
        name: tagName,
        description: description || null,
        color: color || null,
        sort_order: sortOrder,
      })
      .select()
      .single();

    if (error) {
      console.error('创建标签失败:', error);
      return NextResponse.json(
        { success: false, error: '创建标签失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { ...data, count: 0 },
      message: '标签创建成功',
    });
  } catch (error) {
    console.error('创建标签异常:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// DELETE - 删除标签
export async function DELETE(request: NextRequest) {
  try {
    // 尝试从 URL 参数获取 tagName
    const searchParams = request.nextUrl.searchParams;
    let tagName = searchParams.get('tagName');
    
    // 如果 URL 参数没有，尝试从请求体获取
    if (!tagName) {
      try {
        const body = await request.json();
        tagName = body.tagName;
      } catch {
        // 请求体为空，忽略
      }
    }

    if (!tagName) {
      return NextResponse.json(
        { success: false, error: '标签名称不能为空' },
        { status: 400 }
      );
    }

    const client = getDbClient();

    // 从所有文章中移除该标签
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

    // 删除独立存储的标签
    await client
      .from('knowledge_tags')
      .delete()
      .eq('name', tagName);

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
