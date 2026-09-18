import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  Trash2, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Calendar, 
  CheckCheck,
  Bot,
  User,
  RotateCcw,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { extractSiteProgress } from '../services/activityExtractor';
import { matchSiteUpdate } from '../services/nlpMatcher';
import { ExtractedSiteUpdate, MatchResult, ScheduleActivity } from '../types';
import { ConfidenceBadge } from '../components/ConfidenceBadge';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  timestamp: string;
  text?: string;
  extracted?: ExtractedSiteUpdate;
  matchResult?: MatchResult;
  approved?: boolean;
  sentToPlanner?: boolean;
}

export const TimeAgentView: React.FC = () => {
  const { 
    activities, 
    settings, 
    approveDirectSiteUpdate, 
    sendToPlanner, 
    setActiveTab 
  } = useApp();

  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'agent',
      timestamp: '15:30',
      text: "Hello Supervisor! I'm your AI Time Agent. Report your field construction progress in natural language or voice. I will extract activities, detect disciplines, match L5/L6 Primavera milestones, and calculate confidence."
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const examplePrompts = [
    {
      title: 'Demo 1: Line 24 Spool Erection (High Confidence)',
      text: 'Line 24 spool erection started at 9:15 AM and completed at 4:30 PM.'
    },
    {
      title: 'Demo 2: Cable Work (Ambiguous / Review Queue)',
      text: 'Cable work completed.'
    },
    {
      title: 'Civil: Foundation F102 Pouring',
      text: 'Constructed Foundation F102 casting of 65 m3 M35 grade concrete completed at 5:00 PM.'
    },
    {
      title: 'Electrical: Cable Tray CT102',
      text: 'Installed Cable Tray CT102 40 LM on Level 2 rack today.'
    },
    {
      title: 'Piping: Line 18 Hydrotest',
      text: 'Hydrotest on Line 18-HV completed successfully at 150 bar hold test.'
    }
  ];

  const handleVoiceToggle = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setInput('Line 24 spool erection started at 9:15 AM and completed at 4:30 PM.');
      }, 2500);
    } else {
      setIsRecording(false);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const rawText = textToSend || input;
    if (!rawText.trim() || isProcessing) return;

    setInput('');
    const userMsgId = `msg-user-${Date.now()}`;
    
    setMessages(prev => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: rawText
      }
    ]);

    setIsProcessing(true);

    setProcessingStep('Reading site update...');
    await new Promise(r => setTimeout(r, 350));

    setProcessingStep('Extracting activity & parameters...');
    const extracted = extractSiteProgress(rawText);
    await new Promise(r => setTimeout(r, 400));

    setProcessingStep('Matching L5/L6 schedule via ML engine...');
    const match = matchSiteUpdate(extracted.activity, activities, extracted.discipline, settings);
    await new Promise(r => setTimeout(r, 400));

    setProcessingStep('Calculating calibrated confidence score...');
    await new Promise(r => setTimeout(r, 300));

    setIsProcessing(false);
    setProcessingStep('');

    setMessages(prev => [
      ...prev,
      {
        id: `msg-agent-${Date.now()}`,
        sender: 'agent',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        extracted,
        matchResult: match,
        approved: false,
        sentToPlanner: false
      }
    ]);
  };

  const handleApprove = (msgId: string, extracted: ExtractedSiteUpdate, matchedActivity: ScheduleActivity, confidence: number) => {
    approveDirectSiteUpdate(extracted, matchedActivity, confidence);
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, approved: true } : m));
  };

  const handleSendToPlanner = (msgId: string, extracted: ExtractedSiteUpdate, match: MatchResult) => {
    sendToPlanner(extracted, match.bestMatch, match.confidence, match.alternatives);
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, sentToPlanner: true } : m));
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'msg-welcome',
        sender: 'agent',
        timestamp: '15:30',
        text: "Conversation cleared. Ready for your next site progress update."
      }
    ]);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header Banner - Monochrome */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-black text-white shadow-xs">
              <Sparkles className="w-4 h-4 text-white" />
            </span>
            <h1 className="text-xl font-black text-black tracking-tight uppercase font-mono">
              AI Time Agent
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-black text-white font-mono font-bold">
              NLP & ML ENGINE ACTIVE
            </span>
          </div>
          <p className="text-xs text-zinc-500 max-w-xl">
            Log site progress naturally using free text or simulated voice. ProgressAI normalizes activities, detects engineering disciplines, and computes exact match confidence against L5/L6 schedules.
          </p>
        </div>

        <button
          onClick={handleClear}
          className="px-3 py-2 rounded-xl border border-zinc-300 hover:bg-zinc-100 text-black text-xs font-bold font-mono flex items-center gap-2 transition shrink-0"
          title="Clear Conversation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear Chat</span>
        </button>
      </div>

      {/* Example Prompt Chips - High Contrast */}
      <div className="space-y-2">
        <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>Quick Example Prompts (Click to Test)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {examplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p.text)}
              className="text-left px-3 py-2 rounded-xl bg-white hover:bg-zinc-100 border border-zinc-200 hover:border-black text-xs text-zinc-800 transition shadow-xs group"
            >
              <div className="font-bold text-black flex items-center gap-1.5">
                <span>{p.title}</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-black" />
              </div>
              <div className="text-[11px] text-zinc-400 font-mono mt-0.5 max-w-md truncate">
                "{p.text}"
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-5 min-h-[480px] flex flex-col justify-between shadow-inner">
        <div className="space-y-5 overflow-y-auto max-h-[600px] pr-2">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'agent' && (
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div className={`max-w-2xl space-y-3 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                {/* Text Bubble */}
                {msg.text && (
                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed shadow-xs ${
                      msg.sender === 'user'
                        ? 'bg-black text-white rounded-br-none font-medium'
                        : 'bg-white text-black rounded-bl-none border border-zinc-300'
                    }`}
                  >
                    {msg.text}
                    <div
                      className={`text-[10px] font-mono mt-1.5 ${
                        msg.sender === 'user' ? 'text-zinc-400 text-right' : 'text-zinc-400'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                )}

                {/* Structured Extraction & Match Card - Brutalist Monochrome */}
                {msg.extracted && msg.matchResult && (
                  <div className="bg-white rounded-2xl border border-zinc-300 shadow-md overflow-hidden text-xs space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    {/* Header */}
                    <div className="p-4 bg-black text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-white" />
                        <span className="font-mono font-bold text-sm uppercase">AI Progress Extraction</span>
                      </div>
                      <span className="text-[11px] font-mono text-zinc-400">
                        {msg.extracted.date}
                      </span>
                    </div>

                    {/* Parameters Grid */}
                    <div className="px-5 pt-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 space-y-0.5">
                        <span className="text-[10px] uppercase font-mono font-bold text-zinc-400">Discipline</span>
                        <div className="font-bold text-black">{msg.extracted.discipline}</div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 space-y-0.5">
                        <span className="text-[10px] uppercase font-mono font-bold text-zinc-400">Actual Start</span>
                        <div className="font-mono font-bold text-black flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          <span>{msg.extracted.actualStart}</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 space-y-0.5">
                        <span className="text-[10px] uppercase font-mono font-bold text-zinc-400">Actual End</span>
                        <div className="font-mono font-bold text-black flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          <span>{msg.extracted.actualEnd}</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 space-y-0.5">
                        <span className="text-[10px] uppercase font-mono font-bold text-zinc-400">Status</span>
                        <div className="font-bold text-black flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-black" />
                          <span>{msg.extracted.status}</span>
                        </div>
                      </div>
                    </div>

                    {/* Activity Title */}
                    <div className="px-5 space-y-1">
                      <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Normalized Activity</span>
                      <p className="text-sm font-bold text-black bg-zinc-50 px-3 py-2 rounded-lg border border-zinc-200 font-mono">
                        {msg.extracted.activity}
                      </p>
                    </div>

                    {/* Schedule Matching Section */}
                    <div className="px-5 space-y-3">
                      <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
                        <span className="text-[10px] font-mono font-bold text-black uppercase tracking-wider">
                          Primary Suggested L5/L6 Activity
                        </span>
                        <ConfidenceBadge 
                          score={msg.matchResult.confidence} 
                          showBar={true} 
                          showCategoryText={true} 
                        />
                      </div>

                      {msg.matchResult.bestMatch ? (
                        <div className="p-4 rounded-xl border-2 border-black bg-zinc-50 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-white bg-black px-2 py-0.5 rounded shadow-xs">
                                {msg.matchResult.bestMatch.id}
                              </span>
                              <span className="text-xs font-mono font-bold text-zinc-500 uppercase">
                                {msg.matchResult.bestMatch.wbsLevel}
                              </span>
                            </div>
                            <span className="text-xs font-mono text-zinc-500">
                              Area: {msg.matchResult.bestMatch.area}
                            </span>
                          </div>

                          <div className="text-sm font-black text-black">
                            {msg.matchResult.bestMatch.name}
                          </div>

                          <p className="text-[11px] text-zinc-500 italic">
                            Match rationale: {msg.matchResult.rationale}
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl border border-zinc-400 bg-zinc-100 text-black text-xs font-mono">
                          No direct schedule match could be confirmed with sufficient confidence.
                        </div>
                      )}

                      {/* Alternatives List */}
                      {msg.matchResult.alternatives.length > 1 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">
                            Ranked Candidate Matches
                          </span>
                          <div className="space-y-1">
                            {msg.matchResult.alternatives.map(alt => (
                              <div
                                key={alt.id}
                                className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px]"
                              >
                                <div className="flex items-center gap-2 font-mono">
                                  <span className="font-bold text-black">{alt.id}</span>
                                  <span className="text-zinc-700">{alt.name}</span>
                                </div>
                                <span className="font-mono font-bold text-black">{alt.confidence}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-3">
                      {msg.approved ? (
                        <div className="w-full p-3 bg-black text-white rounded-xl flex items-center justify-between font-bold">
                          <div className="flex items-center gap-2">
                            <CheckCheck className="w-4 h-4 text-white" />
                            <span>Approved & Schedule Updated! Milestone recorded in audit trail.</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setActiveTab('Schedule')}
                              className="px-2.5 py-1 bg-white text-black rounded text-xs hover:bg-zinc-200 transition font-mono"
                            >
                              Schedule
                            </button>
                            <button
                              onClick={() => setActiveTab('Audit Trail')}
                              className="px-2.5 py-1 bg-white text-black rounded text-xs hover:bg-zinc-200 transition font-mono"
                            >
                              Audit Record
                            </button>
                          </div>
                        </div>
                      ) : msg.sentToPlanner ? (
                        <div className="w-full p-3 bg-zinc-200 text-black rounded-xl flex items-center justify-between font-bold border border-zinc-400">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-black" />
                            <span>Routed to Review Queue for planner triage and validation.</span>
                          </div>
                          <button
                            onClick={() => setActiveTab('Review Queue')}
                            className="px-3 py-1 bg-black text-white rounded text-xs font-mono hover:bg-zinc-800 transition"
                          >
                            Open Review Queue
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* HIGH CONFIDENCE (>= 90%) */}
                          {msg.matchResult.confidenceCategory === 'HIGH' && msg.matchResult.bestMatch && (
                            <div className="flex items-center justify-between w-full">
                              <div className="text-xs text-black font-bold flex items-center gap-1.5 font-mono">
                                <CheckCircle2 className="w-4 h-4 text-black" />
                                <span>High Confidence Match (≥90%) — Ready for Schedule Sync</span>
                              </div>
                              <button
                                onClick={() => handleApprove(msg.id, msg.extracted!, msg.matchResult!.bestMatch!, msg.matchResult!.confidence)}
                                className="px-5 py-2.5 bg-black hover:bg-zinc-800 text-white font-mono font-bold rounded-xl shadow-md transition flex items-center gap-2"
                              >
                                <CheckCheck className="w-4 h-4" />
                                <span>Approve & Update</span>
                              </button>
                            </div>
                          )}

                          {/* MEDIUM CONFIDENCE (70 - 89%) */}
                          {msg.matchResult.confidenceCategory === 'MEDIUM' && (
                            <div className="flex items-center justify-between w-full flex-wrap gap-2">
                              <div className="text-xs text-zinc-800 font-bold flex items-center gap-1.5 font-mono">
                                <AlertTriangle className="w-4 h-4 text-black" />
                                <span>Planner Review Recommended (70–89%)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleSendToPlanner(msg.id, msg.extracted!, msg.matchResult!)}
                                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition font-mono"
                                >
                                  Send to Planner
                                </button>
                                {msg.matchResult.bestMatch && (
                                  <button
                                    onClick={() => handleApprove(msg.id, msg.extracted!, msg.matchResult!.bestMatch!, msg.matchResult!.confidence)}
                                    className="px-3.5 py-2 bg-black hover:bg-zinc-900 text-white font-bold rounded-xl transition font-mono"
                                  >
                                    Approve Anyway
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* LOW CONFIDENCE (< 70%) */}
                          {msg.matchResult.confidenceCategory === 'LOW' && (
                            <div className="flex items-center justify-between w-full flex-wrap gap-2">
                              <div className="text-xs text-zinc-600 font-bold flex items-center gap-1.5 font-mono">
                                <AlertTriangle className="w-4 h-4 text-black" />
                                <span>No Reliable Match Found ({msg.matchResult.confidence}% &lt; 70% threshold)</span>
                              </div>
                              <button
                                onClick={() => handleSendToPlanner(msg.id, msg.extracted!, msg.matchResult!)}
                                className="px-5 py-2.5 bg-black hover:bg-zinc-800 text-white font-mono font-bold rounded-xl shadow-md transition flex items-center gap-2"
                              >
                                <span>Send to Planner</span>
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-zinc-800 text-white flex items-center justify-center shrink-0 shadow-sm font-mono text-xs font-bold">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {/* Animated Processing State */}
          {isProcessing && (
            <div className="flex gap-3 items-start animate-in fade-in">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shrink-0 animate-spin">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white rounded-2xl p-4 border border-zinc-300 shadow-sm text-xs space-y-2 max-w-sm">
                <div className="flex items-center gap-2 text-black font-bold font-mono">
                  <div className="w-2 h-2 rounded-full bg-black animate-ping" />
                  <span>AI Engine Analyzing...</span>
                </div>
                <p className="text-zinc-600 font-medium">{processingStep}</p>
                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-black h-full animate-pulse w-3/4 rounded-full" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="mt-4 pt-3 border-t border-zinc-200">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            {/* Microphone Button */}
            <button
              type="button"
              onClick={handleVoiceToggle}
              className={`p-3 rounded-xl transition relative ${
                isRecording
                  ? 'bg-black text-white animate-bounce shadow-lg'
                  : 'bg-white hover:bg-zinc-100 text-black border border-zinc-300'
              }`}
              title={isRecording ? 'Listening... click to stop' : 'Voice Input (Simulated speech recognition)'}
            >
              {isRecording ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-black" />}
              {isRecording && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-zinc-400 rounded-full animate-ping" />
              )}
            </button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={isRecording ? 'Listening to site supervisor audio...' : 'Type site update (e.g. "Line 24 spool erected")...'}
                className="w-full bg-white border border-zinc-300 focus:border-black rounded-xl px-4 py-3 text-xs text-black placeholder-zinc-400 outline-none font-medium shadow-xs transition"
              />
              {isRecording && (
                <div className="absolute right-3 top-3 text-[11px] font-mono font-bold text-black flex items-center gap-1.5 animate-pulse">
                  <span>RECORDING VOICE</span>
                </div>
              )}
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className="p-3 bg-black hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl font-bold shadow-sm transition"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
