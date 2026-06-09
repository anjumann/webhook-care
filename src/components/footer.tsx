import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-border mt-8 py-8 text-sm text-dim bg-background">
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
          {/* Company */}
          <div>
            <h4 className="font-semibold mb-3 text-foreground">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/about-us" className="transition-colors hover:text-foreground">About Us</Link></li>
              <li><Link href="/contact-us" className="transition-colors hover:text-foreground">Contact</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-3 text-foreground">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/privacy-policy" className="transition-colors hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href="/terms-and-conditions" className="transition-colors hover:text-foreground">Terms & Conditions</Link></li>
              <li><Link href="/refund-policy" className="transition-colors hover:text-foreground">Refund Policy</Link></li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-semibold mb-3 text-foreground">Connect</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://www.producthunt.com/posts/webhook-catcher?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-webhook-catcher"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  Product Hunt
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between">
          <span>
            &copy; {new Date().getFullYear()} Webhook Care. All rights reserved.
          </span>
          
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <a
              href="https://www.producthunt.com/posts/webhook-catcher?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-webhook-catcher"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src={`https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=970283&theme=dark&t=1748547517762`}
                alt="Webhook Catcher - Create instant disposable Webhooks to inspect & respond fast | Product Hunt"
                width={150}
                height={24}
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
} 