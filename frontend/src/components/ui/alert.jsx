import * as React from "react";
import { cn } from "../../lib/utils";
import PropTypes from "prop-types";

const Alert = React.forwardRef(
  ({ className, variant = "default", children, ...props }, ref) => {
    // Map "error" to "destructive" for backward compatibility
    const effectiveVariant = variant === "error" ? "destructive" : variant;
    
    return (
      <div
        className={cn(
          "p-4 rounded-md border-l-4 text-sm",
          {
            "bg-red-50 text-red-700 border-red-500 dark:bg-red-900/20 dark:text-red-300 dark:border-red-500": 
              effectiveVariant === "destructive",
            "bg-green-50 text-green-700 border-green-500 dark:bg-green-900/20 dark:text-green-300 dark:border-green-500": 
              effectiveVariant === "success",
            "bg-blue-50 text-blue-700 border-blue-500 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-500": 
              effectiveVariant === "info",
            "bg-amber-50 text-amber-700 border-amber-500 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-500": 
              effectiveVariant === "warning",
            "bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700": 
              effectiveVariant === "default",
          },
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Alert.displayName = "Alert";

Alert.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf(["error", "destructive", "success", "info", "warning", "default"]),
  children: PropTypes.node,
};

export { Alert }; 