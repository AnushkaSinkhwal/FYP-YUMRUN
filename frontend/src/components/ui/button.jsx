import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../../lib/utils";
import PropTypes from "prop-types";

const Button = React.forwardRef(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none dark:focus-visible:ring-offset-gray-950",
          {
            "bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-200": 
              variant === "default",
            "bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800": 
              variant === "destructive",
            "border border-gray-300 bg-transparent hover:bg-gray-100 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800": 
              variant === "outline",
            "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-700": 
              variant === "secondary",
            "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800": 
              variant === "brand",
            "text-blue-600 underline-offset-4 hover:underline dark:text-blue-400": 
              variant === "link",
            "h-9 px-4 py-2 text-sm": size === "default",
            "h-8 px-3 text-xs": size === "sm",
            "h-10 px-6 text-base": size === "lg",
            "w-full": size === "full",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

Button.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf([
    "default",
    "destructive",
    "outline",
    "secondary",
    "brand",
    "link",
  ]),
  size: PropTypes.oneOf(["default", "sm", "lg", "full"]),
  asChild: PropTypes.bool,
};

Button.defaultProps = {
  variant: "default",
  size: "default",
  asChild: false
};

export { Button }; 