import React from "react";
import PropTypes from "prop-types";

const Input = React.forwardRef(({
  label = "",
  error = "",
  helperText = "",
  id,
  required = false,
  className = "",
  type = "text",
  ...props
}, ref) => {
  return (
    <div className="form-field-group mb-3">
      {label && (
        <label htmlFor={id} className="form-label-custom d-block mb-1">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        type={type}
        className={`form-control ${error ? "is-invalid-custom" : ""} ${className}`}
        required={required}
        {...props}
      />
      {error && <p className="form-error-custom mt-1 text-danger" style={{ fontSize: "0.8rem", fontWeight: 500 }}>{error}</p>}
      {!error && helperText && <p className="form-helper-custom mt-1 text-muted-custom" style={{ fontSize: "0.8rem" }}>{helperText}</p>}
    </div>
  );
});

Input.displayName = "Input";

Input.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  id: PropTypes.string,
  required: PropTypes.bool,
  className: PropTypes.string,
  type: PropTypes.string,
};

export default Input;
