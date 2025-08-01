"""
Request Queue Service - Manages API rate limiting and request queuing
"""

import asyncio
import logging
import time
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import json

logger = logging.getLogger("request_queue_service")

class RequestQueueService:
    """Production-grade request queuing with intelligent rate limiting"""
    
    def __init__(self, max_concurrent_requests: int = 2, requests_per_minute: int = 10):
        self.max_concurrent_requests = max_concurrent_requests
        self.requests_per_minute = requests_per_minute
        self.queue = asyncio.Queue()
        self.active_requests = 0
        self.request_history = []
        self.is_processing = False
        self.processing_requests = set()  # Track currently processing requests
        logger.info(f"🚦 Request Queue initialized: {max_concurrent_requests} concurrent, {requests_per_minute} RPM")
    
    async def add_request(self, request_type: str, user_input: str, context: Dict[str, Any] = None) -> str:
        """Add a request to the queue and return request ID"""
        # Create base key for deduplication (user_input hash + request_type)
        import hashlib
        user_hash = hashlib.md5(user_input.encode()).hexdigest()[:8]
        base_key = f"{user_hash}_{request_type}"
        
        # Check if similar request is already being processed
        if base_key in self.processing_requests:
            logger.info(f"🔄 Similar request already processing, skipping")
            # Return existing request ID
            for req_id in self.processing_requests:
                if req_id.endswith(request_type):
                    return req_id
        
        request_id = f"req_{int(time.time())}_{request_type}"
        
        request_data = {
            "id": request_id,
            "base_key": base_key,
            "type": request_type,
            "user_input": user_input,
            "context": context or {},
            "timestamp": datetime.utcnow().isoformat(),
            "status": "queued"
        }
        
        await self.queue.put(request_data)
        logger.info(f"📝 Request queued: {request_id} (Queue size: {self.queue.qsize()})")
        
        # Start processing if not already running
        if not self.is_processing:
            asyncio.create_task(self._process_queue())
        
        return request_id
    
    async def _process_queue(self):
        """Process requests from queue with rate limiting"""
        if self.is_processing:
            return
        
        self.is_processing = True
        logger.info("🚀 Starting queue processing")
        
        try:
            while not self.queue.empty() or self.active_requests > 0:
                # Check rate limits
                if not self._can_make_request():
                    wait_time = self._get_wait_time()
                    logger.info(f"⏳ Rate limit reached, waiting {wait_time:.1f}s")
                    await asyncio.sleep(wait_time)
                    continue
                
                # Check concurrent limit
                if self.active_requests >= self.max_concurrent_requests:
                    await asyncio.sleep(1)
                    continue
                
                try:
                    # Get next request (with timeout to avoid blocking)
                    request_data = await asyncio.wait_for(self.queue.get(), timeout=1.0)
                    
                    # Process request in background
                    asyncio.create_task(self._handle_request(request_data))
                    
                except asyncio.TimeoutError:
                    # No requests in queue, continue loop to check active requests
                    if self.active_requests == 0:
                        break
                    await asyncio.sleep(0.5)
                    
        finally:
            self.is_processing = False
            logger.info("✅ Queue processing completed")
    
    async def _handle_request(self, request_data: Dict[str, Any]):
        """Handle individual request with error handling"""
        request_id = request_data["id"]
        base_key = request_data.get("base_key", request_id)
        
        # Add to processing set
        self.processing_requests.add(base_key)
        self.active_requests += 1
        
        try:
            logger.info(f"🔄 Processing request: {request_id}")
            
            # Import here to avoid circular imports
            from .enhanced_blueprint_service import EnhancedBlueprintService
            
            blueprint_service = EnhancedBlueprintService()
            
            # Process the request based on type
            if request_data["type"] == "blueprint":
                result = await blueprint_service.generate_comprehensive_blueprint(
                    request_data["user_input"],
                    request_data["context"]
                )
                
                # Store result for retrieval
                self._store_result(request_id, result)
                
            # Record successful request
            self._record_request()
            logger.info(f"✅ Request completed: {request_id}")
            
        except Exception as e:
            logger.error(f"❌ Request failed: {request_id} - {e}")
            # Store error result
            self._store_result(request_id, {"error": str(e), "status": "failed"})
            
        finally:
            # Remove from processing set
            self.processing_requests.discard(base_key)
            self.active_requests -= 1
    
    def _can_make_request(self) -> bool:
        """Check if we can make a request based on rate limits"""
        current_time = time.time()
        minute_ago = current_time - 60
        
        # Clean old requests
        self.request_history = [t for t in self.request_history if t > minute_ago]
        
        return len(self.request_history) < self.requests_per_minute
    
    def _get_wait_time(self) -> float:
        """Calculate how long to wait before next request"""
        if not self.request_history:
            return 0
        
        oldest_request = min(self.request_history)
        time_until_oldest_expires = 60 - (time.time() - oldest_request)
        
        return max(0, time_until_oldest_expires + 1)
    
    def _record_request(self):
        """Record a successful request"""
        self.request_history.append(time.time())
    
    def _store_result(self, request_id: str, result: Dict[str, Any]):
        """Store request result (in production, use Redis or database)"""
        # For now, store in memory (should be Redis in production)
        if not hasattr(self, '_results'):
            self._results = {}
        
        self._results[request_id] = {
            "result": result,
            "timestamp": datetime.utcnow().isoformat(),
            "status": "completed" if "error" not in result else "failed"
        }
    
    def get_result(self, request_id: str) -> Optional[Dict[str, Any]]:
        """Get result for a request ID"""
        if hasattr(self, '_results'):
            return self._results.get(request_id)
        return None
    
    def get_queue_status(self) -> Dict[str, Any]:
        """Get current queue status"""
        return {
            "queue_size": self.queue.qsize(),
            "active_requests": self.active_requests,
            "is_processing": self.is_processing,
            "requests_last_minute": len(self.request_history),
            "rate_limit": self.requests_per_minute,
            "can_accept_requests": self._can_make_request()
        }

# Singleton instance
request_queue_service = RequestQueueService(
    max_concurrent_requests=2,  # Conservative for free tier
    requests_per_minute=10      # Well below 15 RPM limit
)