import React from "react";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "100vh",
                    background: "var(--background, #f8fafc)",
                    fontFamily: "var(--font-sans, 'Inter', sans-serif)",
                    padding: "2rem"
                }}>
                    <div style={{
                        textAlign: "center",
                        maxWidth: 480,
                        padding: "2.5rem",
                        background: "var(--surface, #ffffff)",
                        borderRadius: "var(--radius-md, 12px)",
                        border: "1px solid var(--border, #e2e8f0)",
                        boxShadow: "0 4px 24px rgba(0,0,0,0.08)"
                    }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: "50%",
                            background: "rgba(239,68,68,0.1)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            margin: "0 auto 1.5rem",
                            fontSize: "1.8rem"
                        }}>
                            ⚠️
                        </div>
                        <h2 style={{
                            fontSize: "1.3rem",
                            fontWeight: 700,
                            color: "var(--text-primary, #0f172a)",
                            marginBottom: "0.75rem"
                        }}>
                            Something went wrong
                        </h2>
                        <p style={{
                            fontSize: "0.9rem",
                            color: "var(--text-secondary, #64748b)",
                            marginBottom: "1.5rem",
                            lineHeight: 1.5
                        }}>
                            An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                background: "var(--primary, #6366f1)",
                                color: "#fff",
                                border: "none",
                                borderRadius: "var(--radius-sm, 8px)",
                                padding: "10px 24px",
                                fontSize: "0.9rem",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "opacity 0.15s ease"
                            }}
                            onMouseEnter={e => e.target.style.opacity = "0.9"}
                            onMouseLeave={e => e.target.style.opacity = "1"}
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
