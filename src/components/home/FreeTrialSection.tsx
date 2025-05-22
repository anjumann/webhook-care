"use client"

import GetStartedBtn from "@/home/get-started-btn";
import Image from "next/image";

export function FreeTrialSection() {
  return (
    <section className="container mx-auto px-4 py-16 flex flex-col md:flex-row items-center gap-10 md:gap-20">
      {/* Text Content */}
      <div className="flex-1 text-center md:text-left space-y-6">
        <h2 className="text-4xl md:text-5xl font-extrabold leading-tight">
          Start Testing Webhooks <span className="text-primary">for Free</span>
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto md:mx-0">
          Instantly create endpoints, inspect requests, <span className="text-primary font-semibold">forward webhooks to multiple destinations</span>, and debug with ease. No credit card required. Experience the fastest way to build and test your webhook workflows.
        </p>
        <div className="flex justify-center md:justify-start mt-6">
          <GetStartedBtn />
        </div>
      </div>
      {/* Image */}
      <div className="flex-1 flex justify-center">
        <div className="relative rounded-xl overflow-hidden shadow-lg aspect-[3/4] w-full max-w-xs md:max-w-sm">
          <Image
            src="/avatar/jinwoo.jpg"
            alt="Webhook Care Demo"
            fill
            sizes="(max-width: 768px) 80vw, 30vw"
            priority
            className="object-cover rounded-xl"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <div className="text-white">
              <p className="text-xs opacity-80">Webhook Care</p>
              <h4 className="text-lg font-semibold">Testing Made Simple</h4>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 