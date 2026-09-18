"use client";

import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@/src/lib/utils/utils";
import type { DrawerRootChangeEventDetails } from "@base-ui/react/drawer";

type DrawerContextProps = {
  hasSnapPoints: boolean;
  modal: DrawerPrimitive.Root.Props["modal"];
  showSwipeHandle: boolean;
  swipeDirection: NonNullable<DrawerPrimitive.Root.Props["swipeDirection"]>;
  onOpenChange?: (
    open: boolean,
    eventDetails: DrawerRootChangeEventDetails,
  ) => void;
  open?: boolean;
};

const DrawerContext = React.createContext<DrawerContextProps | null>(null);

function useDrawer() {
  const context = React.useContext(DrawerContext);

  if (!context) {
    throw new Error("useDrawer must be used within a Drawer.");
  }

  return context;
}

interface DrawerProps extends DrawerPrimitive.Root.Props {
  showSwipeHandle?: boolean;
  showCloseButton?: boolean;
  title?: string;
  description?: string;
  onClose?: () => void;
}

function Drawer({
  modal = true,
  showSwipeHandle = false,
  snapPoints,
  swipeDirection = "down",
  children,
  ...props
}: DrawerProps) {
  const hasSnapPoints = snapPoints != null && snapPoints.length > 0;

  const contextValue = React.useMemo(
    () => ({
      hasSnapPoints,
      modal,
      showSwipeHandle,
      swipeDirection,
      onOpenChange: props.onOpenChange,
      open: props.open,
    }),
    [
      hasSnapPoints,
      modal,
      showSwipeHandle,
      swipeDirection,
      props.onOpenChange,
      props.open,
    ],
  );

  return (
    <DrawerContext.Provider value={contextValue}>
      <DrawerPrimitive.Root
        data-slot="drawer"
        modal={modal}
        snapPoints={snapPoints}
        swipeDirection={swipeDirection}
        {...props}
      >
        {children}
      </DrawerPrimitive.Root>
    </DrawerContext.Provider>
  );
}

function DrawerTrigger({ ...props }: DrawerPrimitive.Trigger.Props) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerPortal({ ...props }: DrawerPrimitive.Portal.Props) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose({ ...props }: DrawerPrimitive.Close.Props) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerOverlay({
  className,
  ...props
}: DrawerPrimitive.Backdrop.Props) {
  return (
    <DrawerPrimitive.Backdrop
      data-slot="drawer-overlay"
      className={cn(
        "fixed inset-0 z-50 min-h-dvh bg-black/50",
        "opacity-[max(var(--drawer-overlay-min-opacity,0),calc(1-var(--drawer-swipe-progress)))]",
        "transition-opacity duration-300",
        "ease-[cubic-bezier(0.32,0.72,0,1)]",
        "select-none",
        "data-ending-style:pointer-events-none",
        "data-ending-style:opacity-0",
        "data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)]",
        "data-snap-points:[--drawer-overlay-min-opacity:0.5]",
        "data-starting-style:opacity-0",
        "data-swiping:duration-0",
        "supports-backdrop-filter:backdrop-blur-sm",
        "supports-[-webkit-touch-callout:none]:absolute",
        className,
      )}
      {...props}
    />
  );
}

function DrawerSwipeHandle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-swipe-handle"
      aria-hidden="true"
      className={cn(
        "relative z-10 flex shrink-0 cursor-grab transition-opacity duration-200",
        "group-data-nested-drawer-open/drawer-popup:opacity-0",
        "group-data-nested-drawer-swiping/drawer-popup:opacity-100",
        "group-data-[swipe-axis=x]/drawer-popup:h-full",
        "group-data-[swipe-axis=x]/drawer-popup:w-3",
        "group-data-[swipe-axis=x]/drawer-popup:items-center",
        "group-data-[swipe-axis=y]/drawer-popup:h-3",
        "group-data-[swipe-axis=y]/drawer-popup:w-full",
        "group-data-[swipe-axis=y]/drawer-popup:justify-center",
        "group-data-[swipe-direction=down]/drawer-popup:items-end",
        "group-data-[swipe-direction=left]/drawer-popup:order-last",
        "group-data-[swipe-direction=left]/drawer-popup:justify-start",
        "group-data-[swipe-direction=right]/drawer-popup:justify-end",
        "group-data-[swipe-direction=up]/drawer-popup:order-last",
        "group-data-[swipe-direction=up]/drawer-popup:items-start",
        "after:block",
        "after:shrink-0",
        "after:rounded-full",
        "after:bg-gray-300",
        "group-data-[swipe-axis=x]/drawer-popup:after:h-24",
        "group-data-[swipe-axis=x]/drawer-popup:after:w-1",
        "group-data-[swipe-axis=y]/drawer-popup:after:h-1",
        "group-data-[swipe-axis=y]/drawer-popup:after:w-24",
        "active:cursor-grabbing",
        className,
      )}
      {...props}
    />
  );
}

function DrawerContent({
  className,
  children,
  title,
  description,
  showCloseButton = true,
  onClose,
  ...props
}: DrawerPrimitive.Popup.Props & {
  title?: string;
  description?: string;
  showCloseButton?: boolean;
  onClose?: () => void;
}) {
  const { hasSnapPoints, modal, showSwipeHandle, swipeDirection } = useDrawer();

  const swipeAxis =
    swipeDirection === "down" || swipeDirection === "up" ? "y" : "x";

  return (
    <DrawerPortal data-slot="drawer-portal">
      {modal === true && (
        <DrawerOverlay data-snap-points={hasSnapPoints ? "" : undefined} />
      )}

      <DrawerPrimitive.Viewport
        data-slot="drawer-viewport"
        data-modal={modal}
        className={cn(
          "pointer-events-none fixed inset-0 z-50",
          "select-none",
          "data-[modal=true]:pointer-events-auto",
        )}
      >
        <DrawerPrimitive.Popup
          data-slot="drawer-popup"
          data-swipe-axis={swipeAxis}
          data-snap-points={hasSnapPoints ? "" : undefined}
          className={cn(
            // Base
            "group/drawer-popup",
            "fixed",
            "z-50",
            "flex",
            "h-full",
            "flex-col",
            "bg-white",
            "text-gray-900",
            "shadow-2xl",
            "outline-none",

            // Right drawer
            swipeDirection === "right" && [
              "right-0",
              "top-0",
              "bottom-0",
              "w-[min(100vw,38rem)]",
              "rounded-l-[50px]",
              "border-l",
              "border-gray-200",

              // OPEN: right -> left
              "data-starting-style:translate-x-full",

              // CLOSE: left -> right
              "data-ending-style:translate-x-full",
            ],

            // Left drawer
            swipeDirection === "left" && [
              "left-0",
              "top-0",
              "bottom-0",
              "w-[min(100vw,38rem)]",
              "rounded-r-[50px]",
              "border-r",
              "border-gray-200",

              "data-starting-style:-translate-x-full",
              "data-ending-style:-translate-x-full",
            ],

            // Bottom drawer
            swipeDirection === "down" && [
              "bottom-0",
              "left-0",
              "right-0",
              "h-auto",
              "max-h-[90vh]",
              "w-full",
              "rounded-t-2xl",
              "border-t",
              "border-gray-200",

              "data-starting-style:translate-y-full",
              "data-ending-style:translate-y-full",
            ],

            // Top drawer
            swipeDirection === "up" && [
              "top-0",
              "left-0",
              "right-0",
              "h-auto",
              "max-h-[90vh]",
              "w-full",
              "rounded-b-2xl",
              "border-b",
              "border-gray-200",

              "data-starting-style:-translate-y-full",
              "data-ending-style:-translate-y-full",
            ],

            // Animation
            "transition-transform",
            "duration-300",
            "ease-[cubic-bezier(0.32,0.72,0,1)]",

            // Disable transition while dragging
            "data-swiping:transition-none",

            className,
          )}
          {...props}
        >
          {showSwipeHandle && <DrawerSwipeHandle />}

          {(title || description || showCloseButton) && (
            <div
              className={cn(
                "flex shrink-0 items-center justify-between rounded-tl-lg",
                "border-b border-gray-200",
                "bg-white",
                "px-6 py-4",
              )}
            >
              <div className="min-w-0">
                {title && (
                  <div className="truncate text-2xl font-semibold text-gray-900">
                    {title}
                  </div>
                )}

                {description && (
                  <p className="mt-1 text-sm text-gray-500">{description}</p>
                )}
              </div>

              {showCloseButton && (
                <DrawerPrimitive.Close
                  type="button"
                  onClick={onClose}
                  aria-label="Close drawer"
                  className={cn(
                    "ml-4 shrink-0 rounded-full p-4 hover:bg-red-50",
                    "text-gray-500",
                    "transition-colors",
                    // "hover:bg-gray-100",
                    "hover:text-gray-900",
                    "focus:outline-none",
                    "focus:ring-2",
                    "focus:ring-gray-300",
                    "cursor-pointer",
                  )}
                >
                  <X className="h-5 w-5" />
                </DrawerPrimitive.Close>
              )}
            </div>
          )}

          <DrawerPrimitive.Content
            data-slot="drawer-content"
            className={cn(
              "flex min-h-0 flex-1 flex-col",
              "overflow-hidden",
              "overscroll-contain",
              "select-text",
              "transition-opacity duration-300",
              "ease-[cubic-bezier(0.45,1.005,0,1.005)]",
              "group-data-nested-drawer-open/drawer-popup:opacity-0",
              "group-data-nested-drawer-swiping/drawer-popup:opacity-100",
              "group-data-swiping/drawer-popup:select-none",
              swipeDirection === "down" && "justify-end",
            )}
          >
            {children}
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPortal>
  );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        "flex shrink-0 flex-col gap-0.5 p-4 pb-0",
        "group-data-[swipe-axis=y]/drawer-popup:text-center",
        "md:gap-0.5 md:text-left",
        className,
      )}
      {...props}
    />
  );
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex shrink-0 flex-col gap-2 p-4 pt-0", className)}
      {...props}
    />
  );
}

function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn(
        "font-heading text-base font-medium text-gray-900",
        className,
      )}
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: DrawerPrimitive.Description.Props) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-sm text-balance text-gray-500", className)}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerSwipeHandle,
  DrawerTitle,
  DrawerTrigger,
};
