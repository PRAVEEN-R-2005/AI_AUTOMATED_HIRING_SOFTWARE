package com.ats.controller;

import com.ats.dto.LoginRequest;
import com.ats.dto.RegisterRequest;
import com.ats.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest body, HttpServletRequest request) {
        Map<String, Object> response = authService.registerUser(body, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@Valid @RequestBody LoginRequest body, HttpServletRequest request) {
        Map<String, Object> response = authService.loginUser(body, request);
        return ResponseEntity.ok(response);
    }
}
