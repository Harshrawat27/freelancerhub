'use client';

import * as React from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomField } from '@/lib/validations';

interface CustomFieldsProps {
  label?: string;
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
  labelPlaceholder?: string;
  valuePlaceholder?: string;
  addButtonText?: string;
}

export function CustomFields({
  label,
  fields,
  onChange,
  labelPlaceholder = 'Field name',
  valuePlaceholder = 'Value',
  addButtonText = 'Add Field',
}: CustomFieldsProps) {
  const addField = () => {
    const newField: CustomField = {
      id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      label: '',
      value: '',
    };
    onChange([...fields, newField]);
  };

  const removeField = (id: string) => {
    onChange(fields.filter((field) => field.id !== id));
  };

  const updateField = (id: string, key: 'label' | 'value', value: string) => {
    onChange(
      fields.map((field) =>
        field.id === id ? { ...field, [key]: value } : field
      )
    );
  };

  return (
    <div className='flex flex-col gap-3'>
      {label && (
        <label className='text-xs font-medium text-muted-foreground'>
          {label}
        </label>
      )}

      {fields.length > 0 && (
        <div className='flex flex-col gap-2'>
          {fields.map((field) => (
            <div key={field.id} className='flex gap-2'>
              <Input
                placeholder={labelPlaceholder}
                value={field.label}
                onChange={(e) => updateField(field.id, 'label', e.target.value)}
                className='flex-1'
              />
              <Input
                placeholder={valuePlaceholder}
                value={field.value}
                onChange={(e) => updateField(field.id, 'value', e.target.value)}
                className='flex-1'
              />
              <Button
                type='button'
                variant='outline'
                size='icon'
                onClick={() => removeField(field.id)}
                className='shrink-0'
              >
                <X className='h-4 w-4' />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button
        type='button'
        variant='outline'
        size='sm'
        onClick={addField}
        className='w-fit'
      >
        <Plus className='mr-2 h-4 w-4' />
        {addButtonText}
      </Button>
    </div>
  );
}
