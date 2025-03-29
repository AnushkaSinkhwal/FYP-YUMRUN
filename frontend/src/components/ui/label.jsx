import * as React from "react";
import { cn } from "../../lib/utils";
import PropTypes from "prop-types";

const Label = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    return (
      <label
        className={cn(
          "block text-sm font-medium text-gray-700 mb-1",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </label>
    );
  }
);

Label.displayName = "Label";

Label.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};

export { Label }; 