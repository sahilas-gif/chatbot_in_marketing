package com.quickbite.support.controller;

import com.quickbite.support.model.ChatRequest;
import com.quickbite.support.model.ChatResponse;
import com.quickbite.support.service.GeminiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api")
public class ChatController {

    private final GeminiService geminiService;

    public ChatController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @PostMapping("/chat")
    public Mono<ResponseEntity<ChatResponse>> chat(@RequestBody ChatRequest request) {
        if (request.getMessages() == null || request.getMessages().isEmpty()) {
            return Mono.just(ResponseEntity.badRequest()
                    .body(ChatResponse.fail("Messages cannot be empty")));
        }

        return geminiService.chat(request.getMessages())
                .map(reply -> ResponseEntity.ok(ChatResponse.ok(reply)))
                .onErrorResume(e -> {
                    System.err.println("Chat API Error: " + e.getMessage());
                    return Mono.just(ResponseEntity.ok(
                            ChatResponse.ok("⚠️ Gemini API Error: " + e.getMessage() + "\n\nPlease try sending your message again.")
                    ));
                });
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("QuickBite Support Backend is running");
    }
}
