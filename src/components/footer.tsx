import React from "react";

export default function Footer() {
  return (
    <footer className="w-full border-t mt-8 py-6 text-center text-sm text-gray-500 bg-white dark:bg-gray-900 dark:text-gray-400">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
        <span>
          &copy; {new Date().getFullYear()} Webhook Care. All rights reserved.
        </span>
       
        <span>
          <a href="https://github.com/anjumann/webhook-care" className="underline" target="_blank" rel="noopener noreferrer">GitHub</a>
        </span>
        <span>
          <a href="https://www.producthunt.com/posts/webhook-catcher" className="underline" target="_blank" >Product Hunt</a>
        </span>
      </div>
    </footer>
  );
} 