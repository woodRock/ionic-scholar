import {
  IonButton,
  IonIcon,
  IonSpinner,
  IonText,
  IonBadge,
  useIonToast,
} from "@ionic/react";
import React, { useEffect, useState } from "react";
import { 
  sparklesOutline, 
  closeOutline, 
  checkmarkOutline, 
  refreshOutline, 
} from "ionicons/icons";
import { AnimatePresence } from "framer-motion";
import Page from "../components/Page";
import { useLibrary } from "../api/library";
import { toList } from "../api/scholar";
import { doc, setDoc, collection, query, getDocs, limit, orderBy } from "firebase/firestore";
import { firestore, auth } from "../api/firebase";
import SwipeCard from "../components/SwipeCard";

// --- Vector Math Helpers for simple KNN ---

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

// --- Component ---

const DiscoverPage = () => {
  const [library, , add, , , , pinnedTags] = useLibrary();
  const [stack, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [swipedIds, setSwipedIds] = useState<Set<string>>(new Set());
  const [currentSeed, setCurrentSeed] = useState<string>("");
  const [present] = useIonToast();

  // Load swiped history once
  useEffect(() => {
    const loadHistory = async () => {
      if (!auth.currentUser) return;
      const q = query(collection(firestore, `users/${auth.currentUser.uid}/swipes`), limit(500));
      const snap = await getDocs(q);
      const ids = new Set<string>();
      snap.forEach(d => ids.add(d.id));
      setSwipedIds(ids);
    };
    loadHistory();
  }, []);

  const handleSwipe = async (paper: any, direction: 'left' | 'right') => {
    if (!auth.currentUser) return;
    
    const paperId = paper.title.toLowerCase().replace(/[^a-z0-9]/g, "_");
    
    // Save swipe to Firebase for KNN training
    const swipeRef = doc(firestore, `users/${auth.currentUser.uid}/swipes`, paperId);
    setDoc(swipeRef, {
      title: paper.title,
      abstract: paper.description || "",
      direction,
      timestamp: Date.now()
    });

    if (direction === 'right') {
      add(paper);
      present({ message: "Added to Library!", duration: 1000, color: "success", position: 'bottom' });
    }

    setRecommendations(prev => prev.filter(p => p.title !== paper.title));
    setSwipedIds(prev => new Set(prev).add(paperId));
  };

  const fetchRecommendations = async () => {
    if (!auth.currentUser) return;
    setIsLoading(true);
    try {
      // 1. Get user profile (liked vs disliked)
      const q = query(collection(firestore, `users/${auth.currentUser.uid}/swipes`), orderBy("timestamp", "desc"), limit(50));
      const snap = await getDocs(q);
      const likes: Record<string, number>[] = [];
      const dislikes: Record<string, number>[] = [];
      
      snap.forEach(d => {
        const data = d.data();
        const freq = getWordFreq(`${data.title} ${data.abstract}`);
        if (data.direction === 'right') likes.push(freq);
        else dislikes.push(freq);
      });

      // Add highly rated library items to likes
      library.forEach((b: any) => {
        if (b.rating >= 4) {
          likes.push(getWordFreq(`${b.title} ${b.description}`));
        }
      });

      // 2. Determine "Seed" topics with randomness
      const likedTopics = likes.length > 0 ? Object.keys(likes[Math.floor(Math.random() * likes.length)]).slice(0, 3) : [];
      const libraryTopics = library.flatMap((b: any) => b.keywords || []);
      
      const allOptions = Array.from(new Set([...pinnedTags, ...likedTopics, ...libraryTopics]));
      
      // Pick 1-2 random topics for this specific fetch
      const shuffled = allOptions.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(2, shuffled.length));
      const queryStr = selected.length > 0 ? selected.join(" ") : "latest academic research";
      
      setCurrentSeed(selected.join(", ") || "General Interest");

      // 3. Fetch candidates
      const response = await fetch(
        `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(queryStr)}&limit=50&fields=title,authors,year,url,citationCount,abstract,venue`
      );
      const result = await response.json();

      // 4. Rank candidates using KNN logic
      const candidates = (result.data || [])
        .filter((p: any) => !swipedIds.has(p.title.toLowerCase().replace(/[^a-z0-9]/g, "_")))
        .map((p: any) => {
          const freq = getWordFreq(`${p.title} ${p.abstract}`);
          const likeScore = likes.length > 0 ? Math.max(...likes.map(l => cosineSimilarity(freq, l))) : 0.5;
          const dislikeScore = dislikes.length > 0 ? Math.max(...dislikes.map(d => cosineSimilarity(freq, d))) : 0;

          return {
            ...p,
            description: p.abstract,
            authors: (p.authors || []).map((a: any) => a.name),
            numCitations: p.citationCount || 0,
            score: likeScore - (dislikeScore * 0.5)
          };
        })
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 15);

      setRecommendations(candidates.reverse()); 
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (swipedIds.size >= 0 && stack.length === 0 && !isLoading) fetchRecommendations();
  }, [stack.length]);

  return (
    <Page name="Discover">
      <div style={{ 
        height: 'calc(100vh - 56px)', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px',
        overflow: 'hidden',
        position: 'relative',
        background: 'var(--ion-background-color)'
      }}>
        
        <div style={{ position: 'absolute', top: '24px', textAlign: 'center', zIndex: 10 }}>
          <h1 style={{ fontWeight: 800, margin: 0, fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IonIcon icon={sparklesOutline} color="secondary" />
            Scholar Discovery
          </h1>
          {currentSeed && (
            <IonBadge color="light" style={{ marginTop: '8px', fontSize: '0.7rem', fontWeight: '400', letterSpacing: '0.05em' }}>
              EXPLORING: {currentSeed.toUpperCase()}
            </IonBadge>
          )}
        </div>

        <div style={{ width: '100%', maxWidth: '380px', height: '520px', position: 'relative', perspective: '1000px' }}>
          <AnimatePresence>
            {stack.length > 0 ? (
              // Only render the top 2 cards for performance
              stack.slice(-2).map((paper, index, arr) => {
                const isTop = index === arr.length - 1;
                return (
                  <SwipeCard 
                    key={paper.title} 
                    item={paper} 
                    isTop={isTop} 
                    onSwipe={(dir) => handleSwipe(paper, dir)}
                  />
                );
              })
            ) : isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <IonSpinner name="crescent" color="primary" />
                <p style={{ marginTop: '16px', color: 'var(--ion-color-step-500)' }}>Analyzing preferences...</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
                <IonIcon icon={refreshOutline} style={{ fontSize: '64px', color: 'var(--ion-color-step-300)', marginBottom: '16px' }} />
                <h3>All caught up!</h3>
                <p style={{ color: 'var(--ion-color-step-600)', marginBottom: '20px' }}>We've processed this batch of research.</p>
                <IonButton fill="outline" shape="round" onClick={fetchRecommendations}>Refresh Stack</IonButton>
              </div>
            )}
          </AnimatePresence>
        </div>

        {stack.length > 0 && (
          <div style={{ display: 'flex', gap: '32px', marginTop: '24px', zIndex: 10 }}>
            <IonButton 
              fill="solid" 
              color="white"
              style={{ '--border-radius': '50%', width: '64px', height: '64px', '--box-shadow': '0 4px 12px rgba(0,0,0,0.1)' }}
              onClick={() => handleSwipe(stack[stack.length-1], 'left')}
            >
              <IonIcon icon={closeOutline} style={{ fontSize: '32px', color: '#ff4b2b' }} />
            </IonButton>
            <IonButton 
              fill="solid" 
              color="white"
              style={{ '--border-radius': '50%', width: '64px', height: '64px', '--box-shadow': '0 4px 12px rgba(0,0,0,0.1)' }}
              onClick={() => handleSwipe(stack[stack.length-1], 'right')}
            >
              <IonIcon icon={checkmarkOutline} style={{ fontSize: '32px', color: '#00e676' }} />
            </IonButton>
          </div>
        )}
      </div>
    </Page>
  );
};

export default DiscoverPage;