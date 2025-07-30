# AI Processing Service - Agent Service Core Domain
# SEPARATION OF CONCERNS: Agent Service handles all AI/ML intensive operations

import asyncio
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import json

from .gemini_service import gemini_service
from .memory_service import memory_service

logger = logging.getLogger(__name__)

class AIProcessingService:
    """
    Core AI processing service for Agent Service domain
    Handles: Intent Analysis, Cost Prediction, Agent Intelligence, Simulations
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.logger.info("🧠 AI Processing Service initialized - Agent Service Domain")
    
    async def analyze_user_intent(self, user_input: str) -> Dict[str, Any]:
        """
        Einstein-level intent analysis - Agent Service specialty
        """
        try:
            self.logger.info(f"🧠 Processing intent analysis for: {user_input[:50]}...")
            
            # Semantic analysis using Gemini
            semantic_prompt = f"""
            Analyze this user input with Einstein-level intelligence:
            "{user_input}"
            
            Provide comprehensive analysis including:
            1. Primary business intent and goals
            2. Industry context and domain
            3. Extracted processes and workflows
            4. Required agent types and capabilities
            5. Integration requirements
            6. Complexity assessment (1-10)
            7. Suggested clarification questions
            8. Cost implications
            
            Return as structured JSON.
            """
            
            analysis_result = await gemini_service.generate_response(semantic_prompt)
            
            # Enhanced processing with memory integration
            processed_analysis = {
                "user_input": user_input,
                "semantic_analysis": analysis_result,
                "extracted_goals": self._extract_goals(user_input),
                "business_context": self._analyze_business_context(user_input),
                "complexity_score": self._calculate_complexity(user_input),
                "suggested_agents": self._suggest_agent_types(user_input),
                "identified_processes": self._identify_processes(user_input),
                "required_integrations": self._identify_integrations(user_input),
                "clarification_questions": self._generate_clarification_questions(user_input),
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Store in memory for learning
            await memory_service.store_interaction({
                "type": "intent_analysis",
                "input": user_input,
                "analysis": processed_analysis,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            self.logger.info("✅ Intent analysis completed successfully")
            return processed_analysis
            
        except Exception as e:
            self.logger.error(f"❌ Intent analysis failed: {str(e)}")
            return self._fallback_intent_analysis(user_input)
    
    async def predict_costs(self, blueprint: Dict[str, Any]) -> Dict[str, Any]:
        """
        AI-driven cost prediction - Agent Service specialty
        """
        try:
            self.logger.info("💰 Processing cost prediction...")
            
            # Analyze blueprint complexity
            complexity_factors = {
                "agent_count": len(blueprint.get("agents", [])),
                "integration_count": len(blueprint.get("integrations", [])),
                "process_complexity": blueprint.get("analysis", {}).get("complexity_score", 1),
                "estimated_volume": self._estimate_volume(blueprint)
            }
            
            # AI-powered cost calculation
            cost_prompt = f"""
            Calculate comprehensive costs for this workflow blueprint:
            
            Agents: {complexity_factors['agent_count']}
            Integrations: {complexity_factors['integration_count']}
            Complexity: {complexity_factors['process_complexity']}/10
            Volume: {complexity_factors['estimated_volume']} ops/month
            
            Provide detailed cost breakdown including:
            1. Development costs
            2. Monthly operational costs
            3. Integration costs
            4. Scaling costs
            5. ROI projections
            
            Return as structured JSON with reasoning.
            """
            
            cost_analysis = await gemini_service.generate_response(cost_prompt)
            
            prediction = {
                "blueprint_id": blueprint.get("id"),
                "complexity_factors": complexity_factors,
                "cost_breakdown": {
                    "development": self._calculate_development_cost(complexity_factors),
                    "monthly_operational": self._calculate_operational_cost(complexity_factors),
                    "integration_setup": self._calculate_integration_cost(complexity_factors),
                    "scaling_projection": self._calculate_scaling_cost(complexity_factors)
                },
                "ai_analysis": cost_analysis,
                "confidence_score": self._calculate_confidence(complexity_factors),
                "recommendations": self._generate_cost_recommendations(complexity_factors),
                "timestamp": datetime.utcnow().isoformat()
            }
            
            self.logger.info("✅ Cost prediction completed")
            return prediction
            
        except Exception as e:
            self.logger.error(f"❌ Cost prediction failed: {str(e)}")
            return self._fallback_cost_prediction(blueprint)
    
    async def discover_mcp_tools(self, goals: List[str]) -> List[Dict[str, Any]]:
        """
        MCP tool discovery - Agent Service specialty
        """
        try:
            self.logger.info(f"🔗 Discovering MCP tools for {len(goals)} goals...")
            
            # AI-powered tool matching
            discovery_prompt = f"""
            Discover optimal MCP (Model Context Protocol) tools for these goals:
            {json.dumps(goals, indent=2)}
            
            For each goal, suggest:
            1. Tool name and category
            2. Capability match score (1-10)
            3. Integration complexity
            4. Cost implications
            5. Alternative tools
            
            Return as structured JSON array.
            """
            
            tool_suggestions = await gemini_service.generate_response(discovery_prompt)
            
            # Enhanced tool discovery with capability matching
            discovered_tools = []
            for goal in goals:
                tools = self._match_tools_to_goal(goal)
                discovered_tools.extend(tools)
            
            # Remove duplicates and rank by relevance
            unique_tools = self._deduplicate_and_rank_tools(discovered_tools)
            
            result = {
                "goals": goals,
                "discovered_tools": unique_tools,
                "ai_suggestions": tool_suggestions,
                "discovery_confidence": self._calculate_discovery_confidence(unique_tools),
                "timestamp": datetime.utcnow().isoformat()
            }
            
            self.logger.info(f"✅ Discovered {len(unique_tools)} MCP tools")
            return result
            
        except Exception as e:
            self.logger.error(f"❌ MCP tool discovery failed: {str(e)}")
            return self._fallback_tool_discovery(goals)
    
    # Helper methods for AI processing
    def _extract_goals(self, user_input: str) -> List[str]:
        """Extract business goals from user input"""
        # AI-powered goal extraction logic
        keywords = ['automate', 'improve', 'manage', 'create', 'build', 'integrate']
        goals = []
        
        for keyword in keywords:
            if keyword in user_input.lower():
                goals.append(f"Process automation related to {keyword}")
        
        return goals or ["General workflow automation"]
    
    def _analyze_business_context(self, user_input: str) -> Dict[str, Any]:
        """Analyze business context and industry"""
        industries = ['ecommerce', 'healthcare', 'finance', 'education', 'retail']
        detected_industry = 'general'
        
        for industry in industries:
            if industry in user_input.lower():
                detected_industry = industry
                break
        
        return {
            "industry": detected_industry,
            "business_size": "medium",  # Could be enhanced with more analysis
            "complexity_level": "moderate"
        }
    
    def _calculate_complexity(self, user_input: str) -> int:
        """Calculate complexity score 1-10"""
        complexity_indicators = ['integration', 'api', 'database', 'multiple', 'complex']
        score = 3  # Base score
        
        for indicator in complexity_indicators:
            if indicator in user_input.lower():
                score += 1
        
        return min(score, 10)
    
    def _suggest_agent_types(self, user_input: str) -> List[Dict[str, Any]]:
        """Suggest appropriate agent types"""
        agents = []
        
        if 'customer' in user_input.lower():
            agents.append({
                "type": "customer_service_agent",
                "role": "Handle customer inquiries",
                "priority": "high"
            })
        
        if 'data' in user_input.lower():
            agents.append({
                "type": "data_processor_agent", 
                "role": "Process and analyze data",
                "priority": "medium"
            })
        
        return agents or [{
            "type": "general_assistant_agent",
            "role": "General task automation",
            "priority": "medium"
        }]
    
    def _identify_processes(self, user_input: str) -> List[str]:
        """Identify business processes"""
        processes = []
        
        process_keywords = {
            'email': 'Email Processing',
            'order': 'Order Management', 
            'customer': 'Customer Service',
            'data': 'Data Processing',
            'report': 'Report Generation'
        }
        
        for keyword, process in process_keywords.items():
            if keyword in user_input.lower():
                processes.append(process)
        
        return processes or ['General Automation']
    
    def _identify_integrations(self, user_input: str) -> List[str]:
        """Identify required integrations"""
        integrations = []
        
        integration_keywords = {
            'slack': 'Slack API',
            'email': 'Email/SMTP',
            'database': 'Database Connection',
            'api': 'REST API Integration',
            'webhook': 'Webhook Integration'
        }
        
        for keyword, integration in integration_keywords.items():
            if keyword in user_input.lower():
                integrations.append(integration)
        
        return integrations or ['Basic API Integration']
    
    def _generate_clarification_questions(self, user_input: str) -> List[str]:
        """Generate intelligent clarification questions"""
        return [
            "What specific systems do you want to integrate with?",
            "How many users will interact with this workflow?", 
            "What's your expected volume of transactions per day?",
            "Do you have any existing tools that need to be connected?"
        ]
    
    def _fallback_intent_analysis(self, user_input: str) -> Dict[str, Any]:
        """Fallback analysis when AI fails"""
        return {
            "user_input": user_input,
            "extracted_goals": ["Automate business process"],
            "business_context": {"industry": "general", "complexity": "medium"},
            "complexity_score": 5,
            "suggested_agents": [{"type": "assistant", "role": "General automation"}],
            "identified_processes": ["Workflow automation"],
            "required_integrations": ["API integration"],
            "clarification_questions": ["What specific process do you want to automate?"],
            "fallback": True,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    # Cost prediction helper methods
    def _estimate_volume(self, blueprint: Dict[str, Any]) -> int:
        """Estimate operational volume"""
        base_volume = 1000  # Base operations per month
        complexity_multiplier = blueprint.get("analysis", {}).get("complexity_score", 1)
        return int(base_volume * complexity_multiplier)
    
    def _calculate_development_cost(self, factors: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate development costs"""
        base_cost = 5000
        agent_cost = factors["agent_count"] * 1000
        integration_cost = factors["integration_count"] * 500
        complexity_multiplier = factors["process_complexity"] / 10
        
        total = (base_cost + agent_cost + integration_cost) * (1 + complexity_multiplier)
        
        return {
            "total": int(total),
            "breakdown": {
                "base": base_cost,
                "agents": agent_cost,
                "integrations": integration_cost,
                "complexity_adjustment": int(total - base_cost - agent_cost - integration_cost)
            }
        }
    
    def _calculate_operational_cost(self, factors: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate monthly operational costs"""
        base_cost = 100
        volume_cost = factors["estimated_volume"] * 0.01  # $0.01 per operation
        agent_cost = factors["agent_count"] * 50  # $50 per agent per month
        
        total = base_cost + volume_cost + agent_cost
        
        return {
            "total": int(total),
            "breakdown": {
                "base_infrastructure": base_cost,
                "volume_based": int(volume_cost),
                "agent_runtime": agent_cost
            }
        }
    
    def _calculate_integration_cost(self, factors: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate integration setup costs"""
        cost_per_integration = 300
        total = factors["integration_count"] * cost_per_integration
        
        return {
            "total": total,
            "per_integration": cost_per_integration,
            "count": factors["integration_count"]
        }
    
    def _calculate_scaling_cost(self, factors: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Calculate scaling cost projections"""
        base_monthly = self._calculate_operational_cost(factors)["total"]
        
        return [
            {"scale": "1x", "monthly_cost": base_monthly, "volume": factors["estimated_volume"]},
            {"scale": "5x", "monthly_cost": base_monthly * 4, "volume": factors["estimated_volume"] * 5},
            {"scale": "10x", "monthly_cost": base_monthly * 7, "volume": factors["estimated_volume"] * 10}
        ]
    
    def _calculate_confidence(self, factors: Dict[str, Any]) -> float:
        """Calculate prediction confidence score"""
        confidence = 0.8  # Base confidence
        
        # Adjust based on complexity
        if factors["process_complexity"] > 7:
            confidence -= 0.1
        
        # Adjust based on scale
        if factors["estimated_volume"] > 10000:
            confidence -= 0.1
        
        return max(confidence, 0.5)
    
    def _generate_cost_recommendations(self, factors: Dict[str, Any]) -> List[str]:
        """Generate cost optimization recommendations"""
        recommendations = []
        
        if factors["agent_count"] > 5:
            recommendations.append("Consider consolidating similar agents to reduce operational costs")
        
        if factors["integration_count"] > 10:
            recommendations.append("Evaluate using middleware solutions for complex integrations")
        
        if factors["process_complexity"] > 7:
            recommendations.append("Consider phased implementation to spread development costs")
        
        return recommendations or ["Current configuration appears cost-optimized"]
    
    def _fallback_cost_prediction(self, blueprint: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback cost prediction"""
        return {
            "blueprint_id": blueprint.get("id"),
            "cost_breakdown": {
                "development": {"total": 5000},
                "monthly_operational": {"total": 200},
                "integration_setup": {"total": 500},
                "scaling_projection": [{"scale": "1x", "monthly_cost": 200}]
            },
            "confidence_score": 0.5,
            "fallback": True,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    # MCP tool discovery helper methods
    def _match_tools_to_goal(self, goal: str) -> List[Dict[str, Any]]:
        """Match tools to specific goals"""
        tools_db = {
            "email": [
                {"name": "Gmail API", "category": "email", "match_score": 9},
                {"name": "SendGrid", "category": "email", "match_score": 8}
            ],
            "data": [
                {"name": "Pandas Processor", "category": "data", "match_score": 9},
                {"name": "SQL Connector", "category": "database", "match_score": 8}
            ],
            "api": [
                {"name": "REST Client", "category": "integration", "match_score": 9},
                {"name": "GraphQL Connector", "category": "integration", "match_score": 7}
            ]
        }
        
        matched_tools = []
        for keyword, tools in tools_db.items():
            if keyword in goal.lower():
                matched_tools.extend(tools)
        
        return matched_tools or [{"name": "Universal Connector", "category": "general", "match_score": 6}]
    
    def _deduplicate_and_rank_tools(self, tools: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicates and rank by relevance"""
        unique_tools = {}
        
        for tool in tools:
            name = tool["name"]
            if name not in unique_tools or tool["match_score"] > unique_tools[name]["match_score"]:
                unique_tools[name] = tool
        
        # Sort by match score
        return sorted(unique_tools.values(), key=lambda x: x["match_score"], reverse=True)
    
    def _calculate_discovery_confidence(self, tools: List[Dict[str, Any]]) -> float:
        """Calculate tool discovery confidence"""
        if not tools:
            return 0.3
        
        avg_score = sum(tool["match_score"] for tool in tools) / len(tools)
        return min(avg_score / 10, 1.0)
    
    def _fallback_tool_discovery(self, goals: List[str]) -> Dict[str, Any]:
        """Fallback tool discovery"""
        return {
            "goals": goals,
            "discovered_tools": [
                {"name": "Universal API Connector", "category": "integration", "match_score": 6},
                {"name": "Data Processor", "category": "data", "match_score": 6}
            ],
            "discovery_confidence": 0.6,
            "fallback": True,
            "timestamp": datetime.utcnow().isoformat()
        }

# Singleton instance
ai_processing_service = AIProcessingService()