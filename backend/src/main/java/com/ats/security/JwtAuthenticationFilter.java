package com.ats.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            logger.info("Incoming request to: {}", request.getRequestURI());
            
            String rawHeader = request.getHeader("Authorization");
            logger.info("Raw Authorization header: {}", rawHeader != null ? (rawHeader.length() > 20 ? rawHeader.substring(0, 20) + "..." : rawHeader) : "null");

            String jwt = getJwtFromRequest(request);
            logger.info("Raw JWT extracted: {}", jwt != null ? jwt.substring(0, Math.min(jwt.length(), 20)) + "..." : "null");

            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                Claims claims = tokenProvider.getClaimsFromJWT(jwt);
                
                Number idNum = claims.get("id", Number.class);
                int id = idNum != null ? idNum.intValue() : 0;
                
                String role = claims.get("role", String.class);
                String email = claims.get("email", String.class);
                
                Number orgIdNum = claims.get("organization_id", Number.class);
                Integer organizationId = orgIdNum != null ? orgIdNum.intValue() : null;

                CustomUserDetails userDetails = new CustomUserDetails(id, email, role, organizationId);
                
                logger.info("User Details Authorities: {}", userDetails.getAuthorities());

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
                logger.info("Authentication set in SecurityContextHolder for email: {}, role: {}", email, role);
            } else {
                logger.warn("JWT is missing, empty, or invalid (tokenProvider.validateToken returned false)");
            }
        } catch (Exception ex) {
            logger.error("JWT Authentication Failed", ex);
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
