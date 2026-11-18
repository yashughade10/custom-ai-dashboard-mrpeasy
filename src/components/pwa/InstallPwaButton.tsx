"use client";

import * as React from "react";
import { Download, MoreVertical, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { usePwa } from "./PwaProvider";

interface InstallPwaButtonProps {
  className?: string;
  label?: string;
  compactOnMobile?: boolean;
}

export function InstallPwaButton({
  className,
  label = "Install App",
  compactOnMobile = true,
}: InstallPwaButtonProps) {
  const { canInstall, isInstalled, isIOS, isMobile, promptInstall } = usePwa();
  const [helpOpen, setHelpOpen] = React.useState(false);

  // Hide once running inside the installed PWA; show whenever native install is ready or on mobile devices
  if (isInstalled || (!canInstall && !isIOS && !isMobile)) {
    return null;
  }

  const handleClick = async () => {
    if (canInstall) {
      const outcome = await promptInstall();
      if (outcome !== "unavailable") return;
    }
    setHelpOpen(true);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleClick}
        className={cn("gap-1.5 h-8 px-2.5 text-xs cursor-pointer", className)}
        title="Install Vaclift AI Dashboard as an app"
      >
        <Download className="h-3.5 w-3.5 shrink-0" />
        {compactOnMobile ? (
          <>
            <span className="sm:hidden">Install</span>
            <span className="hidden sm:inline">{label}</span>
          </>
        ) : (
          <span>{label}</span>
        )}
      </Button>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Install Vaclift AI Dashboard</DialogTitle>
            <DialogDescription>
              {isIOS
                ? "Add this dashboard to your iPhone or iPad Home Screen for a full-screen app experience."
                : "Install this dashboard on your phone for quick Home Screen access."}
            </DialogDescription>
          </DialogHeader>
          {isIOS ? (
            <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                Open this page in{" "}
                <span className="font-medium text-foreground">Safari</span>.
              </li>
              <li>
                Tap the{" "}
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <Share className="inline h-3.5 w-3.5" /> Share
                </span>{" "}
                button in the toolbar.
              </li>
              <li>
                Scroll down and tap{" "}
                <span className="font-medium text-foreground">
                  Add to Home Screen
                </span>
                , then tap{" "}
                <span className="font-medium text-foreground">Add</span>.
              </li>
            </ol>
          ) : (
            <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                Tap the browser menu icon{" "}
                <span className="inline-flex items-center font-medium text-foreground">
                  <MoreVertical className="inline h-3.5 w-3.5" />
                </span>{" "}
                in the top-right corner of Chrome.
              </li>
              <li>
                Tap{" "}
                <span className="font-medium text-foreground">Install app</span>{" "}
                or{" "}
                <span className="font-medium text-foreground">
                  Add to Home screen
                </span>
                .
              </li>
              <li>
                Confirm by tapping{" "}
                <span className="font-medium text-foreground">Install</span>.
              </li>
            </ol>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
