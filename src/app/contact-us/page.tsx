import { APP_NAME } from "@/constant/app-constant";
import ContactUsClient from "./contact-us-client";

export const metadata = {
  title: `Contact Us - ${APP_NAME}`,
  description: `Get in touch with the ${APP_NAME} team. We're here to help with questions, support, and feedback.`,
};

export default function ContactUsPage() {
  return <ContactUsClient />;
}
