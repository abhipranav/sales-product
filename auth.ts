import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import LinkedIn from "next-auth/providers/linkedin";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { AUTH_SECRET } from "@/lib/auth/secret";

export interface AuthProviderCard {
  id: string;
  label: string;
  description: string;
  kind: "oauth" | "credentials";
}

const providerCards: AuthProviderCard[] = [];
const providers: NonNullable<NextAuthConfig["providers"]> = [];

const googleClientId = process.env.AUTH_GOOGLE_ID?.trim();
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET?.trim();
if (googleClientId && googleClientSecret) {
  providers.push(
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret
    })
  );
  providerCards.push({
    id: "google",
    label: "Continue with Google",
    description: "Use your Google identity.",
    kind: "oauth"
  });
}

const linkedInClientId = process.env.AUTH_LINKEDIN_ID?.trim();
const linkedInClientSecret = process.env.AUTH_LINKEDIN_SECRET?.trim();
if (linkedInClientId && linkedInClientSecret) {
  providers.push(
    LinkedIn({
      clientId: linkedInClientId,
      clientSecret: linkedInClientSecret
    })
  );
  providerCards.push({
    id: "linkedin",
    label: "Continue with LinkedIn",
    description: "Use LinkedIn OAuth for sales teams.",
    kind: "oauth"
  });
}

const allowDevCredentials =
  process.env.APP_ENABLE_DEV_LOGIN === "1" || (process.env.NODE_ENV !== "production" && providers.length === 0);

const credentialsSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(2).max(80).optional()
});

if (allowDevCredentials) {
  providers.push(
    Credentials({
      id: "credentials",
      name: "Developer Login",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@company.com" },
        name: { label: "Name", type: "text", placeholder: "Your name" }
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) {
          return null;
        }

        const email = parsed.data.email.trim().toLowerCase();
        const fallbackName = email.split("@")[0].replace(/[._-]+/g, " ");
        const name = parsed.data.name?.trim() || fallbackName;

        return {
          id: email,
          email,
          name
        };
      }
    })
  );
  providerCards.push({
    id: "credentials",
    label: "Developer Login",
    description: "Email-based local login for dev/testing.",
    kind: "credentials"
  });
}

function sanitizeRedirectUrl(url: string, baseUrl: string): string {
  if (url.startsWith("/")) {
    return `${baseUrl}${url}`;
  }

  try {
    const parsed = new URL(url);
    if (parsed.origin === baseUrl) {
      return url;
    }
  } catch {
    // Invalid redirect target falls back to workspace.
  }

  return `${baseUrl}/workspace`;
}

const config: NextAuthConfig = {
  providers,
  secret: AUTH_SECRET,
  pages: {
    signIn: "/auth/signin"
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30
  },
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email.toLowerCase();
      }
      if (user?.name) {
        token.name = user.name;
      }
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (!session.user) {
        return session;
      }

      if (typeof token.email === "string") {
        session.user.email = token.email.toLowerCase();
      }
      if (typeof token.name === "string" && token.name.length > 0) {
        session.user.name = token.name;
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      return sanitizeRedirectUrl(url, baseUrl);
    }
  }
};

export const authProviderCards = providerCards;
export const { handlers, auth, signIn, signOut } = NextAuth(config);
