import { useState } from "react";
import { Info } from "lucide-react";
import { SiGithub } from "@icons-pack/react-simple-icons";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const GITHUB_URL = "https://github.com/sunya9/art-museum-creator";

export function AboutDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="About"
        onClick={() => setOpen(true)}
      >
        <Info />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Light Up Creator</DialogTitle>
            <DialogDescription>
              Akari (美術館) パズルの作成・共有ツール
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              パズルデータはブラウザの localStorage にのみ保存されます。
              ブラウザのデータを削除するとパズルも失われます。 大切なパズルは
              Share URL で共有・バックアップしてください。
            </p>
            <p>
              Created by{" "}
              <a
                href="https://x.com/ephemeralMocha"
                className={buttonVariants({
                  variant: "link",
                  size: "auto",
                })}
              >
                @ephemeralMocha
              </a>
            </p>
          </div>
          <div className="flex flex-row">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline" })}
            >
              <SiGithub />
              GitHub
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
