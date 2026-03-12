'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, CheckCircle, AlertCircle, Info, Clock, ChevronRight, Trash2, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

// 模拟通知数据
const initialNotifications = [
  {
    id: '1',
    title: '工单已分配',
    message: '工单 WO20240101001 已分配给您处理，请及时查看并处理。该工单为服务器磁盘空间不足告警，优先级为高。',
    type: 'info',
    time: '5分钟前',
    read: false,
    category: 'workorder',
  },
  {
    id: '2',
    title: '告警通知',
    message: '服务器 AST001 CPU使用率超过90%，当前使用率为92.5%，请及时处理。',
    type: 'warning',
    time: '10分钟前',
    read: false,
    category: 'alert',
  },
  {
    id: '3',
    title: '工单已完成',
    message: '工单 WO20240101003 已被标记为已完成，感谢您的处理。',
    type: 'success',
    time: '30分钟前',
    read: true,
    category: 'workorder',
  },
  {
    id: '4',
    title: '系统升级通知',
    message: '系统将于今晚22:00进行升级维护，预计维护时长1小时，届时系统将暂停服务。',
    type: 'info',
    time: '1小时前',
    read: true,
    category: 'system',
  },
  {
    id: '5',
    title: '知识库更新',
    message: '有3篇新文章被添加到知识库：《服务器安全加固指南》、《常见网络问题解决方案》、《系统监控配置手册》。',
    type: 'success',
    time: '2小时前',
    read: true,
    category: 'knowledge',
  },
  {
    id: '6',
    title: '资产到期提醒',
    message: '资产 AST001（应用服务器-01）的维保合同将于7天后到期，请及时续保。',
    type: 'warning',
    time: '3小时前',
    read: false,
    category: 'asset',
  },
  {
    id: '7',
    title: '巡检任务完成',
    message: '本周例行巡检任务已完成，共检查设备45台，发现异常3项，已生成巡检报告。',
    type: 'success',
    time: '昨天',
    read: true,
    category: 'routine',
  },
  {
    id: '8',
    title: '新工单待审批',
    message: '您有2个变更申请等待审批，请及时处理。',
    type: 'info',
    time: '昨天',
    read: true,
    category: 'workorder',
  },
];

const notificationIcons: Record<string, React.ReactNode> = {
  info: <Info className="w-5 h-5 text-blue-500" />,
  warning: <AlertCircle className="w-5 h-5 text-orange-500" />,
  success: <CheckCircle className="w-5 h-5 text-green-500" />,
};

const categoryMap: Record<string, { label: string; color: string }> = {
  workorder: { label: '工单', color: 'bg-blue-100 text-blue-700' },
  alert: { label: '告警', color: 'bg-orange-100 text-orange-700' },
  system: { label: '系统', color: 'bg-purple-100 text-purple-700' },
  knowledge: { label: '知识库', color: 'bg-green-100 text-green-700' },
  asset: { label: '资产', color: 'bg-cyan-100 text-cyan-700' },
  routine: { label: '例行工作', color: 'bg-pink-100 text-pink-700' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeTab, setActiveTab] = useState('all');

  const unreadCount = notifications.filter(n => !n.read).length;

  // 过滤通知
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !n.read;
    return n.category === activeTab;
  });

  // 标记单条已读
  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    toast.success('已标记为已读');
  };

  // 标记全部已读
  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('已将所有通知标记为已读');
  };

  // 删除通知
  const handleDelete = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success('通知已删除');
  };

  // 清空已读通知
  const handleClearRead = () => {
    setNotifications(prev => prev.filter(n => !n.read));
    toast.success('已清空已读通知');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">通知中心</h1>
            <p className="text-gray-600 mt-1">
              共 {notifications.length} 条通知，{unreadCount} 条未读
            </p>
          </div>
          <div className="space-x-2">
            {unreadCount > 0 && (
              <Button variant="outline" onClick={handleMarkAllAsRead}>
                <Check className="w-4 h-4 mr-2" />
                全部标记已读
              </Button>
            )}
            <Button variant="outline" onClick={handleClearRead}>
              <Trash2 className="w-4 h-4 mr-2" />
              清空已读
            </Button>
          </div>
        </div>

        {/* 分类标签 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">
              全部 ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread">
              未读 ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="workorder">工单</TabsTrigger>
            <TabsTrigger value="alert">告警</TabsTrigger>
            <TabsTrigger value="system">系统</TabsTrigger>
            <TabsTrigger value="knowledge">知识库</TabsTrigger>
            <TabsTrigger value="asset">资产</TabsTrigger>
            <TabsTrigger value="routine">例行工作</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">
                    {activeTab === 'unread' ? '没有未读通知' : '暂无通知'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <Card 
                    key={notification.id}
                    className={`transition-all hover:shadow-md ${
                      !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* 图标 */}
                        <div className="mt-1">
                          {notificationIcons[notification.type]}
                        </div>
                        
                        {/* 内容 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`text-base ${notification.read ? 'text-gray-600' : 'font-semibold text-gray-900'}`}>
                              {notification.title}
                            </h3>
                            <Badge className={categoryMap[notification.category].color}>
                              {categoryMap[notification.category].label}
                            </Badge>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center text-xs text-gray-400 mt-2">
                            <Clock className="w-3 h-3 mr-1" />
                            {notification.time}
                          </div>
                        </div>
                        
                        {/* 操作按钮 */}
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              标记已读
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(notification.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
