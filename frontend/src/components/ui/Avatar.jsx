import { useState } from "react";
import PropTypes from "prop-types";

const Avatar = ({
  src = "",
  name = "User",
  size = "md",
  className = "",
  ...props
}) => {
  const [error, setError] = useState(false);

  const getInitials = (fullName) => {
    if (!fullName) return "U";
    const parts = fullName.trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  const initials = getInitials(name);
  const sizeClass = `avatar-custom-${size}`;

  return (
    <div
      className={`avatar-custom ${sizeClass} ${className}`}
      title={name}
      {...props}
    >
      {src && !error ? (
        <img
          src={src}
          alt={name}
          onError={() => setError(true)}
        />
      ) : (
        <span className="avatar-initials">{initials}</span>
      )}
    </div>
  );
};

Avatar.propTypes = {
  src: PropTypes.string,
  name: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  className: PropTypes.string,
};

export default Avatar;
