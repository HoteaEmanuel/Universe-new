import * as React from "react"
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// Two-point peek/expand sheet: starts at ~45% viewport height, drags open to
// ~92%. Dragging below the smallest point dismisses, matching a native
// bottom-sheet feel instead of a plain slide-up panel.
const DEFAULT_SNAP_POINTS = [0.45, 0.92]

function Drawer({
  snapPoints = DEFAULT_SNAP_POINTS,
  ...props
}) {
  return (
    <DrawerPrimitive.Root
      data-slot="drawer"
      swipeDirection="down"
      snapPoints={snapPoints}
      {...props}
    />
  );
}

function DrawerPortal({
  ...props
}) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerBackdrop({
  className = "",
  ...props
}) {
  return (
    <DrawerPrimitive.Backdrop
      data-slot="drawer-backdrop"
      className={cn(
        "fixed inset-0 z-50 bg-black/10 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs",
        className
      )}
      {...props} />
  );
}

function DrawerContent({
  className = "",
  children,
  showCloseButton = true,
  ...props
}) {
  return (
    <DrawerPortal>
      <DrawerBackdrop />
      <DrawerPrimitive.Viewport className="fixed inset-x-0 bottom-0 z-50 flex justify-center touch-none">
        <DrawerPrimitive.Popup
          data-slot="drawer-content"
          className={cn(
            "relative flex h-[92dvh] w-full flex-col gap-3 overflow-hidden rounded-t-2xl border-t border-border bg-popover bg-clip-padding text-sm text-popover-foreground shadow-(--shadow-overlay) [transform:translateY(calc(var(--drawer-snap-point-offset)+var(--drawer-swipe-movement-y)))] transition-transform duration-200 ease-in-out data-swiping:transition-none data-ending-style:opacity-0 data-starting-style:opacity-0 sm:mx-auto sm:max-w-md",
            className
          )}
          {...props}>
          <div className="mx-auto mt-2.5 mb-1 h-1.5 w-10 shrink-0 touch-none rounded-full bg-muted-foreground/30" />
          {children}
          {showCloseButton && (
            <DrawerPrimitive.Close
              data-slot="drawer-close"
              render={
                <Button variant="ghost" className="absolute top-3 right-3" size="icon-sm" />
              }>
              <XIcon />
              <span className="sr-only">Close</span>
            </DrawerPrimitive.Close>
          )}
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPortal>
  );
}

function DrawerHeader({
  className = "",
  ...props
}) {
  return (
    <div
      data-slot="drawer-header"
      className={cn("flex shrink-0 touch-none flex-col gap-0.5 p-4", className)}
      {...props} />
  );
}

// Wraps Base UI's Drawer.Content, which marks the scrollable region the
// drawer's drag gesture treats specially: a drag only resizes/dismisses the
// sheet once this area is scrolled to its boundary, so normal list scrolling
// isn't hijacked by the sheet's own drag handling.
function DrawerBody({
  className = "",
  ...props
}) {
  return (
    <DrawerPrimitive.Content
      data-slot="drawer-body"
      className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain", className)}
      {...props} />
  );
}

function DrawerTitle({
  className = "",
  ...props
}) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("font-heading text-base font-medium text-foreground", className)}
      {...props} />
  );
}

function DrawerDescription({
  className = "",
  ...props
}) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props} />
  );
}

export {
  Drawer,
  DrawerPortal,
  DrawerBackdrop,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerTitle,
  DrawerDescription,
}
