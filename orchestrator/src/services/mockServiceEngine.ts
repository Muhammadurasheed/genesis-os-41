import asyncio
import json
import logging
from typing import Dict, Any, List, Optional
import aiohttp
import time
from datetime import datetime

logger = logging.getLogger("advanced_mock_service")

class MockServiceEngine:
    """FAANG-level mock service engine with intelligent failure simulation"""
    
    def __init__(self):
        self.mock_services: Dict[str, Dict] = {}
        self.service_states: Dict[str, Dict] = {}
        self.global_failure_rate = 0.0
        self.latency_multiplier = 1.0
        self.circuit_breakers: Dict[str, Dict] = {}
        
        # Predefined service templates
        self.service_templates = {
            "payment_gateway": {
                "base_latency_ms": 150,
                "failure_scenarios": ["timeout", "insufficient_funds", "card_declined", "network_error"],
                "typical_responses": {
                    "success": {"status": "approved", "transaction_id": "txn_123456"},
                    "insufficient_funds": {"status": "declined", "error": "Insufficient funds"},
                    "card_declined": {"status": "declined", "error": "Card declined by issuer"}
                }
            },
            "user_authentication": {
                "base_latency_ms": 80,
                "failure_scenarios": ["invalid_credentials", "account_locked", "service_unavailable"],
                "typical_responses": {
                    "success": {"authenticated": True, "user_id": "user_123", "session_token": "sess_abc"},
                    "invalid_credentials": {"authenticated": False, "error": "Invalid username or password"},
                    "account_locked": {"authenticated": False, "error": "Account temporarily locked"}
                }
            },
            "email_service": {
                "base_latency_ms": 300,
                "failure_scenarios": ["rate_limited", "invalid_email", "smtp_error"],
                "typical_responses": {
                    "success": {"sent": True, "message_id": "msg_789"},
                    "rate_limited": {"sent": False, "error": "Rate limit exceeded"},
                    "invalid_email": {"sent": False, "error": "Invalid email address"}
                }
            },
            "data_analytics": {
                "base_latency_ms": 1200,
                "failure_scenarios": ["query_timeout", "data_not_found", "processing_error"],
                "typical_responses": {
                    "success": {"data": {"users": 1234, "revenue": 56789, "conversion_rate": 0.12}},
                    "query_timeout": {"error": "Query execution timeout"},
                    "data_not_found": {"error": "No data found for specified parameters"}
                }
            }
        }
        
        logger.info("🎭 Advanced Mock Service Engine initialized with enterprise patterns")
    
    async def create_mock_service(self, service_name: str, config: Dict[str, Any]) -> str:
        """Create a new mock service with comprehensive configuration"""
        service_id = f"mock_{service_name}_{int(time.time())}"
        
        # Merge with template if available
        template = self.service_templates.get(service_name, {})
        
        service_config = {
            "id": service_id,
            "name": service_name,
            "base_url": config.get("base_url", f"https://api.{service_name}.com"),
            "base_latency_ms": config.get("base_latency_ms", template.get("base_latency_ms", 200)),
            "reliability": config.get("reliability", 0.95),  # 95% uptime
            "rate_limit": config.get("rate_limit", {"requests_per_minute": 100}),
            "failure_scenarios": config.get("failure_scenarios", template.get("failure_scenarios", ["timeout", "server_error"])),
            "response_templates": config.get("response_templates", template.get("typical_responses", {})),
            "circuit_breaker": {
                "failure_threshold": 5,
                "recovery_timeout_ms": 30000,
                "enabled": True
            },
            "created_at": datetime.utcnow().isoformat()
        }
        
        self.mock_services[service_id] = service_config
        self.service_states[service_id] = {
            "status": "healthy",
            "consecutive_failures": 0,
            "last_failure": None,
            "circuit_state": "closed",  # closed, open, half_open
            "request_count": 0,
            "failure_count": 0
        }
        
        logger.info(f"🎭 Created mock service: {service_name} ({service_id})")
        return service_id
    
    async def simulate_api_call(self, service_id: str, endpoint: str, method: str = "GET", 
                               payload: Dict = None, headers: Dict = None) -> Dict[str, Any]:
        """Simulate an API call with realistic behavior patterns"""
        if service_id not in self.mock_services:
            raise ValueError(f"Mock service {service_id} not found")
        
        service = self.mock_services[service_id]
        state = self.service_states[service_id]
        
        # Update request metrics
        state["request_count"] += 1
        
        # Check circuit breaker
        if state["circuit_state"] == "open":
            if time.time() - (state.get("circuit_opened_at", 0)) > (service["circuit_breaker"]["recovery_timeout_ms"] / 1000):
                state["circuit_state"] = "half_open"
                logger.info(f"🔄 Circuit breaker for {service_id} moved to half-open")
            else:
                raise Exception("Service circuit breaker is open")
        
        # Simulate latency
        base_latency = service["base_latency_ms"] / 1000.0
        actual_latency = base_latency * self.latency_multiplier
        
        # Add jitter (±20%)
        import random
        jitter = random.uniform(0.8, 1.2)
        actual_latency *= jitter
        
        await asyncio.sleep(actual_latency)
        
        # Determine if this request should fail
        should_fail = await self._should_request_fail(service, state)
        
        if should_fail:
            state["failure_count"] += 1
            state["consecutive_failures"] += 1
            state["last_failure"] = time.time()
            
            # Check circuit breaker threshold
            if (state["consecutive_failures"] >= service["circuit_breaker"]["failure_threshold"] and 
                state["circuit_state"] == "closed"):
                state["circuit_state"] = "open"
                state["circuit_opened_at"] = time.time()
                logger.warning(f"🚨 Circuit breaker opened for {service_id}")
            
            # Generate failure response
            failure_type = random.choice(service["failure_scenarios"])
            return await self._generate_failure_response(service, failure_type, endpoint, method)
        else:
            # Reset consecutive failures on success
            state["consecutive_failures"] = 0
            
            # Close circuit breaker if in half-open state
            if state["circuit_state"] == "half_open":
                state["circuit_state"] = "closed"
                logger.info(f"✅ Circuit breaker closed for {service_id}")
            
            # Generate success response
            return await self._generate_success_response(service, endpoint, method, payload)
    
    async def _should_request_fail(self, service: Dict, state: Dict) -> bool:
        """Determine if a request should fail based on multiple factors"""
        import random
        
        # Base failure rate (inverse of reliability)
        base_failure_rate = 1.0 - service["reliability"]
        
        # Apply global failure rate
        failure_rate = min(base_failure_rate + self.global_failure_rate, 0.5)  # Cap at 50%
        
        # Increase failure rate if service is already having issues
        if state["consecutive_failures"] > 0:
            failure_rate *= (1 + state["consecutive_failures"] * 0.1)  # 10% increase per consecutive failure
        
        # Time-based patterns (higher failure rate during "peak hours")
        current_hour = datetime.now().hour
        if 9 <= current_hour <= 17:  # Business hours
            failure_rate *= 1.2
        
        return random.random() < failure_rate
    
    async def _generate_failure_response(self, service: Dict, failure_type: str, 
                                       endpoint: str, method: str) -> Dict[str, Any]:
        """Generate realistic failure responses"""
        
        failure_responses = {
            "timeout": {
                "status_code": 408,
                "error": "Request timeout",
                "details": "The request took too long to process"
            },
            "server_error": {
                "status_code": 500,
                "error": "Internal server error",
                "details": "An unexpected error occurred"
            },
            "rate_limited": {
                "status_code": 429,
                "error": "Rate limit exceeded",
                "details": "Too many requests",
                "retry_after": 60
            },
            "service_unavailable": {
                "status_code": 503,
                "error": "Service unavailable",
                "details": "Service is temporarily unavailable"
            },
            "unauthorized": {
                "status_code": 401,
                "error": "Unauthorized",
                "details": "Invalid authentication credentials"
            },
            "not_found": {
                "status_code": 404,
                "error": "Not found",
                "details": f"Endpoint {endpoint} not found"
            }
        }
        
        # Use predefined response or generate generic one
        if failure_type in service.get("response_templates", {}):
            response_data = service["response_templates"][failure_type]
            status_code = 400  # Default for business logic errors
        else:
            response_data = failure_responses.get(failure_type, failure_responses["server_error"])
            status_code = response_data.pop("status_code", 500)
        
        return {
            "success": False,
            "status_code": status_code,
            "data": response_data,
            "metadata": {
                "mock_service_id": service["id"],
                "failure_type": failure_type,
                "endpoint": endpoint,
                "method": method,
                "timestamp": time.time(),
                "latency_ms": service["base_latency_ms"] * self.latency_multiplier
            }
        }
    
    async def _generate_success_response(self, service: Dict, endpoint: str, 
                                       method: str, payload: Dict = None) -> Dict[str, Any]:
        """Generate realistic success responses"""
        
        # Try to use predefined success response
        if "success" in service.get("response_templates", {}):
            response_data = service["response_templates"]["success"].copy()
        else:
            # Generate generic success response
            response_data = {
                "message": "Request processed successfully",
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Add method-specific data
            if method == "POST":
                response_data["created"] = True
                response_data["id"] = f"item_{int(time.time())}"
            elif method == "GET":
                response_data["data"] = {"items": [], "total": 0}
            elif method == "PUT":
                response_data["updated"] = True
            elif method == "DELETE":
                response_data["deleted"] = True
        
        # Inject dynamic values
        response_data = self._inject_dynamic_values(response_data)
        
        return {
            "success": True,
            "status_code": 200,
            "data": response_data,
            "metadata": {
                "mock_service_id": service["id"],
                "endpoint": endpoint,
                "method": method,
                "timestamp": time.time(),
                "latency_ms": service["base_latency_ms"] * self.latency_multiplier
            }
        }
    
    def _inject_dynamic_values(self, data: Any) -> Any:
        """Inject dynamic values into response templates"""
        import random
        import string
        
        if isinstance(data, dict):
            result = {}
            for key, value in data.items():
                if isinstance(value, str):
                    # Replace placeholders
                    if "{{timestamp}}" in value:
                        value = value.replace("{{timestamp}}", datetime.utcnow().isoformat())
                    if "{{random_id}}" in value:
                        value = value.replace("{{random_id}}", ''.join(random.choices(string.ascii_letters + string.digits, k=8)))
                    if "{{random_number}}" in value:
                        value = value.replace("{{random_number}}", str(random.randint(1000, 9999)))
                result[key] = self._inject_dynamic_values(value)
            return result
        elif isinstance(data, list):
            return [self._inject_dynamic_values(item) for item in data]
        else:
            return data
    
    def set_global_chaos_level(self, failure_rate: float, latency_multiplier: float = 1.0):
        """Set global chaos engineering parameters"""
        self.global_failure_rate = max(0.0, min(failure_rate, 1.0))  # Clamp 0-1
        self.latency_multiplier = max(0.1, latency_multiplier)  # Minimum 0.1x
        
        logger.info(f"🌪️ Chaos engineering: {failure_rate*100:.1f}% failure rate, {latency_multiplier}x latency")
    
    def get_service_metrics(self, service_id: str) -> Dict[str, Any]:
        """Get comprehensive metrics for a service"""
        if service_id not in self.mock_services:
            return {}
        
        service = self.mock_services[service_id]
        state = self.service_states[service_id]
        
        total_requests = state["request_count"]
        failure_rate = state["failure_count"] / max(total_requests, 1)
        
        return {
            "service_id": service_id,
            "service_name": service["name"],
            "total_requests": total_requests,
            "failure_count": state["failure_count"],
            "failure_rate": failure_rate,
            "consecutive_failures": state["consecutive_failures"],
            "circuit_state": state["circuit_state"],
            "status": state["status"],
            "uptime_percentage": (1 - failure_rate) * 100,
            "average_latency_ms": service["base_latency_ms"] * self.latency_multiplier,
            "last_failure": state.get("last_failure"),
            "created_at": service["created_at"]
        }
    
    def get_all_services_status(self) -> Dict[str, Any]:
        """Get status overview of all mock services"""
        total_services = len(self.mock_services)
        healthy_services = sum(1 for state in self.service_states.values() if state["circuit_state"] == "closed")
        
        return {
            "total_services": total_services,
            "healthy_services": healthy_services,
            "degraded_services": total_services - healthy_services,
            "global_failure_rate": self.global_failure_rate,
            "global_latency_multiplier": self.latency_multiplier,
            "services": [self.get_service_metrics(sid) for sid in self.mock_services.keys()]
        }

# Global singleton
mock_service_engine = MockServiceEngine()