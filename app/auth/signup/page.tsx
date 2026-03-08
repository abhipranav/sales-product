import type { Route } from "next";
import Link from "next/link";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { auth, authProviderCards, signIn } from "@/auth";

function normalizeCallbackUrl(value: string | undefined): string {
  if (!value) {
    return "/workspace/get-started";
  }

  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  return "/workspace/get-started";
}

function getErrorMessage(errorCode: string | undefined): string | null {
  if (!errorCode) {
    return null;
  }

  if (errorCode === "CredentialsSignin") {
    return "Account creation failed. Check your email and name and try again.";
  }

  if (errorCode === "OAuthAccountNotLinked") {
    return "This email is already linked to another provider. Use the original login method.";
  }

  if (errorCode === "AccessDenied") {
    return "Access was denied by the identity provider.";
  }

  return "Authentication failed. Please try again.";
}

async function signUpWithProvider(formData: FormData) {
  "use server";

  const provider = String(formData.get("provider") ?? "");
  const callbackParam = formData.get("callbackUrl");
  const callbackUrl = normalizeCallbackUrl(typeof callbackParam === "string" ? callbackParam : undefined);
  const allowed = authProviderCards.some((card) => card.kind === "oauth" && card.id === provider);

  if (!allowed) {
    redirect(`/auth/signup?error=AccessDenied&callbackUrl=${encodeURIComponent(callbackUrl)}` as Route);
  }

  await signIn(provider, { redirectTo: callbackUrl });
}

async function signUpWithCredentials(formData: FormData) {
  "use server";

  const callbackParam = formData.get("callbackUrl");
  const callbackUrl = normalizeCallbackUrl(typeof callbackParam === "string" ? callbackParam : undefined);
  const email = String(formData.get("email") ?? "");
  const name = String(formData.get("name") ?? "");

  try {
    await signIn("credentials", {
      email,
      name,
      redirectTo: callbackUrl
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/auth/signup?error=${encodeURIComponent(error.type)}&callbackUrl=${encodeURIComponent(callbackUrl)}` as Route);
    }

    throw error;
  }
}

interface SignUpPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const session = await auth().catch(() => null);

  if (session?.user?.email) {
    redirect("/workspace/get-started" as Route);
  }

  const params = await searchParams;
  const callbackParam = params.callbackUrl;
  const callbackUrl = normalizeCallbackUrl(typeof callbackParam === "string" ? callbackParam : undefined);
  const errorCode = typeof params.error === "string" ? params.error : undefined;
  const errorMessage = getErrorMessage(errorCode);

  const oauthProviders = authProviderCards.filter((provider) => provider.kind === "oauth");
  const hasCredentialsProvider = authProviderCards.some((provider) => provider.id === "credentials");

  return (
    <main className="min-h-screen ind-grid-bg">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-5 py-12 md:px-8">
        <section className="grid w-full gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="ind-card relative">
            <div className="absolute -top-3 -right-2 z-10">
              <span className="ind-badge">CREATE WORKSPACE ACCESS</span>
            </div>

            <p className="ind-label mb-4">VELOCITY_OS // SIGN_UP</p>
            <h1 className="font-serif text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-[hsl(var(--foreground))] md:text-[3.25rem]">
              Create your account
              <br />
              and start onboarding.
            </h1>
            <p className="mt-5 max-w-xl font-mono text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
              The first successful login sends you into guided setup, where you can create the first account, first
              contact, and first LinkedIn-assisted capture without touching production auth settings.
            </p>

            <div className="mt-8 space-y-3">
              {oauthProviders.map((provider) => (
                <form key={provider.id} action={signUpWithProvider}>
                  <input type="hidden" name="provider" value={provider.id} />
                  <input type="hidden" name="callbackUrl" value={callbackUrl} />
                  <button type="submit" className="ind-btn w-full justify-center">
                    {provider.id === "linkedin" ? "Create Account with LinkedIn" : provider.label.replace("Continue", "Create Account")}
                  </button>
                </form>
              ))}

              {oauthProviders.length === 0 ? (
                <div className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3">
                  <p className="ind-label">No OAuth provider configured yet</p>
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                    Add `AUTH_GOOGLE_*` or `AUTH_LINKEDIN_*` vars to enable production sign-up.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/" className="ind-btn-outline">
                ← Back to Landing
              </Link>
              <Link href="/auth/signin" className="ind-btn-outline">
                Already have an account?
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <div className="ind-card p-0 overflow-hidden">
              <div className="px-5 py-4">
                <p className="ind-label-lg">CUSTOMER ENTRY FLOW</p>
                <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                  Sign-up now leads directly into guided workspace bootstrap instead of dropping users into an empty shell.
                </p>
              </div>
              <div className="caution-stripe" />
            </div>

            {hasCredentialsProvider ? (
              <div className="ind-card-dashed">
                <p className="ind-label">Developer Sign-up</p>
                <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                  For local testing only. Disabled in production unless explicitly enabled.
                </p>

                <form action={signUpWithCredentials} className="mt-4 grid gap-3">
                  <input type="hidden" name="callbackUrl" value={callbackUrl} />
                  <label className="block">
                    <span className="ind-label">Email</span>
                    <input
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      className="mt-1 w-full border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--foreground))]"
                      placeholder="founder@company.com"
                    />
                  </label>

                  <label className="block">
                    <span className="ind-label">Display name</span>
                    <input
                      name="name"
                      type="text"
                      autoComplete="name"
                      className="mt-1 w-full border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--foreground))]"
                      placeholder="Founding Rep"
                    />
                  </label>

                  <button type="submit" className="ind-btn w-full justify-center">
                    Create Account with Developer Login
                  </button>
                </form>
              </div>
            ) : null}

            {errorMessage ? (
              <div className="border-[2px] border-[hsl(var(--destructive))] bg-[hsl(var(--destructive))/0.08] p-3">
                <p className="ind-label text-[hsl(var(--destructive))]">AUTH ERROR</p>
                <p className="mt-1 text-sm text-[hsl(var(--foreground))]">{errorMessage}</p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
