'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useCustomerService } from '@/components/customer-service';
import {
  BookOpen,
  Search,
  FileText,
  Video,
  MessageCircle,
  Phone,
  Mail,
  ChevronRight,
  Clock,
  ThumbsUp,
  ExternalLink,
  HelpCircle,
  Lightbulb,
  Users,
  Settings,
  Ticket,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

// 常见问题分类
const faqCategories = [
  {
    id: 'account',
    title: '账号与权限',
    icon: Users,
    questions: [
      {
        q: '如何修改个人信息？',
        a: '点击右上角用户头像，选择"个人设置"，在个人信息页面可以修改用户名、邮箱、手机号、部门等信息。修改完成后点击"保存修改"即可。',
      },
      {
        q: '如何更换头像？',
        a: '在个人设置页面，点击头像区域或"选择图片"按钮，选择要上传的图片（支持JPG、PNG、GIF、WebP格式，大小不超过2MB），系统会自动上传并更新头像。',
      },
      {
        q: '忘记密码怎么办？',
        a: '在登录页面点击"忘记密码"，输入注册邮箱后系统会发送重置密码链接。您也可以联系管理员重置密码。',
      },
      {
        q: '如何申请更高权限？',
        a: '请联系系统管理员或运维部门负责人，说明需要的权限和原因，管理员审核后在"系统设置-用户管理"中为您调整权限。',
      },
    ],
  },
  {
    id: 'ticket',
    title: '工单管理',
    icon: Ticket,
    questions: [
      {
        q: '如何创建新工单？',
        a: '点击左侧菜单"服务门户-快速提单"或仪表板上的"快速提单"入口，填写工单标题、描述、优先级等信息，提交后系统会自动分配工单编号。',
      },
      {
        q: '如何查看工单处理进度？',
        a: '进入"服务门户-工单查询"或"工单管理"页面，可以查看工单状态、处理人、处理历史等信息。也可以在搜索框输入工单号快速查询。',
      },
      {
        q: '工单分配错误怎么办？',
        a: '如果工单分配给了错误的处理人，请联系该处理人退回工单，或联系管理员重新分配。工单详情页面也可以查看流转历史。',
      },
      {
        q: '如何导出工单数据？',
        a: '在工单管理页面，设置筛选条件后点击"导出"按钮，系统会导出当前筛选结果为CSV文件。',
      },
    ],
  },
  {
    id: 'asset',
    title: '资产管理',
    icon: Package,
    questions: [
      {
        q: '如何查看资产详情？',
        a: '进入"资产管理-资产台账"页面，可以查看所有资产的列表。点击资产名称或操作栏的查看按钮可以查看详细信息，包括配置、状态、关联项目等。',
      },
      {
        q: '如何新增资产？',
        a: '在资产台账页面点击"新增资产"按钮，填写资产基本信息（名称、类型、IP等）和规格配置，保存后即可新增资产。',
      },
      {
        q: '资产状态有哪些？',
        a: '资产状态包括：正常运行、告警中、维护中、已停用、已报废。状态会根据监控数据自动更新，也可以手动修改。',
      },
    ],
  },
  {
    id: 'knowledge',
    title: '知识库',
    icon: BookOpen,
    questions: [
      {
        q: '如何搜索知识库文章？',
        a: '在顶部搜索框输入关键词，选择"知识库"分类即可搜索。也可以在知识库页面使用搜索框和标签筛选功能。',
      },
      {
        q: '如何创建新文章？',
        a: '进入知识库管理页面，点击"新建文章"按钮，填写标题、类型、标签、内容后提交。新建文章默认为草稿状态。',
      },
      {
        q: '文章版本如何管理？',
        a: '每次编辑保存文章时，版本号会自动+1。可以在文章详情页查看修改历史和不同版本的内容。',
      },
    ],
  },
  {
    id: 'alert',
    title: '监控告警',
    icon: AlertTriangle,
    questions: [
      {
        q: '如何查看告警信息？',
        a: '点击顶部铃铛图标可以查看最新告警通知。进入"监控告警"页面可以查看所有告警详情、处理状态和历史记录。',
      },
      {
        q: '如何设置告警阈值？',
        a: '告警阈值由管理员在系统配置中设置。如有特殊需求，请联系运维团队调整。',
      },
      {
        q: '告警通知有哪些方式？',
        a: '系统支持邮件通知、短信通知、系统内通知三种方式。您可以在"个人设置-通知偏好"中选择接收哪些类型的通知。',
      },
    ],
  },
];

// 使用指南
const guides = [
  {
    id: 'quick-start',
    title: '快速入门',
    description: '了解系统基本功能，快速上手使用',
    icon: Lightbulb,
    time: '5分钟',
    articles: [
      { title: '系统概览与导航', url: '#' },
      { title: '如何提交工单', url: '#' },
      { title: '如何查询资产信息', url: '#' },
      { title: '如何使用知识库', url: '#' },
    ],
  },
  {
    id: 'ticket-guide',
    title: '工单管理指南',
    description: '工单全生命周期管理指南',
    icon: Ticket,
    time: '10分钟',
    articles: [
      { title: '工单创建与提交', url: '#' },
      { title: '工单处理流程', url: '#' },
      { title: '工单流转与审批', url: '#' },
      { title: '工单统计与分析', url: '#' },
    ],
  },
  {
    id: 'asset-guide',
    title: '资产管理指南',
    description: '资产台账、客户、项目管理',
    icon: Package,
    time: '8分钟',
    articles: [
      { title: '资产台账管理', url: '#' },
      { title: '客户信息管理', url: '#' },
      { title: '项目关联管理', url: '#' },
      { title: '资产配置管理', url: '#' },
    ],
  },
  {
    id: 'system-guide',
    title: '系统配置指南',
    description: '用户、角色、权限配置',
    icon: Settings,
    time: '15分钟',
    articles: [
      { title: '用户管理', url: '#' },
      { title: '角色权限配置', url: '#' },
      { title: '服务目录配置', url: '#' },
      { title: '流程模板配置', url: '#' },
    ],
  },
];

// 热门问题
const hotQuestions = [
  { title: '如何重置密码？', views: 1234 },
  { title: '工单如何转派？', views: 987 },
  { title: '如何导出报表？', views: 876 },
  { title: '资产如何批量导入？', views: 654 },
  { title: '如何设置通知偏好？', views: 543 },
];

export default function HelpCenterPage() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [feedbackGiven, setFeedbackGiven] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('faq');
  const { openChat } = useCustomerService();

  const handleSearch = () => {
    if (searchKeyword.trim()) {
      toast.info(`搜索: ${searchKeyword}`);
    }
  };

  const handleFeedback = (questionId: string, isHelpful: boolean) => {
    setFeedbackGiven(questionId);
    toast.success(isHelpful ? '感谢您的反馈！' : '感谢反馈，我们会持续改进');
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText('400-888-8888');
    toast.success('技术支持电话已复制：400-888-8888');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="text-center py-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
          <h1 className="text-3xl font-bold text-gray-900">帮助中心</h1>
          <p className="text-gray-600 mt-2">遇到问题？在这里寻找答案</p>
          
          {/* 搜索框 */}
          <div className="max-w-xl mx-auto mt-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="搜索问题、文档、教程..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-12 pr-4 h-12 text-base"
              />
            </div>
          </div>
        </div>

        {/* 快捷入口 */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('guides')}>
            <CardContent className="p-6 text-center">
              <FileText className="w-8 h-8 mx-auto text-blue-600 mb-2" />
              <p className="font-medium">使用文档</p>
              <p className="text-sm text-gray-500 mt-1">详细功能说明</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => toast.info('视频教程功能开发中，敬请期待')}>
            <CardContent className="p-6 text-center">
              <Video className="w-8 h-8 mx-auto text-purple-600 mb-2" />
              <p className="font-medium">视频教程</p>
              <p className="text-sm text-gray-500 mt-1">操作演示视频</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={openChat}>
            <CardContent className="p-6 text-center">
              <MessageCircle className="w-8 h-8 text-green-600 mb-2" />
              <p className="font-medium">在线客服</p>
              <p className="text-sm text-gray-500 mt-1">实时咨询解答</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleCopyPhone}>
            <CardContent className="p-6 text-center">
              <Phone className="w-8 h-8 text-orange-600 mb-2" />
              <p className="font-medium">技术支持</p>
              <p className="text-sm text-gray-500 mt-1">400-888-8888</p>
            </CardContent>
          </Card>
        </div>

        {/* 常见问题与使用指南 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="faq">常见问题</TabsTrigger>
            <TabsTrigger value="guides">使用指南</TabsTrigger>
            <TabsTrigger value="hot">热门问题</TabsTrigger>
          </TabsList>

          {/* 常见问题 */}
          <TabsContent value="faq" className="space-y-4">
            <div className="grid grid-cols-3 gap-6">
              {/* 左侧分类导航 */}
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="text-base">问题分类</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {faqCategories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                    >
                      <category.icon className="w-5 h-5 text-gray-500" />
                      <span className="flex-1">{category.title}</span>
                      <Badge variant="secondary">{category.questions.length}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* 右侧问题列表 */}
              <div className="col-span-2 space-y-4">
                {faqCategories.map((category) => (
                  <Card key={category.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <category.icon className="w-5 h-5 text-blue-600" />
                        {category.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {category.questions.map((item, index) => (
                          <AccordionItem key={index} value={`${category.id}-${index}`}>
                            <AccordionTrigger className="text-left">
                              <div className="flex items-center gap-2">
                                <HelpCircle className="w-4 h-4 text-blue-500" />
                                {item.q}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="pl-6 text-gray-600">
                                <p className="mb-3">{item.a}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-500 pt-2 border-t">
                                  <span>这篇文章对您有帮助吗？</span>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleFeedback(`${category.id}-${index}`, true)}
                                      disabled={feedbackGiven === `${category.id}-${index}`}
                                    >
                                      <ThumbsUp className="w-3 h-3 mr-1" />
                                      有帮助
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleFeedback(`${category.id}-${index}`, false)}
                                      disabled={feedbackGiven === `${category.id}-${index}`}
                                    >
                                      没帮助
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* 使用指南 */}
          <TabsContent value="guides">
            <div className="grid grid-cols-2 gap-6">
              {guides.map((guide) => (
                <Card key={guide.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <guide.icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{guide.title}</CardTitle>
                        <CardDescription>{guide.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <Clock className="w-4 h-4 mr-1" />
                      预计阅读时间：{guide.time}
                    </div>
                    <div className="space-y-2">
                      {guide.articles.map((article, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50 cursor-pointer group"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{article.title}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                      ))}
                    </div>
                    <Button variant="link" className="mt-4 p-0 text-blue-600">
                      查看完整指南
                      <ExternalLink className="w-4 h-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* 热门问题 */}
          <TabsContent value="hot">
            <Card>
              <CardHeader>
                <CardTitle>热门问题 TOP 5</CardTitle>
                <CardDescription>其他用户最常搜索的问题</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {hotQuestions.map((question, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-gray-50 cursor-pointer border"
                    >
                      <div className="flex items-center gap-4">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-100 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-50 text-gray-500'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="font-medium">{question.title}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{question.views} 次浏览</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 联系支持 */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">没有找到答案？</h3>
                <p className="text-gray-600 mt-1">联系我们的技术支持团队获取帮助</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={openChat}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  在线咨询
                </Button>
                <Button onClick={() => toast.success('技术支持邮箱：support@gov.com，已复制到剪贴板')}>
                  <Mail className="w-4 h-4 mr-2" />
                  发送邮件
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
