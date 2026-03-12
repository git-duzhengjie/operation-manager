'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, AlertCircle, GitBranch, HelpCircle, Upload, X } from 'lucide-react';
import { useState } from 'react';

const serviceCatalogs = [
  { id: '1', name: '账号管理', icon: '👤', children: [
    { id: '1-1', name: '账号申请' },
    { id: '1-2', name: '权限变更' },
    { id: '1-3', name: '密码重置' },
  ]},
  { id: '2', name: '硬件支持', icon: '💻', children: [
    { id: '2-1', name: '设备故障' },
    { id: '2-2', name: '设备采购' },
    { id: '2-3', name: '设备更换' },
  ]},
  { id: '3', name: '软件服务', icon: '📦', children: [
    { id: '3-1', name: '软件安装' },
    { id: '3-2', name: '软件升级' },
    { id: '3-3', name: '软件故障' },
  ]},
  { id: '4', name: '网络服务', icon: '🌐', children: [
    { id: '4-1', name: '网络接入' },
    { id: '4-2', name: '网络故障' },
    { id: '4-3', name: 'VPN申请' },
  ]},
  { id: '5', name: '数据服务', icon: '📊', children: [
    { id: '5-1', name: '数据备份' },
    { id: '5-2', name: '数据恢复' },
    { id: '5-3', name: '数据迁移' },
  ]},
];

const recommendedArticles = [
  { id: '1', title: '如何重置域账号密码', views: 1234 },
  { id: '2', title: 'VPN连接问题排查指南', views: 987 },
  { id: '3', title: '软件安装常见问题', views: 876 },
];

export default function QuickSubmitPage() {
  const [selectedCatalog, setSelectedCatalog] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments([...attachments, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // TODO: 实现提单逻辑
    console.log({ selectedCatalog, title, description, priority, attachments });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">快速提单</h1>
          <p className="text-gray-600 mt-1">选择服务类型，快速提交工单</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：服务目录选择 */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="catalog" className="space-y-4">
              <TabsList>
                <TabsTrigger value="catalog">服务目录</TabsTrigger>
                <TabsTrigger value="quick">快速提单</TabsTrigger>
              </TabsList>

              <TabsContent value="catalog" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>选择服务类型</CardTitle>
                    <CardDescription>点击选择您需要的服务</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {serviceCatalogs.map((catalog) => (
                        <Card 
                          key={catalog.id}
                          className={`cursor-pointer hover:border-blue-500 transition-colors ${
                            selectedCatalog.startsWith(catalog.id) ? 'border-blue-500 bg-blue-50' : ''
                          }`}
                          onClick={() => setSelectedCatalog(catalog.id)}
                        >
                          <CardContent className="p-4 text-center">
                            <div className="text-3xl mb-2">{catalog.icon}</div>
                            <div className="font-medium">{catalog.name}</div>
                            {selectedCatalog.startsWith(catalog.id) && (
                              <div className="mt-2 text-sm text-blue-600">
                                已选择
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {selectedCatalog && (
                      <div className="mt-6">
                        <Label>选择具体服务</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {serviceCatalogs
                            .find(c => c.id === selectedCatalog.split('-')[0])
                            ?.children.map((child) => (
                              <Button
                                key={child.id}
                                variant={selectedCatalog === child.id ? 'default' : 'outline'}
                                onClick={() => setSelectedCatalog(child.id)}
                              >
                                {child.name}
                              </Button>
                            ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="quick" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>快速提单</CardTitle>
                    <CardDescription>直接填写工单信息</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>工单类型</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="选择类型" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="incident">
                              <div className="flex items-center">
                                <AlertCircle className="w-4 h-4 mr-2" />
                                事件管理
                              </div>
                            </SelectItem>
                            <SelectItem value="request">
                              <div className="flex items-center">
                                <HelpCircle className="w-4 h-4 mr-2" />
                                请求管理
                              </div>
                            </SelectItem>
                            <SelectItem value="change">
                              <div className="flex items-center">
                                <GitBranch className="w-4 h-4 mr-2" />
                                变更管理
                              </div>
                            </SelectItem>
                            <SelectItem value="problem">
                              <div className="flex items-center">
                                <FileText className="w-4 h-4 mr-2" />
                                问题管理
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>优先级</Label>
                        <Select value={priority} onValueChange={setPriority}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="urgent">紧急</SelectItem>
                            <SelectItem value="high">高</SelectItem>
                            <SelectItem value="medium">中</SelectItem>
                            <SelectItem value="low">低</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* 工单详情 */}
            <Card>
              <CardHeader>
                <CardTitle>工单详情</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">标题 *</Label>
                  <Input
                    id="title"
                    placeholder="请简要描述您遇到的问题"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">详细描述 *</Label>
                  <Textarea
                    id="description"
                    placeholder="请详细描述问题现象、影响范围、已尝试的解决方法等"
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>客户</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="选择客户" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">市财政局</SelectItem>
                        <SelectItem value="2">市人社局</SelectItem>
                        <SelectItem value="3">市卫健委</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>项目</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="选择项目" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">预算管理系统</SelectItem>
                        <SelectItem value="2">人事管理系统</SelectItem>
                        <SelectItem value="3">医院信息系统</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>附件</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">点击或拖拽文件到此处上传</p>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                      id="file-upload"
                    />
                    <Button
                      variant="outline"
                      className="mt-2"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      选择文件
                    </Button>
                  </div>
                  {attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded">
                          <span className="text-sm">{file.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAttachment(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
              <Button variant="outline">保存草稿</Button>
              <Button onClick={handleSubmit}>提交工单</Button>
            </div>
          </div>

          {/* 右侧：推荐知识库 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>推荐知识库</CardTitle>
                <CardDescription>相关问题解决方案</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendedArticles.map((article) => (
                    <div
                      key={article.id}
                      className="p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <div className="font-medium text-sm">{article.title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        浏览 {article.views} 次
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>提单须知</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <p>1. 请准确描述问题，便于快速处理</p>
                <p>2. 紧急问题请选择"紧急"优先级</p>
                <p>3. 可上传截图、日志等附件</p>
                <p>4. 提交后可在工单列表查看进度</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
