'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  FolderTree, 
  Workflow, 
  FileText,
  Edit,
  Trash2,
  Settings,
  Eye
} from 'lucide-react';

// 模拟服务目录数据
const serviceCatalogs = [
  {
    id: '1',
    name: '账号服务',
    icon: '👤',
    description: '账号申请、权限管理、密码重置等服务',
    children: [
      { id: '1-1', name: '账号申请', workflow: 'new-account', form: 'account-request' },
      { id: '1-2', name: '权限变更', workflow: 'permission-change', form: 'permission-request' },
      { id: '1-3', name: '密码重置', workflow: 'password-reset', form: 'password-reset' },
    ],
    status: 'active',
  },
  {
    id: '2',
    name: '硬件服务',
    icon: '💻',
    description: '设备采购、维修、更换等硬件相关服务',
    children: [
      { id: '2-1', name: '设备采购', workflow: 'hardware-purchase', form: 'purchase-request' },
      { id: '2-2', name: '设备维修', workflow: 'hardware-repair', form: 'repair-request' },
      { id: '2-3', name: '设备更换', workflow: 'hardware-replace', form: 'replace-request' },
    ],
    status: 'active',
  },
  {
    id: '3',
    name: '软件服务',
    icon: '📦',
    description: '软件安装、升级、授权等软件相关服务',
    children: [
      { id: '3-1', name: '软件安装', workflow: 'software-install', form: 'install-request' },
      { id: '3-2', name: '软件升级', workflow: 'software-upgrade', form: 'upgrade-request' },
      { id: '3-3', name: '软件授权', workflow: 'software-license', form: 'license-request' },
    ],
    status: 'active',
  },
  {
    id: '4',
    name: '网络服务',
    icon: '🌐',
    description: '网络接入、VPN、网络故障等网络相关服务',
    children: [
      { id: '4-1', name: '网络接入', workflow: 'network-access', form: 'access-request' },
      { id: '4-2', name: 'VPN服务', workflow: 'vpn-service', form: 'vpn-request' },
      { id: '4-3', name: '网络故障', workflow: 'network-issue', form: 'issue-report' },
    ],
    status: 'active',
  },
];

export default function ServiceCatalogPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 页面标题和操作按钮 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">服务目录管理</h1>
            <p className="text-gray-600 mt-1">管理IT服务场景分类和流程配置</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            新建目录
          </Button>
        </div>

        {/* 服务目录列表 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {serviceCatalogs.map((catalog) => (
            <Card key={catalog.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{catalog.icon}</div>
                    <div>
                      <CardTitle>{catalog.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {catalog.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {catalog.children.map((child) => (
                    <div
                      key={child.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <FolderTree className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{child.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          <Workflow className="w-3 h-3 mr-1" />
                          流程
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <FileText className="w-3 h-3 mr-1" />
                          表单
                        </Badge>
                        <Button variant="ghost" size="icon">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 服务类型统计 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-2">📁</div>
              <div className="text-2xl font-bold">4</div>
              <div className="text-sm text-gray-600">服务目录</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-2">📋</div>
              <div className="text-2xl font-bold">12</div>
              <div className="text-sm text-gray-600">服务项目</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-2">🔄</div>
              <div className="text-2xl font-bold">12</div>
              <div className="text-sm text-gray-600">流程定义</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-2">📝</div>
              <div className="text-2xl font-bold">12</div>
              <div className="text-sm text-gray-600">表单模板</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
