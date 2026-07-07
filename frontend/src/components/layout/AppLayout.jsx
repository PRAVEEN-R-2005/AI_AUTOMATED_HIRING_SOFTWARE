import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useLocation } from "react-router-dom";

const AppLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sidebar-collapsed") === "true";
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", isCollapsed);
  }, [isCollapsed]);

  // Close drawer on path change (mobile)
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => {
    if (window.innerWidth < 992) {
      setIsMobileOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => !prev);
    }
  };

  return (
    <div className="app-shell d-flex">
      {/* Mobile drawer overlay */}
      {isMobileOpen && (
        <div
          className="sidebar-overlay d-lg-none"
          onClick={() => setIsMobileOpen(false)}
          role="presentation"
        />
      )}

      <Sidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      <div className="main-container d-flex flex-column flex-grow-1 min-vh-100">
        <Navbar toggleSidebar={toggleSidebar} isCollapsed={isCollapsed} />
        <main className="content-area p-4 flex-grow-1">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
