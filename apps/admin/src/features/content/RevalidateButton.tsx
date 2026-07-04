import { Button, App as AntApp } from 'antd';
import { CloudUploadOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { normalizeError } from '@/lib/api/client';
import { usePermission } from '@/components/Can';
import { contentApi } from './api';

/** Publish/revalidate: refreshes the public-site ISR cache. */
export function RevalidateButton() {
  const { message } = AntApp.useApp();
  const canWrite = usePermission('content.write');
  const mut = useMutation({
    mutationFn: () => contentApi.revalidate(),
    onSuccess: (d) => message.success(`Public site revalidated (v${d.version})`),
    onError: (e) => message.error(normalizeError(e).message),
  });
  if (!canWrite) return null;
  return (
    <Button
      type="primary"
      icon={<CloudUploadOutlined />}
      loading={mut.isPending}
      onClick={() => mut.mutate()}
    >
      Publish / revalidate
    </Button>
  );
}
