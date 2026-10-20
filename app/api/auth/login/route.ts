import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validators";
import { verifyAdminCredentials, createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { checkRateLimit } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    // Rate limit: 5 attempts per 15 minutes (900 seconds) per IP
    const rateLimitKey = `login_limit:${ip}`;
    const rateLimit = await checkRateLimit(rateLimitKey, 5, 900);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait 15 minutes." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password, turnstileToken, honeypot } = result.data;

    // Bot protection: Reject if honeypot was filled
    if (honeypot && honeypot.length > 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 400 });
    }

    // Cloudflare Turnstile verification if secret key is configured
    if (process.env.TURNSTILE_SECRET_KEY && turnstileToken) {
      const verifyRes = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `secret=${encodeURIComponent(
            process.env.TURNSTILE_SECRET_KEY
          )}&response=${encodeURIComponent(turnstileToken)}&remoteip=${encodeURIComponent(
            ip
          )}`,
        }
      );
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        return NextResponse.json(
          { error: "Bot verification failed" },
          { status: 403 }
        );
      }
    }

    // Verify email matches configured admin email
    const configuredAdminEmail = process.env.ADMIN_EMAIL || "admin@cursedengine.internal";
    if (email.toLowerCase() !== configuredAdminEmail.toLowerCase()) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password hash
    const isValid = await verifyAdminCredentials(password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create session JWT token
    const token = await createSessionToken(email);

    const response = NextResponse.json({ success: true, email });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { error: "Authentication server error" },
      { status: 500 }
    );
  }
}
