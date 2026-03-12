'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Shield, User, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 模拟验证用户名密码
    if (username && password) {
      // TODO: 实际调用登录接口
      setStep('2fa');
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 模拟验证双因素认证
    if (twoFactorCode) {
      // TODO: 实际调用2FA验证接口
      router.push('/');
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
            <CardTitle>
              {step === 'credentials' ? '账户登录' : '双因素认证'}
            </CardTitle>
            <CardDescription>
              {step === 'credentials' 
                ? '请输入您的账户信息' 
                : '请输入短信验证码或动态口令'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'credentials' ? (
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
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
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  登录
                </Button>
              </form>
            ) : (
              <form onSubmit={handle2FASubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="2fa">验证码</Label>
                  <Input
                    id="2fa"
                    type="text"
                    placeholder="请输入6位验证码"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                    required
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <button type="button" className="text-blue-600 hover:underline">
                    重新发送验证码
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setStep('credentials')}
                    className="text-gray-600 hover:underline"
                  >
                    返回登录
                  </button>
                </div>
                <Button type="submit" className="w-full">
                  验证
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* 系统信息 */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>系统支持双因素认证 | 符合等保三级要求</p>
          <p className="mt-2">© 2024 运维管理系统 版权所有</p>
        </div>
      </div>
    </div>
  );
}
