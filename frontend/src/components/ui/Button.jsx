import React from "react";
import PropTypes from "prop-types";

const Button = React.forwardRef(({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  iconBefore = null,
  iconAfter = null,
  type = "button",
  className = "",
  onClick,
  ...props
}, ref) => {
  const baseClass = "btn-custom";
  const variantClass = `btn-custom-${variant}`;
  const sizeClass = `btn-custom-${size}`;
  const isButtonDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}
      disabled={isButtonDisabled}
      onClick={onClick}
      {...props}
    >
      {loading && <span className="btn-spinner" aria-hidden="true" />}
      {!loading && iconBefore && <span className="btn-icon-before">{iconBefore}</span>}
      <span className="btn-content">{children}</span>
      {!loading && iconAfter && <span className="btn-icon-after">{iconAfter}</span>}
    </button>
  );
});

Button.displayName = "Button";

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(["primary", "secondary", "outline", "ghost", "destructive"]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  iconBefore: PropTypes.node,
  iconAfter: PropTypes.node,
  type: PropTypes.string,
  className: PropTypes.string,
  onClick: PropTypes.func,
};

export default Button;
