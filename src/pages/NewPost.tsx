import React, { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// Lazy load the MDEditor component
const MDEditor = lazy(() => import('@uiw/react-md-editor'));

export default function NewPost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to publish a post');
      return;
    }

    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    setPublishing(true);
    setError('');

    try {
      // First verify the user's profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('User profile not found. Please try logging out and back in.');
      }

      // Then create the post
      const { error: postError } = await supabase
        .from('posts')
        .insert([
          {
            title: title.trim(),
            content: content.trim(),
            author_id: user.id,
            published: true,
            created_at: new Date().toISOString()
          }
        ]);

      if (postError) throw postError;
      navigate('/');
    } catch (err: any) {
      console.error('Post creation error:', err);
      setError(err.message || 'Failed to publish post. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in to write a post</h2>
        <button
          onClick={() => navigate('/login')}
          className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Login
        </button>
      </div>
    );
  }

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
            disabled={publishing}
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Content</label>
          <Suspense fallback={<div className="h-[400px] bg-gray-100 animate-pulse rounded-lg"></div>}>
            <MDEditor
              value={content}
              onChange={(val) => setContent(val || '')}
              preview="edit"
              height={400}
            />
          </Suspense>
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