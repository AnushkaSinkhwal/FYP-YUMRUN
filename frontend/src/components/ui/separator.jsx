import * as React from "react";
import { cn } from "../../lib/utils";
import PropTypes from "prop-types";

const Separator = React.forwardRef(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "shrink-0 bg-border",
          orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
          className
        )}
        {...props}
        role={decorative ? "none" : "separator"}
        aria-orientation={decorative ? undefined : orientation}
      />
    );
  }
);

Separator.displayName = "Separator";

Separator.propTypes = {
  className: PropTypes.string,
  orientation: PropTypes.oneOf(["horizontal", "vertical"]),
  decorative: PropTypes.bool
};

export { Separator }; 