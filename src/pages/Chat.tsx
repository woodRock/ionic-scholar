import {
  IonButton,
  IonContent,
  IonFooter,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonText,
  IonTextarea,
  IonAvatar,
  useIonToast
} from "@ionic/react";
import React, { useState, useEffect, useRef } from "react";
import { sendOutline, chatbubblesOutline, personCircleOutline, sparkles } from "ionicons/icons";
import Page from "../components/Page";
import { useLibrary } from "../api/library";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from 'react-markdown';

// Initialize Gemini
const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

interface Message {
  role: 'user' | 'model';
  text: string;
  sources?: string[]; // Titles of papers used as context
}

// --- Simple Search Helpers (Lightweight RAG) ---
const tokenize = (text: string) => 
  text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 2);

const getWordFreq = (text: string) => {
  const counts: Record<string, number> = {};
  tokenize(text).forEach(w => counts[w] = (counts[w] || 0) + 1);
  return counts;
};

const cosineSimilarity = (vecA: Record<string, number>, vecB: Record<string, number>) => {
  let dotProduct = 0;
  let mA = 0;
  let mB = 0;
  for (const key in vecA) {
    if (vecB[key]) dotProduct += vecA[key] * vecB[key];
    mA += vecA[key] * vecA[key];
  }
  for (const key in vecB) mB += vecB[key] * vecB[key];
  if (mA === 0 || mB === 0) return 0;
  return dotProduct / (Math.sqrt(mA) * Math.sqrt(mB));
};

const ChatPage: React.FC = () => {
  const [library] = useLibrary();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hello! I'm your research assistant. Ask me anything about your library." }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const contentRef = useRef<HTMLIonContentElement>(null);
  const [present] = useIonToast();

  const scrollToBottom = () => {
    contentRef.current?.scrollToBottom(300);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!API_KEY) {
      present({ message: "Missing Gemini API Key. Check .env file.", color: "danger", duration: 3000 });
      return;
    }

    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      // 1. Retrieval Step (RAG)
      // Find top 15 most relevant papers from library based on user query
      const queryVec = getWordFreq(userMsg);
      
      const scoredDocs = library.map((book: any) => {
        const docText = `${book.title} ${book.description || ""} ${book.keywords?.join(" ")}`;
        const docVec = getWordFreq(docText);
        return {
          title: book.title,
          year: book.year,
          content: `Title: ${book.title} (${book.year})
Abstract: ${book.description || "No abstract"}
`,
          score: cosineSimilarity(queryVec, docVec)
        };
      });

      // Filter for relevance > 0 and take top 7 (more token efficient)
      const contextDocs = scoredDocs
        .filter((d: any) => d.score > 0)
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 7);

      const contextText = contextDocs.map((d: any) => d.content).join("\n---\n");
      const sources = contextDocs.map((d: any) => d.title);

      // 2. Generation Step
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `
You are a helpful academic research assistant. You have access to the user's personal library of papers.
Answer the user's question using ONLY the context provided below. 
If the answer isn't in the context, say "I couldn't find information about that in your current library."
Cite the papers you use by their title in your answer.

CONTEXT:
${contextText}

USER QUESTION:
${userMsg}
      `;

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      setMessages(prev => [...prev, { role: 'model', text: response, sources }]);

    } catch (error: any) {
      console.error("Gemini Error:", error);
      let errorMsg = "Sorry, I encountered an error accessing the AI model.";
      
      if (error.message?.includes("429") || error.message?.includes("Quota")) {
        errorMsg = "AI Quota reached for today. Please try again in a few hours or upgrade your Gemini tier.";
      } else if (error.message?.includes("404")) {
        errorMsg = "AI Model not found. We might be using an outdated model name.";
      }

      setMessages(prev => [...prev, { role: 'model', text: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Page 
      name="Research Assistant"
      footer={
        <IonFooter style={{ border: 'none' }}>
          <div style={{ 
            padding: '16px', 
            background: 'var(--ion-background-color)', 
            borderTop: '1px solid var(--ion-border-color)',
            maxWidth: '800px',
            margin: '0 auto',
            width: '100%'
          }}>
            <div style={{ 
              display: 'flex', 
              background: 'var(--ion-color-step-100)', 
              borderRadius: '24px', 
              padding: '4px',
              alignItems: 'flex-end'
            }}>
              <IonTextarea 
                placeholder="Ask about your library..." 
                value={input}
                onIonInput={e => setInput(e.detail.value!)}
                autoGrow={true}
                rows={1}
                style={{ '--padding-start': '16px', '--padding-end': '16px', maxHeight: '150px' }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <IonButton 
                shape="round" 
                onClick={handleSend} 
                disabled={!input.trim() || isLoading}
                style={{ margin: '4px' }}
              >
                <IonIcon slot="icon-only" icon={sendOutline} />
              </IonButton>
            </div>
          </div>
        </IonFooter>
      }
    >
      <IonContent ref={contentRef} style={{ '--background': 'var(--ion-background-color)' }}>
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              gap: '12px', 
              marginBottom: '24px',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
            }}>
              <div style={{ flexShrink: 0 }}>
                {msg.role === 'model' ? (
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IonIcon icon={sparkles} style={{ color: 'white', fontSize: '18px' }} />
                  </div>
                ) : (
                  <IonIcon icon={personCircleOutline} style={{ fontSize: '36px', color: '#ccc' }} />
                )}
              </div>
              
              <div style={{ 
                background: msg.role === 'user' ? 'var(--ion-color-primary)' : 'var(--ion-color-step-50)',
                color: msg.role === 'user' ? 'white' : 'var(--ion-text-color)',
                padding: '16px',
                borderRadius: '18px',
                borderTopLeftRadius: msg.role === 'model' ? '4px' : '18px',
                borderTopRightRadius: msg.role === 'user' ? '4px' : '18px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                maxWidth: '85%'
              }}>
                <div style={{ lineHeight: '1.6', fontSize: '0.95rem' }}>
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
                
                {msg.sources && msg.sources.length > 0 && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                    <IonText style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.7, display: 'block', marginBottom: '4px' }}>
                      CONSIDERED SOURCES:
                    </IonText>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {msg.sources.slice(0, 3).map((s, i) => (
                        <span key={i} style={{ fontSize: '0.65rem', background: 'rgba(0,0,0,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                          {s.length > 20 ? s.substring(0, 20) + '...' : s}
                        </span>
                      ))}
                      {msg.sources.length > 3 && (
                        <span style={{ fontSize: '0.65rem', padding: '2px 6px' }}>+{msg.sources.length - 3} more</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IonIcon icon={sparkles} style={{ color: 'white', fontSize: '18px' }} />
              </div>
              <div style={{ background: 'var(--ion-color-step-50)', padding: '16px', borderRadius: '18px', borderTopLeftRadius: '4px' }}>
                <IonSpinner name="dots" color="primary" />
              </div>
            </div>
          )}
        </div>
      </IonContent>
    </Page>
  );
};

export default ChatPage;