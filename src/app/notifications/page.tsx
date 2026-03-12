'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Clock, Trash2, Check, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useNotifications, Notification } from '@/contexts/notification-context';

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
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearReadNotifications 
  } = useNotifications();
  
  const [activeTab, setActiveTab] = useState('all');

  // 过滤通知
  const filteredNotifications = notifications.filter((n: Notification) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !n.read;
    return n.category === activeTab;
  });

  // 标记单条已读
  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
    toast.success('已标记为已读');
  };

  // 标记全部已读
  const handleMarkAllAsRead = () => {
    markAllAsRead();
    toast.success('已将所有通知标记为已读');
  };

  // 删除通知
  const handleDelete = (id: string) => {
    deleteNotification(id);
    toast.success('通知已删除');
  };

  // 清空已读通知
  const handleClearRead = () => {
    clearReadNotifications();
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
                {filteredNotifications.map((notification: Notification) => (
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
