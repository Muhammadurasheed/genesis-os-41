import asyncio
import json
import time
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import websockets
from websockets.exceptions import ConnectionClosed
import threading
from dataclasses import dataclass, asdict

logger = logging.getLogger("realtime_service")

@dataclass
class ExecutionEvent:
    event_id: str
    execution_id: str
    event_type: str  # 'start', 'progress', 'complete', 'error', 'metric'
    timestamp: float
    data: Dict[str, Any]

class RealTimeOrchestrationService:
    """Enterprise real-time orchestration with WebSocket communication"""
    
    def __init__(self):
        self.connected_clients: Dict[str, websockets.WebSocketServerProtocol] = {}
        self.execution_subscriptions: Dict[str, List[str]] = {}  # execution_id -> [client_ids]
        self.client_subscriptions: Dict[str, List[str]] = {}    # client_id -> [execution_ids]
        self.websocket_server = None
        self.running = False
        
        # Event queues for different priority levels
        self.high_priority_queue = asyncio.Queue()
        self.normal_priority_queue = asyncio.Queue()
        self.low_priority_queue = asyncio.Queue()
        
        logger.info("🌐 Real-time Orchestration Service initialized")
    
    async def start_server(self, host: str = "localhost", port: int = 8002):
        """Start WebSocket server for real-time communication"""
        if self.running:
            return
        
        self.running = True
        
        # Start WebSocket server
        self.websocket_server = await websockets.serve(
            self.handle_websocket_connection,
            host,
            port
        )
        
        # Start background tasks
        asyncio.create_task(self.event_processor())
        
        logger.info(f"🌐 WebSocket server started on ws://{host}:{port}")
    
    async def stop_server(self):
        """Stop WebSocket server and cleanup"""
        if not self.running:
            return
        
        self.running = False
        
        # Close all client connections
        for client_id, websocket in self.connected_clients.items():
            try:
                await websocket.close()
            except:
                pass
        
        self.connected_clients.clear()
        self.execution_subscriptions.clear()
        self.client_subscriptions.clear()
        
        if self.websocket_server:
            self.websocket_server.close()
            await self.websocket_server.wait_closed()
        
        logger.info("🌐 WebSocket server stopped")
    
    async def handle_websocket_connection(self, websocket, path):
        """Handle new WebSocket connections"""
        client_id = f"client-{int(time.time() * 1000)}"
        self.connected_clients[client_id] = websocket
        self.client_subscriptions[client_id] = []
        
        logger.info(f"🔗 New client connected: {client_id}")
        
        try:
            # Send welcome message
            await self.send_to_client(client_id, {
                "type": "welcome",
                "client_id": client_id,
                "timestamp": time.time(),
                "server_capabilities": [
                    "execution_tracking",
                    "real_time_metrics",
                    "alert_notifications",
                    "performance_monitoring"
                ]
            })
            
            # Handle incoming messages
            async for message in websocket:
                try:
                    data = json.loads(message)
                    await self.handle_client_message(client_id, data)
                except json.JSONDecodeError:
                    await self.send_error(client_id, "Invalid JSON format")
                except Exception as e:
                    logger.error(f"Error handling message from {client_id}: {e}")
                    await self.send_error(client_id, f"Message processing error: {str(e)}")
        
        except ConnectionClosed:
            logger.info(f"🔌 Client {client_id} disconnected")
        except Exception as e:
            logger.error(f"WebSocket error for {client_id}: {e}")
        finally:
            # Cleanup client
            await self.cleanup_client(client_id)
    
    async def handle_client_message(self, client_id: str, data: Dict[str, Any]):
        """Handle messages from WebSocket clients"""
        message_type = data.get("type")
        
        if message_type == "subscribe_execution":
            execution_id = data.get("execution_id")
            if execution_id:
                await self.subscribe_client_to_execution(client_id, execution_id)
        
        elif message_type == "unsubscribe_execution":
            execution_id = data.get("execution_id")
            if execution_id:
                await self.unsubscribe_client_from_execution(client_id, execution_id)
        
        elif message_type == "get_execution_status":
            execution_id = data.get("execution_id")
            if execution_id:
                await self.send_execution_status(client_id, execution_id)
        
        elif message_type == "get_system_metrics":
            await self.send_system_metrics(client_id)
        
        elif message_type == "ping":
            await self.send_to_client(client_id, {
                "type": "pong",
                "timestamp": time.time()
            })
        
        else:
            await self.send_error(client_id, f"Unknown message type: {message_type}")
    
    async def subscribe_client_to_execution(self, client_id: str, execution_id: str):
        """Subscribe client to execution updates"""
        if execution_id not in self.execution_subscriptions:
            self.execution_subscriptions[execution_id] = []
        
        if client_id not in self.execution_subscriptions[execution_id]:
            self.execution_subscriptions[execution_id].append(client_id)
        
        if client_id in self.client_subscriptions:
            if execution_id not in self.client_subscriptions[client_id]:
                self.client_subscriptions[client_id].append(execution_id)
        
        await self.send_to_client(client_id, {
            "type": "subscription_confirmed",
            "execution_id": execution_id,
            "timestamp": time.time()
        })
        
        logger.info(f"📡 Client {client_id} subscribed to execution {execution_id}")
    
    async def unsubscribe_client_from_execution(self, client_id: str, execution_id: str):
        """Unsubscribe client from execution updates"""
        if execution_id in self.execution_subscriptions:
            if client_id in self.execution_subscriptions[execution_id]:
                self.execution_subscriptions[execution_id].remove(client_id)
        
        if client_id in self.client_subscriptions:
            if execution_id in self.client_subscriptions[client_id]:
                self.client_subscriptions[client_id].remove(execution_id)
        
        await self.send_to_client(client_id, {
            "type": "unsubscription_confirmed",
            "execution_id": execution_id,
            "timestamp": time.time()
        })
    
    async def cleanup_client(self, client_id: str):
        """Cleanup client subscriptions and connections"""
        # Remove from all execution subscriptions
        if client_id in self.client_subscriptions:
            for execution_id in self.client_subscriptions[client_id]:
                if execution_id in self.execution_subscriptions:
                    if client_id in self.execution_subscriptions[execution_id]:
                        self.execution_subscriptions[execution_id].remove(client_id)
        
        # Remove client data
        if client_id in self.connected_clients:
            del self.connected_clients[client_id]
        if client_id in self.client_subscriptions:
            del self.client_subscriptions[client_id]
        
        logger.info(f"🧹 Cleaned up client: {client_id}")
    
    async def send_to_client(self, client_id: str, data: Dict[str, Any]):
        """Send data to a specific client"""
        if client_id not in self.connected_clients:
            return False
        
        try:
            websocket = self.connected_clients[client_id]
            await websocket.send(json.dumps(data))
            return True
        except ConnectionClosed:
            await self.cleanup_client(client_id)
            return False
        except Exception as e:
            logger.error(f"Error sending to client {client_id}: {e}")
            return False
    
    async def broadcast_to_execution_subscribers(self, execution_id: str, data: Dict[str, Any]):
        """Broadcast data to all clients subscribed to an execution"""
        if execution_id not in self.execution_subscriptions:
            return
        
        subscribers = self.execution_subscriptions[execution_id].copy()
        disconnected_clients = []
        
        for client_id in subscribers:
            success = await self.send_to_client(client_id, data)
            if not success:
                disconnected_clients.append(client_id)
        
        # Remove disconnected clients
        for client_id in disconnected_clients:
            await self.cleanup_client(client_id)
    
    async def send_error(self, client_id: str, error_message: str):
        """Send error message to client"""
        await self.send_to_client(client_id, {
            "type": "error",
            "message": error_message,
            "timestamp": time.time()
        })
    
    async def broadcast_execution_event(self, execution_id: str, event_type: str, data: Dict[str, Any], priority: str = "normal"):
        """Broadcast execution event to subscribers"""
        event = ExecutionEvent(
            event_id=f"event-{int(time.time() * 1000)}",
            execution_id=execution_id,
            event_type=event_type,
            timestamp=time.time(),
            data=data
        )
        
        # Queue event based on priority
        if priority == "high":
            await self.high_priority_queue.put(event)
        elif priority == "low":
            await self.low_priority_queue.put(event)
        else:
            await self.normal_priority_queue.put(event)
    
    async def event_processor(self):
        """Process events from priority queues"""
        while self.running:
            try:
                # Process high priority events first
                event = None
                
                try:
                    event = self.high_priority_queue.get_nowait()
                except asyncio.QueueEmpty:
                    try:
                        event = self.normal_priority_queue.get_nowait()
                    except asyncio.QueueEmpty:
                        try:
                            event = self.low_priority_queue.get_nowait()
                        except asyncio.QueueEmpty:
                            await asyncio.sleep(0.1)  # No events, wait briefly
                            continue
                
                if event:
                    await self.process_execution_event(event)
                
            except Exception as e:
                logger.error(f"Error in event processor: {e}")
                await asyncio.sleep(1)
    
    async def process_execution_event(self, event: ExecutionEvent):
        """Process and broadcast execution event"""
        broadcast_data = {
            "type": "execution_event",
            "event": asdict(event)
        }
        
        await self.broadcast_to_execution_subscribers(event.execution_id, broadcast_data)
        
        # Log significant events
        if event.event_type in ["start", "complete", "error"]:
            logger.info(f"🎯 Execution {event.execution_id}: {event.event_type}")
    
    async def send_execution_status(self, client_id: str, execution_id: str):
        """Send current execution status to client"""
        # This would integrate with your execution tracking system
        status_data = {
            "type": "execution_status",
            "execution_id": execution_id,
            "status": "running",  # Would be fetched from actual execution tracker
            "progress": 0.65,     # Progress percentage
            "current_step": "Processing agents",
            "timestamp": time.time()
        }
        
        await self.send_to_client(client_id, status_data)
    
    async def send_system_metrics(self, client_id: str):
        """Send current system metrics to client"""
        metrics_data = {
            "type": "system_metrics",
            "metrics": {
                "active_executions": len(self.execution_subscriptions),
                "connected_clients": len(self.connected_clients),
                "cpu_usage": 45.2,  # Would be fetched from actual monitoring
                "memory_usage_mb": 234.5,
                "uptime_seconds": 3600,
                "requests_per_minute": 42
            },
            "timestamp": time.time()
        }
        
        await self.send_to_client(client_id, metrics_data)
    
    def get_connection_stats(self) -> Dict[str, Any]:
        """Get current connection statistics"""
        return {
            "connected_clients": len(self.connected_clients),
            "total_subscriptions": sum(len(subs) for subs in self.execution_subscriptions.values()),
            "active_executions": len(self.execution_subscriptions),
            "queue_sizes": {
                "high_priority": self.high_priority_queue.qsize(),
                "normal_priority": self.normal_priority_queue.qsize(),
                "low_priority": self.low_priority_queue.qsize()
            }
        }

# Global singleton instance
realtime_service = RealTimeOrchestrationService()