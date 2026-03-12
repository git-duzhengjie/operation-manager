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
  updateUserInfo: (info: Partial<UserInfo>) => Promise<void>;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  updateAvatar: (avatar: string | null) => Promise<void>;
  refreshUserSettings: () => Promise<void>;
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(true);

  // 保存到 localStorage
  const saveToLocalStorage = useCallback((info: UserInfo, settings: NotificationSettings) => {
    try {
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(info));
      localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, []);

  // 从 localStorage 加载
  const loadFromLocalStorage = useCallback(() => {
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
      console.error('Failed to load from localStorage:', error);
    }
  }, []);

  // 从 API 获取用户设置
  const refreshUserSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/user/settings');
      const result = await response.json();
      
      if (result.success && result.data) {
        setUserInfo(result.data.userInfo);
        setNotificationSettings(result.data.notificationSettings);
        
        // 同步保存到 localStorage
        saveToLocalStorage(result.data.userInfo, result.data.notificationSettings);
      }
    } catch (error) {
      console.error('Failed to fetch user settings:', error);
      // API 失败时从 localStorage 加载
      loadFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  }, [saveToLocalStorage, loadFromLocalStorage]);

  // 初始化：先从 localStorage 加载（快速显示），然后尝试从 API 获取
  useEffect(() => {
    loadFromLocalStorage();
    refreshUserSettings();
  }, [refreshUserSettings, loadFromLocalStorage]);

  // 更新用户信息
  const updateUserInfo = useCallback(async (info: Partial<UserInfo>) => {
    const newInfo = { ...userInfo, ...info };
    
    // 先更新本地状态和 localStorage（乐观更新）
    setUserInfo(newInfo);
    saveToLocalStorage(newInfo, notificationSettings);
    
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'userInfo',
          data: newInfo,
        }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to update user info:', error);
      throw error;
    }
  }, [userInfo, notificationSettings, saveToLocalStorage]);

  // 更新通知设置
  const updateNotificationSettings = useCallback(async (settings: Partial<NotificationSettings>) => {
    const newSettings = { ...notificationSettings, ...settings };
    
    // 先更新本地状态和 localStorage（乐观更新）
    setNotificationSettings(newSettings);
    saveToLocalStorage(userInfo, newSettings);
    
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'notificationSettings',
          data: newSettings,
        }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      throw error;
    }
  }, [userInfo, notificationSettings, saveToLocalStorage]);

  // 更新头像
  const updateAvatar = useCallback(async (avatar: string | null) => {
    await updateUserInfo({ avatar });
  }, [updateUserInfo]);

  return (
    <UserContext.Provider
      value={{
        userInfo,
        notificationSettings,
        updateUserInfo,
        updateNotificationSettings,
        updateAvatar,
        refreshUserSettings,
        isLoading,
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
