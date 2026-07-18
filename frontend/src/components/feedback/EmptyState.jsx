import PropTypes from "prop-types";
import Button from "../ui/Button";

const EmptyState = ({
  title = "No Data Available",
  description = "There are no records to display at this time.",
  icon = null,
  actionText = "",
  onActionClick = null,
  className = "",
}) => {
  return (
    <div
      className={`text-center py-5 px-4 card-custom surface-custom border-custom d-flex flex-column align-items-center justify-content-center gap-3 ${className}`}
      style={{ minHeight: "300px" }}
    >
      {icon && <div className="text-muted-custom mb-2" style={{ fontSize: "3rem", lineHeight: 1 }}>{icon}</div>}
      <h4 className="fw-bold mb-0" style={{ color: "var(--text-primary)" }}>{title}</h4>
      <p className="text-muted-custom mx-auto mb-0" style={{ maxWidth: "450px", fontSize: "0.95rem" }}>{description}</p>
      {actionText && onActionClick && (
        <Button variant="primary" onClick={onActionClick} className="mt-2">
          {actionText}
        </Button>
      )}
    </div>
  );
};

EmptyState.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  icon: PropTypes.node,
  actionText: PropTypes.string,
  onActionClick: PropTypes.func,
  className: PropTypes.string,
};

export default EmptyState;
