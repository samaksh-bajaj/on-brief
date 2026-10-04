import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const signedInOnly = ["/check", "/rule-sets", "/settings"];
const signedOutOnly = ["/", "/login", "/signup"];

const matches = (pathname: string, prefixes: string[]) =>
  prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

// Keeps the session cookie fresh and sends people to the right side of the
// sign-in wall. Pages and server functions still check the user themselves.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Ask the auth server, not just the cookie: a deleted account can still hold
  // a valid-looking token, and trusting it here while the pages reject it
  // sends the browser round in a redirect loop.
  const { data } = await supabase.auth.getUser();
  const signedIn = Boolean(data.user);
  const { pathname } = request.nextUrl;

  const redirectTo = (path: string) => {
    const redirect = NextResponse.redirect(new URL(path, request.url));
    for (const cookie of response.cookies.getAll()) {
      redirect.cookies.set(cookie);
    }
    return redirect;
  };

  if (!signedIn && matches(pathname, signedInOnly)) return redirectTo("/login");
  if (signedIn && signedOutOnly.includes(pathname)) return redirectTo("/check");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
