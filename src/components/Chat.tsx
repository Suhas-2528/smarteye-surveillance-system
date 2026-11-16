import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Send, User, Image as ImageIcon, Paperclip, Search, X, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatUser {
  uid: string;
  name: string;
  role: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId?: string;
  text: string;
  fileUrl?: string;
  fileType?: string;
  timestamp: any;
}

interface ChatProps {
  userName: string;
}

export default function Chat({ userName }: ChatProps) {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ data: string; type: string; name: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUser = auth.currentUser;

  // Fetch users for the chat list
  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, 'users_public'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList = snapshot.docs
        .map(doc => doc.data() as ChatUser)
        .filter(user => user.uid !== currentUser.uid);
      setUsers(usersList);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Fetch messages for the selected chat
  useEffect(() => {
    if (!currentUser) return;

    let q;
    if (selectedUser) {
      // Direct messages between current user and selected user
      q = query(
        collection(db, 'messages'),
        where('senderId', 'in', [currentUser.uid, selectedUser.uid]),
        where('receiverId', 'in', [currentUser.uid, selectedUser.uid]),
        orderBy('timestamp', 'asc'),
        limit(100)
      );
    } else {
      // Global chat (messages with no receiverId)
      q = query(
        collection(db, 'messages'),
        where('receiverId', '==', null),
        orderBy('timestamp', 'asc'),
        limit(100)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [currentUser, selectedUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputText.trim() && !attachedFile) || !currentUser) return;

    try {
      const messageData: any = {
        senderId: currentUser.uid,
        senderName: userName,
        text: inputText.trim(),
        timestamp: serverTimestamp(),
      };

      if (selectedUser) {
        messageData.receiverId = selectedUser.uid;
      } else {
        messageData.receiverId = null;
      }

      if (attachedFile) {
        messageData.fileUrl = attachedFile.data;
        messageData.fileType = attachedFile.type;
      }

      await addDoc(collection(db, 'messages'), messageData);
      setInputText('');
      setAttachedFile(null);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size to 1MB for base64 storage in Firestore
    if (file.size > 1024 * 1024) {
      alert('File size too large. Please select a file smaller than 1MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadstart = () => setIsUploading(true);
    reader.onload = (event) => {
      setAttachedFile({
        data: event.target?.result as string,
        type: file.type,
        name: file.name
      });
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[600px] bg-[#0a0a0c] rounded-2xl border border-white/5 overflow-hidden">
      {/* Users List Sidebar */}
      <div className="w-80 border-r border-white/5 flex flex-col">
        <div className="p-4 border-b border-white/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <button 
            onClick={() => setSelectedUser(null)}
            className={`w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors text-left ${!selectedUser ? 'bg-white/5 border-l-2 border-emerald-500' : ''}`}
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Global Chat</p>
              <p className="text-xs text-slate-500">Public channel</p>
            </div>
          </button>

          {filteredUsers.map(user => (
            <button 
              key={user.uid}
              onClick={() => setSelectedUser(user)}
              className={`w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors text-left ${selectedUser?.uid === user.uid ? 'bg-white/5 border-l-2 border-emerald-500' : ''}`}
            >
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                <User size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{user.name}</p>
                <p className="text-xs text-slate-500">{user.role}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedUser ? 'bg-blue-500/20 text-blue-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
              {selectedUser ? <User size={20} /> : <Activity size={20} />}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{selectedUser ? selectedUser.name : 'Global Chat'}</p>
              <p className="text-xs text-emerald-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </p>
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => {
            const isMe = msg.senderId === currentUser?.uid;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] ${isMe ? 'order-2' : ''}`}>
                  {!isMe && !selectedUser && (
                    <p className="text-[10px] text-slate-500 mb-1 ml-1">{msg.senderName}</p>
                  )}
                  <div className={`rounded-2xl px-4 py-2.5 ${
                    isMe 
                      ? 'bg-emerald-500 text-white rounded-tr-none' 
                      : 'bg-white/5 text-slate-200 rounded-tl-none border border-white/5'
                  }`}>
                    {msg.text && <p className="text-sm leading-relaxed">{msg.text}</p>}
                    
                    {msg.fileUrl && (
                      <div className="mt-2">
                        {msg.fileType?.startsWith('image/') ? (
                          <img 
                            src={msg.fileUrl} 
                            alt="Attached" 
                            className="max-w-full rounded-lg border border-white/10"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <a 
                            href={msg.fileUrl} 
                            download 
                            className="flex items-center gap-2 text-xs bg-black/20 p-2 rounded-lg hover:bg-black/30 transition-colors"
                          >
                            <Paperclip size={14} />
                            <span>Download File</span>
                          </a>
                        )}
                      </div>
                    )}
                    
                    <p className={`text-[9px] mt-1 ${isMe ? 'text-emerald-100' : 'text-slate-500'}`}>
                      {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 bg-white/[0.02] border-t border-white/5">
          <AnimatePresence>
            {attachedFile && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mb-3 p-2 bg-white/5 rounded-xl flex items-center justify-between border border-white/10"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  {attachedFile.type.startsWith('image/') ? (
                    <img src={attachedFile.data} className="w-10 h-10 rounded object-cover" alt="Preview" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center">
                      <Paperclip size={16} />
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="text-xs text-white truncate">{attachedFile.name}</p>
                    <p className="text-[10px] text-slate-500">Ready to send</p>
                  </div>
                </div>
                <button 
                  onClick={() => setAttachedFile(null)}
                  className="p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSendMessage} className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all"
                title="Attach image"
              >
                <ImageIcon size={20} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            
            <div className="flex-1 relative">
              <input 
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={selectedUser ? `Message ${selectedUser.name}...` : "Type a message..."}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.08] transition-all"
              />
            </div>

            <button 
              type="submit"
              disabled={(!inputText.trim() && !attachedFile) || isUploading}
              className="p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
