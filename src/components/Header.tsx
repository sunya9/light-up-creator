import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Home } from "lucide-react";
import type { PropsWithChildren } from "react";
import { Link } from "wouter";

interface Props {
  sidebarButton?: boolean;
}

export function Header({ children, sidebarButton }: PropsWithChildren<Props>) {
  return (
    <header className="border-b">
      <div
        className={cn(
          "container flex w-full items-center justify-between gap-2 px-4 py-3",
          {
            "mx-auto": !sidebarButton,
          },
        )}
      >
        {sidebarButton ? (
          <SidebarTrigger />
        ) : (
          <Button
            nativeButton={false}
            render={<Link to="/" />}
            size="icon"
            variant="ghost"
          >
            <Home />
          </Button>
        )}
        <h1 className="flex-1 text-lg font-semibold tracking-tight">
          Light Up Creator
        </h1>
        {children}
      </div>
    </header>
  );
}
