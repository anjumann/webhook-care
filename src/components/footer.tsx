import Image from "next/image";
import Link from "next/link";
import { Webhook } from "lucide-react";
import { APP_NAME } from "@/constant/app-constant";

const PRODUCT_HUNT_URL =
  "https://www.producthunt.com/posts/webhook-catcher?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-webhook-catcher";

const linkGroups = [
  {
    heading: "Company",
    links: [
      { label: "About Us", href: "/about-us" },
      { label: "Contact", href: "/contact-us" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms & Conditions", href: "/terms-and-conditions" },
      { label: "Refund Policy", href: "/refund-policy" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-border text-sm text-dim">
      {/* faint emerald rise so the page ends with light, not a hard edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(70% 100% at 50% 120%, var(--accent-soft), transparent 70%)",
        }}
      />
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex size-8 flex-none items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent2 text-accentfg">
                <Webhook className="size-4" strokeWidth={2.2} />
              </span>
              <span className="text-base font-bold text-foreground">{APP_NAME}</span>
            </Link>
            <p className="mt-3 max-w-xs">
              Catch, inspect, and forward webhooks. Free, no sign-up, 30-day
              history.
            </p>
          </div>

          {linkGroups.map((group) => (
            <div key={group.heading}>
              <h4 className="mb-3 font-semibold text-foreground">{group.heading}</h4>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Connect */}
          <div>
            <h4 className="mb-3 font-semibold text-foreground">Connect</h4>
            <a href={PRODUCT_HUNT_URL} target="_blank" rel="noopener noreferrer">
              <Image
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=970283&theme=dark&t=1748547517762"
                alt="Webhook Catcher on Product Hunt"
                width={150}
                height={24}
              />
            </a>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <span>
            &copy; {new Date().getFullYear()} Webhook Catcher. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
