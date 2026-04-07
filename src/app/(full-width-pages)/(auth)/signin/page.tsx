import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ACETRACK | Sign In",
  description: "This is the Sign In page for ACETRACK",
};

export default function SignIn() {
  return <SignInForm />;
}
