import * as React from "react";
import { cn } from "../../lib/utils";
import PropTypes from "prop-types";

const Checkbox = React.forwardRef(
  ({ className, checked, onChange, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        className={cn(
          "h-4 w-4 rounded border-gray-300 text-yumrun-orange focus:ring-yumrun-orange",
          className
        )}
        ref={ref}
        checked={checked}
        onChange={onChange}
        {...props}
      />
    );
  }
);

Checkbox.displayName = "Checkbox";

Checkbox.propTypes = {
  className: PropTypes.string,
  checked: PropTypes.bool,
  onChange: PropTypes.func
};

export { Checkbox }; 