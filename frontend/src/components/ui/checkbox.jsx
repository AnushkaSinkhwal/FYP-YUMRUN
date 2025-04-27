import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react"; // Assuming lucide-react is used for icons

import { cn } from "../../lib/utils";
import PropTypes from "prop-types"; // Keep PropTypes if used elsewhere, but Radix handles types

const Checkbox = React.forwardRef(
  ({ className, onCheckedChange, checked, ...props }, ref) => (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        className
      )}
      checked={checked}
      onCheckedChange={onCheckedChange} // Use onCheckedChange here
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn("flex items-center justify-center text-current")}
      >
        <Check className="h-4 w-4" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
);
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

// PropTypes might become redundant with TypeScript/Radix, but kept for consistency if needed
Checkbox.propTypes = {
  className: PropTypes.string,
  checked: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]), // Radix state can be 'indeterminate'
  onCheckedChange: PropTypes.func, // Changed from onChange
};

export { Checkbox }; 