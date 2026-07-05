"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail } from "lucide-react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  async function handleResendConfirmation() {
    if (!email) return;
    setResending(true);
    setError(null);
    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${appUrl}/login`,
      },
    });
    setResending(false);
    if (resendError) {
      setError(resendError.message);
      return;
    }
    setInfo("Đã gửi lại email xác nhận. Kiểm tra hộp thư (cả spam).");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    setNeedsConfirmation(false);

    const supabase = createClient();

    try {
      if (mode === "register") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${appUrl}/login`,
          },
        });
        if (signUpError) throw signUpError;

        if (data.user && !data.session) {
          setNeedsConfirmation(true);
          setInfo(
            "Tài khoản đã tạo. Vui lòng xác nhận email trước khi đăng nhập."
          );
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          if (signInError.message.toLowerCase().includes("email not confirmed")) {
            setNeedsConfirmation(true);
            throw new Error(
              "Email chưa được xác nhận. Kiểm tra hộp thư hoặc bấm gửi lại bên dưới."
            );
          }
          throw signInError;
        }
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="glass-panel w-full max-w-md rounded-[2rem] p-8 md:p-10"
    >
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-primary">
          Personal OS
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight text-foreground">
          {mode === "login" ? "Welcome back" : "Create your space"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "login"
            ? "Sign in to manage your daily life in one place."
            : "Start tracking expenses, tasks, and events from day one."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" ? (
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Minh Quan"
              required
            />
          </div>
        ) : null}

        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            minLength={8}
            required
          />
        </div>

        {info ? (
          <p className="rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary">
            {info}
          </p>
        ) : null}

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}

        {needsConfirmation ? (
          <Button
            type="button"
            variant="outline"
            className="w-full border-white/10"
            onClick={handleResendConfirmation}
            disabled={resending || !email}
          >
            {resending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Mail className="size-4" />
            )}
            Gửi lại email xác nhận
          </Button>
        ) : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          {mode === "login" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "login" ? "No account yet?" : "Already have an account?"}{" "}
        <Link
          href={mode === "login" ? "/register" : "/login"}
          className="text-primary hover:underline"
        >
          {mode === "login" ? "Register" : "Sign in"}
        </Link>
      </p>
    </motion.div>
  );
}
