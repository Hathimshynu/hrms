// src/components/auth/LoginForm.tsx
"use client";

import {
  Animated,
  StaggerContainer,
  StaggerItem,
} from "@/src/components/ui/Animated";
import { Button } from "@/src/components/ui/Button";
import { FormCheckbox } from "@/src/components/ui/FormCheckbox";
import { Input } from "@/src/components/ui/Input";
import { useAuth } from "@/src/hooks/useAuth";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export function LoginForm() {
  const { login, isLoading, error } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError("");

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setFieldError("Enter a valid email address");
      return;
    }
    if (password.length < 6) {
      setFieldError("Password must be at least 6 characters");
      return;
    }
    router.push("/dashboard");

    try {
      // await login({ email, password });
      // Redirect to dashboard on successful login
      router.push("/dashboard");
    } catch {
      // error already surfaced via the store
    }
  };

  // If forgot password is active, show the forgot password form
  if (showForgotPassword) {
    return (
      <Animated type="form" direction="left" animationKey="forgot-password">
        <ForgotPasswordForm
          onBackToLogin={() => setShowForgotPassword(false)}
        />
      </Animated>
    );
  }

  return (
    <Animated type="form" direction="right" animationKey="login-form">
      <form onSubmit={onSubmit} className="w-full space-y-5">
        {(error || fieldError) && (
          <Animated type="alert" animationKey="error-message">
            <div
              role="alert"
              className="rounded-xl border border-red-500/25 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
            >
              {fieldError || error}
            </div>
          </Animated>
        )}

        <StaggerContainer
          staggerDelay={0.1}
          delayChildren={0.1}
          className="grid gap-5"
        >
          <StaggerItem>
            <Input
              id="userid"
              label="UserID"
              type="text"
              autoComplete="text"
              placeholder="you employee id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </StaggerItem>

          <StaggerItem>
            <Input
              id="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-xs font-semibold text-gray-500 hover:text-black transition-colors"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              }
            />
          </StaggerItem>

          <StaggerItem>
            <div className="flex items-center justify-between">
              <FormCheckbox
                id="remember"
                label="Remember me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm font-semibold text-black hover:text-gray-700 hover:underline transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
          </StaggerItem>

          <StaggerItem>
            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              className=" text-white transition-colors"
            >
              {isLoading ? "Signing in..." : "→ Sign In"}
            </Button>
          </StaggerItem>

          <StaggerItem>
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-gray-200" />
              <span className="text-xs font-medium text-gray-500">
                Or continue with
              </span>
              <span className="h-px flex-1 bg-gray-200" />
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex items-center justify-center gap-2 p-2 h-11 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Image
                  src="/images/google_icon.png"
                  alt="Google"
                  width={20}
                  height={20}
                  className="h-5 w-5 rounded-full object-contain"
                />
                <span>Google</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="flex items-center justify-center gap-2 p-2 h-11 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Image
                  src="/images/microsoft_icon.png"
                  alt="Microsoft"
                  width={20}
                  height={20}
                  className="h-5 w-5 rounded-full object-contain"
                />
                <span>Microsoft</span>
              </Button>
            </div>
          </StaggerItem>
        </StaggerContainer>
      </form>
    </Animated>
  );
}
