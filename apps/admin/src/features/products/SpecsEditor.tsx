import { useFieldArray, type Control } from 'react-hook-form';
import { Button, Input, Space, Tooltip, Typography } from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Controller } from 'react-hook-form';
import type { ProductFormValues } from './schema';

/**
 * Repeatable label/value/unit spec rows, reorderable. Backed by RHF useFieldArray;
 * row order is persisted as `sortOrder` on submit.
 */
export function SpecsEditor({ control }: { control: Control<ProductFormValues> }) {
  const { fields, append, remove, move } = useFieldArray({ control, name: 'specs' });

  return (
    <div>
      <Typography.Text type="secondary" className="mb-2 block text-xs">
        Specifications — grade/assay/packaging etc. Drag order with the arrows.
      </Typography.Text>
      <Space direction="vertical" size="small" className="w-full">
        {fields.map((field, idx) => (
          <Space.Compact key={field.id} className="w-full">
            <Controller
              control={control}
              name={`specs.${idx}.label`}
              render={({ field: f }) => (
                <Input {...f} placeholder="Label (e.g. Purity)" style={{ width: '34%' }} />
              )}
            />
            <Controller
              control={control}
              name={`specs.${idx}.value`}
              render={({ field: f }) => (
                <Input {...f} placeholder="Value (e.g. 99.95)" style={{ width: '34%' }} />
              )}
            />
            <Controller
              control={control}
              name={`specs.${idx}.unit`}
              render={({ field: f }) => (
                <Input {...f} placeholder="Unit" style={{ width: '16%' }} />
              )}
            />
            <Tooltip title="Move up">
              <Button
                icon={<ArrowUpOutlined />}
                disabled={idx === 0}
                onClick={() => move(idx, idx - 1)}
              />
            </Tooltip>
            <Tooltip title="Move down">
              <Button
                icon={<ArrowDownOutlined />}
                disabled={idx === fields.length - 1}
                onClick={() => move(idx, idx + 1)}
              />
            </Tooltip>
            <Button danger icon={<DeleteOutlined />} onClick={() => remove(idx)} />
          </Space.Compact>
        ))}
      </Space>
      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={() => append({ label: '', value: '', unit: '' })}
        className="mt-2"
        block
      >
        Add specification
      </Button>
    </div>
  );
}
