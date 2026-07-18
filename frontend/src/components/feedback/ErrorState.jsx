import PropTypes from "prop-types";
import Button from "../ui/Button";
import { FaExclamationTriangle } from "react-icons/fa";

const ErrorState = ({
  title = "Something Went Wrong",
  description = "We encountered an error loading this content. Please try again.",
  onRetry = null,
  className = "",
}) => {
  return (
    <div
      className={`text-center py-5 px-4 card-custom surface-custom border-custom d-flex flex-column align-items-center justify-content-center gap-3 ${className}`}
      style={{ minHeight: "300px", borderLeft: "4px solid var(--error)" }}
    >
      <div className="text-danger mb-2" style={{ fontSize: "3rem", lineHeight: 1 }}>
        <FaExclamationTriangle />
      </div>
      <h4 className="fw-bold mb-0" style={{ color: "var(--text-primary)" }}>{title}</h4>
      <p className="text-muted-custom mx-auto mb-0" style={{ maxWidth: "450px", fontSize: "0.95rem" }}>{description}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-2">
          Try Again
        </Button>
      )}
    </div>
  );
};

ErrorState.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  onRetry: PropTypes.func,
  className: PropTypes.string,
};

export default ErrorState;
