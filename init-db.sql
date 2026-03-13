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

-- 完成提示
DO $$
BEGIN
    RAISE NOTICE '数据库初始化完成！';
    RAISE NOTICE '默认管理员账户: admin / admin123';
    RAISE NOTICE '请在生产环境中修改默认密码！';
END $$;
