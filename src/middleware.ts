import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow the login endpoint through without auth
  if (pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  // All other /api/admin/* routes require a valid JWT
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { message: "Unauthorized — no token provided" },
      { status: 401 },
    );
  }

  const token = authHeader.slice(7);
  const payload = await verifyToken(token);

  if (!payload) {
    return NextResponse.json(
      { message: "Unauthorized — invalid or expired token" },
      { status: 401 },
    );
  }

  // Forward the admin email to downstream handlers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-admin-email", payload.email);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: "/api/admin/:path*",
};
