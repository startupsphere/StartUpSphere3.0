package com.startupsphere.capstone.configs;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;

@Configuration
public class SecurityConfiguration {
    private final AuthenticationProvider authenticationProvider;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfiguration(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            AuthenticationProvider authenticationProvider) {
        this.authenticationProvider = authenticationProvider;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.HEAD, "/**").permitAll()
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/startups", "/startups/**").permitAll()
                        .requestMatchers("/stakeholders", "/stakeholders/**").permitAll()
                        .requestMatchers("/startup-stakeholders", "/startup-stakeholders/**").permitAll()
                        .requestMatchers("/api/likes", "/api/likes/**").permitAll()
                        .requestMatchers("/api/metrics", "/api/metrics/**").permitAll()
                        .requestMatchers("/api/rankings", "/api/rankings/**").permitAll()
                        .requestMatchers("/api/stakeholder-connections", "/api/stakeholder-connections/**").permitAll()
                        .requestMatchers("/recents", "/recents/**").permitAll()
                        .requestMatchers("/notifications", "/notifications/**").permitAll()
                        .requestMatchers("/users", "/users/**").permitAll()
                        .requestMatchers("/api/bookmarks", "/api/bookmarks/**").permitAll()
                        .anyRequest().permitAll())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(new CorsFilter(corsConfigurationSource()), UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Allow all origins including Vercel subdomains, custom domains, local development, and wildcard origin patterns
        configuration.setAllowedOriginPatterns(Arrays.asList(
            "*",
            "https://*.vercel.app",
            "https://start-up-sphere3-0.vercel.app",
            "http://localhost:*",
            "https://localhost:*",
            "http://127.0.0.1:*"
        ));
        
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setExposedHeaders(Arrays.asList("Set-Cookie", "Authorization", "Access-Control-Allow-Origin", "Access-Control-Allow-Credentials"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}