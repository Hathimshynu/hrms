"use client";

import * as React from "react";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";

// ==============================
// Types
// ==============================
export type AlertType =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "permission"
  | "loading"
  | "delete";

type ButtonSize = "default" | "sm" | "lg" | "icon";
type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";

export interface ReusableAlertProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  type?: AlertType;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
  className?: string;
  size?: ButtonSize;
  icon?: React.ReactNode;
  confirmVariant?: ButtonVariant;
  loading?: boolean;
}

// ==============================
// Configurations
// ==============================
const alertConfig: Record<
  AlertType,
  {
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    confirmVariant: ButtonVariant;
    defaultConfirmText: string;
  }
> = {
  success: {
    icon: <CheckCircle2 className="h-6 w-6" />,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    confirmVariant: "default",
    defaultConfirmText: "Confirm",
  },
  error: {
    icon: <XCircle className="h-6 w-6" />,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    confirmVariant: "destructive",
    defaultConfirmText: "Confirm",
  },
  warning: {
    icon: <AlertTriangle className="h-6 w-6" />,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    confirmVariant: "default",
    defaultConfirmText: "Confirm",
  },
  info: {
    icon: <Info className="h-6 w-6" />,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    confirmVariant: "default",
    defaultConfirmText: "Confirm",
  },
  permission: {
    icon: <ShieldAlert className="h-6 w-6" />,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    confirmVariant: "default",
    defaultConfirmText: "Grant Access",
  },
  loading: {
    icon: <Loader2 className="h-6 w-6 animate-spin" />,
    iconBg: "bg-gray-100",
    iconColor: "text-gray-600",
    confirmVariant: "default",
    defaultConfirmText: "Loading...",
  },
  delete: {
    icon: <AlertCircle className="h-6 w-6" />,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    confirmVariant: "destructive",
    defaultConfirmText: "Yes",
  },
};

// ==============================
// Main Component
// ==============================
export function ReusableAlert({
  open,
  onOpenChange,
  trigger,
  type = "info",
  title,
  description,
  confirmText,
  cancelText = "No",
  onConfirm,
  onCancel,
  showCancel = true,
  className,
  size = "default",
  icon,
  confirmVariant,
  loading = false,
}: ReusableAlertProps) {
  const config = alertConfig[type];
  const isPermission = type === "permission";

  const handleConfirm = () => {
    onConfirm?.();
    if (!loading) {
      onOpenChange?.(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange?.(false);
  };

  const content = (
    <AlertDialogContent
      size={size as "default" | "sm"}
      className={`max-w-md mx-auto ${className || ""}`}
    >
      <AlertDialogHeader>
        {/* Icon */}
        <div
          className={`p-3 rounded-full ${config.iconBg} ${config.iconColor}`}
        >
          {icon || config.icon}
        </div>

        {/* Title */}
        <AlertDialogTitle>{title}</AlertDialogTitle>

        {/* Description */}
        {description && (
          <AlertDialogDescription>{description}</AlertDialogDescription>
        )}
      </AlertDialogHeader>

      <AlertDialogFooter>
        {showCancel && !isPermission && (
          <AlertDialogCancel onClick={handleCancel} disabled={loading}>
            {cancelText}
          </AlertDialogCancel>
        )}
        {isPermission && showCancel && (
          <AlertDialogCancel onClick={handleCancel} disabled={loading}>
            {cancelText}
          </AlertDialogCancel>
        )}
        <AlertDialogAction
          // variant={
          //   type === "delete"
          //     ? "destructive"
          //     : confirmVariant || config.confirmVariant
          // }
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {confirmText || config.defaultConfirmText}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );

  if (!trigger) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        {content}
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger>{trigger}</AlertDialogTrigger>
      {content}
    </AlertDialog>
  );
}

// ==============================
// Pre-configured Variants
// ==============================

export function SuccessAlert(props: Omit<ReusableAlertProps, "type">) {
  return <ReusableAlert type="success" {...props} />;
}

export function ErrorAlert(props: Omit<ReusableAlertProps, "type">) {
  return <ReusableAlert type="error" {...props} />;
}

export function WarningAlert(props: Omit<ReusableAlertProps, "type">) {
  return <ReusableAlert type="warning" {...props} />;
}

export function InfoAlert(props: Omit<ReusableAlertProps, "type">) {
  return <ReusableAlert type="info" {...props} />;
}

export function PermissionAlert(props: Omit<ReusableAlertProps, "type">) {
  return <ReusableAlert type="permission" showCancel {...props} />;
}

export function LoadingAlert(props: Omit<ReusableAlertProps, "type">) {
  return <ReusableAlert type="loading" showCancel={false} {...props} />;
}

export function DeleteAlert(props: Omit<ReusableAlertProps, "type">) {
  return <ReusableAlert type="delete" showCancel {...props} />;
}
