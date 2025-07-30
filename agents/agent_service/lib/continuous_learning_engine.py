"""
Phase 3: Continuous Learning Engine
Advanced learning capabilities for autonomous agent improvement and adaptation
"""

import asyncio
import json
import time
import uuid
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from enum import Enum
import logging

logger = logging.getLogger("continuous_learning_engine")

class LearningType(Enum):
    PERFORMANCE_OPTIMIZATION = "performance_optimization"
    BEHAVIORAL_ADAPTATION = "behavioral_adaptation"
    KNOWLEDGE_ACQUISITION = "knowledge_acquisition"
    SKILL_ENHANCEMENT = "skill_enhancement"
    COLLABORATIVE_IMPROVEMENT = "collaborative_improvement"
    ERROR_CORRECTION = "error_correction"

class LearningMethod(Enum):
    REINFORCEMENT_LEARNING = "reinforcement_learning"
    IMITATION_LEARNING = "imitation_learning"
    SELF_REFLECTION = "self_reflection"
    PEER_LEARNING = "peer_learning"
    EXPERIENTIAL_LEARNING = "experiential_learning"
    META_LEARNING = "meta_learning"

@dataclass
class LearningExperience:
    id: str
    agent_id: str
    timestamp: datetime
    context: Dict[str, Any]
    action_taken: str
    outcome: str
    success_score: float  # 0.0 to 1.0
    feedback: Dict[str, Any]
    learning_opportunity: bool
    reflection_notes: Optional[str] = None

@dataclass
class LearningPattern:
    id: str
    pattern_type: str
    description: str
    success_rate: float
    confidence: float
    frequency: int
    last_observed: datetime
    applicability_conditions: Dict[str, Any]
    recommended_actions: List[str]

@dataclass
class SkillAssessment:
    skill_name: str
    current_level: float  # 0.0 to 1.0
    target_level: float
    improvement_rate: float
    learning_curve_stage: str  # "novice", "developing", "proficient", "expert"
    last_assessment: datetime
    improvement_recommendations: List[str]

@dataclass
class LearningGoal:
    id: str
    agent_id: str
    goal_type: LearningType
    description: str
    target_metrics: Dict[str, float]
    current_progress: Dict[str, float]
    deadline: datetime
    priority: float
    learning_strategy: List[LearningMethod]
    success_criteria: Dict[str, Any]
    status: str = "active"  # "active", "completed", "paused", "failed"

class ContinuousLearningEngine:
    """
    Advanced continuous learning system for agent improvement
    Features:
    - Multi-modal learning (reinforcement, imitation, self-reflection)
    - Performance pattern recognition
    - Adaptive skill development
    - Collaborative learning networks
    - Meta-learning capabilities
    """
    
    def __init__(self):
        self.learning_experiences: List[LearningExperience] = []
        self.learning_patterns: Dict[str, LearningPattern] = {}
        self.agent_skill_assessments: Dict[str, Dict[str, SkillAssessment]] = {}
        self.agent_learning_goals: Dict[str, List[LearningGoal]] = {}
        self.performance_baselines: Dict[str, Dict[str, float]] = {}
        self.learning_networks: Dict[str, List[str]] = {}  # agent_id -> list of learning partners
        
        logger.info("🧠 Continuous Learning Engine initialized")

    async def register_learning_experience(
        self, 
        agent_id: str, 
        experience_data: Dict[str, Any]
    ) -> str:
        """Register a new learning experience for an agent"""
        
        experience_id = f"exp_{uuid.uuid4().hex[:8]}"
        
        # Evaluate the experience for learning potential
        success_score = self._calculate_success_score(experience_data)
        learning_opportunity = self._identify_learning_opportunity(experience_data, success_score)
        
        experience = LearningExperience(
            id=experience_id,
            agent_id=agent_id,
            timestamp=datetime.now(),
            context=experience_data.get("context", {}),
            action_taken=experience_data.get("action", ""),
            outcome=experience_data.get("outcome", ""),
            success_score=success_score,
            feedback=experience_data.get("feedback", {}),
            learning_opportunity=learning_opportunity
        )
        
        self.learning_experiences.append(experience)
        
        # Trigger immediate learning if significant experience
        if learning_opportunity:
            await self._process_learning_opportunity(experience)
        
        # Update pattern recognition
        await self._update_learning_patterns(agent_id)
        
        # Update skill assessments
        await self._update_skill_assessments(agent_id, experience)
        
        logger.info(f"📚 Registered learning experience {experience_id} for agent {agent_id}")
        return experience_id

    def _calculate_success_score(self, experience_data: Dict[str, Any]) -> float:
        """Calculate success score based on multiple factors"""
        
        # Base success indicators
        outcome_quality = experience_data.get("outcome_quality", 0.5)
        efficiency = experience_data.get("efficiency", 0.5)
        user_satisfaction = experience_data.get("user_satisfaction", 0.5)
        task_completion = experience_data.get("task_completion", 0.5)
        
        # Weighted success score
        success_score = (
            outcome_quality * 0.3 +
            efficiency * 0.2 +
            user_satisfaction * 0.3 +
            task_completion * 0.2
        )
        
        # Bonus for innovation or creative solutions
        if experience_data.get("innovation_detected", False):
            success_score = min(1.0, success_score + 0.1)
        
        # Penalty for errors or negative feedback
        if experience_data.get("errors_occurred", False):
            success_score = max(0.0, success_score - 0.2)
        
        return success_score

    def _identify_learning_opportunity(self, experience_data: Dict[str, Any], success_score: float) -> bool:
        """Identify if an experience presents a significant learning opportunity"""
        
        # High-impact learning scenarios
        if success_score < 0.3:  # Failure scenarios offer learning
            return True
        
        if success_score > 0.9:  # Exceptional success patterns worth learning
            return True
        
        if experience_data.get("novel_situation", False):  # New situations
            return True
        
        if experience_data.get("feedback_available", False):  # Direct feedback
            return True
        
        if experience_data.get("collaborative_task", False):  # Collaboration scenarios
            return True
        
        return False

    async def _process_learning_opportunity(self, experience: LearningExperience):
        """Process a learning opportunity to extract insights"""
        
        # Generate reflection notes
        reflection = await self._generate_reflection(experience)
        experience.reflection_notes = reflection
        
        # Extract learning patterns
        patterns = await self._extract_patterns_from_experience(experience)
        for pattern in patterns:
            await self._update_or_create_pattern(pattern)
        
        # Determine learning method
        learning_method = self._select_optimal_learning_method(experience)
        
        # Apply learning
        await self._apply_learning(experience, learning_method)
        
        logger.info(f"🎯 Processed learning opportunity {experience.id} using {learning_method}")

    async def _generate_reflection(self, experience: LearningExperience) -> str:
        """Generate self-reflection notes for the experience"""
        
        reflection_prompts = {
            "success": "What factors contributed to this successful outcome?",
            "failure": "What could have been done differently to improve the outcome?",
            "novel": "What new insights were gained from this novel situation?",
            "collaborative": "How did collaboration enhance or hinder the outcome?"
        }
        
        # Determine reflection type
        if experience.success_score > 0.8:
            reflection_type = "success"
        elif experience.success_score < 0.3:
            reflection_type = "failure"
        elif experience.context.get("novel_situation"):
            reflection_type = "novel"
        elif experience.context.get("collaborative_task"):
            reflection_type = "collaborative"
        else:
            reflection_type = "success"
        
        # Generate structured reflection
        reflection = f"""
        {reflection_prompts[reflection_type]}
        
        Context Analysis:
        - Task complexity: {experience.context.get('complexity', 'unknown')}
        - Resources available: {experience.context.get('resources', 'standard')}
        - Time constraints: {experience.context.get('time_pressure', 'normal')}
        
        Performance Metrics:
        - Success score: {experience.success_score:.2f}
        - Action taken: {experience.action_taken}
        - Outcome achieved: {experience.outcome}
        
        Key Insights:
        - {self._extract_key_insight(experience)}
        
        Improvement Opportunities:
        - {self._identify_improvement_areas(experience)}
        """
        
        return reflection.strip()

    def _extract_key_insight(self, experience: LearningExperience) -> str:
        """Extract key insight from experience"""
        
        if experience.success_score > 0.8:
            return f"High success was achieved through {experience.action_taken}, indicating effective strategy"
        elif experience.success_score < 0.3:
            return f"Low success suggests that {experience.action_taken} may not be optimal for this context"
        else:
            return f"Moderate success indicates potential for optimization in {experience.action_taken}"

    def _identify_improvement_areas(self, experience: LearningExperience) -> str:
        """Identify specific areas for improvement"""
        
        areas = []
        
        if experience.success_score < 0.5:
            areas.append("strategy selection and execution")
        
        if experience.context.get("time_pressure") == "high" and experience.success_score < 0.7:
            areas.append("performance under time constraints")
        
        if experience.context.get("collaborative_task") and experience.success_score < 0.6:
            areas.append("collaborative coordination and communication")
        
        if not areas:
            areas.append("maintaining consistency and further optimization")
        
        return ", ".join(areas)

    async def _extract_patterns_from_experience(self, experience: LearningExperience) -> List[LearningPattern]:
        """Extract learning patterns from an experience"""
        
        patterns = []
        
        # Context-action-outcome pattern
        if experience.success_score > 0.8:
            pattern = LearningPattern(
                id=f"pattern_{uuid.uuid4().hex[:8]}",
                pattern_type="successful_strategy",
                description=f"Action '{experience.action_taken}' in context '{experience.context.get('type', 'general')}' leads to positive outcomes",
                success_rate=experience.success_score,
                confidence=0.7,
                frequency=1,
                last_observed=datetime.now(),
                applicability_conditions=experience.context,
                recommended_actions=[experience.action_taken]
            )
            patterns.append(pattern)
        
        # Collaborative pattern
        if experience.context.get("collaborative_task") and experience.success_score > 0.7:
            pattern = LearningPattern(
                id=f"pattern_{uuid.uuid4().hex[:8]}",
                pattern_type="collaborative_success",
                description="Collaborative approaches yield positive results in team scenarios",
                success_rate=experience.success_score,
                confidence=0.6,
                frequency=1,
                last_observed=datetime.now(),
                applicability_conditions={"task_type": "collaborative"},
                recommended_actions=["engage_team_members", "coordinate_effectively"]
            )
            patterns.append(pattern)
        
        return patterns

    async def _update_or_create_pattern(self, new_pattern: LearningPattern):
        """Update existing pattern or create new one"""
        
        # Look for similar existing patterns
        similar_pattern = None
        for pattern_id, existing_pattern in self.learning_patterns.items():
            if (existing_pattern.pattern_type == new_pattern.pattern_type and
                self._patterns_are_similar(existing_pattern, new_pattern)):
                similar_pattern = existing_pattern
                break
        
        if similar_pattern:
            # Update existing pattern
            similar_pattern.frequency += 1
            similar_pattern.last_observed = datetime.now()
            
            # Update success rate (weighted average)
            weight = 0.8  # Weight for existing data
            similar_pattern.success_rate = (
                similar_pattern.success_rate * weight + 
                new_pattern.success_rate * (1 - weight)
            )
            
            # Increase confidence
            similar_pattern.confidence = min(1.0, similar_pattern.confidence + 0.1)
            
        else:
            # Create new pattern
            self.learning_patterns[new_pattern.id] = new_pattern

    def _patterns_are_similar(self, pattern1: LearningPattern, pattern2: LearningPattern) -> bool:
        """Check if two patterns are similar enough to merge"""
        
        # Compare applicability conditions
        common_conditions = set(pattern1.applicability_conditions.keys()) & set(pattern2.applicability_conditions.keys())
        
        if len(common_conditions) < 2:  # Need at least 2 common conditions
            return False
        
        # Check if condition values are similar
        for condition in common_conditions:
            if pattern1.applicability_conditions[condition] != pattern2.applicability_conditions[condition]:
                return False
        
        return True

    def _select_optimal_learning_method(self, experience: LearningExperience) -> LearningMethod:
        """Select the most appropriate learning method for the experience"""
        
        # Rule-based selection based on experience characteristics
        if experience.success_score < 0.3:
            return LearningMethod.ERROR_CORRECTION
        
        if experience.context.get("collaborative_task"):
            return LearningMethod.PEER_LEARNING
        
        if experience.context.get("novel_situation"):
            return LearningMethod.EXPERIENTIAL_LEARNING
        
        if experience.feedback:
            return LearningMethod.REINFORCEMENT_LEARNING
        
        if experience.success_score > 0.8:
            return LearningMethod.IMITATION_LEARNING
        
        return LearningMethod.SELF_REFLECTION

    async def _apply_learning(self, experience: LearningExperience, method: LearningMethod):
        """Apply the selected learning method to improve agent performance"""
        
        if method == LearningMethod.REINFORCEMENT_LEARNING:
            await self._apply_reinforcement_learning(experience)
        elif method == LearningMethod.IMITATION_LEARNING:
            await self._apply_imitation_learning(experience)
        elif method == LearningMethod.SELF_REFLECTION:
            await self._apply_self_reflection(experience)
        elif method == LearningMethod.PEER_LEARNING:
            await self._apply_peer_learning(experience)
        elif method == LearningMethod.EXPERIENTIAL_LEARNING:
            await self._apply_experiential_learning(experience)
        elif method == LearningMethod.ERROR_CORRECTION:
            await self._apply_error_correction(experience)

    async def _apply_reinforcement_learning(self, experience: LearningExperience):
        """Apply reinforcement learning based on feedback"""
        
        agent_id = experience.agent_id
        
        # Update action-value estimates
        action = experience.action_taken
        reward = experience.success_score
        
        # Store in agent's policy for future decision making
        if agent_id not in self.performance_baselines:
            self.performance_baselines[agent_id] = {}
        
        if action not in self.performance_baselines[agent_id]:
            self.performance_baselines[agent_id][action] = []
        
        self.performance_baselines[agent_id][action].append(reward)
        
        # Keep only recent performance data (last 20 experiences)
        if len(self.performance_baselines[agent_id][action]) > 20:
            self.performance_baselines[agent_id][action] = self.performance_baselines[agent_id][action][-20:]
        
        logger.info(f"🎯 Applied reinforcement learning for agent {agent_id} action '{action}' with reward {reward:.2f}")

    async def _apply_imitation_learning(self, experience: LearningExperience):
        """Apply imitation learning from successful experiences"""
        
        agent_id = experience.agent_id
        
        # Find similar successful experiences from other agents
        similar_successful_experiences = [
            exp for exp in self.learning_experiences
            if (exp.agent_id != agent_id and 
                exp.success_score > 0.8 and
                self._experiences_are_similar(experience, exp))
        ]
        
        if similar_successful_experiences:
            # Extract best practices from similar successful experiences
            best_practices = []
            for exp in similar_successful_experiences:
                best_practices.append({
                    "action": exp.action_taken,
                    "context": exp.context,
                    "success_score": exp.success_score
                })
            
            # Store best practices for agent
            await self._store_best_practices(agent_id, best_practices)
            
            logger.info(f"🎭 Applied imitation learning for agent {agent_id} from {len(best_practices)} successful examples")

    async def _apply_self_reflection(self, experience: LearningExperience):
        """Apply self-reflection learning"""
        
        agent_id = experience.agent_id
        
        # Generate deeper insights through structured reflection
        insights = {
            "situation_analysis": self._analyze_situation(experience),
            "decision_quality": self._evaluate_decision_quality(experience),
            "outcome_factors": self._identify_outcome_factors(experience),
            "future_improvements": self._suggest_future_improvements(experience)
        }
        
        # Store insights for agent
        await self._store_reflection_insights(agent_id, insights)
        
        logger.info(f"🪞 Applied self-reflection learning for agent {agent_id}")

    async def _apply_peer_learning(self, experience: LearningExperience):
        """Apply peer learning from collaborative experiences"""
        
        agent_id = experience.agent_id
        
        # Identify learning partners
        if agent_id not in self.learning_networks:
            self.learning_networks[agent_id] = []
        
        # Find agents who participated in similar collaborative tasks
        collaborative_agents = set()
        for exp in self.learning_experiences:
            if (exp.context.get("collaborative_task") and 
                exp.agent_id != agent_id and
                exp.success_score > 0.6):
                collaborative_agents.add(exp.agent_id)
        
        # Update learning network
        for peer_id in collaborative_agents:
            if peer_id not in self.learning_networks[agent_id]:
                self.learning_networks[agent_id].append(peer_id)
        
        # Exchange learning insights
        await self._facilitate_peer_knowledge_exchange(agent_id, list(collaborative_agents))
        
        logger.info(f"🤝 Applied peer learning for agent {agent_id} with {len(collaborative_agents)} peers")

    async def _apply_experiential_learning(self, experience: LearningExperience):
        """Apply experiential learning from novel situations"""
        
        agent_id = experience.agent_id
        
        # Create learning goal for handling similar novel situations
        learning_goal = LearningGoal(
            id=f"goal_{uuid.uuid4().hex[:8]}",
            agent_id=agent_id,
            goal_type=LearningType.SKILL_ENHANCEMENT,
            description=f"Improve performance in novel situations similar to: {experience.context.get('situation_type', 'unknown')}",
            target_metrics={"success_rate": 0.8, "adaptability": 0.9},
            current_progress={"success_rate": experience.success_score, "adaptability": 0.5},
            deadline=datetime.now() + timedelta(days=30),
            priority=0.7,
            learning_strategy=[LearningMethod.EXPERIENTIAL_LEARNING, LearningMethod.SELF_REFLECTION]
        )
        
        if agent_id not in self.agent_learning_goals:
            self.agent_learning_goals[agent_id] = []
        
        self.agent_learning_goals[agent_id].append(learning_goal)
        
        logger.info(f"🌱 Applied experiential learning for agent {agent_id} - created learning goal {learning_goal.id}")

    async def _apply_error_correction(self, experience: LearningExperience):
        """Apply error correction learning from failures"""
        
        agent_id = experience.agent_id
        
        # Analyze failure patterns
        failure_pattern = {
            "failed_action": experience.action_taken,
            "failure_context": experience.context,
            "error_type": self._classify_error_type(experience),
            "correction_strategy": self._suggest_correction_strategy(experience)
        }
        
        # Store failure pattern for future avoidance
        await self._store_failure_pattern(agent_id, failure_pattern)
        
        # Create corrective learning goal
        corrective_goal = LearningGoal(
            id=f"goal_{uuid.uuid4().hex[:8]}",
            agent_id=agent_id,
            goal_type=LearningType.ERROR_CORRECTION,
            description=f"Avoid repeating error pattern: {failure_pattern['error_type']}",
            target_metrics={"error_reduction": 0.8},
            current_progress={"error_reduction": 0.0},
            deadline=datetime.now() + timedelta(days=14),
            priority=0.9,  # High priority
            learning_strategy=[LearningMethod.ERROR_CORRECTION, LearningMethod.REINFORCEMENT_LEARNING]
        )
        
        if agent_id not in self.agent_learning_goals:
            self.agent_learning_goals[agent_id] = []
        
        self.agent_learning_goals[agent_id].append(corrective_goal)
        
        logger.info(f"🔧 Applied error correction learning for agent {agent_id}")

    async def _update_skill_assessments(self, agent_id: str, experience: LearningExperience):
        """Update agent skill assessments based on experience"""
        
        if agent_id not in self.agent_skill_assessments:
            self.agent_skill_assessments[agent_id] = {}
        
        # Infer skills from experience context and action
        relevant_skills = self._extract_relevant_skills(experience)
        
        for skill_name in relevant_skills:
            if skill_name not in self.agent_skill_assessments[agent_id]:
                # Initialize new skill assessment
                self.agent_skill_assessments[agent_id][skill_name] = SkillAssessment(
                    skill_name=skill_name,
                    current_level=0.5,
                    target_level=0.8,
                    improvement_rate=0.0,
                    learning_curve_stage="developing",
                    last_assessment=datetime.now(),
                    improvement_recommendations=[]
                )
            
            skill_assessment = self.agent_skill_assessments[agent_id][skill_name]
            
            # Update skill level based on performance
            performance_impact = self._calculate_performance_impact(experience, skill_name)
            
            # Adaptive learning rate
            learning_rate = 0.1 if experience.success_score > 0.7 else 0.05
            
            # Update current level
            skill_assessment.current_level = min(1.0, max(0.0, 
                skill_assessment.current_level + (performance_impact * learning_rate)
            ))
            
            # Update improvement rate
            time_diff = (datetime.now() - skill_assessment.last_assessment).total_seconds() / 3600  # hours
            if time_diff > 0:
                level_change = skill_assessment.current_level - (skill_assessment.current_level - performance_impact * learning_rate)
                skill_assessment.improvement_rate = level_change / time_diff
            
            # Update learning curve stage
            skill_assessment.learning_curve_stage = self._determine_learning_stage(skill_assessment.current_level)
            skill_assessment.last_assessment = datetime.now()
            
            # Generate improvement recommendations
            skill_assessment.improvement_recommendations = self._generate_skill_recommendations(skill_assessment, experience)

    def _extract_relevant_skills(self, experience: LearningExperience) -> List[str]:
        """Extract relevant skills from experience"""
        
        skills = []
        
        # Map actions to skills
        action_skill_mapping = {
            "analysis": ["analytical_thinking", "problem_solving"],
            "communication": ["communication", "interpersonal"],
            "planning": ["strategic_planning", "organization"],
            "execution": ["task_execution", "attention_to_detail"],
            "collaboration": ["teamwork", "collaboration"],
            "creativity": ["creative_thinking", "innovation"],
            "decision": ["decision_making", "critical_thinking"]
        }
        
        action_lower = experience.action_taken.lower()
        for action_key, skill_list in action_skill_mapping.items():
            if action_key in action_lower:
                skills.extend(skill_list)
        
        # Add context-based skills
        context_skills = {
            "technical": ["technical_expertise", "troubleshooting"],
            "customer": ["customer_service", "empathy"],
            "management": ["leadership", "delegation"],
            "research": ["research", "information_gathering"]
        }
        
        for context_key, skill_list in context_skills.items():
            if context_key in str(experience.context).lower():
                skills.extend(skill_list)
        
        return list(set(skills))  # Remove duplicates

    def _calculate_performance_impact(self, experience: LearningExperience, skill_name: str) -> float:
        """Calculate how the experience impacts a specific skill"""
        
        # Base impact from success score
        base_impact = (experience.success_score - 0.5) * 2  # Scale to -1 to 1
        
        # Skill-specific modifiers
        skill_relevance = 1.0
        
        if skill_name in ["communication", "interpersonal"] and experience.context.get("collaborative_task"):
            skill_relevance = 1.5
        elif skill_name in ["problem_solving", "analytical_thinking"] and "analysis" in experience.action_taken.lower():
            skill_relevance = 1.3
        elif skill_name in ["creativity", "innovation"] and experience.context.get("novel_situation"):
            skill_relevance = 1.4
        
        return base_impact * skill_relevance

    def _determine_learning_stage(self, current_level: float) -> str:
        """Determine learning curve stage based on current level"""
        
        if current_level < 0.3:
            return "novice"
        elif current_level < 0.6:
            return "developing"
        elif current_level < 0.8:
            return "proficient"
        else:
            return "expert"

    def _generate_skill_recommendations(self, skill_assessment: SkillAssessment, experience: LearningExperience) -> List[str]:
        """Generate improvement recommendations for a skill"""
        
        recommendations = []
        
        if skill_assessment.current_level < skill_assessment.target_level:
            gap = skill_assessment.target_level - skill_assessment.current_level
            
            if gap > 0.3:
                recommendations.append(f"Focus on foundational {skill_assessment.skill_name} training")
            elif gap > 0.1:
                recommendations.append(f"Practice {skill_assessment.skill_name} in varied contexts")
            else:
                recommendations.append(f"Fine-tune {skill_assessment.skill_name} through advanced exercises")
        
        if skill_assessment.improvement_rate < 0.01:  # Slow improvement
            recommendations.append(f"Try alternative learning approaches for {skill_assessment.skill_name}")
        
        return recommendations

    def get_agent_learning_status(self, agent_id: str) -> Dict[str, Any]:
        """Get comprehensive learning status for an agent"""
        
        # Get recent experiences
        recent_experiences = [
            exp for exp in self.learning_experiences[-50:]
            if exp.agent_id == agent_id
        ]
        
        # Calculate learning metrics
        total_experiences = len([exp for exp in self.learning_experiences if exp.agent_id == agent_id])
        learning_opportunities = len([exp for exp in recent_experiences if exp.learning_opportunity])
        
        avg_success_rate = sum(exp.success_score for exp in recent_experiences) / len(recent_experiences) if recent_experiences else 0.5
        
        # Get skill assessments
        skills = self.agent_skill_assessments.get(agent_id, {})
        
        # Get learning goals
        goals = self.agent_learning_goals.get(agent_id, [])
        active_goals = [goal for goal in goals if goal.status == "active"]
        
        # Get learning network
        learning_partners = self.learning_networks.get(agent_id, [])
        
        return {
            "agent_id": agent_id,
            "learning_overview": {
                "total_experiences": total_experiences,
                "recent_learning_opportunities": learning_opportunities,
                "average_success_rate": avg_success_rate,
                "learning_trajectory": "improving" if avg_success_rate > 0.6 else "developing"
            },
            "skill_assessments": {
                skill_name: {
                    "current_level": assessment.current_level,
                    "target_level": assessment.target_level,
                    "stage": assessment.learning_curve_stage,
                    "improvement_rate": assessment.improvement_rate,
                    "recommendations": assessment.improvement_recommendations
                }
                for skill_name, assessment in skills.items()
            },
            "active_learning_goals": [
                {
                    "id": goal.id,
                    "type": goal.goal_type.value,
                    "description": goal.description,
                    "progress": goal.current_progress,
                    "target": goal.target_metrics,
                    "deadline": goal.deadline.isoformat(),
                    "priority": goal.priority
                }
                for goal in active_goals
            ],
            "learning_network": {
                "partner_count": len(learning_partners),
                "partners": learning_partners
            },
            "recognized_patterns": [
                {
                    "type": pattern.pattern_type,
                    "description": pattern.description,
                    "success_rate": pattern.success_rate,
                    "confidence": pattern.confidence
                }
                for pattern in self.learning_patterns.values()
                if any(agent_id in str(pattern.applicability_conditions) for _ in [1])  # Agent-relevant patterns
            ][:5]  # Top 5 patterns
        }

    def get_system_learning_metrics(self) -> Dict[str, Any]:
        """Get system-wide learning metrics"""
        
        total_agents = len(set(exp.agent_id for exp in self.learning_experiences))
        total_experiences = len(self.learning_experiences)
        total_patterns = len(self.learning_patterns)
        
        # Calculate system-wide performance trends
        recent_experiences = self.learning_experiences[-1000:]  # Last 1000 experiences
        avg_system_performance = sum(exp.success_score for exp in recent_experiences) / len(recent_experiences) if recent_experiences else 0.5
        
        # Learning velocity (patterns discovered per experience)
        learning_velocity = total_patterns / max(total_experiences, 1)
        
        # Knowledge network density
        total_connections = sum(len(partners) for partners in self.learning_networks.values())
        network_density = total_connections / max(total_agents, 1)
        
        return {
            "system_overview": {
                "total_agents_learning": total_agents,
                "total_learning_experiences": total_experiences,
                "learning_patterns_discovered": total_patterns,
                "average_system_performance": avg_system_performance
            },
            "learning_metrics": {
                "learning_velocity": learning_velocity,
                "knowledge_network_density": network_density,
                "system_learning_effectiveness": avg_system_performance * learning_velocity
            },
            "learning_distribution": {
                learning_type.value: len([
                    goal for goals in self.agent_learning_goals.values() 
                    for goal in goals if goal.goal_type == learning_type
                ])
                for learning_type in LearningType
            },
            "top_learning_patterns": [
                {
                    "type": pattern.pattern_type,
                    "description": pattern.description,
                    "success_rate": pattern.success_rate,
                    "frequency": pattern.frequency,
                    "confidence": pattern.confidence
                }
                for pattern in sorted(
                    self.learning_patterns.values(),
                    key=lambda p: p.confidence * p.frequency,
                    reverse=True
                )[:10]
            ]
        }

# Global instance
continuous_learning_engine = ContinuousLearningEngine()