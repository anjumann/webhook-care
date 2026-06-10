import { NextRequest } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { createMagicLink } from "@/services/auth";
import { ok, badRequest, failFromError, tooManyRequests } from "@/lib/http";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { resolveOrigin } from "@/lib/app-url";

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_KEY);

const schema = z.object({
  email: z.string().email(),
  userId: z.string().min(1),
});

/**
 * Send a magic link to claim / sign in to a dashboard. Always returns a uniform
 * 200 (never reveals whether an email exists) and never blocks the response on
 * the send result beyond logging.
 */
export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return badRequest("A valid email is required");

    const { email, userId } = parsed.data;

    // Throttle per IP and per email to stop enumeration / link spam. A 429
    // reveals nothing about whether the email exists.
    const [ipGate, emailGate] = await Promise.all([
      rateLimit("magicLink", `ip:${clientIp(request)}`),
      rateLimit("magicLink", `email:${email.toLowerCase()}`),
    ]);
    if (!ipGate.success || !emailGate.success) {
      return tooManyRequests("Too many sign-in attempts. Please try again later.");
    }

    const token = await createMagicLink(email, userId);
    const origin = resolveOrigin({
      configured: process.env.APP_URL,
      forwardedHost: request.headers.get("x-forwarded-host"),
      host: request.headers.get("host"),
      forwardedProto: request.headers.get("x-forwarded-proto"),
    });
    if (!origin) {
      // No APP_URL and no usable host header — refuse rather than email a
      // domain-less, unclickable link.
      console.error("Magic-link: could not resolve a public origin (set APP_URL).");
      return failFromError(new Error("Server misconfigured"), "Magic-link origin:");
    }
    const link = `${origin}/auth/verify?token=${encodeURIComponent(token)}`;

    const { error } = await resend.emails.send({
      from: "update@projext.in",
      to: [email],
      subject: "Your Webhook Catcher sign-in link",
      html: `
        <h2>Sign in to Webhook Catcher</h2>
        <p>Click the link below to access your dashboard. It expires in 15 minutes and can be used once.</p>
        <p><a href="${link}" style="display:inline-block;padding:10px 16px;background:#0b7a4b;color:#fff;border-radius:6px;text-decoration:none">Sign in</a></p>
        <p style="color:#666;font-size:12px">If you didn't request this, you can ignore this email.</p>
      `,
    });
    if (error) console.error("Magic-link email error:", error);

    // Uniform response regardless of outcome.
    return ok({ ok: true, message: "If that email is valid, a link is on its way." });
  } catch (error) {
    return failFromError(error, "Error sending magic link:");
  }
}
