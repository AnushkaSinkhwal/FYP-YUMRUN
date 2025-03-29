import * as React from "react";
import { cn } from "../../lib/utils";
import PropTypes from "prop-types";

const Card = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        className={cn(
          "bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden",
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

Card.displayName = "Card";

Card.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))

CardHeader.displayName = "CardHeader"

CardHeader.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))

CardTitle.displayName = "CardTitle"

CardTitle.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-500 dark:text-gray-400", className)}
    {...props}
  />
))

CardDescription.displayName = "CardDescription"

CardDescription.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))

CardContent.displayName = "CardContent"

CardContent.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))

CardFooter.displayName = "CardFooter"

CardFooter.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }; 