"""
Phase 3: Advanced Multi-Agent Orchestration Service
Handles complex multi-agent interactions, collaborative problem-solving, and emergent behaviors
"""

import asyncio
import json
import time
import uuid
import logging
from typing import Dict, List, Any, Optional, Set
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from enum import Enum

logger = logging.getLogger("advanced_multi_agent_orchestrator")

class AgentState(Enum):
    IDLE = "idle"
    THINKING = "thinking"
    COMMUNICATING = "communicating"
    EXECUTING = "executing"
    LEARNING = "learning"
    COLLABORATING = "collaborating"

class InteractionType(Enum):
    COLLABORATION = "collaboration"
    NEGOTIATION = "negotiation"
    KNOWLEDGE_SHARING = "knowledge_sharing"
    CONFLICT_RESOLUTION = "conflict_resolution"
    DELEGATION = "delegation"
    CONSENSUS_BUILDING = "consensus_building"

@dataclass
class AgentProfile:
    id: str
    name: str
    role: str
    expertise: List[str]
    personality_traits: Dict[str, float]  # e.g., {"cooperative": 0.8, "analytical": 0.9}
    learning_style: str
    communication_style: str
    trust_network: Dict[str, float]  # agent_id -> trust_level
    performance_history: List[Dict[str, Any]]
    current_state: AgentState = AgentState.IDLE
    current_workload: float = 0.0
    available_capacity: float = 1.0

@dataclass
class CollaborativeTask:
    id: str
    name: str
    description: str
    complexity: float  # 0.0 to 1.0
    required_expertise: List[str]
    deadline: datetime
    priority: float
    subtasks: List[Dict[str, Any]]
    dependencies: List[str]
    assigned_agents: List[str]
    status: str = "pending"
    progress: float = 0.0

@dataclass
class AgentInteraction:
    id: str
    timestamp: datetime
    initiator_id: str
    recipient_id: str
    interaction_type: InteractionType
    context: Dict[str, Any]
    content: str
    outcome: Optional[str] = None
    effectiveness_score: Optional[float] = None

class AdvancedMultiAgentOrchestrator:
    """
    Advanced orchestrator for complex multi-agent scenarios
    Features:
    - Dynamic team formation
    - Conflict resolution
    - Knowledge sharing networks
    - Emergent behavior detection
    - Performance optimization
    """
    
    def __init__(self):
        self.agents: Dict[str, AgentProfile] = {}
        self.active_tasks: Dict[str, CollaborativeTask] = {}
        self.interaction_history: List[AgentInteraction] = []
        self.knowledge_graph: Dict[str, Set[str]] = {}  # expertise -> set of agent_ids
        self.performance_metrics: Dict[str, Dict[str, float]] = {}
        self.emergent_behaviors: List[Dict[str, Any]] = []
        
        logger.info("🤖 Advanced Multi-Agent Orchestrator initialized")

    async def register_agent(self, agent_data: Dict[str, Any]) -> str:
        """Register a new agent in the orchestration system"""
        agent_id = agent_data.get("id", f"agent_{uuid.uuid4().hex[:8]}")
        
        # Create comprehensive agent profile
        agent_profile = AgentProfile(
            id=agent_id,
            name=agent_data.get("name", f"Agent {agent_id}"),
            role=agent_data.get("role", "general"),
            expertise=agent_data.get("expertise", []),
            personality_traits=agent_data.get("personality_traits", {
                "cooperative": 0.7,
                "analytical": 0.6,
                "creative": 0.5,
                "assertive": 0.4,
                "adaptable": 0.8
            }),
            learning_style=agent_data.get("learning_style", "collaborative"),
            communication_style=agent_data.get("communication_style", "direct"),
            trust_network={},
            performance_history=[]
        )
        
        self.agents[agent_id] = agent_profile
        
        # Update knowledge graph
        for expertise in agent_profile.expertise:
            if expertise not in self.knowledge_graph:
                self.knowledge_graph[expertise] = set()
            self.knowledge_graph[expertise].add(agent_id)
        
        # Initialize performance metrics
        self.performance_metrics[agent_id] = {
            "task_completion_rate": 0.0,
            "collaboration_effectiveness": 0.0,
            "learning_progression": 0.0,
            "innovation_score": 0.0,
            "reliability_score": 1.0
        }
        
        logger.info(f"✅ Agent {agent_id} registered with expertise: {agent_profile.expertise}")
        return agent_id

    async def create_collaborative_task(self, task_data: Dict[str, Any]) -> str:
        """Create a complex collaborative task requiring multiple agents"""
        task_id = task_data.get("id", f"task_{uuid.uuid4().hex[:8]}")
        
        # Analyze task requirements
        required_expertise = task_data.get("required_expertise", [])
        complexity = task_data.get("complexity", 0.5)
        
        # Create task object
        task = CollaborativeTask(
            id=task_id,
            name=task_data.get("name", f"Task {task_id}"),
            description=task_data.get("description", ""),
            complexity=complexity,
            required_expertise=required_expertise,
            deadline=datetime.fromisoformat(task_data.get("deadline", 
                (datetime.now() + timedelta(hours=24)).isoformat())),
            priority=task_data.get("priority", 0.5),
            subtasks=task_data.get("subtasks", []),
            dependencies=task_data.get("dependencies", []),
            assigned_agents=[]
        )
        
        # Optimal team formation
        optimal_team = await self._form_optimal_team(task)
        task.assigned_agents = [agent.id for agent in optimal_team]
        
        self.active_tasks[task_id] = task
        
        logger.info(f"🎯 Created collaborative task {task_id} with team: {task.assigned_agents}")
        
        # Start task execution
        await self._execute_collaborative_task(task_id)
        
        return task_id

    async def _form_optimal_team(self, task: CollaborativeTask) -> List[AgentProfile]:
        """Form optimal team based on expertise, personality, and past performance"""
        
        # Find agents with required expertise
        candidate_agents = []
        for expertise in task.required_expertise:
            if expertise in self.knowledge_graph:
                for agent_id in self.knowledge_graph[expertise]:
                    agent = self.agents.get(agent_id)
                    if agent and agent.available_capacity > 0.2:  # Agent has capacity
                        candidate_agents.append(agent)
        
        if not candidate_agents:
            # Fallback: select agents with highest adaptability
            candidate_agents = [
                agent for agent in self.agents.values()
                if agent.available_capacity > 0.2
            ]
        
        # Score agents based on multiple factors
        agent_scores = {}
        for agent in candidate_agents:
            score = self._calculate_agent_fitness_score(agent, task)
            agent_scores[agent.id] = score
        
        # Select optimal team size (2-5 agents based on complexity)
        team_size = min(max(2, int(task.complexity * 5)), len(candidate_agents))
        
        # Select top-scoring agents
        selected_agent_ids = sorted(agent_scores.items(), 
                                   key=lambda x: x[1], reverse=True)[:team_size]
        
        selected_agents = [self.agents[agent_id] for agent_id, _ in selected_agent_ids]
        
        # Check for personality compatibility
        if len(selected_agents) > 1:
            selected_agents = self._optimize_team_compatibility(selected_agents)
        
        logger.info(f"🎯 Formed optimal team of {len(selected_agents)} agents")
        return selected_agents

    def _calculate_agent_fitness_score(self, agent: AgentProfile, task: CollaborativeTask) -> float:
        """Calculate how well an agent fits a specific task"""
        
        # Expertise match score
        expertise_score = 0.0
        for expertise in task.required_expertise:
            if expertise in agent.expertise:
                expertise_score += 1.0
        expertise_score = expertise_score / max(len(task.required_expertise), 1)
        
        # Performance history score
        performance_score = self.performance_metrics.get(agent.id, {}).get("task_completion_rate", 0.5)
        
        # Availability score
        availability_score = agent.available_capacity
        
        # Personality match for task complexity
        personality_score = 0.0
        if task.complexity > 0.7:  # Complex tasks need analytical agents
            personality_score = agent.personality_traits.get("analytical", 0.5)
        else:  # Simple tasks need cooperative agents
            personality_score = agent.personality_traits.get("cooperative", 0.5)
        
        # Weighted final score
        final_score = (
            expertise_score * 0.4 +
            performance_score * 0.3 +
            availability_score * 0.2 +
            personality_score * 0.1
        )
        
        return final_score

    def _optimize_team_compatibility(self, agents: List[AgentProfile]) -> List[AgentProfile]:
        """Optimize team for personality and communication compatibility"""
        
        # Check for balanced personality traits
        team_traits = {}
        for trait in ["cooperative", "analytical", "creative", "assertive"]:
            team_traits[trait] = sum(agent.personality_traits.get(trait, 0.5) for agent in agents) / len(agents)
        
        # Ensure minimum cooperation level
        if team_traits.get("cooperative", 0) < 0.6:
            # Replace least cooperative agent with more cooperative one
            least_cooperative = min(agents, key=lambda a: a.personality_traits.get("cooperative", 0.5))
            
            # Find replacement
            for agent_id, agent in self.agents.items():
                if (agent.id not in [a.id for a in agents] and 
                    agent.personality_traits.get("cooperative", 0.5) > 0.7 and
                    agent.available_capacity > 0.2):
                    # Replace
                    agents = [a for a in agents if a.id != least_cooperative.id]
                    agents.append(agent)
                    break
        
        return agents

    async def _execute_collaborative_task(self, task_id: str):
        """Execute collaborative task with real-time coordination"""
        task = self.active_tasks.get(task_id)
        if not task:
            return
        
        logger.info(f"🚀 Starting execution of task {task_id}")
        task.status = "in_progress"
        
        # Update agent states
        for agent_id in task.assigned_agents:
            agent = self.agents.get(agent_id)
            if agent:
                agent.current_state = AgentState.COLLABORATING
                agent.current_workload += task.complexity * 0.3
                agent.available_capacity = max(0, agent.available_capacity - task.complexity * 0.3)
        
        # Simulate collaborative execution phases
        await self._execute_planning_phase(task_id)
        await self._execute_collaboration_phase(task_id)
        await self._execute_integration_phase(task_id)
        await self._complete_task(task_id)

    async def _execute_planning_phase(self, task_id: str):
        """Execute planning phase with agent coordination"""
        task = self.active_tasks.get(task_id)
        if not task:
            return
        
        logger.info(f"📋 Planning phase for task {task_id}")
        
        # Simulate planning interactions
        for i in range(len(task.assigned_agents)):
            for j in range(i + 1, len(task.assigned_agents)):
                agent1_id = task.assigned_agents[i]
                agent2_id = task.assigned_agents[j]
                
                # Create planning interaction
                interaction = AgentInteraction(
                    id=f"plan_{uuid.uuid4().hex[:8]}",
                    timestamp=datetime.now(),
                    initiator_id=agent1_id,
                    recipient_id=agent2_id,
                    interaction_type=InteractionType.COLLABORATION,
                    context={"phase": "planning", "task_id": task_id},
                    content=f"Planning coordination for task: {task.name}",
                    effectiveness_score=0.8 + (0.2 * self._get_trust_level(agent1_id, agent2_id))
                )
                
                self.interaction_history.append(interaction)
                
                # Update trust levels
                await self._update_trust_levels(agent1_id, agent2_id, interaction.effectiveness_score)
        
        # Simulate planning time
        await asyncio.sleep(2)
        task.progress = 0.2

    async def _execute_collaboration_phase(self, task_id: str):
        """Execute main collaboration phase"""
        task = self.active_tasks.get(task_id)
        if not task:
            return
        
        logger.info(f"🤝 Collaboration phase for task {task_id}")
        
        # Simulate iterative collaboration cycles
        for cycle in range(3):  # 3 collaboration cycles
            
            # Knowledge sharing
            await self._facilitate_knowledge_sharing(task.assigned_agents)
            
            # Problem-solving collaboration
            await self._simulate_collaborative_problem_solving(task_id)
            
            # Conflict resolution if needed
            if self._detect_potential_conflicts(task.assigned_agents):
                await self._resolve_conflicts(task.assigned_agents, task_id)
            
            # Update progress
            task.progress = 0.2 + (0.6 * (cycle + 1) / 3)
            
            await asyncio.sleep(1)

    async def _facilitate_knowledge_sharing(self, agent_ids: List[str]):
        """Facilitate knowledge sharing between agents"""
        
        for agent_id in agent_ids:
            agent = self.agents.get(agent_id)
            if not agent:
                continue
            
            # Share knowledge with team members
            for other_id in agent_ids:
                if other_id != agent_id:
                    # Create knowledge sharing interaction
                    shared_knowledge = f"Expertise in {', '.join(agent.expertise[:2])}"
                    
                    interaction = AgentInteraction(
                        id=f"share_{uuid.uuid4().hex[:8]}",
                        timestamp=datetime.now(),
                        initiator_id=agent_id,
                        recipient_id=other_id,
                        interaction_type=InteractionType.KNOWLEDGE_SHARING,
                        context={"knowledge_type": "expertise"},
                        content=f"Sharing knowledge: {shared_knowledge}",
                        effectiveness_score=agent.personality_traits.get("cooperative", 0.7)
                    )
                    
                    self.interaction_history.append(interaction)

    async def _simulate_collaborative_problem_solving(self, task_id: str):
        """Simulate agents working together to solve problems"""
        task = self.active_tasks.get(task_id)
        if not task:
            return
        
        # Generate collaborative problem-solving scenarios
        problems = [
            "Technical implementation challenge",
            "Resource allocation optimization",
            "Timeline coordination issue",
            "Quality assurance concern"
        ]
        
        problem = problems[len(self.interaction_history) % len(problems)]
        
        # All agents contribute to solution
        for agent_id in task.assigned_agents:
            agent = self.agents.get(agent_id)
            if not agent:
                continue
            
            # Generate agent's contribution based on expertise and personality
            contribution_quality = (
                sum(1 for exp in agent.expertise if exp in task.required_expertise) / max(len(task.required_expertise), 1) * 0.6 +
                agent.personality_traits.get("analytical", 0.5) * 0.4
            )
            
            interaction = AgentInteraction(
                id=f"solve_{uuid.uuid4().hex[:8]}",
                timestamp=datetime.now(),
                initiator_id=agent_id,
                recipient_id="team",
                interaction_type=InteractionType.COLLABORATION,
                context={"problem": problem, "task_id": task_id},
                content=f"Proposed solution approach based on {agent.role} expertise",
                effectiveness_score=contribution_quality
            )
            
            self.interaction_history.append(interaction)

    def _detect_potential_conflicts(self, agent_ids: List[str]) -> bool:
        """Detect potential conflicts between agents"""
        
        for i in range(len(agent_ids)):
            for j in range(i + 1, len(agent_ids)):
                agent1 = self.agents.get(agent_ids[i])
                agent2 = self.agents.get(agent_ids[j])
                
                if not agent1 or not agent2:
                    continue
                
                # Check personality conflicts
                assertiveness_diff = abs(
                    agent1.personality_traits.get("assertive", 0.5) - 
                    agent2.personality_traits.get("assertive", 0.5)
                )
                
                # Check trust levels
                trust_level = self._get_trust_level(agent1.id, agent2.id)
                
                # Conflict likely if high assertiveness difference and low trust
                if assertiveness_diff > 0.4 and trust_level < 0.4:
                    return True
        
        return False

    async def _resolve_conflicts(self, agent_ids: List[str], task_id: str):
        """Resolve conflicts between agents through mediation"""
        
        logger.info(f"⚖️ Resolving conflicts for task {task_id}")
        
        # Find most diplomatic agent (high cooperative, low assertive)
        mediator = None
        best_score = 0
        
        for agent_id in agent_ids:
            agent = self.agents.get(agent_id)
            if not agent:
                continue
            
            diplomacy_score = (
                agent.personality_traits.get("cooperative", 0.5) * 0.7 +
                (1 - agent.personality_traits.get("assertive", 0.5)) * 0.3
            )
            
            if diplomacy_score > best_score:
                best_score = diplomacy_score
                mediator = agent
        
        if mediator:
            # Create conflict resolution interaction
            for agent_id in agent_ids:
                if agent_id != mediator.id:
                    interaction = AgentInteraction(
                        id=f"resolve_{uuid.uuid4().hex[:8]}",
                        timestamp=datetime.now(),
                        initiator_id=mediator.id,
                        recipient_id=agent_id,
                        interaction_type=InteractionType.CONFLICT_RESOLUTION,
                        context={"mediator": mediator.id, "task_id": task_id},
                        content="Facilitating conflict resolution and alignment",
                        effectiveness_score=0.7 + (best_score * 0.3)
                    )
                    
                    self.interaction_history.append(interaction)
                    
                    # Improve trust after successful resolution
                    await self._update_trust_levels(mediator.id, agent_id, 0.8)

    async def _execute_integration_phase(self, task_id: str):
        """Execute integration and finalization phase"""
        task = self.active_tasks.get(task_id)
        if not task:
            return
        
        logger.info(f"🔗 Integration phase for task {task_id}")
        
        # Select integration lead (most experienced agent)
        lead_agent = None
        best_performance = 0
        
        for agent_id in task.assigned_agents:
            performance = self.performance_metrics.get(agent_id, {}).get("task_completion_rate", 0)
            if performance > best_performance:
                best_performance = performance
                lead_agent = self.agents.get(agent_id)
        
        if lead_agent:
            # Create integration interactions
            for agent_id in task.assigned_agents:
                if agent_id != lead_agent.id:
                    interaction = AgentInteraction(
                        id=f"integrate_{uuid.uuid4().hex[:8]}",
                        timestamp=datetime.now(),
                        initiator_id=lead_agent.id,
                        recipient_id=agent_id,
                        interaction_type=InteractionType.COLLABORATION,
                        context={"phase": "integration", "task_id": task_id},
                        content="Integrating contributions and finalizing solution",
                        effectiveness_score=0.8
                    )
                    
                    self.interaction_history.append(interaction)
        
        await asyncio.sleep(1)
        task.progress = 0.9

    async def _complete_task(self, task_id: str):
        """Complete task and update agent performance"""
        task = self.active_tasks.get(task_id)
        if not task:
            return
        
        logger.info(f"✅ Completing task {task_id}")
        
        task.status = "completed"
        task.progress = 1.0
        
        # Calculate task success metrics
        collaboration_effectiveness = self._calculate_collaboration_effectiveness(task.assigned_agents)
        task_quality = 0.8 + (collaboration_effectiveness * 0.2)
        
        # Update agent performance metrics
        for agent_id in task.assigned_agents:
            agent = self.agents.get(agent_id)
            if not agent:
                continue
            
            # Update metrics
            current_metrics = self.performance_metrics[agent_id]
            current_metrics["task_completion_rate"] = min(1.0, current_metrics["task_completion_rate"] + 0.1)
            current_metrics["collaboration_effectiveness"] = collaboration_effectiveness
            
            # Update agent state
            agent.current_state = AgentState.IDLE
            agent.current_workload = max(0, agent.current_workload - task.complexity * 0.3)
            agent.available_capacity = min(1.0, agent.available_capacity + task.complexity * 0.3)
            
            # Add to performance history
            agent.performance_history.append({
                "task_id": task_id,
                "completion_time": datetime.now().isoformat(),
                "quality_score": task_quality,
                "collaboration_score": collaboration_effectiveness
            })
        
        # Detect emergent behaviors
        await self._detect_emergent_behaviors(task_id)

    def _calculate_collaboration_effectiveness(self, agent_ids: List[str]) -> float:
        """Calculate how effectively agents collaborated"""
        
        # Get recent interactions for these agents
        recent_interactions = [
            interaction for interaction in self.interaction_history[-50:]  # Last 50 interactions
            if interaction.initiator_id in agent_ids and interaction.recipient_id in agent_ids
        ]
        
        if not recent_interactions:
            return 0.5
        
        # Calculate average effectiveness
        avg_effectiveness = sum(
            interaction.effectiveness_score or 0.5 
            for interaction in recent_interactions
        ) / len(recent_interactions)
        
        # Bonus for interaction diversity
        interaction_types = set(interaction.interaction_type for interaction in recent_interactions)
        diversity_bonus = len(interaction_types) / len(InteractionType) * 0.2
        
        return min(1.0, avg_effectiveness + diversity_bonus)

    async def _detect_emergent_behaviors(self, task_id: str):
        """Detect emergent behaviors from agent interactions"""
        
        # Analyze recent interaction patterns
        task_interactions = [
            interaction for interaction in self.interaction_history
            if interaction.context.get("task_id") == task_id
        ]
        
        if len(task_interactions) < 5:
            return
        
        # Detect patterns
        emergent_behaviors = []
        
        # Leadership emergence
        leadership_scores = {}
        for interaction in task_interactions:
            if interaction.interaction_type in [InteractionType.DELEGATION, InteractionType.CONFLICT_RESOLUTION]:
                leadership_scores[interaction.initiator_id] = leadership_scores.get(interaction.initiator_id, 0) + 1
        
        if leadership_scores:
            leader = max(leadership_scores.items(), key=lambda x: x[1])
            emergent_behaviors.append({
                "type": "natural_leadership",
                "agent_id": leader[0],
                "strength": leader[1] / len(task_interactions),
                "description": f"Agent {leader[0]} emerged as natural leader"
            })
        
        # Innovation patterns
        knowledge_sharing_count = len([
            i for i in task_interactions 
            if i.interaction_type == InteractionType.KNOWLEDGE_SHARING
        ])
        
        if knowledge_sharing_count > len(task_interactions) * 0.3:
            emergent_behaviors.append({
                "type": "knowledge_synergy",
                "strength": knowledge_sharing_count / len(task_interactions),
                "description": "High knowledge sharing leading to innovative solutions"
            })
        
        # Store emergent behaviors
        if emergent_behaviors:
            self.emergent_behaviors.extend(emergent_behaviors)
            logger.info(f"🌟 Detected {len(emergent_behaviors)} emergent behaviors in task {task_id}")

    def _get_trust_level(self, agent1_id: str, agent2_id: str) -> float:
        """Get trust level between two agents"""
        agent1 = self.agents.get(agent1_id)
        if not agent1:
            return 0.5
        
        return agent1.trust_network.get(agent2_id, 0.5)  # Default neutral trust

    async def _update_trust_levels(self, agent1_id: str, agent2_id: str, interaction_quality: float):
        """Update trust levels based on interaction quality"""
        
        agent1 = self.agents.get(agent1_id)
        agent2 = self.agents.get(agent2_id)
        
        if not agent1 or not agent2:
            return
        
        # Update trust bidirectionally
        current_trust1 = agent1.trust_network.get(agent2_id, 0.5)
        current_trust2 = agent2.trust_network.get(agent1_id, 0.5)
        
        # Gradual trust adjustment
        trust_adjustment = (interaction_quality - 0.5) * 0.1
        
        agent1.trust_network[agent2_id] = max(0, min(1, current_trust1 + trust_adjustment))
        agent2.trust_network[agent1_id] = max(0, min(1, current_trust2 + trust_adjustment))

    def get_orchestration_metrics(self) -> Dict[str, Any]:
        """Get comprehensive orchestration metrics"""
        
        active_agents = len([a for a in self.agents.values() if a.current_state != AgentState.IDLE])
        total_interactions = len(self.interaction_history)
        
        # Calculate average trust levels
        all_trust_values = []
        for agent in self.agents.values():
            all_trust_values.extend(agent.trust_network.values())
        
        avg_trust = sum(all_trust_values) / len(all_trust_values) if all_trust_values else 0.5
        
        # Calculate collaboration effectiveness
        recent_interactions = self.interaction_history[-100:]  # Last 100 interactions
        avg_effectiveness = sum(
            i.effectiveness_score or 0.5 for i in recent_interactions
        ) / len(recent_interactions) if recent_interactions else 0.5
        
        return {
            "system_overview": {
                "total_agents": len(self.agents),
                "active_agents": active_agents,
                "active_tasks": len(self.active_tasks),
                "total_interactions": total_interactions
            },
            "collaboration_metrics": {
                "average_trust_level": avg_trust,
                "collaboration_effectiveness": avg_effectiveness,
                "emergent_behaviors_detected": len(self.emergent_behaviors)
            },
            "performance_metrics": {
                "agent_utilization": active_agents / max(len(self.agents), 1),
                "task_completion_rate": sum(
                    self.performance_metrics.get(aid, {}).get("task_completion_rate", 0)
                    for aid in self.agents.keys()
                ) / max(len(self.agents), 1),
                "system_efficiency": avg_effectiveness * avg_trust
            },
            "emergent_behaviors": self.emergent_behaviors[-10:],  # Last 10 behaviors
            "knowledge_network": {
                expertise: len(agents) for expertise, agents in self.knowledge_graph.items()
            }
        }

    async def optimize_agent_allocation(self) -> Dict[str, Any]:
        """Optimize agent allocation based on performance and workload"""
        
        optimization_results = {
            "rebalanced_agents": [],
            "performance_improvements": {},
            "recommendations": []
        }
        
        # Identify overloaded and underutilized agents
        for agent_id, agent in self.agents.items():
            if agent.current_workload > 0.8:  # Overloaded
                optimization_results["recommendations"].append(
                    f"Agent {agent_id} is overloaded (workload: {agent.current_workload:.2f})"
                )
            elif agent.current_workload < 0.2:  # Underutilized
                optimization_results["recommendations"].append(
                    f"Agent {agent_id} is underutilized (workload: {agent.current_workload:.2f})"
                )
        
        # Performance-based recommendations
        for agent_id, metrics in self.performance_metrics.items():
            if metrics["collaboration_effectiveness"] < 0.6:
                optimization_results["recommendations"].append(
                    f"Improve collaboration training for agent {agent_id}"
                )
        
        logger.info(f"🔧 Generated {len(optimization_results['recommendations'])} optimization recommendations")
        
        return optimization_results

# Global instance
advanced_orchestrator = AdvancedMultiAgentOrchestrator()