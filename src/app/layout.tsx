import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '运维管理系统',
    template: '%s - 运维管理系统',
  },
  description: '数字政府统一运维管理平台，实现监、管、控、析、安、服一体化管理',
  keywords: [
    '运维管理',
    '工单系统',
    'IT服务管理',
    '资产管理',
    '知识库',
  ],
  authors: [{ name: '运维团队' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html lang="zh-CN">
      <body className="antialiased bg-gray-50">
        {isDev && <Inspector />}
        {children}
      </body>
    </html>
  );
}
