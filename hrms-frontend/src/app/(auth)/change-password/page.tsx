"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ChangePasswordForm } from "@/src/features/auth/components/ChangePasswordForm";
import { useAuthStore } from "@/src/store/auth.store";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, isAuthenticated, fetchCurrentUser } = useAuthStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetchCurrentUser().finally(() => setChecked(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (checked && !isAuthenticated) {
      router.replace("/login");
    }
  }, [checked, isAuthenticated, router]);

  if (!checked || !isAuthenticated) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-black/20 border-t-black" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white px-4 py-8">
      <div className="w-full max-w-105">
        <div className="flex justify-center mb-6 lg:mb-8">
          <Image
            src="/images/hrms_logo.png"
            alt="HATHIM HRMS"
            width={80}
            height={80}
            className="rounded-2xl object-contain"
            priority
          />
        </div>

        <div className="p-4 sm:p-8">
          <div className="mb-7 text-center">
            <h1 className="text-2xl sm:text-3xl text-black">Change password</h1>
            <p className="mt-1.5 text-sm text-gray-600">
              {user?.must_change_password
                ? "For your security, set a new password to continue."
                : "Update your account password."}
            </p>
          </div>

          <ChangePasswordForm forced={!!user?.must_change_password} />
        </div>
      </div>
    </div>
  );
}
