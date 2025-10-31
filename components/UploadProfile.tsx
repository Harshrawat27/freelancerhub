'use client';

import React, { useState } from 'react';
import { FileUploadValidation } from './FileUploadValidation';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { teamMemberSchema, type TeamMemberFormData } from '@/lib/validations';

const UploadProfile = () => {
  const [formData, setFormData] = useState<TeamMemberFormData>({
    name: '',
    email: '',
    role: '',
    bio: '',
    photo: '',
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof TeamMemberFormData, string>>
  >({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name as keyof TeamMemberFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Upload photo to R2 if provided
      let photoUrl = '';
      if (uploadedFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', uploadedFile);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadRes.ok) {
          throw new Error('Failed to upload photo');
        }

        const { url } = await uploadRes.json();
        photoUrl = url;
      }

      // Validate form data
      const validatedData = teamMemberSchema.parse({
        ...formData,
        photo: photoUrl || undefined,
      });

      // Submit to API
      const response = await fetch('/api/teammember', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create team member');
      }

      toast.success('Team member added successfully!');

      setFormData({ name: '', email: '', role: '', bio: '', photo: '' });

      // Reset form
      setFormData({ name: '', email: '', role: '', bio: '', photo: '' });
      setUploadedFile(null);
    } catch (error: any) {
      if (error.errors) {
        // Zod validation errors
        const fieldErrors: Partial<Record<keyof TeamMemberFormData, string>> =
          {};
        error.errors.forEach((err: any) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof TeamMemberFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast.error('Please fix the errors in the form');
      } else {
        toast.error(error.message || 'Failed to add team member');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div>
        <label className='block text-sm font-medium mb-2'>Profile Photo</label>
        <FileUploadValidation onFileChange={setUploadedFile} />
      </div>

      <div>
        <label htmlFor='name' className='block text-sm font-medium mb-2'>
          Name <span className='text-destructive'>*</span>
        </label>
        <Input
          id='name'
          name='name'
          value={formData.name}
          onChange={handleInputChange}
          placeholder='John Doe'
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className='text-destructive text-sm mt-1'>{errors.name}</p>
        )}
      </div>

      <div>
        <label htmlFor='email' className='block text-sm font-medium mb-2'>
          Email <span className='text-destructive'>*</span>
        </label>
        <Input
          id='email'
          name='email'
          type='email'
          value={formData.email}
          onChange={handleInputChange}
          placeholder='john@example.com'
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className='text-destructive text-sm mt-1'>{errors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor='role' className='block text-sm font-medium mb-2'>
          Role <span className='text-destructive'>*</span>
        </label>
        <Input
          id='role'
          name='role'
          value={formData.role}
          onChange={handleInputChange}
          placeholder='Designer'
          aria-invalid={!!errors.role}
        />
        {errors.role && (
          <p className='text-destructive text-sm mt-1'>{errors.role}</p>
        )}
      </div>

      <div>
        <label htmlFor='bio' className='block text-sm font-medium mb-2'>
          Bio
        </label>
        <Textarea
          id='bio'
          name='bio'
          value={formData.bio}
          onChange={handleInputChange}
          placeholder='Tell us about yourself...'
          aria-invalid={!!errors.bio}
        />
        {errors.bio && (
          <p className='text-destructive text-sm mt-1'>{errors.bio}</p>
        )}
      </div>

      <Button type='submit' disabled={isSubmitting} className='w-full'>
        {isSubmitting ? 'Adding Member...' : 'Add Member'}
      </Button>
    </form>
  );
};

export default UploadProfile;
