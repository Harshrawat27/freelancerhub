import { z } from 'zod';

// Team Member Schema
export const teamMemberSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  role: z.string().min(1, 'Role is required').max(50, 'Role is too long'),
  photo: z.string().optional(),
  bio: z.string().max(500, 'Bio is too long').optional(),
});

export type TeamMemberFormData = z.infer<typeof teamMemberSchema>;

// Email validation
export const emailSchema = z.string().email('Invalid email address');

// Invoice Line Item Schema
export const invoiceLineItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  rate: z.number().min(0, 'Rate must be greater than or equal to 0'),
  amount: z.number(),
});

// Invoice Schema
export const invoiceSchema = z.object({
  // Business Information
  businessName: z.string().min(1, 'Business name is required'),
  businessEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  businessPhone: z.string().optional(),
  businessAddress: z.string().optional(),
  businessLogo: z.string().optional(),

  // Client Information
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  clientPhone: z.string().optional(),
  clientAddress: z.string().optional(),

  // Invoice Details
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  invoiceDate: z.string().min(1, 'Invoice date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  poNumber: z.string().optional(),

  // Line Items
  items: z.array(invoiceLineItemSchema).min(1, 'At least one item is required'),

  // Totals
  subtotal: z.number(),
  taxRate: z.number().min(0).max(100),
  taxAmount: z.number(),
  discount: z.number().min(0),
  total: z.number(),

  // Notes & Terms
  notes: z.string().optional(),
  terms: z.string().optional(),
});

export type InvoiceLineItem = z.infer<typeof invoiceLineItemSchema>;
export type InvoiceFormData = z.infer<typeof invoiceSchema>;

// Add more schemas here as needed for other forms
