"use client";

import * as React from "react";
import { Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePwa } from "./PwaProvider";

export function InstallPwaButton() {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePwa();
  const [iosHelpOpen, setIosHelpOpen] = React.useState(false);

  if (isInstalled || (!canInstall && !isIOS)) {
    return null;
  }

  const handleClick = async () => {
    if (canInstall) {
      await promptInstall();
      return;
    }
    if (isIOS) {
      setIosHelpOpen(true);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        className="gap-1.5 h-8 px-2.5 text-xs cursor-pointer"
        title="Install Vaclift AI Dashboard as an app"
      >
        <Download className="h-3.5 w-3.5" />
        <span className="hidden md:inline">Install App</span>
      </Button>

      <Dialog open={iosHelpOpen} onOpenChange={setIosHelpOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Install Vaclift AI Dashboard</DialogTitle>
            <DialogDescription>
              Add this dashboard to your iPhone or iPad Home Screen for a
              full-screen app experience.
            </DialogDescription>
          </DialogHeader>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              Tap the{" "}
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <Share className="inline h-3.5 w-3.5" /> Share
              </span>{" "}
              button in Safari.
            </li>
            <li>
              Scroll down and tap{" "}
              <span className="font-medium text-foreground">
                Add to Home Screen
              </span>
              .
            </li>
            <li>
              Tap <span className="font-medium text-foreground">Add</span> in
              the top-right corner.
            </li>
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
}

