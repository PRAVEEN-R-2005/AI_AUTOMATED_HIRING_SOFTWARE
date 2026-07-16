# === Stage 1: Build ===
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /app

# Copy POM first for dependency caching
COPY pom.xml ./

# Download dependencies (cached unless pom.xml changes)
RUN mvn dependency:go-offline -B

# Copy source code and Maven wrapper (kept in repo for local dev)
COPY src/ src/

# Build the fat JAR, skip tests for faster deploy
RUN mvn clean package -DskipTests -B

# === Stage 2: Runtime ===
FROM eclipse-temurin:17-jre

WORKDIR /app

# Copy the built JAR from the builder stage
COPY --from=builder /app/target/*.jar app.jar

# Create uploads directory for resume/JD storage
RUN mkdir -p uploads/resumes uploads/JD

# Render injects PORT at runtime; default to 8080
ENV PORT=8080
ENV SPRING_PROFILES_ACTIVE=production
EXPOSE ${PORT}

# Run the application
ENTRYPOINT java -jar app.jar --server.port=${PORT}

