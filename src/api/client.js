// Form/write operations — plain fetch against the backend API.
//
// This module is in the eager graph of every page (App -> ConsultationModal ->
// ContactForm), so it must stay dependency-free. Supabase-backed blog reads live
// in api/blogs.js; importing them here would put the whole SDK on every page.
// See also: getBlogs / getBlogBySlug in ./blogs.js

// Backend API — used for write operations (contact, applications)
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const updateBlogContent = async (id, content, table = 'blogs') => {
  try {
    const response = await fetch(`${API_BASE}/blogs/${id}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, table }),
    });
    if (!response.ok) throw new Error('Failed to update blog content');
    return await response.json();
  } catch (error) {
    console.error('updateBlogContent error:', error);
    return { error };
  }
};

/* =========================================
   WRITE OPERATIONS — via backend API
   ========================================= */

export const submitContactForm = async (data) => {
  try {
    const response = await fetch(`${API_BASE}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to submit contact');
    }

    return await response.json();
  } catch (error) {
    console.error('submitContactForm error:', error);
    return { error: error.message || error };
  }
};

export const submitNewsletterForm = async (data) => {
  try {
    const response = await fetch(`${API_BASE}/newsletter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to submit newsletter subscription');
    }

    return await response.json();
  } catch (error) {
    console.error('submitNewsletterForm error:', error);
    return { error: error.message || error };
  }
};

export const submitApplicationForm = async (formData) => {
  try {
    const response = await fetch(`${API_BASE}/apply`, {
      method: 'POST',
      body: formData, // FormData directly
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to submit application');
    }

    return await response.json();
  } catch (error) {
    console.error('submitApplicationForm error:', error);
    return { error: error.message || error };
  }
};
