import * as React from "react";
import { cn } from "../../lib/utils";
import PropTypes from "prop-types";

const Badge = React.forwardRef(
  ({ className, variant = "default", children, ...props }, ref) => {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          {
            "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200": 
              variant === "default",
            "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300":
              variant === "success",
            "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300": 
              variant === "danger",
            "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300": 
              variant === "primary",
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300": 
              variant === "warning",
            "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300":
              variant === "secondary",
            "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300": 
              variant === "info",
          },
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

Badge.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf([
    "default",
    "success",
    "danger",
    "primary",
    "warning",
    "secondary",
    "info",
  ]),
  children: PropTypes.node,
};

export { Badge }; 