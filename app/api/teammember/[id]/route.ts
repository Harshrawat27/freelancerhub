import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';

// GET - Get a single team member by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const incomingHeaders = await headers();
    const session = await auth.api.getSession({
      headers: new Headers(incomingHeaders),
    });

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized or user ID missing' },
        { status: 401 }
      );
    }

    const teamMember = await prisma.teamMember.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(teamMember, { status: 200 });
  } catch (error) {
    console.error('Error fetching team member:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team member' },
      { status: 500 }
    );
  }
}

// PATCH - Update a team member
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body));

    const incomingHeaders = await headers();
    const session = await auth.api.getSession({
      headers: new Headers(incomingHeaders),
    });

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized or user ID missing' },
        { status: 401 }
      );
    }

    // Check if team member exists and belongs to this user
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingMember) {
      return NextResponse.json(
        {
          error:
            'Team member not found or you do not have permission to update it',
        },
        { status: 404 }
      );
    }

    // Validate email uniqueness if email is being updated
    const { name, email, role, photo, bio } = body;

    if (email && email !== existingMember.email) {
      const emailExists = await prisma.teamMember.findUnique({
        where: { email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'A team member with this email already exists' },
          { status: 409 }
        );
      }
    }

    // Update the team member
    const updatedMember = await prisma.teamMember.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role }),
        ...(photo !== undefined && { photo: photo || null }),
        ...(bio !== undefined && { bio: bio || null }),
      },
    });

    return NextResponse.json(updatedMember, { status: 200 });
  } catch (error) {
    console.error('Error updating team member:', error);
    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 }
    );
  }
}
