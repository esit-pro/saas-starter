'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardAction } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

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
  onAddComment: (comment: { content: string; isInternal: boolean }) => void;
};

export function TicketComments({ ticketId, comments, onAddComment }: TicketCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment({
        content: newComment,
        isInternal,
      });
      setNewComment('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4 max-h-[400px] overflow-y-auto p-1">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className={`p-3 ${comment.isInternal ? 'bg-amber-50' : 'bg-white'}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center">
                  <div className="font-medium text-sm">{comment.user.name || comment.user.email}</div>
                  {comment.isInternal && (
                    <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs">
                      Internal
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                </div>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
            </Card>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <Input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="w-full"
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
            />
            Internal note (only visible to team)
          </label>
          <Button type="submit" size="sm">
            Add Comment
          </Button>
        </div>
      </form>
    </div>
  );
} 