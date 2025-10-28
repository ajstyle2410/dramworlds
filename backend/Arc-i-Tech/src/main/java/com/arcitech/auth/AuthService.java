package com.arcitech.auth;

import com.arcitech.security.JwtService;
import com.arcitech.user.User;
import com.arcitech.user.UserProfile;
import com.arcitech.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtService jwtService;

    public AuthResponse register(RegisterRequest request) {
        User user = userService.createCustomer(request.fullName(), request.email(), request.password());
        String token = jwtService.generateToken(user);
        return new AuthResponse(token, jwtService.getExpirationMs(), UserProfile.from(user));
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );
        User user = (User) authentication.getPrincipal();
        String token = jwtService.generateToken(user);
        return new AuthResponse(token, jwtService.getExpirationMs(), UserProfile.from(user));
    }
}
