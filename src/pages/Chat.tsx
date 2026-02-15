import {
  IonButton,
  IonContent,
  IonFooter,
  IonIcon,
  IonSpinner,
  IonText,
  IonTextarea,
  useIonToast
} from "@ionic/react";
import React, { useState, useEffect, useRef } from "react";
import { sendOutline, personCircleOutline, sparkles } from "ionicons/icons";
import Page from "../components/Page";
import { useLibrary } from "../api/library";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from 'react-markdown';
import { doc, getDoc } from "firebase/firestore";
import { firestore, auth } from "../api/firebase";

interface Message {
  role: 'user' | 'model';
  text: string;
  sources?: string[]; // Titles of papers used as context
}

// --- Simple Search Helpers (For UI Source Highlighting) ---
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
    { role: 'model', text: "Hello! I'm your research assistant. Your entire library has been loaded into my memory. Ask me to synthesize, summarize, or find connections across your papers!" }
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
    if (!auth.currentUser) return;

    // 0. Retrieve User's Personal Gemini Key from settings
    let personalKey = "";
    try {
      const settingsRef = doc(firestore, `users/${auth.currentUser.uid}/settings/preferences`);
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists()) {
        personalKey = settingsSnap.data().geminiApiKey || "";
      }
    } catch (e) {
      console.error("Error fetching settings:", e);
    }

    if (!personalKey) {
      present({ 
        message: "Please add your Gemini API Key in the Account tab to use the assistant.", 
        color: "warning", 
        duration: 4000 
      });
      return;
    }

    const userMsg = input;
    setInput("");
    const updatedMessages = [...messages, { role: 'user', text: userMsg } as Message];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // 1. Context Preparation (Full Library Mode)
      const fullContext = library.slice(0, 500).map((book: any) => {
        return `PAPER: ${book.title} (${book.year})\nAUTHORS: ${book.authors.join(", ")}\nKEYWORDS: ${(book.keywords || []).join(", ")}\nABSTRACT: ${book.description || "No abstract available."}\n`;
      }).join("\n---\n");

      // 2. Generation Step with Memory
      const genAI = new GoogleGenerativeAI(personalKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-3-flash-preview",
        generationConfig: {
          temperature: 0.2,
        }
      });

      // Prepare conversation history for Gemini (excluding the initial greeting)
      const history = messages.slice(1).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      const chat = model.startChat({
        history: history,
      });

      const systemPrompt = `
You are a sophisticated academic research assistant. Below is the user's ENTIRE personal library of research papers.
Use this collection as your primary knowledge base to answer questions.

GUIDELINES:
- Synthesize information across multiple papers.
- Always cite specific paper titles when mentioning findings.
- Maintain context of the previous conversation.
- If the answer is not in the library, supplement with general scientific knowledge but clearly distinguish it.

USER'S LIBRARY DATA:
${fullContext}
`;

      // Sending system prompt + context alongside current message to ensure focus
      const result = await chat.sendMessage(`${systemPrompt}\n\nUSER QUESTION: ${userMsg}`);
      const response = result.response.text();

      // Highlight relevant sources
      const queryVec = getWordFreq(userMsg);
      const topSources = library
        .map((b: any) => ({ title: b.title, score: cosineSimilarity(queryVec, getWordFreq(`${b.title} ${b.description}`)) }))
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(s => s.title);

      setMessages(prev => [...prev, { role: 'model', text: response, sources: topSources }]);

    } catch (error: any) {
      console.error("Gemini Error:", error);
      let errorMsg = "Sorry, I encountered an error accessing the AI model. Please check your API key in the Account settings.";
      
      if (error.message?.includes("429") || error.message?.includes("Quota")) {
        errorMsg = "Your AI Quota has been reached for today. Please try again later.";
      } else if (error.message?.includes("400") || error.message?.includes("API_KEY_INVALID")) {
        errorMsg = "Your Gemini API Key appears to be invalid. Please update it in the Account settings.";
      }

      setMessages(prev => [...prev, { role: 'model', text: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Page 
      name="Assistant"
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
                placeholder="Ask anything about your whole library..." 
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
                      MOST RELEVANT SOURCES:
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