import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";

const Modal = ({
  isOpen = false,
  onClose,
  title = "",
  children,
  footer = null,
  size = "md",
  className = "",
}) => {
  const modalRef = useRef(null);
  const previouslyFocusedElement = useRef(null);

  // Esc key close action
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement;
      document.body.style.overflow = "hidden";
      // Focus modal close button or container for accessibility
      if (modalRef.current) {
        modalRef.current.focus();
      }
    } else {
      document.body.style.overflow = "unset";
      if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        tabIndex="-1"
        className={`modal-wrapper modal-wrapper-${size} ${className}`}
        style={{ outline: "none" }}
      >
        <div className="modal-custom-header">
          <h3 id="modal-title" className="modal-custom-title">
            {title}
          </h3>
          <button
            type="button"
            className="modal-custom-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        <div className="modal-custom-body">{children}</div>
        {footer && <div className="modal-custom-footer">{footer}</div>}
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.node,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  className: PropTypes.string,
};

export default Modal;
