"use client";

import Silk from "@/src/components/backgrounds/Silk";
import { LoginForm } from "@/src/features/auth/components/LoginForm";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const [isDark, setIsDark] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      <div className="relative hidden lg:block lg:w-[70%] h-screen overflow-hidden">
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        >
          <Silk
            speed={5}
            scale={0.8}
            noiseIntensity={1.2}
            rotation={0.5}
            useThemeColor={true}
            darkMode={isDark}
            className="opacity-90 w-full h-full absolute inset-0"
          />
        </div>

        <div className="absolute inset-0 bg-linear-to-r from-black/5 to-transparent pointer-events-none" />
      </div>

      <div className="flex w-full lg:w-[30%] items-center justify-center px-4 py-8 lg:py-0 bg-white/95 backdrop-blur-sm lg:bg-white min-h-screen relative z-10">
        <div className="w-full max-w-105">
          <div className="flex justify-center lg:justify-center mb-6 lg:mb-8">
            <Image
              src="/images/hrms_logo.png"
              alt="AHRMS"
              width={80}
              height={80}
              className="rounded-2xl object-contain"
              priority
            />
          </div>

          <div className="p-4 sm:p-8">
            <div className="mb-7 text-center">
              <h1 className="text-2xl sm:text-3xl text-black">Welcome back</h1>
              <p className="mt-1.5 text-sm text-gray-600">
                Sign in to your AHRMS account
              </p>
            </div>

            <div className="min-h-105 lg:min-h-112.5">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
