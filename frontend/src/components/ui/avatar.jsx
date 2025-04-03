import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import PropTypes from "prop-types";
import { cn } from "../../lib/utils";

const Avatar = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
));
Avatar.displayName = "Avatar";
Avatar.propTypes = {
  className: PropTypes.string
};

const AvatarImage = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
));
AvatarImage.displayName = "AvatarImage";
AvatarImage.propTypes = {
  className: PropTypes.string,
  src: PropTypes.string,
  alt: PropTypes.string
};

const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800",
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = "AvatarFallback";
AvatarFallback.propTypes = {
  className: PropTypes.string
};

export { Avatar, AvatarImage, AvatarFallback }; 