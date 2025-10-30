import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';

// GET - List all team members for the logged-in user
export async function GET() {
  try {
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

    const teamMembers = await prisma.teamMember.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(teamMembers, { status: 200 });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

// POST - Create a new team member
export async function POST(request: Request) {
  try {
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

    // Validate required fields
    const { name, email, role, photo, bio } = body;

    if (!name || !email || !role) {
      return NextResponse.json(
        {
          error: 'Missing required fields: name, email, and role are required',
        },
        { status: 400 }
      );
    }

    // Check if team member with this email already exists
    const existingMember = await prisma.teamMember.findUnique({
      where: { email },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'A team member with this email already exists' },
        { status: 409 }
      );
    }

    // Create the team member
    const teamMember = await prisma.teamMember.create({
      data: {
        name,
        email,
        role,
        photo: photo || null,
        bio: bio || null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(teamMember, { status: 201 });
  } catch (error) {
    console.error('Error creating team member:', error);
    return NextResponse.json(
      { error: 'Failed to create team member' },
      { status: 500 }
    );
  }
}
