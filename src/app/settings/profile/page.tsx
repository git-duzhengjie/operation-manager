'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Lock, 
  Bell, 
  Shield, 
  Camera, 
  Save,
  Eye,
  EyeOff,
  Smartphone,
  Mail,
  MessageSquare
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function SettingsPage() {
  // 个人信息
  const [userInfo, setUserInfo] = useState({
    username: '管理员',
    email: 'admin@gov.com',
    phone: '138****8888',
    department: '运维部',
    position: '运维工程师',
  });

  // 密码修改
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  // 通知偏好
  const [notifications, setNotifications] = useState({
    emailNotify: true,
    smsNotify: false,
    systemNotify: true,
    workorderNotify: true,
    alertNotify: true,
    knowledgeNotify: false,
  });

  // 保存个人信息
  const handleSaveProfile = () => {
    toast.success('个人信息已保存');
  };

  // 修改密码
  const handleChangePassword = () => {
    if (!passwordForm.currentPassword) {
      toast.error('请输入当前密码');
      return;
    }
    if (!passwordForm.newPassword) {
      toast.error('请输入新密码');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('密码长度不能少于6位');
      return;
    }

    // 模拟密码修改
    toast.success('密码修改成功，请重新登录');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  // 保存通知偏好
  const handleSaveNotifications = () => {
    toast.success('通知偏好已保存');
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        {/* 页面标题 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">个人设置</h1>
          <p className="text-gray-600 mt-1">管理您的账号信息和偏好设置</p>
        </div>

        {/* 设置标签页 */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              个人信息
            </TabsTrigger>
            <TabsTrigger value="security">
              <Lock className="w-4 h-4 mr-2" />
              账号安全
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4 mr-2" />
              通知偏好
            </TabsTrigger>
          </TabsList>

          {/* 个人信息 */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
                <CardDescription>更新您的个人资料信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 头像 */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-12 h-12 text-blue-600" />
                    </div>
                    <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <p className="font-medium">更换头像</p>
                    <p className="text-sm text-gray-500">支持 JPG、PNG 格式，大小不超过 2MB</p>
                  </div>
                </div>

                <Separator />

                {/* 表单 */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>用户名</Label>
                    <Input
                      value={userInfo.username}
                      onChange={(e) => setUserInfo({ ...userInfo, username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>邮箱</Label>
                    <Input
                      value={userInfo.email}
                      onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>手机号</Label>
                    <Input
                      value={userInfo.phone}
                      onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>部门</Label>
                    <Input
                      value={userInfo.department}
                      onChange={(e) => setUserInfo({ ...userInfo, department: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>职位</Label>
                    <Input
                      value={userInfo.position}
                      onChange={(e) => setUserInfo({ ...userInfo, position: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile}>
                    <Save className="w-4 h-4 mr-2" />
                    保存修改
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 账号安全 */}
          <TabsContent value="security">
            <div className="space-y-6">
              {/* 修改密码 */}
              <Card>
                <CardHeader>
                  <CardTitle>修改密码</CardTitle>
                  <CardDescription>定期修改密码可以提高账号安全性</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>当前密码</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        placeholder="请输入当前密码"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>新密码</Label>
                    <Input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="请输入新密码（至少6位）"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>确认新密码</Label>
                    <Input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="请再次输入新密码"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleChangePassword}>
                      <Lock className="w-4 h-4 mr-2" />
                      修改密码
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 登录设备 */}
              <Card>
                <CardHeader>
                  <CardTitle>登录设备管理</CardTitle>
                  <CardDescription>管理已登录的设备，可疑设备可以及时移除</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">当前设备</p>
                        <p className="text-sm text-gray-500">Chrome · Windows 10 · 北京</p>
                      </div>
                    </div>
                    <span className="text-sm text-green-600">当前在线</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">iPhone 14 Pro</p>
                        <p className="text-sm text-gray-500">Safari · iOS 17 · 北京</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => toast.success('设备已移除')}>
                      移除
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 安全日志 */}
              <Card>
                <CardHeader>
                  <CardTitle>安全日志</CardTitle>
                  <CardDescription>查看最近的登录和操作记录</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { time: '今天 14:30', action: '登录成功', device: 'Chrome · Windows 10', ip: '192.168.1.100' },
                      { time: '今天 09:15', action: '修改密码', device: 'Chrome · Windows 10', ip: '192.168.1.100' },
                      { time: '昨天 18:20', action: '登录成功', device: 'Safari · iOS 17', ip: '192.168.1.101' },
                      { time: '昨天 10:30', action: '登录成功', device: 'Chrome · Windows 10', ip: '192.168.1.100' },
                    ].map((log, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-500 w-24">{log.time}</span>
                          <span className="font-medium">{log.action}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {log.device} · {log.ip}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 通知偏好 */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>通知设置</CardTitle>
                <CardDescription>选择您希望接收的通知方式</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 通知方式 */}
                <div className="space-y-4">
                  <h4 className="font-medium">通知方式</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="font-medium">邮件通知</p>
                          <p className="text-sm text-gray-500">通过邮件接收重要通知</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications.emailNotify}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, emailNotify: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="font-medium">短信通知</p>
                          <p className="text-sm text-gray-500">通过短信接收紧急通知</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications.smsNotify}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, smsNotify: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="font-medium">系统通知</p>
                          <p className="text-sm text-gray-500">在系统内接收通知消息</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications.systemNotify}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, systemNotify: checked })}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* 通知类型 */}
                <div className="space-y-4">
                  <h4 className="font-medium">通知类型</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="font-medium">工单通知</p>
                          <p className="text-sm text-gray-500">工单状态变更、分配等通知</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications.workorderNotify}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, workorderNotify: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="font-medium">告警通知</p>
                          <p className="text-sm text-gray-500">系统告警、异常事件通知</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications.alertNotify}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, alertNotify: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="font-medium">知识库通知</p>
                          <p className="text-sm text-gray-500">知识库更新、新文章通知</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications.knowledgeNotify}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, knowledgeNotify: checked })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveNotifications}>
                    <Save className="w-4 h-4 mr-2" />
                    保存设置
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
