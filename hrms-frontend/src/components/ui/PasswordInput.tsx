"use client";

import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState } from "react";

import { Input, type InputProps } from "./Input";

// Password field with a show/hide (eye) toggle. Same props as Input.
export const PasswordInput = forwardRef<
  HTMLInputElement,
  Omit<InputProps, "type" | "rightElement">
>((props, ref) => {
  const [visible, setVisible] = useState(false);
  const label = props.label ? `${props.label}` : "password";

  return (
    <Input
      {...props}
      ref={ref}
      type={visible ? "text" : "password"}
      rightElement={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="rounded-full p-1 text-gray-500 transition-colors hover:text-black focus-visible:outline-2 focus-visible:outline-primary"
        >
          {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      }
    />
  );
});
PasswordInput.displayName = "PasswordInput";
