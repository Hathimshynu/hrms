"use client";

import { Input } from "@/src/components/ui/Input";
import { Switch } from "@/src/components/ui/Switch";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  Laptop,
  LogOut,
  type LucideIcon,
  Monitor,
  Pencil,
  Smartphone,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type SessionIcon = "desktop" | "mobile" | "laptop";

interface Session {
  id: string;
  device: string;
  location: string;
  status: string;
  icon: SessionIcon;
  current?: boolean;
}

interface ProfileForm {
  fullName: string;
  email: string;
  department: string;
  role: string;
}

const sessionIconMap: Record<SessionIcon, LucideIcon> = {
  desktop: Monitor,
  mobile: Smartphone,
  laptop: Laptop,
};

const INITIAL_PROFILE: ProfileForm = {
  fullName: "Jane Doe",
  email: "jane.doe@workforce.com",
  department: "Human Resources",
  role: "HR Administrator",
};

const DEFAULT_AVATAR = "/avatars/jane-doe.jpg";

export default function SettingsPage() {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profile, setProfile] = useState<ProfileForm>(INITIAL_PROFILE);
  const [draftProfile, setDraftProfile] =
    useState<ProfileForm>(INITIAL_PROFILE);

  const handleStartEdit = () => {
    setDraftProfile(profile);
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    setDraftProfile(profile);
    setIsEditingProfile(false);
  };

  const handleSaveProfile = () => {
    setProfile(draftProfile);
    setIsEditingProfile(false);
  };

  const updateDraft =
    (field: keyof ProfileForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setDraftProfile((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarSrc, setAvatarSrc] = useState<string>(DEFAULT_AVATAR);
  const objectUrlRef = useRef<string | null>(null);
  const hasCustomAvatar = avatarSrc !== DEFAULT_AVATAR;

  const handleChangePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) return;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const nextUrl = URL.createObjectURL(file);
    objectUrlRef.current = nextUrl;
    setAvatarSrc(nextUrl);
    e.target.value = "";
  };

  const handleRemovePhoto = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setAvatarSrc(DEFAULT_AVATAR);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleUpdatePassword = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const [sessions, setSessions] = useState<Session[]>([
    {
      id: "windows-desktop",
      device: "Windows Desktop",
      location: "London, UK",
      status: "Active Now",
      icon: "desktop",
      current: true,
    },
    {
      id: "iphone-13",
      device: "iPhone 13",
      location: "Paris, FR",
      status: "Last active 2h ago",
      icon: "mobile",
    },
    {
      id: "macbook-pro",
      device: "MacBook Pro",
      location: "Berlin, DE",
      status: "Last active 1d ago",
      icon: "laptop",
    },
  ]);

  const handleRemoveSession = (id: string) => {
    setSessions((prev) => prev.filter((session) => session.id !== id));
  };

  const handleLogoutAllDevices = () => {
    setSessions((prev) => prev.filter((session) => session.current));
  };

  const displayedProfile = isEditingProfile ? draftProfile : profile;

  return (
    <div className="h-full w-full overflow-y-auto bg-[#F2F2F2] px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <div className="mb-6 flex items-center gap-3">
          <div
            className="group flex h-12 w-12 cursor-pointer items-center justify-center rounded-full transition hover:bg-primary sm:h-10 sm:w-10"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-5 w-5 text-black transition group-hover:text-white" />
          </div>

          <div>
            <h1 className="text-lg font-semibold text-ink sm:text-2xl">
              Settings Management
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_340px]">
          <div className="flex flex-col gap-5">
            <section className="rounded-2xl border border-border bg-surface p-5  sm:p-6">
              <div className="mb-6 flex min-h-10 items-center justify-between">
                <h2 className="text-lg font-bold text-ink sm:text-xl">
                  Profile Information
                </h2>

                {!isEditingProfile && (
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-ink transition hover:bg-surface-muted"
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-6 sm:flex-row">
                <div className="flex shrink-0 flex-col items-center gap-2 sm:items-start">
                  <div className="relative h-32 w-32">
                    <div className="h-32 w-32 overflow-hidden rounded-full border-2 border-border bg-surface-muted">
                      <Image
                        src={avatarSrc}
                        alt="Profile photo"
                        width={128}
                        height={128}
                        unoptimized={avatarSrc.startsWith("blob:")}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleChangePhotoClick}
                      disabled={!isEditingProfile}
                      aria-label="Change photo"
                      className={[
                        "cursor-pointer absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-surface bg-primary text-white  transition",
                        isEditingProfile
                          ? "opacity-100"
                          : "pointer-events-none opacity-0",
                        "hover:opacity-90",
                      ].join(" ")}
                    >
                      <Camera size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={!isEditingProfile || !hasCustomAvatar}
                      aria-label="Remove photo"
                      className={[
                        "cursor-pointer absolute -right-1 -top-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-surface bg-red-600 text-white  transition hover:bg-red-700",
                        isEditingProfile && hasCustomAvatar
                          ? "opacity-100"
                          : "pointer-events-none opacity-0",
                      ].join(" ")}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  <p
                    className={[
                      "h-4 text-xs text-muted transition-opacity",
                      isEditingProfile ? "opacity-100" : "opacity-0",
                    ].join(" ")}
                  >
                    JPG or PNG, up to 5MB
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelected}
                    className="hidden"
                  />
                </div>

                <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Full Name"
                    value={displayedProfile.fullName}
                    onChange={updateDraft("fullName")}
                    disabled={!isEditingProfile}
                    readOnly={!isEditingProfile}
                  />
                  <Input
                    label="Email Address"
                    value={displayedProfile.email}
                    onChange={updateDraft("email")}
                    disabled={!isEditingProfile}
                    readOnly={!isEditingProfile}
                  />
                  <Input
                    label="Department"
                    value={displayedProfile.department}
                    onChange={updateDraft("department")}
                    disabled={!isEditingProfile}
                    readOnly={!isEditingProfile}
                  />
                  <Input
                    label="Role"
                    value={displayedProfile.role}
                    onChange={updateDraft("role")}
                    disabled={!isEditingProfile}
                    readOnly={!isEditingProfile}
                  />
                </div>
              </div>

              {isEditingProfile && (
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="rounded-lg border border-border px-6 py-3 text-sm font-semibold text-ink transition hover:bg-surface-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-surface p-5  sm:p-6">
              <h2 className="mb-6 text-lg font-bold text-ink sm:text-xl">
                Security &amp; Password
              </h2>

              <div className="flex flex-col gap-4">
                <Input
                  label="Current Password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((prev) => !prev)}
                      aria-label={
                        showCurrentPassword ? "Hide password" : "Show password"
                      }
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      {showCurrentPassword ? "Hide" : "Show"}
                    </button>
                  }
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="New Password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        aria-label={
                          showNewPassword ? "Hide password" : "Show password"
                        }
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        {showNewPassword ? "Hide" : "Show"}
                      </button>
                    }
                  />
                  <Input
                    label="Confirm New Password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        aria-label={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        {showConfirmPassword ? "Hide" : "Show"}
                      </button>
                    }
                  />
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleUpdatePassword}
                    className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Update Password
                  </button>
                </div>
              </div>

              <hr className="my-6 border-border" />

              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-ink">
                    Two-Factor Authentication (2FA)
                  </h3>
                  <p className="mt-0.5 text-sm text-muted">
                    Add an extra layer of security to your account.
                  </p>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onChange={setTwoFactorEnabled}
                  ariaLabel="Two-Factor Authentication"
                />
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-5">
            <section className="rounded-2xl border border-border bg-surface p-5  sm:p-6">
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-lg font-bold text-ink sm:text-xl">
                  Active Sessions
                </h2>
                <Laptop size={20} className="text-muted" aria-hidden="true" />
              </div>
              <p className="mb-5 text-sm text-muted">
                Devices currently logged into your account.
              </p>

              <ul className="flex flex-col gap-4">
                {sessions.map((session) => {
                  const Icon: LucideIcon = sessionIconMap[session.icon];

                  return (
                    <li
                      key={session.id}
                      className="flex items-start justify-between gap-3"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <Icon
                          size={20}
                          className="mt-0.5 shrink-0 text-ink"
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-ink">
                              {session.device}
                            </span>
                            {session.current && (
                              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="truncate text-xs text-muted">
                            {session.location} • {session.status}
                          </p>
                        </div>
                      </div>

                      {!session.current && (
                        <button
                          type="button"
                          aria-label={`Sign out ${session.device}`}
                          onClick={() => handleRemoveSession(session.id)}
                          className="shrink-0 rounded-md p-1 text-muted transition hover:bg-surface-muted hover:text-ink"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>

              <hr className="my-5 border-border" />

              <div className="flex items-start gap-2 text-red-600">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                <h3 className="text-sm font-bold">Security Action</h3>
              </div>
              <p className="mt-2 text-sm text-muted">
                If you notice suspicious activity, sign out of all devices
                immediately. You will need to log back in on this device.
              </p>

              <button
                type="button"
                onClick={handleLogoutAllDevices}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
              >
                <LogOut size={16} />
                Logout from all devices
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
