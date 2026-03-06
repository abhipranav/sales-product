const resolvedAuthSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

if (!resolvedAuthSecret && process.env.NODE_ENV === "production") {
  throw new Error("Missing AUTH_SECRET (or NEXTAUTH_SECRET) in production environment.");
}

export const AUTH_SECRET =
  resolvedAuthSecret ?? (process.env.NODE_ENV !== "production" ? "dev-only-auth-secret-change-me" : undefined);
