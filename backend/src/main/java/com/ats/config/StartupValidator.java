package com.ats.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

/**
 * Validates that all required environment variables are set at startup.
 * Runs before database initialization to give clear, actionable error messages
 * instead of cryptic Spring placeholder resolution or HikariCP connection failures.
 */
@Configuration
@Order(0)
public class StartupValidator {

    @Value("${spring.datasource.url:}")
    private String datasourceUrl;

    @Value("${spring.datasource.username:}")
    private String datasourceUsername;

    @Value("${spring.datasource.password:}")
    private String datasourcePassword;

    @Value("${jwt.secret:}")
    private String jwtSecret;

    @Value("${server.port:8080}")
    private String serverPort;

    @PostConstruct
    public void validateEnvironment() {
        System.out.println("========================================");
        System.out.println("  ATS Backend — Startup Environment Check");
        System.out.println("========================================");
        System.out.println("  PORT        = " + serverPort);
        System.out.println("  DB URL      = " + (isBlank(datasourceUrl) ? "*** NOT SET ***" : maskUrl(datasourceUrl)));
        System.out.println("  DB Username = " + (isBlank(datasourceUsername) ? "*** NOT SET ***" : datasourceUsername));
        System.out.println("  DB Password = " + (isBlank(datasourcePassword) ? "*** NOT SET ***" : "****"));
        System.out.println("  JWT Secret  = " + (isBlank(jwtSecret) ? "*** NOT SET ***" : "****"));
        System.out.println("========================================");

        StringBuilder errors = new StringBuilder();

        if (isBlank(datasourceUrl)) {
            errors.append("\n  - SPRING_DATASOURCE_URL is not set. "
                    + "Set it in the Render Dashboard under Environment, e.g.: "
                    + "jdbc:mysql://<TIDB_HOST>:4000/<DATABASE>?sslMode=VERIFY_IDENTITY");
        }
        if (isBlank(datasourceUsername)) {
            errors.append("\n  - SPRING_DATASOURCE_USERNAME is not set.");
        }
        if (isBlank(datasourcePassword)) {
            errors.append("\n  - SPRING_DATASOURCE_PASSWORD is not set.");
        }
        if (isBlank(jwtSecret) || "default-dev-secret-change-me".equals(jwtSecret)) {
            errors.append("\n  - JWT_SECRET is not set (or still using the insecure default). "
                    + "Set a strong random secret in the Render Dashboard.");
        }

        if (errors.length() > 0) {
            System.err.println("==========================================");
            System.err.println("  FATAL: Missing required environment variables:");
            System.err.println(errors);
            System.err.println();
            System.err.println("  Set these in your Render Dashboard > Environment tab.");
            System.err.println("==========================================");
            throw new IllegalStateException("Missing required environment variables." + errors);
        }

        System.out.println("  All required environment variables are present.");
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String maskUrl(String url) {
        // Show host portion but mask credentials if embedded in URL
        if (url.contains("@")) {
            int atIndex = url.indexOf("@");
            return "jdbc:mysql://****@" + url.substring(atIndex + 1);
        }
        return url;
    }
}
