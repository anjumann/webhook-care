import Image from "next/image";
import React from "react";

export default function Footer() {
  return (
    <footer className="w-full border-t mt-8 py-6 text-center text-sm text-gray-500 bg-white dark:bg-gray-900 dark:text-gray-400">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
        <span>
          &copy; {new Date().getFullYear()} Webhook Care. All rights reserved.
        </span>
        <div className="flex items-center gap-4">
          <span>
            <a href="https://github.com/anjumann/webhook-care" className="underline" target="_blank" rel="noopener noreferrer">GitHub</a>
          </span>
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
    </footer>
  );
} 