package com.ats.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CommentRequest {

    @NotBlank(message = "Resource type is required")
    private String resourceType;

    @NotNull(message = "Resource ID is required")
    private Integer resourceId;

    @NotBlank(message = "Comment content cannot be empty")
    private String content;

    // Getters and Setters
    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }

    public Integer getResourceId() { return resourceId; }
    public void setResourceId(Integer resourceId) { this.resourceId = resourceId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
