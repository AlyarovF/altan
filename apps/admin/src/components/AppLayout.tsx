import { useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Breadcrumb,
  Button,
  Dropdown,
  Layout,
  Menu,
  Tag,
  Typography,
  App as AntApp,
} from 'antd';
import {
  AppstoreOutlined,
  DashboardOutlined,
  FileTextOutlined,
  GlobalOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ProfileOutlined,
  TagsOutlined,
  UserOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSessionStore } from '@/stores/session';
import { can, type Permission } from '@/lib/rbac';
import { logout } from '@/features/auth/api';

const { Sider, Header, Content } = Layout;

interface NavItem {
  key: string;
  to: string;
  label: string;
  icon: React.ReactNode;
  permission: Permission;
}

export function AppLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { modal } = AntApp.useApp();
  const user = useSessionStore((s) => s.user);
  const refreshToken = useSessionStore((s) => s.refreshToken);
  const clear = useSessionStore((s) => s.clear);
  const [collapsed, setCollapsed] = useState(false);

  const allItems: NavItem[] = [
    {
      key: 'dashboard',
      to: '/',
      label: t('nav.dashboard'),
      icon: <DashboardOutlined />,
      permission: 'product.read',
    },
    {
      key: 'products',
      to: '/products',
      label: t('nav.products'),
      icon: <AppstoreOutlined />,
      permission: 'product.read',
    },
    {
      key: 'taxonomy',
      to: '/taxonomy',
      label: t('nav.taxonomy'),
      icon: <TagsOutlined />,
      permission: 'product.read',
    },
    {
      key: 'news',
      to: '/news',
      label: t('nav.news'),
      icon: <FileTextOutlined />,
      permission: 'news.read',
    },
    {
      key: 'quotes',
      to: '/quotes',
      label: t('nav.quotes'),
      icon: <ProfileOutlined />,
      permission: 'quote.read',
    },
    {
      key: 'content',
      to: '/content',
      label: t('nav.content'),
      icon: <GlobalOutlined />,
      permission: 'content.read',
    },
    {
      key: 'translations',
      to: '/translations',
      label: t('nav.translations'),
      icon: <TranslationOutlined />,
      permission: 'content.read',
    },
  ];

  const items = allItems.filter((i) => can(user, i.permission));

  const selectedKey = useMemo(() => {
    const path = location.pathname;
    if (path === '/') return 'dashboard';
    const match = items.find((i) => i.to !== '/' && path.startsWith(i.to));
    return match?.key ?? 'dashboard';
  }, [location.pathname, items]);

  const crumbs = useMemo(() => {
    const current = items.find((i) => i.key === selectedKey);
    return [{ title: t('app.title') }, ...(current ? [{ title: current.label }] : [])];
  }, [items, selectedKey, t]);

  async function onLogout() {
    modal.confirm({
      title: t('app.signOut'),
      okText: t('app.signOut'),
      onOk: async () => {
        await logout(refreshToken);
        clear();
        navigate('/login', { replace: true });
      },
    });
  }

  return (
    <Layout className="min-h-screen">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        breakpoint="lg"
        collapsedWidth={0}
        trigger={null}
        theme="dark"
        width={216}
        className="!fixed inset-y-0 left-0 z-20 h-screen lg:!static lg:h-auto"
      >
        <div className="flex h-14 items-center justify-center px-4 text-amber">
          <Typography.Title
            level={4}
            className="!mb-0 !text-amber"
            style={{ letterSpacing: '0.12em' }}
          >
            {collapsed ? 'A' : 'ALTAN'}
          </Typography.Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={items.map((i) => ({
            key: i.key,
            icon: i.icon,
            label: <Link to={i.to}>{i.label}</Link>,
          }))}
        />
      </Sider>
      <Layout>
        <Header className="flex items-center justify-between gap-3 border-b border-steel-200 !px-3 sm:!px-5">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              type="text"
              aria-label={t('nav.toggleMenu')}
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((c) => !c)}
            />
            <Breadcrumb items={crumbs} className="min-w-0" />
          </div>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'role',
                  disabled: true,
                  label: <span className="text-xs">{user?.email}</span>,
                },
                { type: 'divider' },
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: t('app.signOut'),
                  onClick: onLogout,
                },
              ],
            }}
          >
            <div className="flex cursor-pointer items-center gap-2">
              <Avatar size="small" icon={<UserOutlined />} className="!bg-amber" />
              <span className="hidden text-sm font-medium sm:inline">{user?.name}</span>
              {user?.role ? <Tag className="!mr-0">{user.role}</Tag> : null}
            </div>
          </Dropdown>
        </Header>
        <Content className="p-5">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
