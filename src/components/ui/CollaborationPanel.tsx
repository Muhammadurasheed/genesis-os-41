import React from 'react';
import { motion } from 'framer-motion';
import { Users, MessageCircle, Share2, Eye } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';

interface CollaborationPanelProps {
  collaborators: Array<{
    id: string;
    name: string;
    color: string;
    isActive: boolean;
  }>;
  cursorPositions: Record<string, { x: number; y: number }>;
  className?: string;
}

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  collaborators,
  cursorPositions,
  className = ''
}) => {
  const activeCollaborators = collaborators.filter(c => c.isActive);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`bg-black/80 backdrop-blur-lg rounded-lg p-4 border border-white/10 min-w-[280px] ${className}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <Users className="w-5 h-5 text-blue-400" />
        <h3 className="text-white font-medium">Live Collaboration</h3>
        <div className="ml-auto flex items-center gap-1">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-400 text-sm">{activeCollaborators.length} online</span>
        </div>
      </div>

      {/* Active Collaborators */}
      <div className="space-y-3 mb-4">
        {collaborators.map((collaborator) => (
          <motion.div
            key={collaborator.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={`/api/avatar/${collaborator.id}`} />
              <AvatarFallback 
                className="text-xs font-medium"
                style={{ backgroundColor: collaborator.color + '40', color: collaborator.color }}
              >
                {collaborator.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <p className="text-white text-sm font-medium">{collaborator.name}</p>
              <div className="flex items-center gap-2 text-xs">
                <div 
                  className={`w-2 h-2 rounded-full ${collaborator.isActive ? 'bg-green-400' : 'bg-gray-500'}`}
                />
                <span className="text-white/60">
                  {collaborator.isActive ? 'Active' : 'Away'}
                </span>
              </div>
            </div>

            {collaborator.isActive && (
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3 text-blue-400" />
                <span className="text-blue-400 text-xs">Viewing</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="border-t border-white/10 pt-3">
        <div className="flex items-center gap-2">
          <button className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors text-sm">
            <Share2 className="w-4 h-4" />
            Invite
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-colors text-sm">
            <MessageCircle className="w-4 h-4" />
            Chat
          </button>
        </div>
      </div>

      {/* Cursor Activity Indicator */}
      {Object.keys(cursorPositions).length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            {Object.keys(cursorPositions).length} cursor{Object.keys(cursorPositions).length !== 1 ? 's' : ''} active
          </div>
        </div>
      )}
    </motion.div>
  );
};