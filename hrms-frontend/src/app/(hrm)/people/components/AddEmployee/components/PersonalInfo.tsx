"use client";

import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import { useRef, useState } from "react";

const gender = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Others", value: "others" },
];

const married_status = [
  { label: "Single", value: "single" },
  { label: "Married", value: "married" },
];

export function PersonalInfoStep() {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) return;

    // Max file size: 2MB
    if (file.size > 2 * 1024 * 1024) {
      alert("Image size must be less than 2MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setPreview(reader.result as string);
    };

    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setPreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="grid justify-items-center items-center gap-4">
          <div className="flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-50">
            {preview ? (
              <img
                src={preview}
                alt="Profile preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="h-10 w-10 text-gray-300"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
            )}
          </div>

          <div className="space-y-2 grid gap-px">
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium transition hover:bg-gray-50 cursor-pointer"
              >
                {preview ? "Change Photo" : "Upload Photo"}
              </button>

              {preview && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>

            <p className="text-xs text-gray-400 text-center">
              JPG, PNG or GIF. Max size 2MB.
            </p>
          </div>

          <input
            ref={fileInputRef}
            id="profileImage"
            name="profileImage"
            type="file"
            accept="image/png,image/jpeg,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="firstName"
            className="text-sm font-medium text-gray-700"
          >
            First Name
          </label>

          <Input
            id="firstName"
            name="firstName"
            placeholder="Enter first name"
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="lastName"
            className="text-sm font-medium text-gray-700"
          >
            Last Name
          </label>

          <Input id="lastName" name="lastName" placeholder="Enter last name" />
        </div>
      </div>

      {/* Email & Phone */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email
          </label>

          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Enter email address"
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label htmlFor="phone" className="text-sm font-medium text-gray-700">
            Phone Number
          </label>

          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="Enter phone number"
          />
        </div>
      </div>

      {/* Date of Birth & Gender */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label htmlFor="dob" className="text-sm font-medium text-gray-700">
            Date of Birth
          </label>

          <Input id="dob" name="dob" type="date" />
        </div>

        <div className="space-y-2 grid gap-px">
          <label htmlFor="gender" className="text-sm font-medium text-gray-700">
            Gender
          </label>

          <Select
            id="gender"
            name="gender"
            placeholder="Select gender"
            options={gender}
          />
        </div>
      </div>

      {/* Marital Status & Alternate Phone */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="married_status"
            className="text-sm font-medium text-gray-700"
          >
            Marital Status
          </label>

          <Select
            id="married_status"
            name="married_status"
            placeholder="Select marital status"
            options={married_status}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="alternatePhone"
            className="text-sm font-medium text-gray-700"
          >
            Alternate Phone
          </label>

          <Input
            id="alternatePhone"
            name="alternatePhone"
            type="tel"
            placeholder="Enter alternate phone number"
          />
        </div>
      </div>
    </div>
  );
}
