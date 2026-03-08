/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Lightbulb, 
  Code, 
  Bug, 
  Map as MapIcon, 
  Calculator, 
  ClipboardList, 
  Send, 
  Terminal, 
  Cpu, 
  Layers,
  ChevronRight,
  User,
  Bot,
  Plus,
  Trash2,
  Menu,
  X,
  Image as ImageIcon,
  Sparkles,
  Download,
  Settings,
  Sword,
  Shield,
  Pickaxe,
  Hammer,
  AlertTriangle,
  Video,
  Play,
  Lock
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, TaskConfig } from './types';
import { getChatResponseStream, generateVideo } from './services/geminiService';
import { generateForgeIcon, generateAssetImage } from './services/imageService';
import Auth from './components/Auth';
import Environment from './components/Environment';
import { cn } from './lib/utils';
import { TASK_CONFIGS, GAME_TEMPLATES, GameTemplate } from './constants';
import { motion } from 'motion/react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { useAudio } from './hooks/useAudio';

export default function App() {
  const { playClick, playTyping, toggleMusic, nextTrack } = useAudio();
  const [isMusicOn, setIsMusicOn] = useState(false);
  const [user, setUser] = useState<any>({ username: 'Guest', full_name: 'Guest User' });
  const [isAuthChecking, setIsAuthChecking] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [appLogo, setAppLogo] = useState<string | null>(null);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [renamingSessionId, setRenamingSessionId] = useState<number | null>(null);
  const [renameTitle, setRenameTitle] = useState('');

  // Asset Forge State
  const [isAssetForgeOpen, setIsAssetForgeOpen] = useState(false);
  const [isCharacterCreatorOpen, setIsCharacterCreatorOpen] = useState(false);
  const [isVideoForgeOpen, setIsVideoForgeOpen] = useState(false);
  const [videoPrompt, setVideoPrompt] = useState(() => localStorage.getItem('wildstar_video_prompt') || '');
  const [isVideoForging, setIsVideoForging] = useState(false);
  const [forgedVideo, setForgedVideo] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState('');
  const [hasVideoKey, setHasVideoKey] = useState(false);
  const [assetPrompt, setAssetPrompt] = useState(() => localStorage.getItem('wildstar_asset_prompt') || '');
  const [assetStyle, setAssetStyle] = useState(() => localStorage.getItem('wildstar_asset_style') || 'pixel art');
  const [isForgingAsset, setIsForgingAsset] = useState(false);
  const [forgedAsset, setForgedAsset] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [assetTab, setAssetTab] = useState<'forge' | 'gallery'>('forge');

  // Character Creator State
  const [charName, setCharName] = useState(() => localStorage.getItem('wildstar_char_name') || '');
  const [charRace, setCharRace] = useState(() => localStorage.getItem('wildstar_char_race') || 'Human');
  const [charClass, setCharClass] = useState(() => localStorage.getItem('wildstar_char_class') || 'Warrior');
  const [charStyle, setCharStyle] = useState(() => localStorage.getItem('wildstar_char_style') || 'pixel art');
  const [charTraits, setCharTraits] = useState(() => localStorage.getItem('wildstar_char_traits') || '');
  const [isCreatingChar, setIsCreatingChar] = useState(false);
  const [createdChar, setCreatedChar] = useState<string | null>(null);
  const [confirmingTemplate, setConfirmingTemplate] = useState<GameTemplate | null>(null);

  const [role, setRole] = useState<'DEVELOPER' | 'ADMIN' | 'USER'>('USER');
  const [accessKey, setAccessKey] = useState('');
  const [networkError, setNetworkError] = useState<string | null>(null);

  const handleAccessKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessKey === 'devs@2079') {
      setRole('DEVELOPER');
      alert('Access Granted: DEVELOPER');
    } else {
      alert('Invalid Key');
    }
    setAccessKey('');
  };

  // Profile State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileUsername, setProfileUsername] = useState(() => localStorage.getItem('wildstar_profile_username') || '');
  const [profileFullName, setProfileFullName] = useState(() => localStorage.getItem('wildstar_profile_full_name') || '');
  const [profileAvatar, setProfileAvatar] = useState(() => localStorage.getItem('wildstar_profile_avatar') || null);
  const [profilePassword, setProfilePassword] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Leaderboard State
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isFetchingLeaderboard, setIsFetchingLeaderboard] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkAuth();
    fetchLeaderboard();
    fetchSessions();
    fetchAssets();
  }, []);

  // Persist form states
  useEffect(() => {
    localStorage.setItem('wildstar_char_name', charName);
    localStorage.setItem('wildstar_char_race', charRace);
    localStorage.setItem('wildstar_char_class', charClass);
    localStorage.setItem('wildstar_char_style', charStyle);
    localStorage.setItem('wildstar_char_traits', charTraits);
  }, [charName, charRace, charClass, charStyle, charTraits]);

  useEffect(() => {
    localStorage.setItem('wildstar_asset_prompt', assetPrompt);
    localStorage.setItem('wildstar_asset_style', assetStyle);
  }, [assetPrompt, assetStyle]);

  useEffect(() => {
    localStorage.setItem('wildstar_video_prompt', videoPrompt);
  }, [videoPrompt]);

  useEffect(() => {
    localStorage.setItem('wildstar_profile_username', profileUsername);
    localStorage.setItem('wildstar_profile_full_name', profileFullName);
    localStorage.setItem('wildstar_profile_avatar', profileAvatar || '');
  }, [profileUsername, profileFullName, profileAvatar]);

  const checkAuth = async () => {
    // No-op
  };

  const handleConnectVideoEngine = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasVideoKey(true);
    }
  };

  const handleForgeVideo = async () => {
    if (!videoPrompt.trim()) return;
    setIsVideoForging(true);
    setForgedVideo(null);
    setVideoStatus('Initializing Video Architect...');
    
    try {
      const videoUrl = await generateVideo(videoPrompt, {}, (status) => setVideoStatus(status));
      setForgedVideo(videoUrl);
      setVideoStatus('Video Forged Successfully! ✨');
    } catch (err: any) {
      console.error('Video Forge failed', err);
      setVideoStatus(`Forge Error: ${err.message}`);
    } finally {
      setIsVideoForging(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const q = query(collection(db, 'sessions'), where('userId', '==', user.uid || 'guest'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSessions(data);
      if (data.length > 0 && !currentSessionId) {
        handleSwitchSession(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch sessions', err);
      setNetworkError('Connection to database failed. Working in offline mode.');
    }
  };

  const fetchAssets = async () => {
    try {
      const q = query(collection(db, 'assets'), where('userId', '==', user.uid || 'guest'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAssets(data);
    } catch (err) {
      console.error('Failed to fetch assets', err);
      setNetworkError('Connection to database failed. Working in offline mode.');
    }
  };

  const handleNewChat = async () => {
    try {
      const newSession = {
        id: Date.now(),
        title: `Quest #${sessions.length + 1}`,
        userId: user.uid || 'guest',
        timestamp: Date.now()
      };
      setSessions(prev => [newSession, ...prev]);
      handleSwitchSession(newSession.id);
    } catch (err) {
      console.error('Failed to create session', err);
    }
  };

  const handleSwitchSession = async (sessionId: string | number) => {
    playClick();
    setCurrentSessionId(typeof sessionId === 'string' ? parseInt(sessionId) : sessionId);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
    try {
      // For now, just clear messages if we don't have a backend
      setMessages([]);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: number) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this quest? All progress will be lost.')) return;
    try {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        setMessages([]);
        setCurrentSessionId(null);
      }
    } catch (err) {
      console.error('Failed to delete session', err);
    }
  };

  const handleRenameSession = async (e: React.FormEvent, sessionId: number) => {
    e.preventDefault();
    if (!renameTitle.trim()) return;
    try {
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: renameTitle } : s));
      setRenamingSessionId(null);
    } catch (err) {
      console.error('Failed to rename session', err);
    }
  };

  const saveMessage = async (msg: Message, sessionId: number | null = currentSessionId) => {
    // For now, just do nothing if we don't have a backend
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      // For now, just update local state
      setIsProfileModalOpen(false);
      setProfilePassword('');
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size to 5MB for safety
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Max 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const fetchLeaderboard = async () => {
    setIsFetchingLeaderboard(true);
    try {
      const q = query(collection(db, 'leaderboard'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to fetch leaderboard', err);
    } finally {
      setIsFetchingLeaderboard(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add typing sound on input change
  useEffect(() => {
    if (input.length > 0) playTyping();
  }, [input]);

  const handleSend = async (text: string = input) => {
    playClick();
    if (!text.trim() || isLoading) return;

    let sessionId = currentSessionId;
    if (!sessionId) {
      // Auto-create session if none active
      const newSession = {
        id: Date.now(),
        title: text.slice(0, 20) + '...',
        userId: user.uid || 'guest',
        timestamp: Date.now()
      };
      setSessions(prev => [newSession, ...prev]);
      sessionId = newSession.id;
      setCurrentSessionId(sessionId);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    // Add both messages at once to avoid multiple re-renders and potential race conditions
    setMessages(prev => [...prev, userMessage, assistantMessage]);
    
    setInput('');
    setIsLoading(true);

    try {
      let fullContent = '';
      // Use the messages from the current render as history
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const stream = getChatResponseStream(text, history);
      
      for await (const chunk of stream) {
        if (chunk.type === 'text' && chunk.content) {
          fullContent += chunk.content;
          setMessages(prev => 
            prev.map(m => String(m.id) === String(assistantMessageId) ? { ...m, content: fullContent } : m)
          );
        } else if (chunk.type === 'function_call' && chunk.call.name === 'generate_game_asset') {
          const args = chunk.call.args as { prompt: string, style?: string };
          
          // Show a status message
          setMessages(prev => 
            prev.map(m => String(m.id) === String(assistantMessageId) ? { ...m, content: fullContent + `\n\n*Forging asset: ${args.prompt}...*` } : m)
          );

          try {
            const imageUrl = await generateAssetImage(args.prompt, args.style || 'pixel art');
            if (imageUrl) {
              // Save to local state
              const newAsset = {
                id: Date.now(),
                prompt: args.prompt,
                style: args.style || 'pixel art',
                image_data: imageUrl,
                userId: user.uid || 'guest'
              };
              setAssets(prev => [newAsset, ...prev]);

              // Append image to chat
              fullContent += `\n\n![${args.prompt}](${imageUrl})`;
              setMessages(prev => 
                prev.map(m => String(m.id) === String(assistantMessageId) ? { ...m, content: fullContent } : m)
              );
            }
          } catch (err) {
            console.error('Failed to generate asset via AI:', err);
            fullContent += `\n\n*Failed to forge asset: ${args.prompt}*`;
            setMessages(prev => 
              prev.map(m => String(m.id) === String(assistantMessageId) ? { ...m, content: fullContent } : m)
            );
          }
        } else if (chunk.type === 'function_call' && chunk.call.name === 'generate_character') {
          const args = chunk.call.args as { name: string, race: string, charClass: string, traits?: string, style?: string };
          
          setMessages(prev => 
            prev.map(m => String(m.id) === String(assistantMessageId) ? { ...m, content: fullContent + `\n\n*Summoning character: ${args.name} (${args.race} ${args.charClass})...*` } : m)
          );

          try {
            const prompt = `A game character named ${args.name}. Race: ${args.race}, Class: ${args.charClass}. Traits: ${args.traits || ''}. Full body character design, centered, transparent background style.`;
            const imageUrl = await generateAssetImage(prompt, args.style || 'pixel art');
            if (imageUrl) {
              // Save to local state
              const newAsset = {
                id: Date.now(),
                prompt: `Character: ${args.name} (${args.race} ${args.charClass})`,
                style: args.style || 'pixel art',
                image_data: imageUrl,
                userId: user.uid || 'guest'
              };
              setAssets(prev => [newAsset, ...prev]);

              // Append image to chat
              fullContent += `\n\n### ${args.name}\n**Race:** ${args.race} | **Class:** ${args.charClass}\n\n![${args.name}](${imageUrl})`;
              setMessages(prev => 
                prev.map(m => String(m.id) === String(assistantMessageId) ? { ...m, content: fullContent } : m)
              );
            }
          } catch (err) {
            console.error('Failed to generate character via AI:', err);
            fullContent += `\n\n*Failed to summon character: ${args.name}*`;
            setMessages(prev => 
              prev.map(m => String(m.id) === String(assistantMessageId) ? { ...m, content: fullContent } : m)
            );
          }
        }
      }
    } catch (error) {
      console.error('Error getting response:', error);
      setMessages(prev => 
        prev.map(m => String(m.id) === String(assistantMessageId) ? { ...m, content: 'Sorry, I encountered an error. Please try again.' } : m)
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    if (currentSessionId) {
      setSessions(prev => prev.filter(s => s.id !== currentSessionId));
      setMessages([]);
      setCurrentSessionId(null);
    }
  };

  const handleGenerateLogo = async () => {
    setIsGeneratingLogo(true);
    try {
      const logoUrl = await generateForgeIcon();
      if (logoUrl) {
        setAppLogo(logoUrl);
      }
    } catch (error) {
      console.error('Error generating logo:', error);
    } finally {
      setIsGeneratingLogo(false);
    }
  };

  const handleGenerateCharacter = async () => {
    setIsCreatingChar(true);
    setCreatedChar(null);
    try {
      const prompt = `A game character named ${charName || 'Hero'}. Race: ${charRace}, Class: ${charClass}. Traits: ${charTraits}. Full body character design, centered, transparent background style.`;
      const imageUrl = await generateAssetImage(prompt, charStyle);
      if (imageUrl) {
        setCreatedChar(imageUrl);
        // Automatically save to gallery
        const newAsset = {
          id: Date.now(),
          prompt: `Character: ${charName || 'Unnamed'} (${charRace} ${charClass})`,
          style: charStyle,
          image_data: imageUrl,
          userId: user.uid || 'guest'
        };
        setAssets(prev => [newAsset, ...prev]);
      }
    } catch (error) {
      console.error('Error creating character:', error);
    } finally {
      setIsCreatingChar(false);
    }
  };

  const handleGenerateAsset = async () => {
    if (!assetPrompt.trim()) return;
    setIsForgingAsset(true);
    setForgedAsset(null);
    try {
      const imageUrl = await generateAssetImage(assetPrompt, assetStyle);
      if (imageUrl) {
        setForgedAsset(imageUrl);
        // Automatically save to gallery
        const newAsset = {
          id: Date.now(),
          prompt: assetPrompt,
          style: assetStyle,
          image_data: imageUrl,
          userId: user.uid || 'guest'
        };
        setAssets(prev => [newAsset, ...prev]);
      }
    } catch (error) {
      console.error('Error forging asset:', error);
    } finally {
      setIsForgingAsset(false);
    }
  };

  const handleDeleteAsset = async (assetId: number) => {
    try {
      setAssets(prev => prev.filter(a => a.id !== assetId));
    } catch (err) {
      console.error('Failed to delete asset', err);
    }
  };

  const downloadAsset = (imageData: string, filename: string = 'asset') => {
    const link = document.createElement('a');
    link.href = imageData;
    link.download = `${filename}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getIcon = (iconName: string, size: number = 18) => {
    switch (iconName) {
      case 'Lightbulb': return <Lightbulb size={size} />;
      case 'Code': return <Code size={size} />;
      case 'Bug': return <Bug size={size} />;
      case 'Map': return <MapIcon size={size} />;
      case 'Calculator': return <Calculator size={size} />;
      case 'ClipboardList': return <ClipboardList size={size} />;
      case 'Sword': return <Sword size={size} />;
      case 'Shield': return <Shield size={size} />;
      case 'Pickaxe': return <Pickaxe size={size} />;
      case 'Hammer': return <Hammer size={size} />;
      case 'Trophy': return <Sword size={size} />;
      case 'Users': return <User size={size} />;
      default: return <Terminal size={size} />;
    }
  };

  const handleTaskClick = (task: TaskConfig) => {
    setInput(task.prompt);
    setActiveTask(task.id);
  };

  if (isAuthChecking) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center mc-dirt">
        <div className="w-16 h-16 mc-panel bg-[#ff3232] animate-bounce mb-6 flex items-center justify-center">
          <Cpu size={32} className="text-black animate-pulse" />
        </div>
        <div className="font-display text-[#ff3232] text-sm tracking-widest animate-pulse">
          Loading_World...
        </div>
      </div>
    );
  }

  // if (!user) {
  //   return <Auth onAuthSuccess={(u) => { setUser(u); fetchSessions(); }} logo={appLogo} />;
  // }

  return (
    <div className="flex h-screen bg-black items-center justify-center p-4">
      <div className="cyber-bg" />
      <div className="particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${5 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>
      
      {/* Smartphone Frame */}
      <div className="relative w-full max-w-[375px] h-[800px] bg-[#0a0a0a] rounded-[40px] border-[8px] border-[#1a1a1a] shadow-[0_0_50px_rgba(0,255,255,0.2)] overflow-hidden flex flex-col">
        {networkError && (
          <div className="absolute top-0 left-0 right-0 bg-red-500/80 backdrop-blur text-white text-center p-2 z-50 text-xs font-mono">
            {networkError}
          </div>
        )}
        {/* Sidebar Overlay for Mobile/Compact View */}
        {isSidebarOpen && (
          <div 
            className="absolute inset-0 bg-black/60 z-30"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

      {/* Sidebar - Sessions */}
      <aside className={cn(
        "absolute inset-y-0 left-0 w-64 cyber-panel flex flex-col z-40 border-r border-white/10 transition-all duration-300 transform",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 cyber-panel shrink-0 flex items-center justify-center bg-[#00ffff]/20 overflow-hidden">
              {appLogo && appLogo !== "" ? (
                <img src={appLogo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Cpu size={24} className="text-[#00ffff]" />
              )}
            </div>
            <div>
              <h1 className="font-display text-base tracking-tight leading-none text-[#00ffff] pixel-text">
                WILDSTAR
              </h1>
              <p className="text-[9px] uppercase tracking-[0.2em] opacity-60 mt-1 font-mono">World Crafter</p>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 hover:bg-white/10 rounded"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 border-b border-white/10 space-y-2">
          <button 
            onClick={() => { handleNewChat(); setIsSidebarOpen(false); }}
            className="w-full cyber-button py-2 flex items-center justify-center gap-2 text-xs cyber-glow"
            title="Start a new crafting session"
          >
            <Plus size={14} />
            New Quest
          </button>
          <button 
            onClick={() => { 
                if (role === 'DEVELOPER') {
                    setIsAssetForgeOpen(true); 
                    setIsSidebarOpen(false); 
                    playClick();
                } else {
                    alert('Access Denied: DEVELOPER role required');
                }
            }}
            className="w-full cyber-button py-2 flex items-center justify-center gap-2 text-xs cyber-glow"
            title="Open the game asset generator"
          >
            <Sparkles size={14} />
            Asset Forge
          </button>
          <button 
            onClick={() => { 
                if (role === 'DEVELOPER') {
                    setIsCharacterCreatorOpen(true); 
                    setIsSidebarOpen(false); 
                    playClick();
                } else {
                    alert('Access Denied: DEVELOPER role required');
                }
            }}
            className="w-full cyber-button py-2 flex items-center justify-center gap-2 text-xs cyber-glow"
            title="Create custom characters for your game"
          >
            <User size={14} />
            Character Creator
          </button>
          <button 
            onClick={() => { setIsAssetForgeOpen(true); setAssetTab('gallery'); setIsSidebarOpen(false); }}
            className="w-full cyber-button py-2 flex items-center justify-center gap-2 text-xs cyber-glow"
            title="Open your collection of forged assets"
          >
            <Download size={14} />
            Asset Vault
          </button>
          <button 
            onClick={() => { setIsHistoryOpen(true); setIsSidebarOpen(false); }}
            className="w-full cyber-button py-2 flex items-center justify-center gap-2 text-xs cyber-glow"
            title="View all your previous crafting quests"
          >
            <Layers size={14} />
            Quest History
          </button>
          <div className="p-4 border-b border-[#00ffff]/30 space-y-2">
            <form onSubmit={handleAccessKey} className="flex gap-2">
              <input
                type="password"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                placeholder="Access Key"
                className="w-full bg-black/50 border border-[#00ffff]/50 p-2 text-xs text-[#e0e0e0] placeholder-[#e0e0e0]/50 focus:outline-none rounded"
              />
              <button type="submit" className="cyber-button text-[10px]">GO</button>
            </form>
            <div className="flex items-center justify-between text-[10px] text-[#e0e0e0]/70 mt-2">
              <span>Role: {role}</span>
              <button 
                onClick={() => {
                  if (isMusicOn) {
                    nextTrack();
                  } else {
                    setIsMusicOn(true);
                    toggleMusic(true);
                  }
                  playClick();
                }}
                className="cyber-button text-[8px] py-1"
              >
                Music: {isMusicOn ? 'NEXT' : 'OFF'}
              </button>
            </div>
          </div>
          <Environment />
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* 3D Game Design Templates Section */}
          <div className="space-y-2">
            <div className="text-[9px] uppercase tracking-[0.2em] opacity-40 font-mono mb-3 px-2 flex items-center justify-between">
              <span>Design Blueprints</span>
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-white/20" />
                <div className="w-1 h-1 bg-white/20" />
                <div className="w-1 h-1 bg-white/20" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 px-1">
              {GAME_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    playClick();
                    setConfirmingTemplate(template);
                  }}
                  className="group relative w-full text-left transition-all duration-100 active:translate-y-1 active:translate-x-1 cyber-glow"
                >
                  {/* 3D Shadow Layer */}
                  <div className="absolute inset-0 bg-black translate-y-1 translate-x-1 border border-black" />
                  
                  {/* Main Button Layer */}
                  <div className={cn(
                    "relative p-2 border border-[#00ffff]/30 flex items-center gap-3 transition-colors cyber-panel",
                    "hover:brightness-110"
                  )}>
                    <div className="w-8 h-8 bg-black/20 flex items-center justify-center shrink-0">
                      {getIcon(template.icon, 16)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-display uppercase tracking-tight truncate leading-none mb-1">
                        {template.name}
                      </div>
                      <div className="text-[8px] font-mono opacity-60 truncate">
                        {template.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[9px] uppercase tracking-[0.2em] opacity-40 font-mono mb-2 px-2 flex items-center justify-between">
              <span>Saved Worlds</span>
              <span className="text-[7px] opacity-50">{sessions.length} Slots</span>
            </div>
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => handleSwitchSession(session.id)}
                className={cn(
                  "w-full flex items-center gap-2 p-3 text-xs transition-all cursor-pointer group cyber-glow",
                  currentSessionId === session.id 
                    ? "bg-[#00ffff]/20 border border-[#00ffff] text-[#00ffff]" 
                    : "hover:bg-white/5 border border-transparent"
                )}
              >
                <div className="w-6 h-6 cyber-panel shrink-0 flex items-center justify-center bg-[#C6C6C6]">
                  <Layers size={12} className="text-[#333333]" />
                </div>
                <div className="flex-1 min-w-0">
                  {renamingSessionId === session.id ? (
                    <form onSubmit={(e) => handleRenameSession(e, session.id)} className="flex items-center gap-1">
                      <input
                        autoFocus
                        value={renameTitle}
                        onChange={(e) => setRenameTitle(e.target.value)}
                        onBlur={() => setRenamingSessionId(null)}
                        className="w-full bg-black text-[10px] p-1 font-mono border border-[#555555] focus:outline-none"
                      />
                    </form>
                  ) : (
                    <span className="font-mono truncate block">{session.title}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setRenamingSessionId(session.id); setRenameTitle(session.title); }}
                    className="p-1 hover:text-[#ff3232]"
                    title="Rename quest"
                  >
                    <Code size={12} />
                  </button>
                  <button 
                    onClick={(e) => handleDeleteSession(e, session.id)}
                    className="p-1 hover:text-red-400"
                    title="Permanently delete this quest"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Top Builders Preview */}
          <div className="space-y-2">
            <div className="text-[9px] uppercase tracking-[0.2em] opacity-40 font-mono mb-2 px-2 flex items-center justify-between">
              <span>Top Builders</span>
              <button 
                onClick={() => { fetchLeaderboard(); setIsLeaderboardOpen(true); }}
                className="text-[7px] text-[#ff3232] hover:underline"
              >
                View All
              </button>
            </div>
            <div className="space-y-1 px-1">
              {leaderboard.slice(0, 3).map((entry, idx) => (
                <div key={entry.id} className="flex items-center gap-2 p-1.5 bg-black/20 border border-white/5">
                  <span className="text-[8px] font-display text-[#ff3232] w-3">#{idx + 1}</span>
                  <div className="w-5 h-5 bg-[#333333] shrink-0 overflow-hidden">
                    {entry.avatar_url && entry.avatar_url !== "" ? (
                      <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User size={10} className="m-auto" />
                    )}
                  </div>
                  <span className="text-[9px] font-mono truncate flex-1 opacity-60">
                    {entry.username || entry.full_name || 'Builder'}
                  </span>
                  <span className="text-[8px] font-mono text-[#ff3232]">{entry.message_count}</span>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <p className="text-[8px] font-mono opacity-20 text-center py-2">No builders yet...</p>
              )}
            </div>
          </div>
        </nav>

        <div className="p-3 border-t-4 border-black space-y-3 bg-black/50">
          <button 
            onClick={() => {
              fetchLeaderboard();
              setIsLeaderboardOpen(true);
            }}
            className="w-full mc-button mc-button-blue py-1.5 text-[10px] flex items-center justify-center gap-2"
          >
            <Sword size={12} />
            Hall of Builders
          </button>
          <div 
            onClick={() => {
              setProfileUsername(user.username || '');
              setProfileFullName(user.full_name || '');
              setProfileAvatar(user.avatar_url || '');
              setIsProfileModalOpen(true);
            }}
            className="flex items-center gap-2 px-2 py-1 hover:bg-white/5 cursor-pointer transition-colors group"
            title="Edit your profile"
          >
            <div className="w-8 h-8 mc-panel shrink-0 bg-[#ff3232] flex items-center justify-center overflow-hidden">
              {user.avatar_url && user.avatar_url !== "" ? (
                <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User size={18} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-mono truncate text-white/90 group-hover:text-[#ff3232]">
                  {user.username || user.email.split('@')[0]}
                </p>
                <p className="text-[8px] font-mono text-[#ff3232] shrink-0">Lvl {Math.floor(user.message_count / 10) + 1}</p>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <div className="flex items-center gap-1.5">
                  <div className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5AA524] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#5AA524]"></span>
                  </div>
                  <p className="text-[8px] font-mono text-[#5AA524] uppercase tracking-widest">Online</p>
                </div>
                <p className="text-[7px] font-mono text-white/30 uppercase tracking-tighter">{user.message_count} Prompts</p>
              </div>
            </div>
            <Settings size={12} className="opacity-0 group-hover:opacity-40 transition-opacity" />
          </div>
          <button 
            onClick={() => setIsProfileModalOpen(true)}
            className="w-full mc-button py-1.5 text-[10px]"
            title="Edit your profile"
          >
            Edit Profile
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative mc-grass min-w-0">
        {/* Header Bar */}
        <header className="h-14 border-b-4 border-black flex items-center justify-between px-6 bg-black/90 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Toggle Menu"
              title="Toggle Sidebar"
            >
              <Menu size={20} className="text-[#ff3232]" />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-[#ff3232] border-2 border-[#1a130f]" />
                <span className="text-xs font-mono uppercase tracking-widest text-[#ff3232]">Server_Active</span>
              </div>
              <div className="hidden sm:block h-4 w-[2px] bg-white/10" />
              <div className="hidden sm:block text-[10px] font-mono uppercase tracking-widest opacity-60">Protocol: Wildstar_v2</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-[10px] font-display opacity-40 tracking-wider uppercase pixel-text">Creative Mode</div>
          </div>
        </header>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide bg-black/30">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center space-y-8">
              <div className="mc-panel p-6 bg-[#1a1a1a] max-w-md text-center">
                <Cpu size={48} className="text-[#ff3232] mx-auto mb-4" />
                <h2 className="font-display text-xl text-white mb-3">
                  Welcome to <span className="text-[#ff3232]">WILDSTAR</span>
                </h2>
                <p className="text-white/80 text-base font-mono leading-tight mb-6">
                  The world is your canvas. What shall we craft today, builder?
                </p>
                
                {sessions.length > 0 && (
                  <div className="mt-6 pt-6 border-t-4 border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display text-[10px] text-white/40 uppercase tracking-widest">Resume Recent Quests</h3>
                      <button 
                        onClick={() => setIsHistoryOpen(true)}
                        className="text-[9px] font-mono text-[#ff3232] hover:underline uppercase tracking-widest"
                      >
                        View All
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {sessions.slice(0, 3).map(session => (
                        <button
                          key={session.id}
                          onClick={() => handleSwitchSession(session.id)}
                          className="mc-button w-full text-left flex items-center gap-3 py-3 text-xs !bg-[#1a1a1a] !text-white !border-[#333333]"
                        >
                          <Layers size={14} className="text-[#ff3232]" />
                          <span className="truncate flex-1">{session.title}</span>
                          <ChevronRight size={12} className="text-[#ff3232]" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-8">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={cn(
                    "flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300",
                    msg.role === 'assistant' ? "flex-row" : "flex-row-reverse"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 mc-panel shrink-0 flex items-center justify-center overflow-hidden",
                    msg.role === 'assistant' 
                      ? "bg-[#ff3232] text-black" 
                      : "bg-[#ff3232] text-black"
                  )}>
                    {msg.role === 'assistant' ? (
                      <Bot size={20} />
                    ) : user?.avatar_url && user.avatar_url !== "" ? (
                      <img src={user.avatar_url} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User size={20} />
                    )}
                  </div>
                  <div className={cn(
                    "flex-1 space-y-2 min-w-0",
                    msg.role === 'user' && "text-right"
                  )}>
                    <div className={cn(
                      "flex items-center gap-3 opacity-40 font-mono text-[10px] uppercase tracking-widest",
                      msg.role === 'user' && "justify-end"
                    )}>
                      <span className="text-[#ff3232]">{msg.role === 'assistant' ? 'WILDSTAR' : (user?.username || 'BUILDER')}</span>
                      <span>•</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className={cn(
                      "mc-panel p-4 prose prose-invert max-w-none !bg-[#1a1a1a] !text-white !border-[#333333] !border-b-black !border-r-black text-sm",
                      msg.role === 'user' ? "!bg-[#0a0a0a]" : "!bg-[#1a1a1a]"
                    )}>
                      {msg.role === 'assistant' && msg.content === '' ? (
                        <div className="flex items-center gap-3 py-2">
                          <div className="w-3 h-3 bg-[#ff3232] animate-bounce" />
                          <div className="w-3 h-3 bg-[#ff3232] animate-bounce [animation-delay:0.2s]" />
                          <div className="w-3 h-3 bg-[#ff3232] animate-bounce [animation-delay:0.4s]" />
                          <span className="ml-2 font-mono text-xs opacity-40 uppercase tracking-widest">Crafting...</span>
                        </div>
                      ) : (
                        <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-black border-t-4 border-[#ff3232]">
          <div className="max-w-4xl mx-auto relative">
            <div className="flex flex-col mc-panel-dark overflow-hidden shadow-2xl">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type your command..."
                className="w-full bg-black p-4 min-h-[60px] max-h-[300px] focus:outline-none resize-none text-[#00FF00] font-mono text-base leading-tight placeholder:opacity-20"
              />
              <div className="flex items-center justify-between px-4 py-3 bg-black">
                <div className="flex items-center gap-4 opacity-40">
                   <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest">
                     <Terminal size={12} />
                     <span>Ready_To_Build</span>
                   </div>
                </div>
                <button
                  onClick={() => handleSend()}
                  disabled={isLoading || !input.trim()}
                  className={cn(
                    "mc-button mc-button-green p-2 min-w-[40px] flex items-center justify-center",
                    (!input.trim() || isLoading) && "opacity-50 grayscale"
                  )}
                  title="Send Command"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 bg-white animate-pulse shadow-[1px_1px_0px_0px_rgba(0,0,0,0.5)]" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="max-w-4xl mx-auto mt-4 text-center opacity-20 font-mono text-[9px] uppercase tracking-[0.4em]">
            Wildstar_Crafting_Protocol_v2.17.1
          </div>
        </div>
      </main>

      {/* Character Creator Modal */}
      {isCharacterCreatorOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-4xl mc-panel overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-4 border-b-4 border-black flex items-center justify-between bg-black">
              <div className="flex items-center gap-3">
                <User size={20} className="text-[#ff3232]" />
                <h2 className="font-display text-lg text-white pixel-text">Character Creator</h2>
              </div>
              <button onClick={() => setIsCharacterCreatorOpen(false)} className="p-1 hover:bg-white/10 rounded">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-white/60">Character Name</label>
                  <input
                    type="text"
                    value={charName}
                    onChange={(e) => setCharName(e.target.value)}
                    placeholder="e.g., Kaelen the Brave"
                    className="w-full bg-black border-4 border-[#333333] p-3 text-sm font-mono text-[#ff3232] focus:outline-none focus:border-[#ff3232]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-white/60">Race</label>
                    <select
                      value={charRace}
                      onChange={(e) => setCharRace(e.target.value)}
                      className="w-full bg-black border-4 border-[#333333] p-3 text-sm font-mono text-white focus:outline-none focus:border-[#ff3232]"
                    >
                      <option>Human</option>
                      <option>Elf</option>
                      <option>Dwarf</option>
                      <option>Orc</option>
                      <option>Undead</option>
                      <option>Dragonborn</option>
                      <option>Robot</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-white/60">Class</label>
                    <select
                      value={charClass}
                      onChange={(e) => setCharClass(e.target.value)}
                      className="w-full bg-black border-4 border-[#333333] p-3 text-sm font-mono text-white focus:outline-none focus:border-[#ff3232]"
                    >
                      <option>Warrior</option>
                      <option>Mage</option>
                      <option>Rogue</option>
                      <option>Paladin</option>
                      <option>Necromancer</option>
                      <option>Engineer</option>
                      <option>Bard</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-white/60">Visual Style</label>
                  <select
                    value={charStyle}
                    onChange={(e) => setCharStyle(e.target.value)}
                    className="w-full bg-black border-4 border-[#333333] p-3 text-sm font-mono text-white focus:outline-none focus:border-[#ff3232]"
                  >
                    <option value="pixel art">Pixel Art (16-bit)</option>
                    <option value="voxel art">Voxel Art (3D Blocks)</option>
                    <option value="hand-drawn">Hand-Drawn Sketch</option>
                    <option value="low-poly">Low-Poly 3D</option>
                    <option value="vector">Clean Vector Art</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-white/60">Special Traits / Equipment</label>
                  <textarea
                    value={charTraits}
                    onChange={(e) => setCharTraits(e.target.value)}
                    placeholder="e.g., wearing glowing blue armor, carrying a massive axe"
                    className="w-full bg-black border-4 border-[#333333] p-3 text-sm font-mono text-[#00FF00] focus:outline-none focus:border-[#ff3232] min-h-[80px] resize-none"
                  />
                </div>
                
                <button
                  onClick={handleGenerateCharacter}
                  disabled={isCreatingChar}
                  className={cn(
                    "w-full mc-button mc-button-blue py-4 text-sm flex items-center justify-center gap-3",
                    isCreatingChar && "opacity-50 grayscale"
                  )}
                >
                  {isCreatingChar ? (
                    <>
                      <div className="w-4 h-4 bg-white animate-bounce" />
                      <div className="w-4 h-4 bg-white animate-bounce [animation-delay:0.2s]" />
                      <span>Summoning...</span>
                    </>
                  ) : (
                    <>
                      <User size={18} />
                      <span>Summon Character</span>
                    </>
                  )}
                </button>
              </div>
              
              <div className="flex flex-col items-center justify-center bg-black/20 mc-panel border-4 border-[#333333] p-4">
                <div className="w-full aspect-[3/4] flex items-center justify-center relative overflow-hidden group">
                  {createdChar && createdChar !== "" ? (
                    <>
                      <img src={createdChar} alt="Created Character" className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button 
                          onClick={() => downloadAsset(createdChar, charName || 'character')}
                          className="mc-button mc-button-green p-3"
                          title="Download Character"
                        >
                          <Download size={20} />
                        </button>
                      </div>
                    </>
                  ) : isCreatingChar ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 mc-panel bg-[#ff3232] animate-spin" />
                      <span className="font-mono text-[10px] uppercase tracking-widest opacity-40">Manifesting_Hero...</span>
                    </div>
                  ) : (
                    <div className="text-center p-6 space-y-3">
                      <User size={64} className="mx-auto text-white/5" />
                      <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Character_Preview_Area</p>
                    </div>
                  )}
                </div>
                {createdChar && createdChar !== "" && (
                  <div className="mt-4 text-center">
                    <p className="text-sm font-display text-[#ff3232] uppercase">{charName || 'The Hero'}</p>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">{charRace} {charClass}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 bg-black/50 border-t-4 border-black text-center">
              <p className="text-[8px] font-mono uppercase tracking-[0.4em] opacity-20">Character_Manifest_v2.1.0</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Video Architect Modal */}
      {isVideoForgeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl mc-panel-dark overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="p-4 border-b-4 border-black flex items-center justify-between bg-[#FF55FF]">
              <div className="flex items-center gap-3">
                <Video size={20} className="text-white" />
                <h2 className="font-display text-lg text-white pixel-text">Video Architect</h2>
              </div>
              <button onClick={() => setIsVideoForgeOpen(false)} className="p-1 hover:bg-white/10 rounded">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6 bg-[#1a1a1a]">
              {!hasVideoKey ? (
                <div className="text-center space-y-6 py-10">
                  <div className="w-20 h-20 mc-panel mx-auto bg-[#1a1a1a] flex items-center justify-center">
                    <Lock size={40} className="text-[#FF55FF] animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-display text-xl text-white pixel-text">Video Engine Locked</h3>
                    <p className="text-xs text-white/60 font-mono leading-relaxed max-w-md mx-auto">
                      To forge cinematic videos, you must connect a paid Google Cloud project. 
                      This ensures high-quality, 5-second renders at 720p resolution.
                    </p>
                  </div>
                  <button 
                    onClick={handleConnectVideoEngine}
                    className="mc-button mc-button-blue px-8 py-3 text-sm flex items-center gap-3 mx-auto"
                  >
                    <Sparkles size={18} />
                    Connect Video Engine
                  </button>
                  <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest">
                    Requires billing setup at <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">ai.google.dev/gemini-api/docs/billing</a>
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-[#FF55FF]">Scene Description</label>
                      <textarea
                        value={videoPrompt}
                        onChange={(e) => setVideoPrompt(e.target.value)}
                        placeholder="Describe the cinematic scene (e.g., 'A neon hologram of a cat driving a cyberpunk car at top speed through a rainy city')..."
                        className="w-full mc-input h-32 py-3 px-4 text-sm"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="mc-panel p-3 bg-black/40 border-2 border-[#333333]">
                        <p className="text-[8px] font-mono text-white/40 uppercase mb-1">Duration</p>
                        <p className="text-xs font-display text-[#ff3232]">5 Seconds</p>
                      </div>
                      <div className="mc-panel p-3 bg-black/40 border-2 border-[#333333]">
                        <p className="text-[8px] font-mono text-white/40 uppercase mb-1">Resolution</p>
                        <p className="text-xs font-display text-[#ff3232]">720p (HD)</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <button 
                      onClick={handleForgeVideo}
                      disabled={isVideoForging || !videoPrompt.trim()}
                      className={cn(
                        "w-full mc-button py-4 text-sm flex items-center justify-center gap-3",
                        isVideoForging ? "opacity-50 cursor-not-allowed" : "mc-button-green"
                      )}
                    >
                      {isVideoForging ? (
                        <>
                          <div className="w-4 h-4 bg-white animate-bounce" />
                          <span className="font-display">Forging Video...</span>
                        </>
                      ) : (
                        <>
                          <Play size={20} />
                          <span className="font-display">Forge Video</span>
                        </>
                      )}
                    </button>
                    
                    {videoStatus && (
                      <div className="mc-panel p-3 bg-black border-2 border-[#333333] flex items-center gap-3">
                        <Terminal size={14} className="text-[#00FF00]" />
                        <p className="text-[10px] font-mono text-[#00FF00] uppercase tracking-wider">{videoStatus}</p>
                      </div>
                    )}
                  </div>

                  {forgedVideo && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="mc-panel bg-black border-4 border-[#FF55FF] overflow-hidden aspect-video relative group">
                        {forgedVideo ? (
                          <video 
                            src={forgedVideo} 
                            controls 
                            autoPlay 
                            loop 
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {forgedVideo ? (
                            <a 
                              href={forgedVideo} 
                              download="wildstar-forge.mp4"
                              className="mc-button mc-button-blue p-2 flex items-center gap-2 text-[10px]"
                            >
                              <Download size={14} />
                              Save
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="p-4 bg-black/50 border-t-4 border-black text-center">
              <p className="text-[8px] font-mono uppercase tracking-[0.4em] opacity-20">Video_Architect_Protocol_v3.1.0</p>
            </div>
          </div>
        </div>
      )}
      {isAssetForgeOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setIsAssetForgeOpen(false)}
        >
          <div 
            className="w-full max-w-2xl mc-panel-dark overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b-4 border-black flex items-center justify-between bg-black">
              <div className="flex items-center gap-3">
                <Sparkles size={20} className="text-[#ff3232]" />
                <h2 className="font-display text-lg text-white pixel-text">Asset Forge</h2>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setAssetTab('forge')}
                  className={cn(
                    "mc-button py-1 px-3 text-[10px]",
                    assetTab === 'forge' ? "mc-button-blue" : "!bg-[#1a1a1a]"
                  )}
                >
                  Forge
                </button>
                <button 
                  onClick={() => setAssetTab('gallery')}
                  className={cn(
                    "mc-button py-1 px-3 text-[10px]",
                    assetTab === 'gallery' ? "mc-button-green" : "!bg-[#1a1a1a]"
                  )}
                >
                  Vault ({assets.length})
                </button>
                <button onClick={() => setIsAssetForgeOpen(false)} className="p-1 hover:bg-white/10 rounded ml-2">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            {assetTab === 'forge' ? (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-white/60">Asset Content</label>
                    <textarea
                      value={assetPrompt}
                      onChange={(e) => setAssetPrompt(e.target.value)}
                      placeholder="e.g., a legendary sword with glowing runes"
                      className="w-full bg-black border-4 border-[#333333] p-3 text-sm font-mono text-[#00FF00] focus:outline-none focus:border-[#ff3232] min-h-[100px] resize-none"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-white/60">Art Style</label>
                    <select
                      value={assetStyle}
                      onChange={(e) => setAssetStyle(e.target.value)}
                      className="w-full bg-black border-4 border-[#333333] p-3 text-sm font-mono text-white focus:outline-none focus:border-[#ff3232]"
                    >
                      <option value="pixel art">Pixel Art (16-bit)</option>
                      <option value="voxel art">Voxel Art (3D Blocks)</option>
                      <option value="hand-drawn">Hand-Drawn Sketch</option>
                      <option value="low-poly">Low-Poly 3D</option>
                      <option value="vector">Clean Vector Art</option>
                      <option value="oil painting">Classic Oil Painting</option>
                    </select>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleGenerateAsset}
                      disabled={isForgingAsset || !assetPrompt.trim()}
                      className={cn(
                        "flex-1 mc-button mc-button-blue py-4 text-sm flex items-center justify-center gap-3",
                        (isForgingAsset || !assetPrompt.trim()) && "opacity-50 grayscale"
                      )}
                    >
                      {isForgingAsset ? (
                        <>
                          <div className="w-4 h-4 bg-white animate-bounce" />
                          <div className="w-4 h-4 bg-white animate-bounce [animation-delay:0.2s]" />
                          <span>Forging...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={18} />
                          <span>Forge Asset</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setIsAssetForgeOpen(false)}
                      className="mc-button py-4 px-6 text-sm !bg-[#1a1a1a] !text-white !border-[#333333]"
                    >
                      Exit
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col items-center justify-center">
                  <div className="w-full aspect-square mc-panel bg-black/50 border-4 border-[#333333] flex items-center justify-center relative overflow-hidden group">
                    {forgedAsset && forgedAsset !== "" ? (
                      <>
                        <img src={forgedAsset} alt="Forged Asset" className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                          <button 
                            onClick={() => downloadAsset(forgedAsset, assetPrompt)}
                            className="mc-button mc-button-green p-3"
                            title="Download to Device"
                          >
                            <Download size={20} />
                          </button>
                        </div>
                      </>
                    ) : isForgingAsset ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 mc-panel bg-[#ff3232] animate-spin" />
                        <span className="font-mono text-[10px] uppercase tracking-widest opacity-40">Generating_Pixels...</span>
                      </div>
                    ) : (
                      <div className="text-center p-6 space-y-3">
                        <ImageIcon size={48} className="mx-auto text-white/10" />
                        <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Asset_Preview_Area</p>
                      </div>
                    )}
                  </div>
                  {forgedAsset && forgedAsset !== "" && (
                    <p className="mt-4 text-[10px] font-mono uppercase tracking-widest text-[#ff3232]">Asset_Forged_Successfully</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 flex-1 overflow-y-auto max-h-[60vh]">
                {assets.length === 0 ? (
                  <div className="text-center py-20 space-y-4">
                    <Layers size={48} className="mx-auto text-white/10" />
                    <p className="font-mono text-xs text-white/20 uppercase tracking-[0.3em]">The Vault is Empty</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {assets.map((asset) => (
                      <div key={asset.id} className="mc-panel bg-black border-4 border-[#333333] overflow-hidden group relative aspect-square">
                        {asset.image_data && asset.image_data !== "" ? (
                          <img src={asset.image_data} alt={asset.prompt} className="w-full h-full object-cover" />
                        ) : null}
                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between">
                          <p className="text-[8px] font-mono text-white/60 truncate uppercase">{asset.prompt}</p>
                          <div className="flex gap-2 justify-center">
                            <button 
                              onClick={() => downloadAsset(asset.image_data, asset.prompt)}
                              className="mc-button mc-button-green p-1.5"
                              title="Download"
                            >
                              <Download size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteAsset(asset.id)}
                              className="mc-button p-1.5 !bg-[#AA0000] !border-[#FF5555]"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div className="p-4 bg-black/50 border-t-4 border-black text-center">
              <p className="text-[8px] font-mono uppercase tracking-[0.4em] opacity-20">Asset_Forge_Protocol_v1.0.4</p>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setIsHistoryOpen(false)}
        >
          <div 
            className="w-full max-w-3xl mc-panel-dark overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b-4 border-black flex items-center justify-between bg-black">
              <div className="flex items-center gap-3">
                <Layers size={20} className="text-[#ff3232]" />
                <h2 className="font-display text-lg text-white pixel-text">Quest History</h2>
              </div>
              <button onClick={() => setIsHistoryOpen(false)} className="p-1 hover:bg-white/10 rounded">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 bg-[#1a1a1a] border-b-4 border-black">
              <div className="relative">
                <Terminal size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00FF00]/40" />
                <input
                  type="text"
                  placeholder="Search your quests..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full mc-input pl-12 py-3 text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/30">
              {sessions
                .filter(s => s.title.toLowerCase().includes(historySearch.toLowerCase()))
                .map((session) => (
                  <div
                    key={session.id}
                    onClick={() => { handleSwitchSession(session.id); setIsHistoryOpen(false); }}
                    className="mc-panel p-4 flex items-center gap-4 hover:bg-white/5 cursor-pointer group transition-colors !bg-[#1a1a1a] !border-[#333333]"
                  >
                    <div className="w-12 h-12 mc-panel shrink-0 flex items-center justify-center bg-[#ff3232]">
                      <Layers size={24} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-xs text-[#ff3232] mb-1 truncate">{session.title}</h3>
                      <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                        Created: {new Date(session.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setRenamingSessionId(session.id); setRenameTitle(session.title); }}
                        className="mc-button p-2 !bg-[#333333] !border-[#555555]"
                        title="Rename"
                      >
                        <Code size={14} />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteSession(e, session.id)}
                        className="mc-button p-2 !bg-[#AA0000] !border-[#FF5555]"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                      <ChevronRight size={20} className="text-[#ff3232] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              {sessions.length === 0 && (
                <div className="text-center py-12">
                  <Terminal size={48} className="mx-auto text-white/10 mb-4" />
                  <p className="font-mono text-xs text-white/20 uppercase tracking-[0.3em]">No history found</p>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-black/50 border-t-4 border-black flex items-center justify-between">
              <p className="text-[8px] font-mono uppercase tracking-[0.4em] opacity-20">Total Quests: {sessions.length}</p>
              <button 
                onClick={() => setIsHistoryOpen(false)}
                className="mc-button py-2 px-6 text-xs !bg-[#1a1a1a] !text-white !border-[#333333]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Confirmation Modal */}
      {confirmingTemplate && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md mc-panel overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b-4 border-black flex items-center justify-between bg-[#ff3232]">
              <div className="flex items-center gap-3">
                <AlertTriangle size={20} className="text-black" />
                <h2 className="font-display text-sm text-black pixel-text">Load Blueprint?</h2>
              </div>
              <button onClick={() => setConfirmingTemplate(null)} className="p-1 hover:bg-white/10 rounded">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-black/40 border-4 border-[#333333]">
                <div className="w-12 h-12 bg-[#ff3232]/20 flex items-center justify-center shrink-0 border-2 border-[#ff3232]">
                  {getIcon(confirmingTemplate.icon, 24)}
                </div>
                <div>
                  <h3 className="font-display text-xs text-[#ff3232] uppercase">{confirmingTemplate.name}</h3>
                  <p className="text-[10px] font-mono text-white/60 leading-tight mt-1">{confirmingTemplate.description}</p>
                </div>
              </div>
              
              <p className="text-xs font-mono text-white/80 leading-relaxed">
                Loading this blueprint will replace your current chat input. Are you sure you want to proceed with this design quest?
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <button 
                  onClick={() => setConfirmingTemplate(null)}
                  className="mc-button py-2 text-[10px]"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setInput(confirmingTemplate.prompt);
                    if (currentSessionId === null) {
                      handleNewChat();
                    }
                    setConfirmingTemplate(null);
                    setIsSidebarOpen(false);
                  }}
                  className="mc-button mc-button-green py-2 text-[10px]"
                >
                  Confirm
                </button>
              </div>
            </div>
            
            <div className="p-3 bg-black/50 border-t-4 border-black text-center">
              <p className="text-[8px] font-mono uppercase tracking-[0.4em] opacity-20">Quest_Confirmation_Required</p>
            </div>
          </motion.div>
        </div>
      )}
      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-xs mc-panel overflow-hidden flex flex-col"
          >
            <div className="p-3 border-b-4 border-black flex items-center justify-between bg-[#ff3232]">
              <div className="flex items-center gap-2">
                <Settings size={16} className="text-black" />
                <h2 className="font-display text-[10px] text-black pixel-text uppercase tracking-wider">Builder Settings</h2>
              </div>
              <button onClick={() => setIsProfileModalOpen(false)} className="p-1 hover:bg-black/10 rounded">
                <X size={16} className="text-black" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="p-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="w-16 h-16 mc-panel shrink-0 bg-[#ff3232] flex items-center justify-center overflow-hidden border-2 border-black">
                    {profileAvatar && profileAvatar !== "" ? (
                      <img src={profileAvatar} alt="Avatar Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User size={32} className="text-white/20" />
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer"
                  >
                    <ImageIcon size={14} className="text-[#ff3232]" />
                    <span className="text-[6px] font-mono uppercase text-white">Upload</span>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-display text-[#ff3232] uppercase truncate">{user?.username || 'New Builder'}</p>
                  <p className="text-[7px] font-mono text-white/40 uppercase tracking-widest mt-1">Lvl {Math.floor((user?.message_count || 0) / 10) + 1} Architect</p>
                </div>
              </div>

              <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-1 custom-scrollbar">
                <div className="space-y-1">
                  <label className="block text-[8px] font-mono uppercase tracking-widest opacity-40">Username</label>
                  <input 
                    type="text" 
                    value={profileUsername}
                    onChange={(e) => setProfileUsername(e.target.value)}
                    placeholder="Builder Name"
                    className="w-full bg-black border-2 border-[#333333] p-2 text-[10px] font-mono text-white focus:outline-none focus:border-[#ff3232]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[8px] font-mono uppercase tracking-widest opacity-40">Full Name</label>
                  <input 
                    type="text" 
                    value={profileFullName}
                    onChange={(e) => setProfileFullName(e.target.value)}
                    placeholder="Identity"
                    className="w-full bg-black border-2 border-[#333333] p-2 text-[10px] font-mono text-white focus:outline-none focus:border-[#ff3232]"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="block text-[8px] font-mono uppercase tracking-widest opacity-40">Access Key</label>
                  <input 
                    type="password" 
                    value={profilePassword}
                    onChange={(e) => setProfilePassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black border-2 border-[#333333] p-2 text-[10px] font-mono text-white focus:outline-none focus:border-[#ff3232]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="mc-button py-1.5 text-[8px] !bg-[#1a1a1a] !text-white !border-[#333333]"
                >
                  Discard
                </button>
                <button 
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="mc-button mc-button-green py-1.5 text-[8px] flex items-center justify-center gap-2"
                >
                  {isUpdatingProfile ? (
                    <div className="w-2 h-2 bg-white animate-spin" />
                  ) : (
                    <>
                      <Download size={10} />
                      <span>Apply</span>
                    </>
                  )}
                </button>
              </div>
            </form>
            
            <div className="p-2 bg-black/50 border-t-2 border-black text-center">
              <p className="text-[6px] font-mono uppercase tracking-[0.4em] opacity-20">Secure_Identity_v2.0</p>
            </div>
          </motion.div>
        </div>
      )}
      {/* Leaderboard Modal */}
      {isLeaderboardOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg mc-panel overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b-4 border-black flex items-center justify-between bg-[#ff3232]">
              <div className="flex items-center gap-3">
                <Sword size={20} className="text-black" />
                <h2 className="font-display text-sm text-black pixel-text">Hall of Builders</h2>
              </div>
              <button onClick={() => setIsLeaderboardOpen(false)} className="p-1 hover:bg-white/10 rounded">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              {isFetchingLeaderboard ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="w-12 h-12 mc-panel bg-[#ff3232] animate-spin" />
                  <p className="font-mono text-xs uppercase tracking-widest opacity-40">Calculating_Ranks...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => (
                    <div 
                      key={entry.id}
                      className={cn(
                        "mc-panel p-3 flex items-center gap-4 transition-colors",
                        entry.id === user?.id ? "bg-[#ff3232]/20 border-[#ff3232]" : "bg-black/40 border-[#333333]"
                      )}
                    >
                      <div className="w-8 font-display text-xs text-[#ff3232] text-center">
                        #{index + 1}
                      </div>
                      <div className="w-10 h-10 mc-panel shrink-0 bg-[#333333] flex items-center justify-center overflow-hidden">
                        {entry.avatar_url && entry.avatar_url !== "" ? (
                          <img src={entry.avatar_url} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <User size={20} className="text-white/20" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-display uppercase truncate">
                          {entry.username || entry.full_name || 'Anonymous Builder'}
                        </p>
                        <p className="text-[8px] font-mono text-white/40 uppercase tracking-widest">
                          {entry.full_name ? entry.full_name : 'No Name Set'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono text-[#ff3232]">{entry.message_count}</p>
                        <p className="text-[8px] font-mono text-white/20 uppercase">Prompts</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 bg-black/50 border-t-4 border-black flex items-center justify-between">
              <p className="text-[8px] font-mono uppercase tracking-[0.4em] opacity-20">Leaderboard_v1.0</p>
              <button 
                onClick={() => setIsLeaderboardOpen(false)}
                className="mc-button py-2 px-6 text-xs"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
