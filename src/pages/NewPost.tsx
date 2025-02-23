import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import MDEditor from '@uiw/react-md-editor';

export default function NewPost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setPublishing(true);
    try {
      // Insert new post into posts table
      // RLS policy ensures only authenticated users can insert
      // and author_id must match the authenticated user's ID
      const { error: postError } = await supabase
        .from('posts')
        .insert([
          {
            title,
            content,
            author_id: user.id,
            published: true
          }
        ]);

      if (postError) throw postError;
      navigate('/');
    } catch (err) {
      setError('Failed to publish post');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Write a New Post</h1>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-700 mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Content</label>
          <MDEditor
            value={content}
            onChange={(val) => setContent(val || '')}
            preview="edit"
            height={400}
          />
        </div>
        <button
          type="submit"
          disabled={publishing}
          className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400"
        >
          {publishing ? 'Publishing...' : 'Publish Post'}
        </button>
      </form>
    </div>
  );
}