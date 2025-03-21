'use client';

import React, { useState, useOptimistic } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { addTicketComment } from '../dashboard/tickets/actions';

type Comment = {
  id: number;
  content: string;
  createdAt: Date;
  isInternal: boolean;
  user: {
    id: number;
    name: string | null;
    email: string;
  };
};

type TicketCommentsProps = {
  ticketId: number;
  comments: Comment[];
};

export function TicketComments({ ticketId, comments: initialComments }: TicketCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Optimistic updates
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    initialComments,
    (state, newComment: Comment) => [newComment, ...state]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    
    // Create form data
    const formData = new FormData();
    formData.append('ticketId', ticketId.toString());
    formData.append('content', newComment);
    formData.append('isInternal', isInternal.toString());
    
    try {
      // Create optimistic comment for immediate UI update
      const optimisticComment = {
        id: Date.now(), // temporary ID
        content: newComment,
        createdAt: new Date(),
        isInternal,
        user: {
          id: 0, // Will be replaced with actual user
          name: 'You', // Placeholder
          email: '',
        },
      };
      
      // Add to optimistic state
      addOptimisticComment(optimisticComment);
      
      // Clear form
      setNewComment('');
      
      // Submit to server
      const result = await addTicketComment(
        {
          ticketId,
          content: newComment,
          isInternal
        },
        formData
      );
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      toast.success("Comment added successfully");
      
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error("Failed to add comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4">
        {optimisticComments.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No comments yet</p>
        ) : (
          optimisticComments.map((comment) => (
            <div key={comment.id} className={`p-3 rounded-md ${comment.isInternal ? 'bg-amber-50/50 dark:bg-amber-950/20' : 'bg-gray-50/50 dark:bg-gray-800/20'}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center">
                  <div className="font-medium text-sm">{comment.user.name || comment.user.email}</div>
                  {comment.isInternal && (
                    <span className="ml-2 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 rounded-full text-xs">
                      Internal
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))
        )}
      </div>

      <div className="mt-auto pt-4">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                disabled={isSubmitting}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="border-input focus:ring-ring"
                  disabled={isSubmitting}
                />
                Internal note (only visible to team)
              </label>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Comment'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 