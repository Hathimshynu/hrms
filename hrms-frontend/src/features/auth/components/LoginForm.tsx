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
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { GoogleSignIn } from "./GoogleSignIn";

export function LoginForm() {
  const { login, isLoading, error } = useAuth();
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

    try {
      await login({ email, password, remember_me: rememberMe });
      // navigation to /dashboard or /change-password happens inside useAuth
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
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="rounded-full p-1 text-gray-500 transition-colors hover:text-black focus-visible:outline-2 focus-visible:outline-primary"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
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
            <GoogleSignIn rememberMe={rememberMe} />
          </StaggerItem>
        </StaggerContainer>
      </form>
    </Animated>
  );
}
