import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Button, Card, Form, Input, Typography, App as AntApp } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSessionStore } from '@/stores/session';
import { normalizeError } from '@/lib/api/client';
import { login, fetchMe } from './api';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = AntApp.useApp();
  const setSession = useSessionStore((s) => s.setSession);
  const setUser = useSessionStore((s) => s.setUser);
  const isAuthed = useSessionStore((s) => s.isAuthenticated());
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  if (isAuthed) return <Navigate to={from} replace />;

  async function onFinish(values: { email: string; password: string }) {
    setSubmitting(true);
    try {
      const res = await login(values.email, values.password);
      setSession({ accessToken: res.accessToken, refreshToken: res.refreshToken, user: res.user });
      // Confirm role/profile from /me (source of truth for RBAC).
      try {
        setUser(await fetchMe());
      } catch {
        /* keep login user */
      }
      navigate(from, { replace: true });
    } catch (err) {
      const n = normalizeError(err);
      message.error(n.status === 401 ? t('login.failed') : n.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-steel-900 p-4">
      <Card className="w-full max-w-md shadow-lg" styles={{ body: { padding: 32 } }}>
        <div className="mb-6 text-center">
          <Typography.Title level={3} className="!mb-1">
            ALTAN
          </Typography.Title>
          <Typography.Text type="secondary">{t('login.title')}</Typography.Text>
        </div>
        <Form layout="vertical" onFinish={onFinish} requiredMark={false} disabled={submitting}>
          <Form.Item
            label={t('login.email')}
            name="email"
            rules={[{ required: true, type: 'email' }]}
          >
            <Input
              prefix={<MailOutlined />}
              autoComplete="username"
              placeholder="admin@altan.test"
            />
          </Form.Item>
          <Form.Item label={t('login.password')} name="password" rules={[{ required: true }]}>
            <Input.Password prefix={<LockOutlined />} autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={submitting} size="large">
            {t('login.submit')}
          </Button>
        </Form>
      </Card>
    </div>
  );
}
