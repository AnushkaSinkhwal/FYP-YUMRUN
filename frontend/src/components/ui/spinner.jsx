import * as React from "react";
import { cn } from "../../lib/utils";
import PropTypes from "prop-types";

const Spinner = React.forwardRef(
  ({ className, size = "default", color = "default", ...props }, ref) => {
    return (
      <svg
        className={cn(
          "animate-spin",
          {
            "h-4 w-4": size === "sm",
            "h-6 w-6": size === "default",
            "h-8 w-8": size === "lg",
            "text-gray-600 dark:text-gray-300": color === "default",
            "text-blue-600 dark:text-blue-400": color === "primary",
            "text-red-600 dark:text-red-400": color === "danger",
            "text-green-600 dark:text-green-400": color === "success",
          },
          className
        )}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        ref={ref}
        {...props}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    );
  }
);

Spinner.displayName = "Spinner";

Spinner.propTypes = {
  className: PropTypes.string,
  size: PropTypes.oneOf(["sm", "default", "lg"]),
  color: PropTypes.oneOf(["default", "primary", "danger", "success"]),
};

export { Spinner }; 