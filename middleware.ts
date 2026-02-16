import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { AUTH_SECRET } from "@/lib/auth/secret";

function isPublicApiRoute(pathname: string): boolean {
  return pathname === "/api/auth" || pathname.startsWith("/api/auth/");
}

function buildCallbackUrl(pathname: string, search: string): string {
  return `${pathname}${search || ""}`;
}

export default async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");

  if (isPublicApiRoute(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: AUTH_SECRET });
  const actorEmail = typeof token?.email === "string" ? token.email.trim().toLowerCase() : "";

  if (!actorEmail) {
    if (isApi) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const signInUrl = new URL("/auth/signin", request.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", buildCallbackUrl(pathname, search));
    return NextResponse.redirect(signInUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-actor-email", actorEmail);

  const actorName = typeof token?.name === "string" ? token.name.trim() : "";
  if (actorName) {
    requestHeaders.set("x-actor-name", actorName);
  } else {
    requestHeaders.delete("x-actor-name");
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });
}

export const config = {
  matcher: [
    "/workspace/:path*",
    "/cockpit/:path*",
    "/accounts/:path*",
    "/contacts/:path*",
    "/pipeline/:path*",
    "/intelligence/:path*",
    "/notifications/:path*",
    "/integrations/:path*",
    "/workflows/:path*",
    "/activities/:path*",
    "/settings/:path*",
    "/setup/:path*",
    "/api/:path*"
  ]
};
