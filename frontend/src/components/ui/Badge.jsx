import PropTypes from "prop-types";

const Badge = ({
  children,
  variant = "secondary",
  className = "",
  ...props
}) => {
  const baseClass = "badge-custom";
  const variantClass = `badge-custom-${variant}`;

  return (
    <span className={`${baseClass} ${variantClass} ${className}`} {...props}>
      {children}
    </span>
  );
};

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(["primary", "success", "warning", "danger", "info", "secondary"]),
  className: PropTypes.string,
};

export default Badge;
