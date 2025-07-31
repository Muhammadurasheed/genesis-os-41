"""
Queue Status Endpoints - Monitor request queue and processing status
"""

from fastapi import APIRouter
from lib.request_queue_service import request_queue_service

router = APIRouter()

@router.get("/queue-status")
async def get_queue_status():
    """Get current queue processing status"""
    status = request_queue_service.get_queue_status()
    return {
        "success": True,
        "queue_status": status
    }

@router.get("/request-status/{request_id}")
async def get_request_status(request_id: str):
    """Get status of specific request"""
    result = request_queue_service.get_result(request_id)
    
    if result:
        return {
            "success": True,
            "request_id": request_id,
            "status": result["status"],
            "timestamp": result["timestamp"],
            "has_result": True
        }
    else:
        return {
            "success": True,
            "request_id": request_id,
            "status": "processing",
            "has_result": False
        }