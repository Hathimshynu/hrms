// src/components/auth/ForgotPasswordForm.tsx
"use client";

import { Input } from "@/src/components/ui/Input";
import { Button } from "@/src/components/ui/Button";
import { useState } from "react";
import { Animated, StaggerContainer, StaggerItem } from "@/src/components/ui/Animated";

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError("");
    setSuccessMessage("");

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setFieldError("Enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement your actual forgot password API call here
      // await forgotPassword({ email });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccessMessage("Password reset instructions sent to your email");
      setIsSubmitted(true);
    } catch (error) {
      setFieldError("Failed to send reset instructions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="w-full">
      {fieldError && (
        <Animated type="alert" animationKey="forgot-error">
          <div
            role="alert"
            className="rounded-xl border border-red-500/25 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 mb-5"
          >
            {fieldError}
          </div>
        </Animated>
      )}

      {successMessage && (
        <Animated type="alert" animationKey="forgot-success">
          <div
            role="alert"
            className="rounded-xl border border-green-500/25 bg-green-50 px-4 py-3 text-sm font-medium text-green-600 mb-5"
          >
            {successMessage}
          </div>
        </Animated>
      )}

      <StaggerContainer staggerDelay={0.1} delayChildren={0.1} className="grid gap-5">
        <StaggerItem>
          <Input
            id="forgot-email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitted}
          />
        </StaggerItem>

        <StaggerItem>
          <Button 
            type="submit" 
            fullWidth 
            isLoading={isLoading}
            disabled={isSubmitted}
            className=" text-white transition-colors"
          >
            {isLoading ? "Sending..." : "Send Reset Instructions"}
          </Button>
        </StaggerItem>

        <StaggerItem>
          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full text-sm font-semibold text-gray-600 hover:text-black transition-colors text-center py-2"
          >
            ← Back to Sign In
          </button>
        </StaggerItem>
      </StaggerContainer>
    </form>
  );
}