import PropTypes from "prop-types";

export const Card = ({ children, className = "", ...props }) => {
  return (
    <div className={`card-custom ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = "", ...props }) => {
  return (
    <div className={`card-custom-header ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className = "", tag: Tag = "h3", ...props }) => {
  return (
    <Tag className={`card-custom-title ${className}`} {...props}>
      {children}
    </Tag>
  );
};

export const CardDescription = ({ children, className = "", ...props }) => {
  return (
    <p className={`card-custom-description ${className}`} {...props}>
      {children}
    </p>
  );
};

export const CardContent = ({ children, className = "", ...props }) => {
  return (
    <div className={`card-custom-content ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className = "", ...props }) => {
  return (
    <div className={`card-custom-footer ${className}`} {...props}>
      {children}
    </div>
  );
};

Card.propTypes = { children: PropTypes.node.isRequired, className: PropTypes.string };
CardHeader.propTypes = { children: PropTypes.node.isRequired, className: PropTypes.string };
CardTitle.propTypes = { children: PropTypes.node.isRequired, className: PropTypes.string, tag: PropTypes.string };
CardDescription.propTypes = { children: PropTypes.node.isRequired, className: PropTypes.string };
CardContent.propTypes = { children: PropTypes.node.isRequired, className: PropTypes.string };
CardFooter.propTypes = { children: PropTypes.node.isRequired, className: PropTypes.string };
