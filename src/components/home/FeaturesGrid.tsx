"use client";
import { BarChart2, List, ClipboardCopy, Eye, RefreshCcw, AlertCircle, UserCircle2, FlaskConical } from "lucide-react";
import { motion } from "framer-motion";
import { Highlight } from "@/components/ui/Highlight";

const features = [
  {
    title: "Smooth & Responsive UI",
    description: <>Work efficiently with a <Highlight>modern interface</Highlight> that&rsquo;s intuitive on any device, providing clear feedback and smooth transitions.</>,
    icon: Eye
  },
  {
    title: "Instant Insight with Real-Time Metrics",
    description: <>Track request counts, success rates, and response times per endpoint. <Highlight>Know what&lsquo;s happening, as it happens</Highlight>.</>,
    icon: BarChart2
  },
  {
    title: "Integrated Webhook Playground",
    description: <>Test and debug directly within the app. Send custom payloads, tweak headers, and <Highlight>see responses instantly</Highlight>—no context switching.</>,
    icon: FlaskConical
  },
  {
    title: "Comprehensive Request History",
    description: <><Highlight>Never miss a detail</Highlight>. Access complete logs for every request, including full payloads and responses, for thorough debugging.</>,
    icon: List
  },
  {
    title: "One-Click Copy for Faster Setup",
    description: <>Grab webhook URLs and <Highlight>ready-to-use cURL commands</Highlight> with a single click. Speed up your integration workflow.</>,
    icon: ClipboardCopy
  },
  {
    title: "Always Up-to-Date",
    description: <>Get the latest data and logs with <Highlight>instant refresh</Highlight>, ensuring you&apos;re always seeing the current state.</>,
    icon: RefreshCcw
  },
  {
    title: "Clear & Consistent Error Handling",
    description: <><Highlight>Understand issues quickly</Highlight> with straightforward error messages for all UI actions and API calls.</>,
    icon: AlertCircle
  },
  {
    title: "Tailor it To Your Needs",
    description: <>Personalize your dashboard and manage your settings for a <Highlight>workflow that fits you perfectly</Highlight>.</>,
    icon: UserCircle2
  }
];

const sectionVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15 // Adjusted stagger for grid
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export function FeaturesGrid() {
  return (
    <motion.section 
      className="py-24 px-2"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={sectionVariants} // Apply to section for overall animation, or directly to grid div if only grid staggers
    >
      <div className="container mx-auto px-4">
        <motion.h2 
          className="text-3xl font-bold text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Highlight>Developer Experience</Highlight> <br className="md:hidden" /> at the Core
        </motion.h2>
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={sectionVariants} // This div will be the container for staggering items
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index} 
              className="flex flex-col items-start gap-4"
              variants={itemVariants}
            >
              <div className="p-3 rounded-lg bg-muted">
                <feature.icon className="w-6 h-6" /> {/* Icons are not green here, can add text-green-500 if desired */}
              </div>
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
} 