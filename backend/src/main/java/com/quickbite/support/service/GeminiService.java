package com.quickbite.support.service;

import com.quickbite.support.model.ChatMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;
import java.time.Duration;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    private final WebClient webClient;
    private final String apiKey;
    private final String model;

    private static final String SYSTEM_PROMPT = """
            You are QuickBite's senior AI customer support specialist. You provide thoughtful, thorough, and empathetic responses — never rushed one-liners.

            RESPONSE STYLE:
            - Always acknowledge the customer's frustration/concern first
            - Analyze the issue from multiple angles before responding
            - Provide structured, step-by-step solutions
            - Use clear formatting with line breaks
            - End with a proactive follow-up question
            - Be warm but professional — never robotic
            - Keep responses between 3-6 sentences, well-structured

            CONTEXT:
            - You are QuickBite Assistant, working specifically for **Pizza Palace**.
            - The customer has ordered a **Cheese Burst Margherita Pizza** (Order #QB-85492).
            - You can offer credits, refunds, and escalation to human agents.
            - Never mention you are an AI or Gemini — you are QuickBite Assistant.

            STRICT RULE SET FOR DEMO SCENARIOS:
            - If they complain about poor quality (e.g. cheese not cooked): Apologize, mention the Cheese Burst Margherita Pizza (Order #QB-85492), and tell them they will be fully refunded.
            - If they receive the wrong pizza: Tell them to keep it with our compliments and that we will refund their money entirely for Order #QB-85492.
            - If it's a veg/non-veg mix-up: Offer an extreme apology for the severity of the mix-up, initiate a full refund for Order #QB-85492, and promise an executive will call them soon.
            - If the pizza has spillage: Initiate a full refund for the damaged Cheese Burst Margherita Pizza.
            - If they complain about a rude delivery person: Apologize, promise strict action, and state an executive will call them soon to resolve the matter.
            - If they state their order was NEVER received: Reply EXACTLY with "This issue cannot be handled by the chatbot. I am transferring you to a human agent immediately. [TRANSFER]"

            IMPORTANT: Do NOT use markdown bold/italics (like ** or ##) in your generated responses. Use plain text with line breaks and emojis for structure. Ensure your tone is highly empathetic and maximum customer satisfaction is achieved.""";

    public GeminiService(
            @Value("${gemini.api.url}") String apiUrl,
            @Value("${gemini.api.key}") String apiKey,
            @Value("${gemini.api.model}") String model) {
        this.apiKey = apiKey;
        this.model = model;
        this.webClient = WebClient.builder()
                .baseUrl(apiUrl)
                .build();
    }

    @SuppressWarnings("unchecked")
    public Mono<String> chat(List<ChatMessage> messages) {
        // Build Gemini API request body
        List<Map<String, Object>> contents = new ArrayList<>();
        for (ChatMessage msg : messages) {
            Map<String, Object> content = new HashMap<>();
            content.put("role", msg.getRole());
            content.put("parts", List.of(Map.of("text", msg.getText())));
            contents.add(content);
        }

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("system_instruction", Map.of("parts", List.of(Map.of("text", SYSTEM_PROMPT))));
        requestBody.put("contents", contents);

        List<String> modelCascade = Arrays.asList(this.model, "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro");
        List<String> uniqueModels = new ArrayList<>();
        for (String m : modelCascade) {
            if (!uniqueModels.contains(m)) {
                uniqueModels.add(m);
            }
        }

        // Call Gemini API non-blocking with recursive failover
        return executeWithFailover(uniqueModels, requestBody);
    }

    private Mono<String> executeWithFailover(List<String> models, Map<String, Object> requestBody) {
        if (models.isEmpty()) {
            return Mono.error(new RuntimeException("All Gemini fallback models exhausted due to rate/quota limits."));
        }

        String currentModel = models.get(0);
        List<String> remainingModels = models.subList(1, models.size());

        return executeWithModel(currentModel, requestBody)
                .onErrorResume(e -> {
                    if (e instanceof org.springframework.web.reactive.function.client.WebClientResponseException ex) {
                        int status = ex.getStatusCode().value();
                        if (status == 429 || status == 403 || status == 503) {
                            System.err.println("Model " + currentModel + " rate limited (" + status + "). Failing over to next...");
                            return executeWithFailover(remainingModels, requestBody);
                        }
                    }
                    return Mono.error(e);
                });
    }

    @SuppressWarnings("unchecked")
    private Mono<String> executeWithModel(String targetModel, Map<String, Object> requestBody) {
        String url = "/" + targetModel + ":generateContent?key=" + apiKey;

        return webClient.post()
                .uri(url)
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> {
                    // Extract text from response
                    if (response != null && response.containsKey("candidates")) {
                        List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
                        if (!candidates.isEmpty()) {
                            Map<String, Object> firstCandidate = candidates.get(0);
                            Map<String, Object> content = (Map<String, Object>) firstCandidate.get("content");
                            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                            if (!parts.isEmpty()) {
                                String text = (String) parts.get(0).get("text");
                                // Strip markdown formatting
                                return text
                                        .replaceAll("\\*\\*(.*?)\\*\\*", "$1")
                                        .replaceAll("##\\s*(.*)", "$1")
                                        .trim();
                            }
                        }
                    }
                    throw new RuntimeException("Empty response from Gemini API");
                });
    }
}
