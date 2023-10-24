import { cn } from "@/utils/utils";
import React from "react";

interface MaxWidtchWrapperProps {
  className?: string;
  children?: React.ReactNode;
}

const MaxWidtchWrapper: React.FC<MaxWidtchWrapperProps> = ({
  className,
  children,
}) => {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-screen-xl px-2.5 md:px-20",
        className
      )}
    >
      {children}
    </div>
  );
};

export default MaxWidtchWrapper;
