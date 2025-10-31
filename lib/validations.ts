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

// Add more schemas here as needed for other forms
