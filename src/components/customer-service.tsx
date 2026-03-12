'use client';

import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface CustomerServiceContextType {
  openChat: () => void;
  isOpen: boolean;
}

const CustomerServiceContext = createContext<CustomerServiceContextType | undefined>(undefined);

// 模拟自动回复
const autoReplies: Record<string, string> = {
  '密码': '您好，关于密码问题：\n\n1. 忘记密码：请在登录页面点击"忘记密码"，通过邮箱重置\n2. 修改密码：请进入"个人设置-账号安全"进行修改\n3. 账号锁定：请联系管理员解锁\n\n还有什么可以帮您的吗？',
  '工单': '您好，关于工单问题：\n\n1. 创建工单：点击"快速提单"或"服务门户-快速提单"\n2. 查询工单：进入"工单查询"页面，输入工单号或关键词\n3. 工单状态：待分配→处理中→已解决→已关闭\n\n需要更详细的指导吗？',
  '资产': '您好，关于资产管理：\n\n1. 查看资产：进入"资产管理-资产台账"\n2. 新增资产：点击"新增资产"按钮\n3. 资产状态：正常运行、告警中、维护中、已停用\n\n请问您想了解哪方面？',
  '知识库': '您好，关于知识库：\n\n1. 搜索文章：使用顶部搜索框或在知识库页面搜索\n2. 新建文章：进入知识库管理，点击"新建文章"\n3. 文章类型：变更管理、事件管理、请求管理、问题管理\n\n还有其他问题吗？',
  '通知': '您好，关于通知设置：\n\n1. 点击右上角铃铛图标查看通知\n2. 进入"个人设置-通知偏好"管理通知方式\n3. 支持邮件、短信、系统内三种通知方式\n\n是否需要帮您调整通知设置？',
  '帮助': '您好！我可以帮您解答以下问题：\n\n• 密码相关问题\n• 工单管理问题\n• 资产管理问题\n• 知识库使用\n• 通知设置\n\n请直接输入您的问题，或点击下方快捷问题。',
};

const quickQuestions = [
  '如何修改密码？',
  '如何创建工单？',
  '如何查看资产？',
  '如何使用知识库？',
];

// 智能匹配回复
function getAutoReply(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  for (const [keyword, reply] of Object.entries(autoReplies)) {
    if (lowerMessage.includes(keyword)) {
      return reply;
    }
  }
  
  return `您好！感谢您的咨询。\n\n我理解您的问题是："${message}"\n\n目前我能解答以下类型的问题：\n• 密码和账号问题\n• 工单管理问题\n• 资产管理问题\n• 知识库使用\n• 通知设置\n\n您也可以：\n1. 拨打技术支持电话：400-888-8888\n2. 发送邮件至：support@gov.com\n3. 查看帮助中心获取详细文档\n\n请问还有什么可以帮您的吗？`;
}

export function CustomerServiceProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: '您好！我是智能客服助手，很高兴为您服务 🎉\n\n请问有什么可以帮您的吗？您可以直接输入问题，或点击下方快捷问题。',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const openChat = () => {
    setIsOpen(true);
    setIsMinimized(false);
  };

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 发送消息
  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // 模拟打字延迟
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));

    const reply = getAutoReply(inputValue);
    
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: reply,
      sender: 'bot',
      timestamp: new Date(),
    };

    setIsTyping(false);
    setMessages(prev => [...prev, botMessage]);
  };

  // 点击快捷问题
  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
  };

  // 格式化时间
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <CustomerServiceContext.Provider value={{ openChat, isOpen }}>
      {children}
      
      {/* 聊天窗口 */}
      {isOpen && (
        <div
          className={cn(
            'fixed z-50 bg-white rounded-lg shadow-2xl transition-all duration-300',
            isMinimized
              ? 'bottom-6 right-6 w-72 h-14'
              : 'bottom-6 right-6 w-96 h-[500px] flex flex-col'
          )}
        >
          {/* 标题栏 */}
          <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <span className="font-medium">智能客服</span>
              <span className="text-xs bg-green-400 text-green-900 px-2 py-0.5 rounded-full">
                在线
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-white hover:bg-blue-700"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-white hover:bg-blue-700"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 聊天内容区 */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-2',
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.sender === 'bot' && (
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-blue-600" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[80%] rounded-lg px-3 py-2',
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border shadow-sm'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p
                        className={cn(
                          'text-xs mt-1',
                          message.sender === 'user' ? 'text-blue-200' : 'text-gray-400'
                        )}
                      >
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                    {message.sender === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}

                {/* 打字中提示 */}
                {isTyping && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="bg-white border rounded-lg px-3 py-2 shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* 快捷问题 */}
              <div className="px-4 py-2 border-t bg-white">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {quickQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="whitespace-nowrap text-xs"
                      onClick={() => handleQuickQuestion(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 输入框 */}
              <div className="p-3 border-t bg-white rounded-b-lg">
                <div className="flex gap-2">
                  <Input
                    placeholder="请输入您的问题..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    className="flex-1"
                  />
                  <Button onClick={handleSend} disabled={!inputValue.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </CustomerServiceContext.Provider>
  );
}

export function useCustomerService() {
  const context = useContext(CustomerServiceContext);
  if (context === undefined) {
    throw new Error('useCustomerService must be used within a CustomerServiceProvider');
  }
  return context;
}
