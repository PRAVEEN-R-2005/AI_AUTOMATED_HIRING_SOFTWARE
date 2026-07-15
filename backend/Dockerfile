# === Stage 1: Build ===
FROM eclipse-temurin:17-jdk AS builder

WORKDIR /app

# Copy Maven wrapper and config first (layer caching for dependencies)
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Make Maven wrapper executable
RUN chmod +x mvnw

# Download dependencies (cached unless pom.xml changes)
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY src/ src/

# Build the fat JAR, skip tests for faster deploy
RUN ./mvnw clean package -DskipTests -B

# === Stage 2: Runtime ===
FROM eclipse-temurin:17-jre

WORKDIR /app

# Copy the built JAR from the builder stage
COPY --from=builder /app/target/*.jar app.jar

# Render sets PORT dynamically; Spring Boot reads server.port from env
ENV PORT=8080
EXPOSE ${PORT}

# Run the application
# Spring Boot automatically picks up environment variables:
#   SERVER_PORT, SPRING_DATASOURCE_URL, SPRING_DATASOURCE_USERNAME,
#   SPRING_DATASOURCE_PASSWORD, JWT_SECRET, etc.
ENTRYPOINT java -jar app.jar --server.port=${PORT}
