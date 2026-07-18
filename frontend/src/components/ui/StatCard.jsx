import PropTypes from "prop-types";
import { Card, CardContent } from "./Card";
import Skeleton from "./Skeleton";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

const StatCard = ({
  title = "",
  value = "",
  icon = null,
  trend = "",
  trendDirection = "neutral",
  description = "",
  loading = false,
  className = "",
}) => {
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="d-flex flex-column gap-2 p-4">
          <Skeleton variant="text" width="50%" height={16} />
          <Skeleton variant="rect" width="70%" height={32} className="my-1" />
          <Skeleton variant="text" width="90%" height={14} />
        </CardContent>
      </Card>
    );
  }

  const getTrendColor = () => {
    if (trendDirection === "up") return "text-success";
    if (trendDirection === "down") return "text-danger";
    return "text-muted-custom";
  };

  const getTrendIcon = () => {
    if (trendDirection === "up") return <FaArrowUp className="me-1" style={{ fontSize: "0.75rem" }} />;
    if (trendDirection === "down") return <FaArrowDown className="me-1" style={{ fontSize: "0.75rem" }} />;
    return null;
  };

  return (
    <Card className={className}>
      <CardContent className="d-flex align-items-center justify-content-between p-4">
        <div className="d-flex flex-column gap-1">
          <span
            className="text-muted-custom text-uppercase fw-semibold"
            style={{ fontSize: "0.75rem", letterSpacing: "0.05em" }}
          >
            {title}
          </span>
          <h2 className="fw-bold mb-0" style={{ color: "var(--text-primary)", fontSize: "1.75rem", lineHeight: 1.2 }}>
            {value}
          </h2>
          {(trend || description) && (
            <div className="d-flex align-items-center gap-1 mt-1" style={{ fontSize: "0.8rem" }}>
              {trend && (
                <span className={`fw-semibold d-flex align-items-center ${getTrendColor()}`}>
                  {getTrendIcon()}
                  {trend}
                </span>
              )}
              {description && <span className="text-muted-custom">{description}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div
            className="d-flex align-items-center justify-content-center rounded-circle"
            style={{
              width: "48px",
              height: "48px",
              backgroundColor: "var(--primary-light)",
              color: "var(--primary)",
              fontSize: "1.25rem",
              flexShrink: 0
            }}
          >
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.node,
  trend: PropTypes.string,
  trendDirection: PropTypes.oneOf(["up", "down", "neutral"]),
  description: PropTypes.string,
  loading: PropTypes.bool,
  className: PropTypes.string,
};

export default StatCard;
