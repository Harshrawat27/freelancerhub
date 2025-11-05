'use client';

import * as React from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BillingDetail } from '@/lib/validations';
import { getCurrencySymbol } from '@/lib/currencies';

interface BillingDetailsProps {
  label?: string;
  details: BillingDetail[];
  onChange: (details: BillingDetail[]) => void;
  subtotal: number;
  currency: string;
}

export function BillingDetails({
  label,
  details,
  onChange,
  subtotal,
  currency,
}: BillingDetailsProps) {
  const currencySymbol = getCurrencySymbol(currency);

  const addDetail = () => {
    const newDetail: BillingDetail = {
      id: `detail-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      label: '',
      type: 'fixed',
      value: 0,
    };
    onChange([...details, newDetail]);
  };

  const removeDetail = (id: string) => {
    onChange(details.filter((detail) => detail.id !== id));
  };

  const updateDetail = <K extends keyof BillingDetail>(
    id: string,
    key: K,
    value: BillingDetail[K]
  ) => {
    onChange(
      details.map((detail) =>
        detail.id === id ? { ...detail, [key]: value } : detail
      )
    );
  };

  const calculateAmount = (detail: BillingDetail): number => {
    if (detail.type === 'percentage') {
      return (subtotal * detail.value) / 100;
    }
    return detail.value;
  };

  return (
    <div className='flex flex-col gap-3'>
      {label && (
        <label className='text-xs font-medium text-muted-foreground'>
          {label}
        </label>
      )}

      {details.length > 0 && (
        <div className='flex flex-col gap-2'>
          {details.map((detail) => (
            <div key={detail.id} className='flex gap-2 items-start'>
              <Input
                placeholder='Label (e.g., Tax, Discount)'
                value={detail.label}
                onChange={(e) => updateDetail(detail.id, 'label', e.target.value)}
                className='flex-1'
              />
              <Select
                value={detail.type}
                onValueChange={(value: 'fixed' | 'percentage') =>
                  updateDetail(detail.id, 'type', value)
                }
              >
                <SelectTrigger className='w-[130px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='fixed'>Fixed</SelectItem>
                  <SelectItem value='percentage'>Percentage</SelectItem>
                </SelectContent>
              </Select>
              <div className='flex-1 flex gap-2 items-center'>
                <Input
                  type='number'
                  step='0.01'
                  placeholder={detail.type === 'percentage' ? '%' : currencySymbol}
                  value={detail.value || ''}
                  onChange={(e) =>
                    updateDetail(detail.id, 'value', parseFloat(e.target.value) || 0)
                  }
                  className='flex-1'
                />
                <span className='text-sm text-muted-foreground min-w-[80px] text-right'>
                  {currencySymbol}
                  {calculateAmount(detail).toFixed(2)}
                </span>
              </div>
              <Button
                type='button'
                variant='outline'
                size='icon'
                onClick={() => removeDetail(detail.id)}
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
        onClick={addDetail}
        className='w-fit'
      >
        <Plus className='mr-2 h-4 w-4' />
        Add Billing Detail
      </Button>
    </div>
  );
}
