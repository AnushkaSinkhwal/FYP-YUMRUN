import * as React from "react";
import { cn } from "../../lib/utils";
import PropTypes from "prop-types";

const Container = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        className={cn(
          "w-full mx-auto px-4 md:px-6 max-w-full lg:max-w-7xl xl:max-w-[1280px]",
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

Container.displayName = "Container";

Container.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};

export { Container }; 