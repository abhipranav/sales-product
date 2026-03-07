import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";

type AuthenticatedRequest = NextRequest & {
  auth?: {
    user?: {
      email?: string | null;
      name?: string | null;
    };
  };
};

function isPublicApiRoute(pathname: string): boolean {
  return pathname === "/api/auth" || pathname.startsWith("/api/auth/");
}

function buildCallbackUrl(pathname: string, search: string): string {
  return `${pathname}${search || ""}`;
}

export default auth(async function middleware(request) {
  const authRequest = request as AuthenticatedRequest;
  const { pathname, search } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");

  if (isPublicApiRoute(pathname)) {
    return NextResponse.next();
  }

  const actorEmail = typeof authRequest.auth?.user?.email === "string" ? authRequest.auth.user.email.trim().toLowerCase() : "";

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

  const actorName = typeof authRequest.auth?.user?.name === "string" ? authRequest.auth.user.name.trim() : "";
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
});

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
