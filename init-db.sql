-- 数字政府统一运维管理平台数据库初始化脚本
-- Database initialization script for OPS Platform

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- 用户表
-- ===========================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    real_name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'external' CHECK (role IN ('admin', 'internal', 'external')),
    department VARCHAR(100),
    position VARCHAR(100),
    avatar TEXT,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- 客户表（委办局）
-- ===========================================
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE,
    contact_person VARCHAR(50),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    address TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- 项目表
-- ===========================================
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE,
    customer_id INTEGER REFERENCES customers(id),
    description TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- 资产台账表
-- ===========================================
CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    asset_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    brand VARCHAR(50),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    ip VARCHAR(50),
    location VARCHAR(200),
    customer_id INTEGER REFERENCES customers(id),
    project_id INTEGER REFERENCES projects(id),
    status VARCHAR(20) DEFAULT 'normal',
    description TEXT,
    purchase_date DATE,
    warranty_end_date DATE,
    specifications JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- 工单表
-- ===========================================
CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    ticket_no VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    type VARCHAR(50) DEFAULT 'incident',
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    customer_id INTEGER REFERENCES customers(id),
    customer_name VARCHAR(100),
    project_id INTEGER REFERENCES projects(id),
    project_name VARCHAR(100),
    asset_id INTEGER REFERENCES assets(id),
    reporter_id INTEGER REFERENCES users(id),
    assignee_id INTEGER REFERENCES users(id),
    assignee_name VARCHAR(100),
    description TEXT,
    resolution TEXT,
    due_date TIMESTAMP,
    resolved_at TIMESTAMP,
    closed_at TIMESTAMP,
    custom_fields JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- 工单流转历史表
-- ===========================================
CREATE TABLE IF NOT EXISTS ticket_history (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    from_status VARCHAR(50),
    to_status VARCHAR(50),
    from_assignee_id INTEGER REFERENCES users(id),
    to_assignee_id INTEGER REFERENCES users(id),
    comment TEXT,
    operator_id INTEGER REFERENCES users(id),
    operator_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- 知识库文章表
-- ===========================================
CREATE TABLE IF NOT EXISTS knowledge_articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'article',
    category VARCHAR(50),
    tags TEXT[],
    author_id INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'draft',
    view_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- 服务目录表
-- ===========================================
CREATE TABLE IF NOT EXISTS service_catalogs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- 服务项目表
-- ===========================================
CREATE TABLE IF NOT EXISTS service_items (
    id SERIAL PRIMARY KEY,
    catalog_id INTEGER REFERENCES service_catalogs(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    workflow_id INTEGER,
    form_template_id INTEGER,
    sla_time INTEGER,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- 流程定义表
-- ===========================================
CREATE TABLE IF NOT EXISTS workflows (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    catalog_id INTEGER,
    catalog_name VARCHAR(100),
    description TEXT,
    steps JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- 表单模板表
-- ===========================================
CREATE TABLE IF NOT EXISTS form_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    catalog_id INTEGER,
    catalog_name VARCHAR(100),
    description TEXT,
    fields JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- 例行任务表
-- ===========================================
CREATE TABLE IF NOT EXISTS scheduled_tasks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    cron_expression VARCHAR(100),
    task_type VARCHAR(50),
    task_config JSONB,
    status VARCHAR(20) DEFAULT 'active',
    last_run_at TIMESTAMP,
    next_run_at TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- 告警表
-- ===========================================
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    alert_id VARCHAR(100) UNIQUE NOT NULL,
    source VARCHAR(50),
    level VARCHAR(20) DEFAULT 'info',
    title VARCHAR(200) NOT NULL,
    description TEXT,
    asset_id INTEGER REFERENCES assets(id),
    asset_name VARCHAR(100),
    customer_id INTEGER REFERENCES customers(id),
    customer_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    ticket_id INTEGER REFERENCES tickets(id),
    ticket_code VARCHAR(50),
    raw_data JSONB,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- 操作日志表
-- ===========================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    details JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- 通知表
-- ===========================================
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    title VARCHAR(200) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    related_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- 用户设置表
-- ===========================================
CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) UNIQUE NOT NULL,
    theme VARCHAR(20) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'zh-CN',
    notification_enabled BOOLEAN DEFAULT TRUE,
    email_notification BOOLEAN DEFAULT TRUE,
    sms_notification BOOLEAN DEFAULT FALSE,
    settings JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- 角色表
-- ===========================================
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- 权限表
-- ===========================================
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- 角色权限关联表
-- ===========================================
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

-- ===========================================
-- 创建索引
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_reporter_id ON tickets(reporter_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee_id ON tickets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_level ON alerts(level);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_status ON knowledge_articles(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_type ON knowledge_articles(type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- ===========================================
-- 插入默认管理员账户
-- 密码: admin123 (请在生产环境中修改)
-- 注意：这里使用明文密码，生产环境建议使用 bcrypt 加密
-- ===========================================
INSERT INTO users (username, password, real_name, email, role, is_active) VALUES
('admin', 'admin123', '系统管理员', 'admin@example.com', 'admin', TRUE),
('zhangsan', '123456', '张三', 'zhangsan@example.com', 'internal', TRUE),
('lisi', '123456', '李四', 'lisi@example.com', 'internal', TRUE)
ON CONFLICT (username) DO NOTHING;

-- ===========================================
-- 插入默认角色
-- ===========================================
INSERT INTO roles (name, code, description, is_system) VALUES
('管理员', 'admin', '系统管理员，拥有所有权限', TRUE),
('内部人员', 'internal', '内部工作人员，拥有常规操作权限', TRUE),
('外部人员', 'external', '外部用户，拥有基本查看权限', TRUE)
ON CONFLICT (code) DO NOTHING;

-- ===========================================
-- 插入默认权限
-- ===========================================
INSERT INTO permissions (name, code, category) VALUES
-- 工单权限
('查看工单', 'ticket_view', '工单管理'),
('创建工单', 'ticket_create', '工单管理'),
('编辑工单', 'ticket_edit', '工单管理'),
('删除工单', 'ticket_delete', '工单管理'),
('处理工单', 'ticket_process', '工单管理'),
-- 资产权限
('查看资产', 'asset_view', '资产管理'),
('创建资产', 'asset_create', '资产管理'),
('编辑资产', 'asset_edit', '资产管理'),
('删除资产', 'asset_delete', '资产管理'),
-- 知识库权限
('查看知识库', 'knowledge_view', '知识库管理'),
('创建文章', 'knowledge_create', '知识库管理'),
('编辑文章', 'knowledge_edit', '知识库管理'),
('删除文章', 'knowledge_delete', '知识库管理'),
-- 监控权限
('查看监控', 'monitor_view', '监控管理'),
('配置监控', 'monitor_config', '监控管理'),
('处理告警', 'alert_handle', '监控管理'),
-- 用户管理权限
('查看用户', 'user_view', '用户管理'),
('创建用户', 'user_create', '用户管理'),
('编辑用户', 'user_edit', '用户管理'),
('删除用户', 'user_delete', '用户管理'),
-- 系统权限
('系统配置', 'system_config', '系统管理'),
('查看日志', 'log_view', '系统管理'),
('查看角色', 'role_view', '角色管理'),
('编辑角色', 'role_edit', '角色管理')
ON CONFLICT (code) DO NOTHING;

-- ===========================================
-- 分配管理员角色权限
-- ===========================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ===========================================
-- 插入示例客户数据
-- ===========================================
INSERT INTO customers (name, code, contact_person, contact_phone, status) VALUES
('市财政局', 'FIN-001', '张主任', '13800138001', 'active'),
('市人社局', 'HR-001', '李局长', '13800138002', 'active'),
('市卫健委', 'HEALTH-001', '王主任', '13800138003', 'active'),
('市公安局', 'POLICE-001', '赵队长', '13800138004', 'active'),
('市教育局', 'EDU-001', '钱主任', '13800138005', 'active')
ON CONFLICT (code) DO NOTHING;

-- ===========================================
-- 插入默认例行任务数据
-- ===========================================
INSERT INTO scheduled_tasks (name, description, cron_expression, task_type, task_config, status, last_run_at, next_run_at, created_by) VALUES
('每日系统巡检', '每日自动执行系统巡检，检查服务器状态、资源使用情况等', '0 8 * * *', 'inspection', '{"checkItems": ["cpu", "memory", "disk", "network"]}'::jsonb, 'active', NOW() - INTERVAL '1 day', NOW() + INTERVAL '1 day', 1),
('每周数据库备份检查', '每周自动检查数据库备份是否正常完成', '0 2 * * 0', 'backup', '{"target": "database", "retentionDays": 30}'::jsonb, 'active', NOW() - INTERVAL '7 day', NOW() + INTERVAL '7 day', 1),
('每月安全漏洞扫描', '每月执行安全漏洞扫描，检测系统安全隐患', '0 3 1 * *', 'security', '{"scanType": "full", "report": true}'::jsonb, 'active', NOW() - INTERVAL '1 month', NOW() + INTERVAL '1 month', 1),
('每周日志归档', '每周归档历史日志，释放存储空间', '0 4 * * 0', 'archive', '{"logTypes": ["system", "application", "audit"], "compress": true}'::jsonb, 'paused', NOW() - INTERVAL '7 day', NOW() + INTERVAL '7 day', 1),
('每日告警统计报告', '每日生成告警统计报告并发送邮件', '0 9 * * *', 'report', '{"type": "alert_summary", "recipients": ["admin@example.com"]}'::jsonb, 'active', NOW() - INTERVAL '1 day', NOW() + INTERVAL '1 day', 1),
('每周资产盘点检查', '每周检查资产状态，更新资产信息', '0 5 * * 1', 'asset', '{"checkExpired": true, "updateStatus": true}'::jsonb, 'active', NOW() - INTERVAL '7 day', NOW() + INTERVAL '7 day', 1)
ON CONFLICT DO NOTHING;

-- ===========================================
-- 插入默认通知数据
-- ===========================================
INSERT INTO notifications (title, message, type, category, is_read, related_id) VALUES
('工单已分配', '工单 WO20240101001 已分配给您处理，请及时查看并处理。该工单为服务器磁盘空间不足告警，优先级为高。', 'info', 'workorder', FALSE, 'WO20240101001'),
('告警通知', '服务器 AST001 CPU使用率超过90%，当前使用率为92.5%，请及时处理。', 'warning', 'alert', FALSE, 'AST001'),
('工单已完成', '工单 WO20240101003 已被标记为已完成，感谢您的处理。', 'success', 'workorder', TRUE, 'WO20240101003'),
('系统升级通知', '系统将于今晚22:00进行升级维护，预计维护时长1小时，届时系统将暂停服务。', 'info', 'system', TRUE, NULL),
('知识库更新', '有3篇新文章被添加到知识库：《服务器安全加固指南》、《常见网络问题解决方案》、《系统监控配置手册》。', 'success', 'knowledge', TRUE, NULL),
('资产到期提醒', '资产 AST001（应用服务器-01）的维保合同将于7天后到期，请及时续保。', 'warning', 'asset', FALSE, 'AST001'),
('巡检任务完成', '本周例行巡检任务已完成，共检查设备45台，发现异常3项，已生成巡检报告。', 'success', 'routine', TRUE, NULL),
('新工单待审批', '您有2个变更申请等待审批，请及时处理。', 'info', 'workorder', TRUE, NULL),
('告警已恢复', '服务器 AST002 内存使用率已恢复正常，当前使用率为75%。', 'success', 'alert', FALSE, 'AST002'),
('资产入库通知', '新资产「数据库服务器-03」已入库，资产编号：AST-2024-0056，请及时进行资产登记。', 'info', 'asset', FALSE, 'AST-2024-0056'),
('工单超时提醒', '工单 WO20240101005 已超过处理时限，请尽快处理或申请延期。', 'warning', 'workorder', FALSE, 'WO20240101005'),
('密码即将过期', '您的账户密码将于3天后过期，请及时修改密码。', 'warning', 'system', TRUE, NULL),
('月度报告已生成', '2024年1月运维月度报告已生成，请前往「例行工作」模块查看。', 'info', 'routine', TRUE, NULL),
('知识库审批通过', '您提交的文章《Nginx性能优化实践》已审核通过并发布。', 'success', 'knowledge', TRUE, NULL),
('服务目录更新', '服务目录「基础运维服务」已更新，新增了2个服务项目，请查看。', 'info', 'system', FALSE, NULL);

-- ===========================================
-- 插入默认资产数据
-- ===========================================
INSERT INTO assets (asset_code, name, type, brand, model, serial_number, ip, location, customer_id, project_id, status, description, purchase_date, warranty_end_date, specifications) VALUES
('AST-001', '应用服务器-01', 'server', 'Dell', 'PowerEdge R740', 'SN001', '192.168.1.10', '机房A-机柜01-U1-U10', 1, 1, 'normal', '财政局预算管理系统应用服务器', '2022-03-15', '2025-03-14', '{"cpu": "Intel Xeon Gold 6248R", "memory": "128GB", "disk": "2TB SSD RAID"}'),
('AST-002', '数据库服务器-01', 'server', 'Dell', 'PowerEdge R750', 'SN002', '192.168.1.11', '机房A-机柜01-U11-U20', 1, 1, 'normal', '财政局预算管理系统数据库服务器', '2022-03-15', '2025-03-14', '{"cpu": "Intel Xeon Platinum 8380", "memory": "256GB", "disk": "4TB SSD RAID 10"}'),
('AST-003', '核心交换机-01', 'network', 'Huawei', 'CloudEngine S7706', 'SN003', '192.168.1.1', '机房A-网络机柜', 1, NULL, 'normal', '核心网络交换机', '2021-06-20', '2024-06-19', '{"ports": "48x10GE+6x40GE", "throughput": "1.44Tbps"}'),
('AST-004', '应用服务器-02', 'server', 'Lenovo', 'ThinkSystem SR650', 'SN004', '192.168.1.20', '机房B-机柜02-U1-U10', 2, 2, 'warning', '人社局人事管理系统应用服务器', '2023-01-10', '2026-01-09', '{"cpu": "Intel Xeon Silver 4314", "memory": "64GB", "disk": "1TB SSD"}'),
('AST-005', '存储设备-01', 'storage', 'NetApp', 'AFF A250', 'SN005', '192.168.1.30', '机房A-存储机柜', 3, 3, 'normal', '卫健委医院信息系统存储', '2022-08-01', '2025-07-31', '{"capacity": "100TB", "type": "All-Flash Array"}'),
('AST-006', '防火墙-01', 'security', 'Fortinet', 'FortiGate 600F', 'SN006', '192.168.1.254', '机房A-网络机柜', NULL, NULL, 'normal', '核心边界防火墙', '2022-04-01', '2025-03-31', '{"throughput": "36Gbps", "interfaces": "10x10GE SFP+"}'),
('AST-007', '应用服务器-03', 'server', 'HP', 'ProLiant DL380 Gen10', 'SN007', '192.168.1.40', '机房C-机柜01-U1-U10', 4, 4, 'normal', '教育学籍管理系统应用服务器', '2023-05-15', '2026-05-14', '{"cpu": "Intel Xeon Gold 6330", "memory": "128GB", "disk": "1.6TB NVMe"}'),
('AST-008', '备份服务器-01', 'server', 'Dell', 'PowerEdge R650xs', 'SN008', '192.168.1.50', '机房A-机柜02-U1-U10', NULL, NULL, 'normal', '集中备份服务器', '2023-07-01', '2026-06-30', '{"cpu": "Intel Xeon Silver 4410Y", "memory": "64GB", "disk": "48TB RAID 6"}')
ON CONFLICT (asset_code) DO NOTHING;

-- ===========================================
-- 插入默认工单数据
-- ===========================================
INSERT INTO tickets (ticket_no, title, type, status, priority, customer_id, customer_name, project_id, project_name, asset_id, reporter_id, assignee_id, assignee_name, description, due_date, created_at) VALUES
('WO20240101001', '服务器磁盘空间不足告警', 'incident', 'processing', 'high', 1, '市财政局', 1, '预算管理系统', 1, 2, 2, '张工', '应用服务器-01磁盘空间使用率达到90%，需要及时处理', NOW() + INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('WO20240101002', '数据库备份失败', 'incident', 'pending', 'critical', 1, '市财政局', 1, '预算管理系统', 2, 3, NULL, NULL, '数据库服务器-01每日备份任务失败，错误代码：E001', NOW() + INTERVAL '12 hours', NOW()),
('WO20240101003', '网络设备配置变更申请', 'change', 'resolved', 'medium', 1, '市财政局', NULL, NULL, 3, 2, 2, '张工', '核心交换机需要新增VLAN配置', NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days'),
('WO20240101004', '人事系统登录缓慢', 'incident', 'processing', 'medium', 2, '市人社局', 2, '人事管理系统', 4, 4, 2, '张工', '用户反馈人事管理系统登录响应时间超过10秒', NOW() + INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('WO20240101005', '新系统上线支持申请', 'request', 'pending', 'low', 5, '市住建局', 5, '房产管理系统', NULL, 5, NULL, NULL, '房产管理系统即将上线，需要运维支持', NOW() + INTERVAL '7 days', NOW())
ON CONFLICT (ticket_no) DO NOTHING;

-- ===========================================
-- 插入默认知识库文章
-- ===========================================
INSERT INTO knowledge_articles (title, content, type, category, tags, author_id, status, view_count, is_public, published_at, created_at) VALUES
('服务器安全加固指南', '# 服务器安全加固指南\n\n## 1. 操作系统安全\n\n### 1.1 账户安全\n- 禁用不必要的默认账户\n- 设置强密码策略\n- 配置账户锁定策略\n\n### 1.2 服务安全\n- 关闭不必要的服务\n- 配置防火墙规则\n- 定期更新补丁', 'article', '安全管理', '{安全,服务器,加固}', 1, 'published', 156, TRUE, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
('常见网络问题解决方案', '# 常见网络问题解决方案\n\n## 1. 网络连接问题\n\n### 1.1 无法访问网络\n1. 检查网线连接\n2. 检查IP配置\n3. 检查DNS设置\n4. 检查防火墙规则', 'article', '网络管理', '{网络,故障排查}', 2, 'published', 234, TRUE, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
('系统监控配置手册', '# 系统监控配置手册\n\n## 1. CPU监控\n\n### 1.1 监控指标\n- CPU使用率\n- CPU负载\n- CPU上下文切换\n\n### 1.2 告警阈值\n- 警告：70%\n- 严重：85%\n- 紧急：95%', 'article', '监控管理', '{监控,配置}', 1, 'published', 189, TRUE, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
('数据库备份恢复操作指南', '# 数据库备份恢复操作指南\n\n## 1. 备份策略\n\n### 1.1 全量备份\n- 每周日凌晨2点执行\n- 保留周期：30天\n\n### 1.2 增量备份\n- 每日凌晨2点执行\n- 保留周期：7天', 'article', '数据库管理', '{数据库,备份,恢复}', 2, 'published', 98, TRUE, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
('Nginx性能优化实践', '# Nginx性能优化实践\n\n## 1. 基础优化\n\n### 1.1 worker进程配置\n```nginx\nworker_processes auto;\nworker_connections 4096;\n```', 'article', '中间件管理', '{Nginx,性能优化}', 1, 'draft', 0, FALSE, NULL, NOW())
ON CONFLICT DO NOTHING;

-- ===========================================
-- 插入默认服务目录
-- ===========================================
INSERT INTO service_catalogs (name, description, icon, sort_order, is_active) VALUES
('基础运维服务', '提供基础设施运维支持服务', 'Server', 1, TRUE),
('应用运维服务', '提供应用系统运维支持服务', 'AppWindow', 2, TRUE),
('安全运维服务', '提供安全运维支持服务', 'Shield', 3, TRUE),
('数据运维服务', '提供数据库及存储运维支持服务', 'Database', 4, TRUE)
ON CONFLICT DO NOTHING;

-- ===========================================
-- 插入默认服务项目
-- ===========================================
INSERT INTO service_items (catalog_id, name, description, workflow_id, form_template_id, sla_time, sort_order, is_active) VALUES
(1, '服务器故障处理', '处理服务器硬件及系统故障', 1, 1, 4, 1, TRUE),
(1, '网络故障处理', '处理网络设备及连接故障', 1, 1, 2, 2, TRUE),
(2, '应用问题处理', '处理应用系统运行问题', 1, 2, 8, 1, TRUE),
(2, '系统变更申请', '应用系统配置变更申请', 2, 3, 24, 2, TRUE),
(3, '安全事件处理', '处理安全告警和安全事件', 3, 1, 1, 1, TRUE),
(4, '数据库问题处理', '处理数据库运行问题', 1, 1, 4, 1, TRUE),
(4, '数据恢复申请', '申请数据备份恢复服务', 4, 4, 8, 2, TRUE)
ON CONFLICT DO NOTHING;

-- ===========================================
-- 插入默认工作流
-- ===========================================
INSERT INTO workflows (name, type, catalog_id, catalog_name, description, steps, is_active, version) VALUES
('故障处理流程', 'incident', 1, '基础运维服务', '标准故障处理流程', '[{"name": "提交", "assignee": "reporter"}, {"name": "分派", "assignee": "dispatcher"}, {"name": "处理", "assignee": "handler"}, {"name": "确认", "assignee": "reporter"}, {"name": "关闭", "assignee": "handler"}]'::jsonb, TRUE, 1),
('变更审批流程', 'change', 2, '应用运维服务', '标准变更审批流程', '[{"name": "提交", "assignee": "reporter"}, {"name": "初审", "assignee": "reviewer"}, {"name": "审批", "assignee": "approver"}, {"name": "实施", "assignee": "handler"}, {"name": "验收", "assignee": "reporter"}, {"name": "关闭", "assignee": "handler"}]'::jsonb, TRUE, 1),
('安全事件处理流程', 'security', 3, '安全运维服务', '安全事件处理流程', '[{"name": "发现", "assignee": "system"}, {"name": "确认", "assignee": "security"}, {"name": "处置", "assignee": "security"}, {"name": "复盘", "assignee": "security"}, {"name": "关闭", "assignee": "security"}]'::jsonb, TRUE, 1),
('数据恢复流程', 'recovery', 4, '数据运维服务', '数据恢复申请处理流程', '[{"name": "申请", "assignee": "reporter"}, {"name": "审批", "assignee": "approver"}, {"name": "执行", "assignee": "dba"}, {"name": "验证", "assignee": "reporter"}, {"name": "关闭", "assignee": "dba"}]'::jsonb, TRUE, 1)
ON CONFLICT DO NOTHING;

-- ===========================================
-- 插入默认表单模板
-- ===========================================
INSERT INTO form_templates (name, catalog_id, catalog_name, description, fields, is_active, version) VALUES
('故障报告表单', 1, '基础运维服务', '用于报告系统故障的表单', '[{"name": "title", "label": "故障标题", "type": "text", "required": true}, {"name": "description", "label": "故障描述", "type": "textarea", "required": true}, {"name": "priority", "label": "优先级", "type": "select", "options": ["low", "medium", "high", "critical"], "required": true}]'::jsonb, TRUE, 1),
('应用问题报告表单', 2, '应用运维服务', '用于报告应用系统问题的表单', '[{"name": "title", "label": "问题标题", "type": "text", "required": true}, {"name": "description", "label": "问题描述", "type": "textarea", "required": true}, {"name": "priority", "label": "优先级", "type": "select", "options": ["low", "medium", "high", "critical"], "required": true}, {"name": "impact", "label": "影响范围", "type": "select", "options": ["个人", "部门", "全局"], "required": true}]'::jsonb, TRUE, 1),
('变更申请表单', 2, '应用运维服务', '用于提交变更申请的表单', '[{"name": "title", "label": "变更标题", "type": "text", "required": true}, {"name": "reason", "label": "变更原因", "type": "textarea", "required": true}, {"name": "plan", "label": "变更方案", "type": "textarea", "required": true}, {"name": "risk", "label": "风险评估", "type": "textarea", "required": true}]'::jsonb, TRUE, 1),
('数据恢复申请表单', 4, '数据运维服务', '用于申请数据恢复的表单', '[{"name": "database", "label": "数据库名称", "type": "text", "required": true}, {"name": "restore_time", "label": "恢复时间点", "type": "datetime", "required": true}, {"name": "reason", "label": "恢复原因", "type": "textarea", "required": true}]'::jsonb, TRUE, 1)
ON CONFLICT DO NOTHING;

-- ===========================================
-- 插入默认告警数据
-- ===========================================
INSERT INTO alerts (alert_id, source, level, title, description, asset_id, asset_name, customer_id, customer_name, status, raw_data, created_at) VALUES
('ALT001', 'Zabbix', 'warning', 'CPU使用率过高', '服务器AST001 CPU使用率超过80%，当前值：85%', 1, '应用服务器-01', 1, '市财政局', 'pending', '{"cpu_usage": 85, "threshold": 80}'::jsonb, NOW() - INTERVAL '1 hour'),
('ALT002', 'Zabbix', 'critical', '磁盘空间不足', '服务器AST001 磁盘空间不足，剩余空间：5%', 1, '应用服务器-01', 1, '市财政局', 'processing', '{"disk_usage": 95, "free_space": "50GB"}'::jsonb, NOW() - INTERVAL '2 hours'),
('ALT003', 'Zabbix', 'warning', '内存使用率过高', '服务器AST002 内存使用率超过85%，当前值：90%', 4, '应用服务器-02', 2, '市人社局', 'pending', '{"memory_usage": 90, "threshold": 85}'::jsonb, NOW() - INTERVAL '30 minutes'),
('ALT004', 'Zabbix', 'info', '服务端口异常', '检测到异常端口扫描活动', 6, '防火墙-01', NULL, NULL, 'resolved', '{"source_ip": "192.168.100.50", "ports": [22, 3389, 445]}'::jsonb, NOW() - INTERVAL '2 days'),
('ALT005', 'Zabbix', 'high', '数据库连接数过高', '数据库服务器-01 连接数超过阈值，当前：450', 2, '数据库服务器-01', 1, '市财政局', 'pending', '{"connections": 450, "threshold": 400}'::jsonb, NOW())
ON CONFLICT (alert_id) DO NOTHING;

-- ===========================================
-- 插入默认审计日志
-- ===========================================
INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at) VALUES
(1, '用户登录', 'auth', '1', '{"method": "password", "ip": "192.168.1.100"}'::jsonb, '192.168.1.100', 'Mozilla/5.0 Chrome/120.0', NOW() - INTERVAL '1 hour'),
(1, '创建工单', 'ticket', 'WO20240101001', '{"title": "服务器磁盘空间不足告警"}'::jsonb, '192.168.1.100', 'Mozilla/5.0 Chrome/120.0', NOW() - INTERVAL '2 hours'),
(2, '更新工单状态', 'ticket', 'WO20240101001', '{"from_status": "pending", "to_status": "processing"}'::jsonb, '192.168.1.101', 'Mozilla/5.0 Chrome/120.0', NOW() - INTERVAL '90 minutes'),
(1, '创建资产', 'asset', 'AST-001', '{"name": "应用服务器-01"}'::jsonb, '192.168.1.100', 'Mozilla/5.0 Chrome/120.0', NOW() - INTERVAL '1 day'),
(1, '创建用户', 'user', '2', '{"username": "zhangsan"}'::jsonb, '192.168.1.100', 'Mozilla/5.0 Chrome/120.0', NOW() - INTERVAL '2 days'),
(1, '修改系统配置', 'system', 'notification', '{"key": "email_enabled", "value": true}'::jsonb, '192.168.1.100', 'Mozilla/5.0 Chrome/120.0', NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

-- 完成提示
DO $$
BEGIN
    RAISE NOTICE '数据库初始化完成！';
    RAISE NOTICE '默认管理员账户: admin / admin123';
    RAISE NOTICE '请在生产环境中修改默认密码！';
END $$;
