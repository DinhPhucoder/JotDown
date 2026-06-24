package com.jotdown.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class JotDownApplication {
    public static void main(String[] args) {
        SpringApplication.run(JotDownApplication.class, args);
    }
}
