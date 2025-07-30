import asyncio
import time
import json
import logging
from typing import Dict, Any, List, Optional, Callable, Union
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from enum import Enum
import uuid
from collections import defaultdict, deque
import threading

logger = logging.getLogger("production_workflow_engine")

class WorkflowStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class NodeType(Enum):
    TRIGGER = "trigger"
    ACTION = "action"
    CONDITION = "condition"
    INTEGRATION = "integration"
    DELAY = "delay"
    PARALLEL = "parallel"
    LOOP = "loop"
    SUBFLOW = "subflow"

class ExecutionMode(Enum):
    SEQUENTIAL = "sequential"
    PARALLEL = "parallel"
    BATCH = "batch"
    STREAMING = "streaming"

@dataclass
class WorkflowNode:
    id: str
    type: NodeType
    name: str
    config: Dict[str, Any]
    position: Dict[str, float]
    metadata: Dict[str, Any] = None

@dataclass
class WorkflowEdge:
    id: str
    source: str
    target: str
    condition: Optional[str] = None
    metadata: Dict[str, Any] = None

@dataclass
class WorkflowExecution:
    id: str
    workflow_id: str
    status: WorkflowStatus
    started_at: datetime
    completed_at: Optional[datetime] = None
    execution_context: Dict[str, Any] = None
    results: Dict[str, Any] = None
    error_details: Optional[str] = None
    performance_metrics: Dict[str, Any] = None

@dataclass
class WorkflowDefinition:
    id: str
    name: str
    description: str
    version: str
    nodes: List[WorkflowNode]
    edges: List[WorkflowEdge]
    execution_mode: ExecutionMode
    timeout_seconds: int = 3600
    retry_config: Dict[str, Any] = None
    scaling_config: Dict[str, Any] = None

class ProductionWorkflowEngine:
    """Enterprise-grade workflow engine with FAANG-level scalability and reliability"""
    
    def __init__(self):
        self.workflows: Dict[str, WorkflowDefinition] = {}
        self.executions: Dict[str, WorkflowExecution] = {}
        self.execution_queue: asyncio.Queue = asyncio.Queue()
        self.active_executions: Dict[str, asyncio.Task] = {}
        
        # Performance optimization
        self.execution_pool_size = 10
        self.batch_size = 5
        self.cache_size = 1000
        self.result_cache: Dict[str, Any] = {}
        
        # Scaling configuration
        self.auto_scaling_enabled = True
        self.max_concurrent_executions = 100
        self.scale_up_threshold = 0.8
        self.scale_down_threshold = 0.3
        
        # Performance monitoring
        self.metrics = {
            "total_executions": 0,
            "successful_executions": 0,
            "failed_executions": 0,
            "average_execution_time": 0.0,
            "throughput_per_minute": 0.0,
            "queue_size": 0,
            "active_executions": 0
        }
        
        # Node execution handlers
        self.node_handlers: Dict[NodeType, Callable] = {
            NodeType.TRIGGER: self._execute_trigger_node,
            NodeType.ACTION: self._execute_action_node,
            NodeType.CONDITION: self._execute_condition_node,
            NodeType.INTEGRATION: self._execute_integration_node,
            NodeType.DELAY: self._execute_delay_node,
            NodeType.PARALLEL: self._execute_parallel_node,
            NodeType.LOOP: self._execute_loop_node,
            NodeType.SUBFLOW: self._execute_subflow_node
        }
        
        # Background tasks
        self._engine_task = None
        self._metrics_task = None
        self._cleanup_task = None
        self._running = False
        
        logger.info("🏭 Production Workflow Engine initialized")
    
    async def start_engine(self):
        """Start the workflow engine with all background tasks"""
        if self._running:
            return
            
        self._running = True
        
        # Start background tasks
        self._engine_task = asyncio.create_task(self._execution_engine())
        self._metrics_task = asyncio.create_task(self._metrics_collector())
        self._cleanup_task = asyncio.create_task(self._cleanup_completed_executions())
        
        logger.info("🏭 Production Workflow Engine started")
    
    async def stop_engine(self):
        """Stop the workflow engine and cleanup"""
        self._running = False
        
        # Cancel all active executions
        for execution_id, task in self.active_executions.items():
            task.cancel()
            logger.info(f"🛑 Cancelled execution: {execution_id}")
        
        # Cancel background tasks
        for task in [self._engine_task, self._metrics_task, self._cleanup_task]:
            if task:
                task.cancel()
        
        logger.info("🏭 Production Workflow Engine stopped")
    
    async def register_workflow(self, workflow_def: WorkflowDefinition) -> str:
        """Register a new workflow definition"""
        # Validate workflow
        validation_result = await self._validate_workflow(workflow_def)
        if not validation_result["valid"]:
            raise ValueError(f"Invalid workflow: {validation_result['errors']}")
        
        # Optimize workflow for performance
        optimized_workflow = await self._optimize_workflow(workflow_def)
        
        self.workflows[workflow_def.id] = optimized_workflow
        logger.info(f"📋 Registered workflow: {workflow_def.name} ({workflow_def.id})")
        
        return workflow_def.id
    
    async def execute_workflow(self, workflow_id: str, execution_context: Dict[str, Any] = None,
                             priority: int = 1) -> str:
        """Execute a workflow with enterprise-grade features"""
        if workflow_id not in self.workflows:
            raise ValueError(f"Workflow {workflow_id} not found")
        
        workflow = self.workflows[workflow_id]
        execution_id = f"exec-{workflow_id}-{uuid.uuid4().hex[:8]}"
        
        # Create execution record
        execution = WorkflowExecution(
            id=execution_id,
            workflow_id=workflow_id,
            status=WorkflowStatus.PENDING,
            started_at=datetime.utcnow(),
            execution_context=execution_context or {},
            performance_metrics={}
        )
        
        self.executions[execution_id] = execution
        
        # Queue for execution with priority
        await self.execution_queue.put({
            "execution_id": execution_id,
            "priority": priority,
            "queued_at": time.time()
        })
        
        self.metrics["queue_size"] = self.execution_queue.qsize()
        
        logger.info(f"🎯 Queued workflow execution: {execution_id} (priority: {priority})")
        return execution_id
    
    async def _execution_engine(self):
        """Main execution engine with intelligent load balancing"""
        while self._running:
            try:
                # Check if we can handle more executions
                if len(self.active_executions) >= self.max_concurrent_executions:
                    await asyncio.sleep(0.1)
                    continue
                
                # Get next execution from queue
                try:
                    queue_item = await asyncio.wait_for(self.execution_queue.get(), timeout=1.0)
                except asyncio.TimeoutError:
                    continue
                
                execution_id = queue_item["execution_id"]
                
                # Start execution
                execution_task = asyncio.create_task(
                    self._execute_workflow_instance(execution_id)
                )
                self.active_executions[execution_id] = execution_task
                
                # Update metrics
                self.metrics["active_executions"] = len(self.active_executions)
                self.metrics["queue_size"] = self.execution_queue.qsize()
                
                # Auto-scaling logic
                if self.auto_scaling_enabled:
                    await self._check_auto_scaling()
                
            except Exception as e:
                logger.error(f"Error in execution engine: {e}")
                await asyncio.sleep(1)
    
    async def _execute_workflow_instance(self, execution_id: str):
        """Execute a specific workflow instance with comprehensive error handling"""
        execution = self.executions[execution_id]
        workflow = self.workflows[execution.workflow_id]
        
        try:
            start_time = time.time()
            execution.status = WorkflowStatus.RUNNING
            
            logger.info(f"🚀 Starting workflow execution: {execution_id}")
            
            # Initialize execution context
            context = {
                "execution_id": execution_id,
                "workflow_id": execution.workflow_id,
                "started_at": execution.started_at,
                "variables": execution.execution_context.copy(),
                "node_results": {},
                "performance_data": {}
            }
            
            # Execute workflow based on execution mode
            if workflow.execution_mode == ExecutionMode.SEQUENTIAL:
                results = await self._execute_sequential(workflow, context)
            elif workflow.execution_mode == ExecutionMode.PARALLEL:
                results = await self._execute_parallel_workflow(workflow, context)
            elif workflow.execution_mode == ExecutionMode.BATCH:
                results = await self._execute_batch(workflow, context)
            else:
                results = await self._execute_streaming(workflow, context)
            
            # Calculate execution metrics
            execution_time = time.time() - start_time
            
            # Update execution record
            execution.status = WorkflowStatus.COMPLETED
            execution.completed_at = datetime.utcnow()
            execution.results = results
            execution.performance_metrics = {
                "execution_time_seconds": execution_time,
                "nodes_executed": len(context["node_results"]),
                "cache_hits": context.get("cache_hits", 0),
                "api_calls": context.get("api_calls", 0)
            }
            
            # Update global metrics
            self.metrics["total_executions"] += 1
            self.metrics["successful_executions"] += 1
            self._update_average_execution_time(execution_time)
            
            logger.info(f"✅ Workflow execution completed: {execution_id} ({execution_time:.2f}s)")
            
        except Exception as e:
            execution.status = WorkflowStatus.FAILED
            execution.completed_at = datetime.utcnow()
            execution.error_details = str(e)
            
            self.metrics["total_executions"] += 1
            self.metrics["failed_executions"] += 1
            
            logger.error(f"❌ Workflow execution failed: {execution_id} - {e}")
            
        finally:
            # Remove from active executions
            self.active_executions.pop(execution_id, None)
            self.metrics["active_executions"] = len(self.active_executions)
    
    async def _execute_sequential(self, workflow: WorkflowDefinition, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute workflow nodes sequentially with dependency resolution"""
        # Build execution graph
        execution_graph = self._build_execution_graph(workflow.nodes, workflow.edges)
        
        # Execute nodes in topological order
        executed_nodes = set()
        results = {}
        
        while len(executed_nodes) < len(workflow.nodes):
            # Find nodes ready for execution
            ready_nodes = [
                node for node in workflow.nodes
                if node.id not in executed_nodes and
                all(dep in executed_nodes for dep in execution_graph.get(node.id, {}).get("dependencies", []))
            ]
            
            if not ready_nodes:
                raise RuntimeError("Circular dependency detected in workflow")
            
            # Execute ready nodes
            for node in ready_nodes:
                node_start = time.time()
                
                try:
                    # Check cache first
                    cache_key = self._generate_cache_key(node, context)
                    if cache_key in self.result_cache:
                        node_result = self.result_cache[cache_key]
                        context["cache_hits"] = context.get("cache_hits", 0) + 1
                    else:
                        # Execute node
                        node_result = await self._execute_node(node, context)
                        
                        # Cache result if applicable
                        if node.config.get("cacheable", False):
                            self.result_cache[cache_key] = node_result
                    
                    # Store result
                    context["node_results"][node.id] = node_result
                    results[node.id] = node_result
                    executed_nodes.add(node.id)
                    
                    # Update performance data
                    context["performance_data"][node.id] = {
                        "execution_time": time.time() - node_start,
                        "success": True
                    }
                    
                except Exception as e:
                    context["performance_data"][node.id] = {
                        "execution_time": time.time() - node_start,
                        "success": False,
                        "error": str(e)
                    }
                    
                    # Handle node failure based on workflow configuration
                    if workflow.retry_config and workflow.retry_config.get("enabled", False):
                        # Implement retry logic
                        retry_result = await self._retry_node_execution(node, context, workflow.retry_config)
                        if retry_result:
                            context["node_results"][node.id] = retry_result
                            results[node.id] = retry_result
                            executed_nodes.add(node.id)
                            continue
                    
                    # If retry failed or not configured, handle based on error strategy
                    error_strategy = node.config.get("error_strategy", "fail")
                    if error_strategy == "fail":
                        raise e
                    elif error_strategy == "skip":
                        executed_nodes.add(node.id)
                        logger.warning(f"Skipped failed node: {node.id}")
                    elif error_strategy == "default":
                        default_result = node.config.get("default_result", {})
                        context["node_results"][node.id] = default_result
                        results[node.id] = default_result
                        executed_nodes.add(node.id)
        
        return results
    
    async def _execute_node(self, node: WorkflowNode, context: Dict[str, Any]) -> Any:
        """Execute a single workflow node with comprehensive handling"""
        handler = self.node_handlers.get(node.type)
        if not handler:
            raise ValueError(f"No handler for node type: {node.type}")
        
        # Pre-execution hooks
        await self._pre_node_execution(node, context)
        
        # Execute node
        result = await handler(node, context)
        
        # Post-execution hooks
        await self._post_node_execution(node, context, result)
        
        return result
    
    async def _execute_trigger_node(self, node: WorkflowNode, context: Dict[str, Any]) -> Any:
        """Execute trigger node - typically the starting point"""
        trigger_type = node.config.get("trigger_type", "manual")
        
        if trigger_type == "manual":
            return {"triggered_at": datetime.utcnow().isoformat(), "trigger_data": context.get("variables", {})}
        elif trigger_type == "webhook":
            # Simulate webhook trigger
            return {"webhook_data": context.get("webhook_payload", {})}
        elif trigger_type == "schedule":
            return {"scheduled_trigger": True, "schedule": node.config.get("schedule")}
        else:
            return {"trigger_type": trigger_type}
    
    async def _execute_action_node(self, node: WorkflowNode, context: Dict[str, Any]) -> Any:
        """Execute action node - performs actual work"""
        action_type = node.config.get("action_type", "custom")
        
        if action_type == "http_request":
            return await self._execute_http_action(node, context)
        elif action_type == "data_transformation":
            return await self._execute_data_transformation(node, context)
        elif action_type == "agent_execution":
            return await self._execute_agent_action(node, context)
        elif action_type == "file_operation":
            return await self._execute_file_operation(node, context)
        else:
            # Custom action execution
            return await self._execute_custom_action(node, context)
    
    async def _execute_condition_node(self, node: WorkflowNode, context: Dict[str, Any]) -> Any:
        """Execute condition node - controls flow based on conditions"""
        condition = node.config.get("condition", "true")
        
        # Evaluate condition with context
        result = await self._evaluate_condition(condition, context)
        
        return {"condition_result": result, "condition": condition}
    
    async def _execute_integration_node(self, node: WorkflowNode, context: Dict[str, Any]) -> Any:
        """Execute integration node - external service integration"""
        integration_type = node.config.get("integration_type")
        
        if integration_type == "database":
            return await self._execute_database_integration(node, context)
        elif integration_type == "api":
            return await self._execute_api_integration(node, context)
        elif integration_type == "message_queue":
            return await self._execute_message_queue_integration(node, context)
        else:
            return {"integration_result": "success", "integration_type": integration_type}
    
    async def _execute_delay_node(self, node: WorkflowNode, context: Dict[str, Any]) -> Any:
        """Execute delay node - introduces delays in workflow"""
        delay_seconds = node.config.get("delay_seconds", 1)
        await asyncio.sleep(delay_seconds)
        return {"delayed_seconds": delay_seconds}
    
    async def _execute_parallel_node(self, node: WorkflowNode, context: Dict[str, Any]) -> Any:
        """Execute parallel node - runs multiple branches concurrently"""
        parallel_branches = node.config.get("branches", [])
        
        # Execute all branches concurrently
        tasks = []
        for branch in parallel_branches:
            branch_task = asyncio.create_task(self._execute_branch(branch, context))
            tasks.append(branch_task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        return {"parallel_results": results, "branch_count": len(parallel_branches)}
    
    async def _execute_loop_node(self, node: WorkflowNode, context: Dict[str, Any]) -> Any:
        """Execute loop node - iterative execution"""
        loop_type = node.config.get("loop_type", "for")
        
        if loop_type == "for":
            iterations = node.config.get("iterations", 1)
            results = []
            
            for i in range(iterations):
                iteration_context = context.copy()
                iteration_context["loop_index"] = i
                
                iteration_result = await self._execute_loop_body(node, iteration_context)
                results.append(iteration_result)
            
            return {"loop_results": results, "iterations": iterations}
        
        elif loop_type == "while":
            condition = node.config.get("while_condition", "false")
            results = []
            iteration = 0
            max_iterations = node.config.get("max_iterations", 100)
            
            while iteration < max_iterations and await self._evaluate_condition(condition, context):
                iteration_context = context.copy()
                iteration_context["loop_index"] = iteration
                
                iteration_result = await self._execute_loop_body(node, iteration_context)
                results.append(iteration_result)
                iteration += 1
            
            return {"loop_results": results, "iterations": iteration}
        
        else:
            return {"error": f"Unknown loop type: {loop_type}"}
    
    async def _execute_subflow_node(self, node: WorkflowNode, context: Dict[str, Any]) -> Any:
        """Execute subflow node - nested workflow execution"""
        subflow_id = node.config.get("subflow_id")
        
        if subflow_id and subflow_id in self.workflows:
            # Execute subflow with isolated context
            subflow_context = {
                "parent_execution_id": context["execution_id"],
                "variables": node.config.get("input_mapping", {}),
                "inherited_variables": context.get("variables", {})
            }
            
            subflow_execution_id = await self.execute_workflow(subflow_id, subflow_context)
            
            # Wait for subflow completion
            while self.executions[subflow_execution_id].status in [WorkflowStatus.PENDING, WorkflowStatus.RUNNING]:
                await asyncio.sleep(0.1)
            
            subflow_execution = self.executions[subflow_execution_id]
            
            return {
                "subflow_id": subflow_id,
                "subflow_execution_id": subflow_execution_id,
                "subflow_result": subflow_execution.results,
                "subflow_status": subflow_execution.status.value
            }
        else:
            return {"error": f"Subflow not found: {subflow_id}"}
    
    def _build_execution_graph(self, nodes: List[WorkflowNode], edges: List[WorkflowEdge]) -> Dict[str, Dict]:
        """Build execution dependency graph"""
        graph = {}
        
        for node in nodes:
            graph[node.id] = {
                "node": node,
                "dependencies": [],
                "dependents": []
            }
        
        for edge in edges:
            if edge.target in graph and edge.source in graph:
                graph[edge.target]["dependencies"].append(edge.source)
                graph[edge.source]["dependents"].append(edge.target)
        
        return graph
    
    async def _validate_workflow(self, workflow: WorkflowDefinition) -> Dict[str, Any]:
        """Validate workflow definition"""
        errors = []
        
        # Check for required fields
        if not workflow.name:
            errors.append("Workflow name is required")
        
        if not workflow.nodes:
            errors.append("Workflow must have at least one node")
        
        # Check for cycles
        if self._has_cycles(workflow.nodes, workflow.edges):
            errors.append("Workflow contains circular dependencies")
        
        # Validate node configurations
        for node in workflow.nodes:
            node_errors = await self._validate_node(node)
            errors.extend(node_errors)
        
        return {
            "valid": len(errors) == 0,
            "errors": errors
        }
    
    def _has_cycles(self, nodes: List[WorkflowNode], edges: List[WorkflowEdge]) -> bool:
        """Check for circular dependencies using DFS"""
        graph = defaultdict(list)
        for edge in edges:
            graph[edge.source].append(edge.target)
        
        visited = set()
        rec_stack = set()
        
        def dfs(node_id):
            if node_id in rec_stack:
                return True
            if node_id in visited:
                return False
            
            visited.add(node_id)
            rec_stack.add(node_id)
            
            for neighbor in graph[node_id]:
                if dfs(neighbor):
                    return True
            
            rec_stack.remove(node_id)
            return False
        
        for node in nodes:
            if node.id not in visited:
                if dfs(node.id):
                    return True
        
        return False
    
    async def _validate_node(self, node: WorkflowNode) -> List[str]:
        """Validate individual node configuration"""
        errors = []
        
        if not node.name:
            errors.append(f"Node {node.id} must have a name")
        
        # Type-specific validations
        if node.type == NodeType.ACTION:
            if not node.config.get("action_type"):
                errors.append(f"Action node {node.id} must specify action_type")
        
        elif node.type == NodeType.CONDITION:
            if not node.config.get("condition"):
                errors.append(f"Condition node {node.id} must specify condition")
        
        return errors
    
    async def _optimize_workflow(self, workflow: WorkflowDefinition) -> WorkflowDefinition:
        """Optimize workflow for performance"""
        # This is a simplified optimization - in production, this would be much more sophisticated
        optimized_workflow = workflow
        
        # Add caching hints to expensive operations
        for node in optimized_workflow.nodes:
            if node.type == NodeType.INTEGRATION:
                if "cacheable" not in node.config:
                    node.config["cacheable"] = True
        
        return optimized_workflow
    
    def get_execution_status(self, execution_id: str) -> Optional[Dict[str, Any]]:
        """Get execution status and metrics"""
        if execution_id not in self.executions:
            return None
        
        execution = self.executions[execution_id]
        
        return {
            "execution_id": execution_id,
            "workflow_id": execution.workflow_id,
            "status": execution.status.value,
            "started_at": execution.started_at.isoformat(),
            "completed_at": execution.completed_at.isoformat() if execution.completed_at else None,
            "performance_metrics": execution.performance_metrics,
            "error_details": execution.error_details,
            "results_summary": {
                "total_nodes": len(execution.results) if execution.results else 0,
                "successful_nodes": len([r for r in (execution.results or {}).values() if r.get("success", True)])
            }
        }
    
    def get_engine_metrics(self) -> Dict[str, Any]:
        """Get comprehensive engine metrics"""
        return {
            **self.metrics,
            "registered_workflows": len(self.workflows),
            "total_executions_stored": len(self.executions),
            "cache_size": len(self.result_cache),
            "engine_uptime": "running" if self._running else "stopped"
        }

# Global singleton
production_workflow_engine = ProductionWorkflowEngine()