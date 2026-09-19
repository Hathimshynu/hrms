import { LoginBackdrop } from "@/src/components/backgrounds/LoginBackdrop";
import { HyperText } from "@/src/components/common/HyperText";
import { LoginForm } from "@/src/features/auth/components/LoginForm";
import Image from "next/image";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#06122b] px-4 py-10 lg:justify-between lg:px-16">
      <LoginBackdrop />

      <section className="relative z-10 hidden max-w-xl text-white lg:block">
        <div className="mb-6 inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-2 pr-4 backdrop-blur">
          <Image
            src="/images/hrms_logo.png"
            alt=""
            width={44}
            height={44}
            className="rounded-xl object-contain"
            priority
          />
          <span className="text-sm font-semibold tracking-wide">HATHIM HRMS</span>
        </div>
        <h1 className="text-5xl font-bold leading-[1.1] tracking-tight">
          <HyperText lines={["HATHIM HRMS", "Human Resource", "Management, Simplified."]} />
        </h1>
        <p className="mt-4 max-w-md text-base text-blue-100/80">
          People, attendance and access control in one secure, fast workspace.
        </p>
      </section>

      <section className="relative z-10 w-full max-w-md login-card rounded-3xl border border-white/30 bg-white/90 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="flex justify-center pt-6 lg:hidden">
          <Image
            src="/images/hrms_logo.png"
            alt="HATHIM HRMS"
            width={64}
            height={64}
            className="rounded-2xl object-contain"
            priority
          />
        </div>
        <div className="p-4 sm:p-8">
          <div className="mb-7 text-center">
            <h2 className="text-2xl text-black sm:text-3xl">Welcome back</h2>
            <p className="mt-1.5 text-sm text-gray-600">
              Sign in to your HATHIM HRMS account
            </p>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
