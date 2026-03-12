/**
 * 技术支持配置
 */
export const supportConfig = {
  /** 技术支持电话 */
  phone: '400-888-8888',
  
  /** 技术支持邮箱 */
  email: 'support@gov.com',
  
  /** 在线客服工作时间 */
  workingHours: '工作日 9:00-18:00',
  
  /** 技术支持服务时间 */
  supportHours: '7×24小时',
} as const;

export type SupportConfig = typeof supportConfig;
