import { createCheckoutSession } from "@/lib/dodo-payment";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(req: Request) {
  const { productId } = await req.json();

  const incomingHeaders = await headers();
  const session = await auth.api.getSession({
    headers: new Headers(incomingHeaders),
  });

  if (!session || !session.user || !session.user.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = session.user;

  if (!productId) {
    return new NextResponse("Product ID is required", { status: 400 });
  }

  try {
    const checkoutSession = await createCheckoutSession(
      productId,
      user.email!,
      user.id,
      user.name || undefined
    );
    return NextResponse.json({ url: checkoutSession.checkout_url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
