'use client';

import * as React from 'react';
import { CalendarSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  label?: React.ReactNode;
  value?: string; // ISO date string (YYYY-MM-DD)
  onChange?: (date: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function DatePicker({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  className,
  id,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Convert ISO string to Date object
  const dateValue = value ? new Date(value) : undefined;

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate && onChange) {
      // Convert to ISO string (YYYY-MM-DD)
      const isoDate = selectedDate.toISOString().split('T')[0];
      onChange(isoDate);
    }
    setOpen(false);
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && (
        <label htmlFor={id} className='text-xs font-medium text-muted-foreground'>
          {label}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            id={id}
            className='w-full justify-between font-normal text-sm h-10'
          >
            {dateValue ? dateValue.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }) : placeholder}
            <CalendarSearch className='h-4 w-4 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto overflow-hidden p-0' align='start'>
          <Calendar
            mode='single'
            selected={dateValue}
            onSelect={handleSelect}
            captionLayout='dropdown'
            fromYear={2020}
            toYear={2030}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Legacy export for backward compatibility
export function Calendar22() {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(undefined);

  return (
    <div className='flex flex-col gap-3'>
      <Label htmlFor='date' className='px-1'>
        Date of birth
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            id='date'
            className='w-48 justify-between font-normal'
          >
            {date ? date.toLocaleDateString() : 'Select date'}
            <CalendarSearch />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto overflow-hidden p-0' align='start'>
          <Calendar
            mode='single'
            selected={date}
            captionLayout='dropdown'
            onSelect={(date) => {
              setDate(date);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
