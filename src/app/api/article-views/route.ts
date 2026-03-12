import { NextRequest, NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { articleViews } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

// 数据库连接
let db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      return null;
    }
    const pool = new Pool({ connectionString });
    db = drizzle(pool);
  }
  return db;
}

// 内存存储作为备用
const memoryViews: Record<string, number> = {
  'hot-1': 1234,
  'hot-2': 987,
  'hot-3': 876,
  'hot-4': 654,
  'hot-5': 543,
};

// 初始化默认文章浏览次数
const defaultViews: Record<string, number> = {
  'hot-1': 1234,
  'hot-2': 987,
  'hot-3': 876,
  'hot-4': 654,
  'hot-5': 543,
};

// GET: 获取所有文章浏览次数
export async function GET() {
  const database = getDb();
  
  if (database) {
    try {
      const results = await database.select().from(articleViews);
      const viewsMap: Record<string, number> = { ...defaultViews };
      
      results.forEach((row) => {
        viewsMap[row.articleId] = row.viewCount;
      });
      
      return NextResponse.json({ success: true, data: viewsMap });
    } catch (error) {
      console.error('Database error:', error);
      // 数据库错误时返回内存数据
      return NextResponse.json({ success: true, data: memoryViews, fallback: true });
    }
  }
  
  return NextResponse.json({ success: true, data: memoryViews, fallback: true });
}

// POST: 增加文章浏览次数
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleId } = body;
    
    if (!articleId) {
      return NextResponse.json({ success: false, error: '缺少文章ID' }, { status: 400 });
    }
    
    const database = getDb();
    
    if (database) {
      try {
        // 尝试更新现有记录
        const existing = await database
          .select()
          .from(articleViews)
          .where(eq(articleViews.articleId, articleId));
        
        if (existing.length > 0) {
          // 更新现有记录
          const newCount = existing[0].viewCount + 1;
          await database
            .update(articleViews)
            .set({ 
              viewCount: newCount,
              updatedAt: new Date() 
            })
            .where(eq(articleViews.articleId, articleId));
          
          return NextResponse.json({ success: true, viewCount: newCount });
        } else {
          // 插入新记录
          const initialCount = (defaultViews[articleId] || 0) + 1;
          await database.insert(articleViews).values({
            articleId,
            viewCount: initialCount,
          });
          
          return NextResponse.json({ success: true, viewCount: initialCount });
        }
      } catch (error) {
        console.error('Database error:', error);
        // 数据库错误时使用内存
        memoryViews[articleId] = (memoryViews[articleId] || defaultViews[articleId] || 0) + 1;
        return NextResponse.json({ 
          success: true, 
          viewCount: memoryViews[articleId],
          fallback: true 
        });
      }
    }
    
    // 无数据库时使用内存
    memoryViews[articleId] = (memoryViews[articleId] || defaultViews[articleId] || 0) + 1;
    return NextResponse.json({ 
      success: true, 
      viewCount: memoryViews[articleId],
      fallback: true 
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
