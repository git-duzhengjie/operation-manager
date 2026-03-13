'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Shield, User, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast.error('请输入用户名和密码');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || '登录失败');
        return;
      }

      // 存储登录状态和用户信息
      localStorage.setItem('oms_is_logged_in', 'true');
      localStorage.setItem('oms_user_id', String(result.data.user.id));
      localStorage.setItem('oms_user_role', result.data.user.role);
      
      // 存储用户信息到 UserContext 使用的 key
      const userInfo = {
        username: result.data.user.realName || result.data.user.username,
        email: result.data.user.email,
        phone: result.data.user.phone || '',
        department: result.data.user.department || '',
        position: result.data.user.position || '',
        avatar: result.data.user.avatar,
      };
      localStorage.setItem('oms_user_info', JSON.stringify(userInfo));
      
      toast.success('登录成功');
      router.push('/');
    } catch (error) {
      console.error('登录失败:', error);
      toast.error('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo 和标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">运维管理系统</h1>
          <p className="text-gray-600 mt-2">数字政府统一运维平台</p>
        </div>

        {/* 登录表单 */}
        <Card>
          <CardHeader>
            <CardTitle>账户登录</CardTitle>
            <CardDescription>请输入您的账户信息</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="请输入用户名"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                登录
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 系统信息 */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>© 2024 运维管理系统 版权所有</p>
        </div>
      </div>
    </div>
  );
}
