import * as React from "react";

import { cn } from "@/lib/utils";

type NeonCardProps = React.ComponentProps<"div">;

export function NeonCard({ className, children, ...props }: NeonCardProps) {
  return (
    <div className={cn("home-neon-card group", className)} {...props}>
      <div className="home-neon-card__inner h-full">{children}</div>
    </div>
  );
}
