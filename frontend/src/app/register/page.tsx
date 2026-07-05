import { AuthForm } from "@/components/auth/auth-form";

export default function RegisterPage() {
  return (
    <div className="noise-overlay relative flex min-h-[100dvh] items-center justify-center px-4 py-12">
      <AuthForm mode="register" />
    </div>
  );
}
