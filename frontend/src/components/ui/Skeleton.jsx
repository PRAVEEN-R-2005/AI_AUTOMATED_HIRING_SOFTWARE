import React from "react";
import PropTypes from "prop-types";

const Skeleton = ({
  variant = "text",
  width = null,
  height = null,
  className = "",
  style = {},
  ...props
}) => {
  const baseClass = "skeleton-pulse";
  const variantClass = variant !== "text" ? `skeleton-${variant}` : "";

  const customStyle = {
    ...(width && { width }),
    ...(height && { height }),
    ...style,
  };

  return (
    <div
      className={`${baseClass} ${variantClass} ${className}`}
      style={customStyle}
      {...props}
    />
  );
};

Skeleton.propTypes = {
  variant: PropTypes.oneOf(["text", "circle", "rect"]),
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string,
  style: PropTypes.object,
};

export default Skeleton;
