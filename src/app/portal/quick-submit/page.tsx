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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, AlertCircle, GitBranch, HelpCircle, Upload, X, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const serviceCatalogs = [
  { id: '1', name: '账号管理', icon: '👤', children: [
    { id: '1-1', name: '账号申请', description: '申请新的系统账号' },
    { id: '1-2', name: '权限变更', description: '申请账号权限变更' },
    { id: '1-3', name: '密码重置', description: '重置账号密码' },
  ]},
  { id: '2', name: '硬件支持', icon: '💻', children: [
    { id: '2-1', name: '设备故障', description: '报告硬件设备故障' },
    { id: '2-2', name: '设备采购', description: '申请采购新设备' },
    { id: '2-3', name: '设备更换', description: '申请更换设备' },
  ]},
  { id: '3', name: '软件服务', icon: '📦', children: [
    { id: '3-1', name: '软件安装', description: '申请安装软件' },
    { id: '3-2', name: '软件升级', description: '申请软件升级' },
    { id: '3-3', name: '软件故障', description: '报告软件故障' },
  ]},
  { id: '4', name: '网络服务', icon: '🌐', children: [
    { id: '4-1', name: '网络接入', description: '申请网络接入' },
    { id: '4-2', name: '网络故障', description: '报告网络故障' },
    { id: '4-3', name: 'VPN申请', description: '申请VPN账号' },
  ]},
  { id: '5', name: '数据服务', icon: '📊', children: [
    { id: '5-1', name: '数据备份', description: '申请数据备份' },
    { id: '5-2', name: '数据恢复', description: '申请数据恢复' },
    { id: '5-3', name: '数据迁移', description: '申请数据迁移' },
  ]},
];

const recommendedArticles = [
  { id: '1', title: '如何重置域账号密码', views: 1234 },
  { id: '2', title: 'VPN连接问题排查指南', views: 987 },
  { id: '3', title: '软件安装常见问题', views: 876 },
];

export default function QuickSubmitPage() {
  const [selectedCatalog, setSelectedCatalog] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [customer, setCustomer] = useState('');
  const [project, setProject] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [ticketNo, setTicketNo] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments([...attachments, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    // 自动填充标题
    const catalog = serviceCatalogs.find(c => c.id === serviceId.split('-')[0]);
    const service = catalog?.children.find(s => s.id === serviceId);
    if (service) {
      setTitle(`${service.name}申请`);
    }
  };

  const handleSubmit = async () => {
    if (!selectedService) {
      toast.error('请选择服务类型');
      return;
    }
    if (!title.trim()) {
      toast.error('请输入工单标题');
      return;
    }
    if (!description.trim()) {
      toast.error('请输入问题描述');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 模拟提交
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 生成工单号
      const newTicketNo = `WO${Date.now().toString().slice(-10)}`;
      setTicketNo(newTicketNo);
      setShowSuccess(true);
      
      // 重置表单
      setSelectedService('');
      setTitle('');
      setDescription('');
      setPriority('medium');
      setCustomer('');
      setProject('');
      setAttachments([]);
    } catch (error) {
      toast.error('提交失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedCatalog('');
    setSelectedService('');
    setTitle('');
    setDescription('');
    setPriority('medium');
    setCustomer('');
    setProject('');
    setAttachments([]);
    setShowSuccess(false);
  };

  // 获取当前选中的服务信息
  const currentCatalog = serviceCatalogs.find(c => c.id === selectedService.split('-')[0]);
  const currentService = currentCatalog?.children.find(s => s.id === selectedService);

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
                {/* 服务目录选择 */}
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
                            selectedCatalog === catalog.id || selectedService.startsWith(catalog.id) 
                              ? 'border-blue-500 bg-blue-50' : ''
                          }`}
                          onClick={() => setSelectedCatalog(catalog.id)}
                        >
                          <CardContent className="p-4 text-center">
                            <div className="text-3xl mb-2">{catalog.icon}</div>
                            <div className="font-medium">{catalog.name}</div>
                            {(selectedCatalog === catalog.id || selectedService.startsWith(catalog.id)) && (
                              <div className="mt-2 text-sm text-blue-600">
                                已选择
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* 子服务选择 */}
                    {selectedCatalog && (
                      <div className="mt-6">
                        <Label>选择具体服务</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {serviceCatalogs
                            .find(c => c.id === selectedCatalog.split('-')[0])
                            ?.children.map((child) => (
                              <Button
                                key={child.id}
                                variant={selectedService === child.id ? 'default' : 'outline'}
                                onClick={() => handleServiceSelect(child.id)}
                                className="h-auto py-3"
                              >
                                <div className="text-center">
                                  <div>{child.name}</div>
                                  <div className="text-xs opacity-70 mt-1">{child.description}</div>
                                </div>
                              </Button>
                            ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 工单填写表单 - 选择服务后显示 */}
                {selectedService && currentService && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>填写工单详情</CardTitle>
                          <CardDescription>
                            当前服务：{currentCatalog?.name} - {currentService.name}
                          </CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => {
                          setSelectedService('');
                          setTitle('');
                          setDescription('');
                        }}>
                          重新选择
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* 基本信息 */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="priority">优先级</Label>
                          <Select value={priority} onValueChange={setPriority}>
                            <SelectTrigger id="priority">
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
                        <div className="space-y-2">
                          <Label htmlFor="customer">客户</Label>
                          <Select value={customer} onValueChange={setCustomer}>
                            <SelectTrigger id="customer">
                              <SelectValue placeholder="选择客户" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="财政局">市财政局</SelectItem>
                              <SelectItem value="人社局">市人社局</SelectItem>
                              <SelectItem value="卫健委">市卫健委</SelectItem>
                              <SelectItem value="公安局">市公安局</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="project">项目</Label>
                        <Select value={project} onValueChange={setProject}>
                          <SelectTrigger id="project">
                            <SelectValue placeholder="选择项目" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="预算系统">预算管理系统</SelectItem>
                            <SelectItem value="人事系统">人事管理系统</SelectItem>
                            <SelectItem value="医院系统">医院信息系统</SelectItem>
                            <SelectItem value="警务系统">警务综合平台</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 工单内容 */}
                      <div className="space-y-2">
                        <Label htmlFor="title">标题 *</Label>
                        <Input
                          id="title"
                          placeholder="请输入工单标题"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">问题描述 *</Label>
                        <Textarea
                          id="description"
                          placeholder="请详细描述您遇到的问题或需求..."
                          rows={6}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>

                      {/* 附件上传 */}
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

                      {/* 提交按钮 */}
                      <div className="flex justify-end space-x-4 pt-4 border-t">
                        <Button variant="outline" onClick={resetForm}>
                          取消
                        </Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                          {isSubmitting ? '提交中...' : '提交工单'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
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
                    
                    <div className="space-y-2">
                      <Label>标题</Label>
                      <Input placeholder="请输入工单标题" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>问题描述</Label>
                      <Textarea placeholder="请详细描述问题..." rows={5} />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button>提交工单</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
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

      {/* 成功提示弹窗 */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center">工单提交成功</DialogTitle>
            <DialogDescription className="text-center">
              您的工单已成功提交，工单号为：
              <div className="font-mono text-lg font-bold text-blue-600 mt-2">
                {ticketNo}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center space-x-4 mt-4">
            <Button variant="outline" onClick={resetForm}>
              继续提单
            </Button>
            <Button onClick={() => window.location.href = '/portal/tickets'}>
              查看工单
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
