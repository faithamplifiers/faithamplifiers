import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, Check, Trash2, MailOpen, AlertCircle, Archive, Filter } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ContactMessages: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'read' | 'replied' | 'archived'>('all');
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load contact messages');
    } finally {
      setLoading(false);
    }
  };

  const updateMessageStatus = async (id: string, newStatus: 'read' | 'replied' | 'archived') => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(`Message marked as ${newStatus}`);
      
      // Update local state
      setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, status: newStatus } : msg));
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Message deleted');
      setMessages(prev => prev.filter(msg => msg.id !== id));
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (filter === 'all') return true;
    return msg.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            <AlertCircle className="w-3.5 h-3.5 mr-1" /> New
          </span>
        );
      case 'read':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
            <MailOpen className="w-3.5 h-3.5 mr-1" /> Read
          </span>
        );
      case 'replied':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <Check className="w-3.5 h-3.5 mr-1" /> Replied
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            <Archive className="w-3.5 h-3.5 mr-1" /> Archived
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contact Submissions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">View and respond to inquiries from users</p>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'new', 'read', 'replied', 'archived'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setFilter(tab);
                setSelectedMessage(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                filter === tab
                  ? 'bg-secondary text-primary shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-750 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-1 space-y-3 max-h-[70vh] overflow-y-auto pr-2">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-100 dark:border-gray-700 text-center text-gray-500">
              No messages found.
            </div>
          ) : (
            filteredMessages.map(msg => (
              <div
                key={msg.id}
                onClick={() => {
                  setSelectedMessage(msg);
                  if (msg.status === 'new') {
                    updateMessageStatus(msg.id, 'read');
                  }
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 text-left ${
                  selectedMessage?.id === msg.id
                    ? 'bg-secondary/10 border-secondary dark:bg-secondary/5'
                    : msg.status === 'new'
                    ? 'bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-900/50 shadow-sm'
                    : 'bg-white dark:bg-gray-800 border-gray-150 dark:border-gray-700'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-bold truncate max-w-[150px] ${msg.status === 'new' ? 'text-gray-900 dark:text-white font-extrabold' : 'text-gray-600 dark:text-gray-300'}`}>
                    {msg.name}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {format(new Date(msg.created_at), 'MMM d')}
                  </span>
                </div>
                <h4 className={`text-sm truncate mb-2 ${msg.status === 'new' ? 'text-primary dark:text-white font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                  {msg.subject}
                </h4>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-450 dark:text-gray-400 truncate max-w-[120px]">
                    {msg.email}
                  </span>
                  {getStatusBadge(msg.status)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Details */}
        <div className="lg:col-span-2">
          {selectedMessage ? (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6 text-left animate-in fade-in duration-300">
              <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-700 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedMessage.subject}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    From: <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedMessage.name}</span> ({selectedMessage.email})
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Received: {format(new Date(selectedMessage.created_at), 'MMMM d, yyyy h:mm a')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedMessage.status)}
                  <button
                    onClick={() => deleteMessage(selectedMessage.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete Message"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Message Content */}
              <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-100 dark:border-gray-800 min-h-[150px] whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                {selectedMessage.message}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                  onClick={() => {
                    if (selectedMessage.status !== 'replied') {
                      updateMessageStatus(selectedMessage.id, 'replied');
                    }
                  }}
                  className="btn btn-primary inline-flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" /> Reply via Email
                </a>
                
                {selectedMessage.status !== 'replied' && (
                  <button
                    onClick={() => updateMessageStatus(selectedMessage.id, 'replied')}
                    className="btn btn-outline inline-flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Mark as Replied
                  </button>
                )}

                {selectedMessage.status !== 'archived' && (
                  <button
                    onClick={() => updateMessageStatus(selectedMessage.id, 'archived')}
                    className="btn btn-outline inline-flex items-center gap-2 text-amber-600 border-amber-200 dark:border-amber-900/50 hover:bg-amber-50 dark:hover:bg-amber-900/10"
                  >
                    <Archive className="w-4 h-4" /> Archive Message
                  </button>
                )}

                {selectedMessage.status === 'archived' && (
                  <button
                    onClick={() => updateMessageStatus(selectedMessage.id, 'read')}
                    className="btn btn-outline inline-flex items-center gap-2"
                  >
                    <MailOpen className="w-4 h-4" /> Unarchive Message
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[300px] flex flex-col justify-center items-center bg-white dark:bg-gray-800 p-12 rounded-2xl border border-gray-100 dark:border-gray-700 text-gray-400">
              <Mail className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <h3 className="font-bold text-gray-700 dark:text-gray-300">No Message Selected</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-xs text-center">
                Click on a submission from the list to view its contents and respond.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactMessages;
