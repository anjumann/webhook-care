import { APP_NAME } from "@/constant/app-constant";
import PricingClient from "./pricing-client";

export const metadata = {
  title: `Pricing - ${APP_NAME}`,
  description: `Simple and transparent pricing for ${APP_NAME}. Start free, upgrade to premium for AI-based analysis and platform integrations.`,
};

export default function PricingPage() {
  return <PricingClient />;
}
