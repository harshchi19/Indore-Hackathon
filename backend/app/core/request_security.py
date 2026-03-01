"""
Verdant Backend – Request Security Middleware
Implements request ID tracking, input size limits, and request validation.
"""

from __future__ import annotations

import uuid
from typing import Callable

from fastapi import Request, status
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import JSONResponse, Response

from app.core.config import get_settings
from app.core.logging import get_logger

settings = get_settings()
logger = get_logger("request_security")

# Maximum request body sizes (in bytes)
MAX_BODY_SIZE = 10 * 1024 * 1024  # 10 MB default
MAX_JSON_SIZE = 1 * 1024 * 1024   # 1 MB for JSON
MAX_FILE_UPLOAD_SIZE = 50 * 1024 * 1024  # 50 MB for file uploads


class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Middleware that adds a unique request ID to each request.
    
    This enables:
    - Request tracing across services
    - Log correlation
    - Debugging and incident investigation
    """
    
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Skip processing for WebSocket upgrades
        if request.scope.get("type") == "websocket" or request.headers.get("upgrade", "").lower() == "websocket":
            return await call_next(request)

        # Generate or use existing request ID
        request_id = request.headers.get("X-Request-ID")
        if not request_id:
            request_id = str(uuid.uuid4())
        
        # Store in request state for access in handlers
        request.state.request_id = request_id
        
        # Process request
        response = await call_next(request)
        
        # Add request ID to response headers
        response.headers["X-Request-ID"] = request_id
        
        return response


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware that enforces request body size limits.
    
    Protects against:
    - Denial of Service (DoS) via large payloads
    - Memory exhaustion attacks
    - Slow POST attacks
    """
    
    def __init__(self, app, max_body_size: int = MAX_BODY_SIZE):
        super().__init__(app)
        self.max_body_size = max_body_size
    
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Skip processing for WebSocket upgrades
        if request.scope.get("type") == "websocket" or request.headers.get("upgrade", "").lower() == "websocket":
            return await call_next(request)

        # Check Content-Length header
        content_length = request.headers.get("content-length")
        
        if content_length:
            try:
                size = int(content_length)
                
                # Determine limit based on content type
                content_type = request.headers.get("content-type", "")
                
                if "application/json" in content_type:
                    max_size = MAX_JSON_SIZE
                elif "multipart/form-data" in content_type:
                    max_size = MAX_FILE_UPLOAD_SIZE
                else:
                    max_size = self.max_body_size
                
                if size > max_size:
                    logger.warning(
                        "Request body too large: %d bytes (max: %d) from %s",
                        size, max_size, 
                        request.client.host if request.client else "unknown"
                    )
                    return JSONResponse(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        content={
                            "detail": f"Request body too large. Maximum size: {max_size // 1024} KB"
                        }
                    )
            except ValueError:
                pass
        
        return await call_next(request)


class SuspiciousRequestMiddleware(BaseHTTPMiddleware):
    """
    Middleware that detects and blocks suspicious requests.
    
    Checks for:
    - Path traversal attempts
    - SQL injection patterns
    - XSS patterns
    - Common exploit signatures
    """
    
    # Suspicious patterns to check
    SUSPICIOUS_PATTERNS = [
        "../",           # Path traversal
        "..\\",          # Windows path traversal
        "<script",       # XSS
        "javascript:",   # XSS
        "onclick=",      # XSS
        "onerror=",      # XSS
        "' OR ",         # SQL injection
        "\" OR ",        # SQL injection
        "1=1",           # SQL injection
        "DROP TABLE",    # SQL injection
        "UNION SELECT",  # SQL injection
        "${",            # Template injection
        "{{",            # Template injection
        "cmd=",          # Command injection
        "exec(",         # Command injection
        "system(",       # Command injection
        "%00",           # Null byte injection
        "\x00",          # Null byte
    ]
    
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Skip processing for WebSocket upgrades
        if request.scope.get("type") == "websocket" or request.headers.get("upgrade", "").lower() == "websocket":
            return await call_next(request)

        # Check URL path
        path = request.url.path.lower()
        query = str(request.url.query).lower() if request.url.query else ""
        
        # Combine for checking
        check_string = f"{path}?{query}"
        
        for pattern in self.SUSPICIOUS_PATTERNS:
            if pattern.lower() in check_string:
                client_ip = request.client.host if request.client else "unknown"
                logger.warning(
                    "Suspicious request blocked: pattern='%s' path='%s' ip='%s'",
                    pattern, request.url.path, client_ip
                )
                
                # Import here to avoid circular dependency
                from app.core.audit_log import audit_logger
                audit_logger.log_suspicious_activity(
                    ip_address=client_ip,
                    description=f"Suspicious pattern detected: {pattern}"
                )
                
                return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content={"detail": "Invalid request"}
                )
        
        return await call_next(request)


class AdminIPWhitelistMiddleware(BaseHTTPMiddleware):
    """
    Middleware that restricts admin routes to whitelisted IPs.
    
    Only applies to routes starting with /api/v1/admin/
    """
    
    # Whitelisted IPs for admin access (configure via env in production)
    # Empty list means all IPs allowed
    ADMIN_WHITELIST = []
    
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Only check admin routes
        if not request.url.path.startswith(f"{settings.API_V1_PREFIX}/admin"):
            return await call_next(request)
        
        # Skip if no whitelist configured
        if not self.ADMIN_WHITELIST:
            return await call_next(request)
        
        # Get client IP
        client_ip = self._get_client_ip(request)
        
        if client_ip not in self.ADMIN_WHITELIST:
            logger.warning(
                "Admin access denied for IP: %s (path: %s)",
                client_ip, request.url.path
            )
            
            from app.core.audit_log import audit_logger
            audit_logger.log_access_denied(
                ip_address=client_ip,
                resource=request.url.path,
                required_role="admin (IP whitelist)"
            )
            
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "Access denied"}
            )
        
        return await call_next(request)
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP, considering proxy headers."""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()
        return request.client.host if request.client else "unknown"
