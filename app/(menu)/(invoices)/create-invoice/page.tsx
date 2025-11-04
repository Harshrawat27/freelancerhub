'use client';

import { Sidebar } from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  invoiceSchema,
  type InvoiceFormData,
  type InvoiceLineItem,
} from '@/lib/validations';
import dynamic from 'next/dynamic';
import { DatePicker } from '@/components/DatePicker';

// Dynamically import InvoicePreview with no SSR to avoid DOMMatrix error
const InvoicePreview = dynamic(() => import('@/components/InvoicePreview'), {
  ssr: false,
  loading: () => (
    <div className='flex h-full w-full items-center justify-center'>
      <div className='text-center'>
        <div className='mb-2 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary mx-auto'></div>
        <p className='text-sm text-gray-500'>Loading preview...</p>
      </div>
    </div>
  ),
});

export default function CreateInvoice() {
  const [invoiceData, setInvoiceData] = useState<InvoiceFormData>({
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    businessAddress: '',
    businessLogo: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    invoiceNumber: `INV-${Date.now()}`,
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    poNumber: '',
    items: [
      {
        id: '1',
        description: '',
        quantity: 1,
        rate: 0,
        amount: 0,
      },
    ],
    subtotal: 0,
    taxRate: 0,
    taxAmount: 0,
    discount: 0,
    total: 0,
  });

  // Calculate totals
  const calculateTotals = (
    items: InvoiceLineItem[],
    taxRate: number,
    discount: number
  ) => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount - discount;
    return { subtotal, taxAmount, total };
  };

  // Update invoice data
  const updateInvoiceData = (field: keyof InvoiceFormData, value: any) => {
    setInvoiceData((prev) => {
      const updated = { ...prev, [field]: value };

      // Recalculate totals if items, taxRate, or discount changes
      if (field === 'items' || field === 'taxRate' || field === 'discount') {
        const { subtotal, taxAmount, total } = calculateTotals(
          field === 'items' ? value : updated.items,
          field === 'taxRate' ? value : updated.taxRate,
          field === 'discount' ? value : updated.discount
        );
        updated.subtotal = subtotal;
        updated.taxAmount = taxAmount;
        updated.total = total;
      }

      return updated;
    });
  };

  // Add new line item
  const addLineItem = () => {
    const newItem: InvoiceLineItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0,
    };
    updateInvoiceData('items', [...invoiceData.items, newItem]);
  };

  // Remove line item
  const removeLineItem = (id: string) => {
    if (invoiceData.items.length === 1) {
      toast.error('At least one item is required');
      return;
    }
    updateInvoiceData(
      'items',
      invoiceData.items.filter((item) => item.id !== id)
    );
  };

  // Update line item
  const updateLineItem = (
    id: string,
    field: keyof InvoiceLineItem,
    value: any
  ) => {
    const updatedItems = invoiceData.items.map((item) => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Recalculate amount
        if (field === 'quantity' || field === 'rate') {
          updated.amount = updated.quantity * updated.rate;
        }
        return updated;
      }
      return item;
    });
    updateInvoiceData('items', updatedItems);
  };

  // Download as PDF (placeholder for now)
  const downloadPDF = () => {
    // Validate first
    try {
      invoiceSchema.parse(invoiceData);
      toast.success('Validation passed! PDF download will be implemented');
      // TODO: Implement PDF generation
    } catch (error: any) {
      toast.error(
        error.errors?.[0]?.message || 'Please fill in all required fields'
      );
    }
  };

  return (
    <div className='min-h-screen bg-background transition-colors duration-300'>
      <Sidebar />
      <main className='ml-[270px] p-6 flex flex-col min-h-screen max-h-screen'>
        <Topbar pageName='Create Invoice' />

        <div className='mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5 grow h-[calc(100vh-110px)]'>
          {/* Left Side - Form with Accordions */}
          <div className='flex flex-col gap-4 overflow-auto hide-scrollbar px-1'>
            <div className='rounded-lg flex flex-col pb-6'>
              <h2 className='font-heading text-xl font-bold text-foreground mb-4'>
                Invoice Details
              </h2>

              <Accordion
                type='single'
                collapsible
                defaultValue='business'
                className='space-y-2 py-2'
              >
                {/* Business Information */}
                <AccordionItem
                  value='business'
                  className='border border-border rounded-lg px-3 bg-background/50'
                >
                  <AccordionTrigger className='hover:no-underline'>
                    <span className='font-medium text-foreground'>
                      Business Information
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className='space-y-4 pt-4 px-1'>
                    <div>
                      <label className='text-xs font-medium text-muted-foreground mb-1 block'>
                        Business Name <span className='text-red-500'>*</span>
                      </label>
                      <Input
                        value={invoiceData.businessName}
                        onChange={(e) =>
                          updateInvoiceData('businessName', e.target.value)
                        }
                        placeholder='Your Business Name'
                        className='text-sm'
                      />
                    </div>
                    <div>
                      <label className='text-xs font-medium text-muted-foreground mb-1 block'>
                        Email
                      </label>
                      <Input
                        type='email'
                        value={invoiceData.businessEmail}
                        onChange={(e) =>
                          updateInvoiceData('businessEmail', e.target.value)
                        }
                        placeholder='business@example.com'
                        className='text-sm'
                      />
                    </div>
                    <div>
                      <label className='text-xs font-medium text-muted-foreground mb-1 block'>
                        Phone
                      </label>
                      <Input
                        value={invoiceData.businessPhone}
                        onChange={(e) =>
                          updateInvoiceData('businessPhone', e.target.value)
                        }
                        placeholder='+1 (555) 000-0000'
                        className='text-sm'
                      />
                    </div>
                    <div>
                      <label className='text-xs font-medium text-muted-foreground mb-1 block'>
                        Address
                      </label>
                      <Textarea
                        value={invoiceData.businessAddress}
                        onChange={(e) =>
                          updateInvoiceData('businessAddress', e.target.value)
                        }
                        placeholder='123 Business St, City, State, ZIP'
                        className='text-sm resize-none'
                        rows={3}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Client Information */}
                <AccordionItem
                  value='client'
                  className='border border-border rounded-lg px-3 bg-background/50'
                >
                  <AccordionTrigger className='hover:no-underline'>
                    <span className='font-medium text-foreground'>
                      Client Information
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className='space-y-4 pt-4 px-1'>
                    <div>
                      <label className='text-xs font-medium text-muted-foreground mb-1 block'>
                        Client Name <span className='text-red-500'>*</span>
                      </label>
                      <Input
                        value={invoiceData.clientName}
                        onChange={(e) =>
                          updateInvoiceData('clientName', e.target.value)
                        }
                        placeholder='Client Name'
                        className='text-sm'
                      />
                    </div>
                    <div>
                      <label className='text-xs font-medium text-muted-foreground mb-1 block'>
                        Email
                      </label>
                      <Input
                        type='email'
                        value={invoiceData.clientEmail}
                        onChange={(e) =>
                          updateInvoiceData('clientEmail', e.target.value)
                        }
                        placeholder='client@example.com'
                        className='text-sm'
                      />
                    </div>
                    <div>
                      <label className='text-xs font-medium text-muted-foreground mb-1 block'>
                        Phone
                      </label>
                      <Input
                        value={invoiceData.clientPhone}
                        onChange={(e) =>
                          updateInvoiceData('clientPhone', e.target.value)
                        }
                        placeholder='+1 (555) 000-0000'
                        className='text-sm'
                      />
                    </div>
                    <div>
                      <label className='text-xs font-medium text-muted-foreground mb-1 block'>
                        Address
                      </label>
                      <Textarea
                        value={invoiceData.clientAddress}
                        onChange={(e) =>
                          updateInvoiceData('clientAddress', e.target.value)
                        }
                        placeholder='123 Client St, City, State, ZIP'
                        className='text-sm resize-none'
                        rows={3}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Invoice Details */}
                <AccordionItem
                  value='details'
                  className='border border-border rounded-lg px-3 bg-background/50'
                >
                  <AccordionTrigger className='hover:no-underline'>
                    <span className='font-medium text-foreground'>
                      Invoice Details
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className='space-y-4 pt-4 px-1'>
                    <div>
                      <label className='text-xs font-medium text-muted-foreground mb-1 block'>
                        Invoice Number <span className='text-red-500'>*</span>
                      </label>
                      <Input
                        value={invoiceData.invoiceNumber}
                        onChange={(e) =>
                          updateInvoiceData('invoiceNumber', e.target.value)
                        }
                        placeholder='INV-001'
                        className='text-sm'
                      />
                    </div>
                    <div className='grid grid-cols-2 gap-4'>
                      <DatePicker
                        label={
                          <>
                            Invoice Date <span className='text-red-500'>*</span>
                          </>
                        }
                        value={invoiceData.invoiceDate}
                        onChange={(date) => updateInvoiceData('invoiceDate', date)}
                        placeholder='Select invoice date'
                        id='invoiceDate'
                      />
                      <DatePicker
                        label={
                          <>
                            Due Date <span className='text-red-500'>*</span>
                          </>
                        }
                        value={invoiceData.dueDate}
                        onChange={(date) => updateInvoiceData('dueDate', date)}
                        placeholder='Select due date'
                        id='dueDate'
                      />
                    </div>
                    <div>
                      <label className='text-xs font-medium text-muted-foreground mb-1 block'>
                        PO Number (Optional)
                      </label>
                      <Input
                        value={invoiceData.poNumber}
                        onChange={(e) =>
                          updateInvoiceData('poNumber', e.target.value)
                        }
                        placeholder='PO-001'
                        className='text-sm'
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Line Items */}
                <AccordionItem
                  value='items'
                  className='border border-border rounded-lg px-4 bg-background/50'
                >
                  <AccordionTrigger className='hover:no-underline'>
                    <span className='font-medium text-foreground'>
                      Line Items ({invoiceData.items.length})
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className='space-y-4 pt-4'>
                    {invoiceData.items.map((item, index) => (
                      <div
                        key={item.id}
                        className='p-3 border border-border rounded-lg bg-muted/30 space-y-3'
                      >
                        <div className='flex items-center justify-between'>
                          <span className='text-xs font-medium text-muted-foreground'>
                            Item {index + 1}
                          </span>
                          {invoiceData.items.length > 1 && (
                            <Button
                              onClick={() => removeLineItem(item.id)}
                              size='sm'
                              variant='ghost'
                              className='h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950'
                            >
                              <svg
                                className='w-4 h-4'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M6 18L18 6M6 6l12 12'
                                />
                              </svg>
                            </Button>
                          )}
                        </div>
                        <div>
                          <label className='text-xs font-medium text-muted-foreground mb-1 block'>
                            Description <span className='text-red-500'>*</span>
                          </label>
                          <Input
                            value={item.description}
                            onChange={(e) =>
                              updateLineItem(
                                item.id,
                                'description',
                                e.target.value
                              )
                            }
                            placeholder='Service or product description'
                            className='text-sm'
                          />
                        </div>
                        <div className='grid grid-cols-3 gap-2'>
                          <div>
                            <label className='text-xs font-medium text-muted-foreground mb-1 block'>
                              Qty
                            </label>
                            <Input
                              type='number'
                              min='0.01'
                              step='0.01'
                              value={item.quantity}
                              onChange={(e) =>
                                updateLineItem(
                                  item.id,
                                  'quantity',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className='text-sm'
                            />
                          </div>
                          <div>
                            <label className='text-xs font-medium text-muted-foreground mb-1 block'>
                              Rate
                            </label>
                            <Input
                              type='number'
                              min='0'
                              step='0.01'
                              value={item.rate}
                              onChange={(e) =>
                                updateLineItem(
                                  item.id,
                                  'rate',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className='text-sm'
                            />
                          </div>
                          <div>
                            <label className='text-xs font-medium text-muted-foreground mb-1 block'>
                              Amount
                            </label>
                            <Input
                              type='number'
                              value={item.amount.toFixed(2)}
                              readOnly
                              className='text-sm bg-muted'
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      onClick={addLineItem}
                      size='sm'
                      variant='outline'
                      className='w-full text-xs'
                    >
                      <svg
                        className='w-4 h-4 mr-1'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M12 4v16m8-8H4'
                        />
                      </svg>
                      Add Item
                    </Button>
                  </AccordionContent>
                </AccordionItem>

                {/* Payment & Notes */}
                <AccordionItem
                  value='payment'
                  className='border border-border rounded-lg px-3 bg-background/50'
                >
                  <AccordionTrigger className='hover:no-underline'>
                    <span className='font-medium text-foreground'>
                      Payment & Notes
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className='space-y-4 pt-4 px-1'>
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <label className='text-xs font-medium text-muted-foreground mb-1 block'>
                          Tax Rate (%)
                        </label>
                        <Input
                          type='number'
                          min='0'
                          max='100'
                          step='0.01'
                          value={invoiceData.taxRate}
                          onChange={(e) =>
                            updateInvoiceData(
                              'taxRate',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className='text-sm'
                        />
                      </div>
                      <div>
                        <label className='text-xs font-medium text-muted-foreground mb-1 block'>
                          Discount ($)
                        </label>
                        <Input
                          type='number'
                          min='0'
                          step='0.01'
                          value={invoiceData.discount}
                          onChange={(e) =>
                            updateInvoiceData(
                              'discount',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className='text-sm'
                        />
                      </div>
                    </div>
                    <div>
                      <label className='text-xs font-medium text-muted-foreground mb-1 block'>
                        Notes
                      </label>
                      <Textarea
                        value={invoiceData.notes}
                        onChange={(e) =>
                          updateInvoiceData('notes', e.target.value)
                        }
                        placeholder='Additional notes for the client'
                        className='text-sm resize-none'
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className='text-xs font-medium text-muted-foreground mb-1 block'>
                        Terms & Conditions
                      </label>
                      <Textarea
                        value={invoiceData.terms}
                        onChange={(e) =>
                          updateInvoiceData('terms', e.target.value)
                        }
                        placeholder='Payment terms and conditions'
                        className='text-sm resize-none'
                        rows={3}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          {/* Right Side - Invoice Preview */}
          <div className='flex flex-col gap-4 overflow-auto hide-scrollbar relative'>
            <div className='rounded-lg flex flex-col'>
              <div className='flex items-center justify-between pb-4 sticky top-0 z-10 bg-background'>
                <h2 className='font-heading text-xl font-bold text-foreground'>
                  Invoice Preview
                </h2>
                <Button
                  onClick={downloadPDF}
                  size='sm'
                  className='text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20'
                >
                  <svg
                    className='w-4 h-4 mr-1'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    />
                  </svg>
                  Download PDF
                </Button>
              </div>

              {/* Invoice Preview */}
              <div className='w-full h-full rounded-lg overflow-hidden bg-gray-100'>
                <InvoicePreview invoiceData={invoiceData} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
