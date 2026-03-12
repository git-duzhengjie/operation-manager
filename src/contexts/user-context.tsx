'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface UserInfo {
  username: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  avatar: string | null;
}

export interface NotificationSettings {
  emailNotify: boolean;
  smsNotify: boolean;
  systemNotify: boolean;
  workorderNotify: boolean;
  alertNotify: boolean;
  knowledgeNotify: boolean;
}

interface UserContextType {
  userInfo: UserInfo;
  notificationSettings: NotificationSettings;
  updateUserInfo: (info: Partial<UserInfo>) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  updateAvatar: (avatar: string | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// 默认用户信息
const defaultUserInfo: UserInfo = {
  username: '管理员',
  email: 'admin@gov.com',
  phone: '138****8888',
  department: '运维部',
  position: '运维工程师',
  avatar: null,
};

// 默认通知设置
const defaultNotificationSettings: NotificationSettings = {
  emailNotify: true,
  smsNotify: false,
  systemNotify: true,
  workorderNotify: true,
  alertNotify: true,
  knowledgeNotify: false,
};

// localStorage keys
const USER_INFO_KEY = 'oms_user_info';
const NOTIFICATION_SETTINGS_KEY = 'oms_notification_settings';

export function UserProvider({ children }: { children: ReactNode }) {
  const [userInfo, setUserInfo] = useState<UserInfo>(defaultUserInfo);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const [isInitialized, setIsInitialized] = useState(false);

  // 初始化：从 localStorage 读取数据
  useEffect(() => {
    try {
      const savedUserInfo = localStorage.getItem(USER_INFO_KEY);
      const savedNotificationSettings = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);

      if (savedUserInfo) {
        setUserInfo(JSON.parse(savedUserInfo));
      }
      if (savedNotificationSettings) {
        setNotificationSettings(JSON.parse(savedNotificationSettings));
      }
    } catch (error) {
      console.error('Failed to load user settings from localStorage:', error);
    }
    setIsInitialized(true);
  }, []);

  // 更新用户信息
  const updateUserInfo = useCallback((info: Partial<UserInfo>) => {
    setUserInfo(prev => {
      const newInfo = { ...prev, ...info };
      try {
        localStorage.setItem(USER_INFO_KEY, JSON.stringify(newInfo));
      } catch (error) {
        console.error('Failed to save user info to localStorage:', error);
      }
      return newInfo;
    });
  }, []);

  // 更新通知设置
  const updateNotificationSettings = useCallback((settings: Partial<NotificationSettings>) => {
    setNotificationSettings(prev => {
      const newSettings = { ...prev, ...settings };
      try {
        localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(newSettings));
      } catch (error) {
        console.error('Failed to save notification settings to localStorage:', error);
      }
      return newSettings;
    });
  }, []);

  // 更新头像
  const updateAvatar = useCallback((avatar: string | null) => {
    updateUserInfo({ avatar });
  }, [updateUserInfo]);

  return (
    <UserContext.Provider
      value={{
        userInfo,
        notificationSettings,
        updateUserInfo,
        updateNotificationSettings,
        updateAvatar,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
