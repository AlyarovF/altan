import { Spin } from 'antd';

export default function Loading() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <Spin size="large" />
    </div>
  );
}
