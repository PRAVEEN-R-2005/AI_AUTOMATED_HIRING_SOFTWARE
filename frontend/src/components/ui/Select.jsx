import React from "react";
import PropTypes from "prop-types";

const Select = React.forwardRef(({
  label = "",
  options = [],
  error = "",
  helperText = "",
  id,
  required = false,
  className = "",
  ...props
}, ref) => {
  return (
    <div className="form-field-group mb-3">
      {label && (
        <label htmlFor={id} className="form-label-custom d-block mb-1">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={`form-select ${error ? "is-invalid-custom" : ""} ${className}`}
        required={required}
        {...props}
      >
        {options.map((opt) => {
          const optionKey = opt.key ?? opt.id ?? opt.value;
          return (
            <option key={String(optionKey)} value={opt.value}>
              {opt.label}
            </option>
          );
        })}
      </select>
      {error && <p className="form-error-custom mt-1 text-danger" style={{ fontSize: "0.8rem", fontWeight: 500 }}>{error}</p>}
      {!error && helperText && <p className="form-helper-custom mt-1 text-muted-custom" style={{ fontSize: "0.8rem" }}>{helperText}</p>}
    </div>
  );
});

Select.displayName = "Select";

Select.propTypes = {
  label: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  error: PropTypes.string,
  helperText: PropTypes.string,
  id: PropTypes.string,
  required: PropTypes.bool,
  className: PropTypes.string,
};

export default Select;
