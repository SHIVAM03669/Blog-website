import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { BookOpen, Clock, User } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredPost, ...regularPosts] = posts;

  useEffect(() => {
    async function fetchPosts() {
      // Fetch posts from Supabase with joins
      // This query:
      // 1. Selects all columns from posts table
      // 2. Joins with profiles table to get author information
      // 3. Filters for published posts only (RLS policy applies)
      // 4. Orders by creation date, newest first
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (username, avatar_url)
        `)
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
      } else {
        setPosts(data || []);
      }
      setLoading(false);
    }

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center py-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl text-white px-4">
        <h1 className="text-5xl font-bold mb-6">Welcome to BlogSpace</h1>
        <p className="text-xl mb-8 max-w-2xl mx-auto">Share your stories, ideas, and expertise with the world. Join our community of writers and readers.</p>
        <Link
          to="/new-post"
          className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors inline-flex items-center"
        >
          <BookOpen className="mr-2" size={20} />
          Start Writing
        </Link>
      </div>

      {/* Featured Post */}
      {featuredPost && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Featured Post</h2>
          <Link
            to={`/post/${featuredPost.id}`}
            className="block bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow"
          >
            <div className="p-8">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">{featuredPost.title}</h3>
              <p className="text-gray-600 text-lg mb-6 line-clamp-3">
                {featuredPost.content.substring(0, 200)}...
              </p>
              <div className="flex items-center text-gray-500 space-x-6">
                <div className="flex items-center">
                  <User size={18} className="mr-2" />
                  <span>{featuredPost.profiles.username}</span>
                </div>
                <div className="flex items-center">
                  <Clock size={18} className="mr-2" />
                  <span>{format(new Date(featuredPost.created_at), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Regular Posts Grid */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Latest Posts</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {regularPosts.map((post) => (
            <Link
              key={post.id}
              to={`/post/${post.id}`}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all transform hover:-translate-y-1"
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">{post.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {post.content.substring(0, 150)}...
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <User size={16} className="mr-2" />
                    <span>{post.profiles.username}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock size={16} className="mr-2" />
                    <span>{format(new Date(post.created_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}