package com.quickbite.support.model;

public class ChatMessage {
    private String role; // "user" or "model"
    private String text;

    public ChatMessage() {}

    public ChatMessage(String role, String text) {
        this.role = role;
        this.text = text;
    }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
}
