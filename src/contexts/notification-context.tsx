'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  time: string;
  read: boolean;
  category: 'workorder' | 'alert' | 'system' | 'knowledge' | 'asset' | 'routine';
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearReadNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// 初始通知数据
const initialNotifications: Notification[] = [
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

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearReadNotifications = useCallback(() => {
    setNotifications(prev => prev.filter(n => !n.read));
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearReadNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
