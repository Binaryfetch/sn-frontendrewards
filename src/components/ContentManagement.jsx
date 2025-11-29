import React, { useState, useEffect, useCallback } from "react";
import { getAllContent, createContent, updateContent, deleteContent, getContentSummary } from "../api/api";

export default function ContentManagement({ enableUploads = true }) {
  const [content, setContent] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [formData, setFormData] = useState({
    type: "Image",
    title: "",
    description: "",
    visibleTo: "Both",
    tags: "",
    file: null
  });
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadContent = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10
      });
      
      if (activeTab !== 'all') {
        params.append('type', activeTab);
      }

      const response = await getAllContent(params.toString());
      setContent(response.data.content);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Error loading content:", error);
    }
  }, [currentPage, activeTab]);

  const loadSummary = useCallback(async () => {
    try {
      const response = await getContentSummary();
      setSummary(response.data);
    } catch (error) {
      console.error("Error loading summary:", error);
    }
  }, []);

  useEffect(() => {
    loadContent();
    loadSummary();
  }, [loadContent, loadSummary]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('type', formData.type);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('visibleTo', formData.visibleTo);
      formDataToSend.append('tags', formData.tags);
      if (formData.file) {
        formDataToSend.append('file', formData.file);
      }

      if (editingContent) {
        await updateContent(editingContent._id, formData);
      } else {
        await createContent(formDataToSend);
      }

      setShowForm(false);
      setEditingContent(null);
      setFormData({
        type: "Image",
        title: "",
        description: "",
        visibleTo: "Both",
        tags: "",
        file: null
      });
      loadContent();
      loadSummary();
    } catch (error) {
      console.error("Error saving content:", error);
      alert(error.response?.data?.msg || "Failed to save content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (content) => {
    setEditingContent(content);
    setFormData({
      type: content.type,
      title: content.title,
      description: content.description,
      visibleTo: content.visibleTo,
      tags: content.tags.join(', '),
      file: null
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this content?")) {
      try {
        await deleteContent(id);
        loadContent();
        loadSummary();
      } catch (error) {
        console.error("Error deleting content:", error);
        alert(error.response?.data?.msg || "Failed to delete content. Please try again.");
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'Image': return '🖼️';
      case 'Video': return '🎥';
      case 'Document': return '📄';
      case 'News': return '📰';
      default: return '📁';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Content Management</h2>
          <p className="text-gray-600">Manage videos, images, documents, and news updates</p>
        </div>
        {enableUploads && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <span className="mr-2">📤</span>
            Upload Content
          </button>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">📁</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-blue-900">{summary.totalContent}</h3>
                <p className="text-sm text-blue-700">Total Content</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">🖼️</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-green-900">
                  {summary.summary.find(s => s._id === 'Image')?.count || 0}
                </h3>
                <p className="text-sm text-green-700">Images</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">🎥</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-purple-900">
                  {summary.summary.find(s => s._id === 'Video')?.count || 0}
                </h3>
                <p className="text-sm text-purple-700">Videos</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">📰</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-yellow-900">
                  {summary.summary.find(s => s._id === 'News')?.count || 0}
                </h3>
                <p className="text-sm text-yellow-700">News Updates</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto">
            {['all', 'Image', 'Video', 'Document', 'News'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getFileIcon(tab)}</span>
                  <span>{tab === 'all' ? 'All Content' : tab}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Content List */}
          {content.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📁</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
              <p className="text-gray-500">Upload your first piece of content to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {content.map((item) => (
                <div key={item._id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-16 w-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                          <span className="text-white text-2xl">{getFileIcon(item.type)}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                        <p className="text-gray-600 mt-1">{item.description}</p>
                        <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                          <span>Type: {item.type}</span>
                          <span>Visible to: {item.visibleTo}</span>
                          <span>Size: {formatFileSize(item.fileSize)}</span>
                          <span>Uploaded: {new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                        {item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {item.tags.map((tag, index) => (
                              <span key={index} className="bg-primary-100 text-primary-800 px-2 py-1 rounded-md text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-gray-400 hover:text-primary-600 transition-colors duration-200"
                      >
                        <span className="text-lg">✏️</span>
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                      >
                        <span className="text-lg">🗑️</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upload Form Modal */}
      {enableUploads && showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingContent ? 'Edit Content' : 'Upload New Content'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingContent(null);
                  setFormData({
                    type: "Image",
                    title: "",
                    description: "",
                    visibleTo: "Both",
                    tags: "",
                    file: null
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">✕</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="Image">Image</option>
                    <option value="Video">Video</option>
                    <option value="Document">Document</option>
                    <option value="News">News</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Visible To</label>
                  <select
                    value={formData.visibleTo}
                    onChange={(e) => setFormData({ ...formData, visibleTo: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="Both">Both Distributors & Dealers</option>
                    <option value="Distributor">Distributors Only</option>
                    <option value="Dealer">Dealers Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g., promotion, announcement, training"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {!editingContent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">File</label>
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        // Validate file size (100MB limit)
                        if (file.size > 100 * 1024 * 1024) {
                          alert('File size must be less than 100MB');
                          e.target.value = '';
                          return;
                        }
                        // Validate file type
                        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/avi', 'video/mov', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                        if (!allowedTypes.includes(file.type)) {
                          alert('Invalid file type. Please select an image, video, or document file.');
                          e.target.value = '';
                          return;
                        }
                      }
                      setFormData({ ...formData, file: file });
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required={!editingContent}
                    accept="image/*,video/*,.pdf,.doc,.docx"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: Images (JPG, PNG, GIF), Videos (MP4, AVI, MOV), Documents (PDF, DOC, DOCX). Max size: 100MB
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingContent(null);
                    setFormData({
                      type: "Image",
                      title: "",
                      description: "",
                      visibleTo: "Both",
                      tags: "",
                      file: null
                    });
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-medium hover:from-primary-600 hover:to-primary-700 transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingContent ? 'Update Content' : 'Upload Content')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
