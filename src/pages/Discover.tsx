import {
  IonButton,
  IonIcon,
  IonSpinner,
  IonText,
  IonBadge,
  useIonToast,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton
} from "@ionic/react";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { 
  sparklesOutline, 
  closeOutline, 
  checkmarkOutline, 
  refreshOutline, 
  bookOutline, 
  openOutline,
  trashOutline
} from "ionicons/icons";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import Page from "../components/Page";
import { useLibrary, Book } from "../api/library";
import { toList } from "../api/scholar";
import { doc, getDoc, setDoc, collection, query, getDocs, limit, orderBy } from "firebase/firestore";
import { firestore, auth } from "../api/firebase";

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
  const [library, , add] = useLibrary();
  const [stack, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [swipedIds, setSwipedIds] = useState<Set<string>>(new Set());
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
    
    // Save swipe to Firebase for KNN training
    const swipeRef = doc(firestore, `users/${auth.currentUser.uid}/swipes`, paper.title.toLowerCase().replace(/\s/g, "_"));
    await setDoc(swipeRef, {
      title: paper.title,
      abstract: paper.description || "",
      direction,
      timestamp: Date.now()
    });

    if (direction === 'right') {
      add(paper);
      present({ message: "Added to Library!", duration: 1500, color: "success", position: 'bottom' });
    }

    setRecommendations(prev => prev.filter(p => p.title !== paper.title));
    setSwipedIds(prev => new Set(prev).add(paper.title.toLowerCase().replace(/\s/g, "_")));
  };

  const fetchRecommendations = async () => {
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

      // 2. Determine "Seed" topics from likes or library
      const topics = likes.length > 0 
        ? Object.keys(likes[0]).slice(0, 2)
        : library.flatMap(b => b.keywords || []).slice(0, 2);
      
      const queryStr = topics.length > 0 ? topics.join(" ") : "latest academic research";

      // 3. Fetch candidates
      const response = await fetch(
        `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(queryStr)}&limit=50&fields=title,authors,year,url,citationCount,abstract,venue`
      );
      const result = await response.json();

      // 4. Rank candidates using KNN logic
      const candidates = (result.data || [])
        .filter((p: any) => !swipedIds.has(p.title.toLowerCase().replace(/\s/g, "_")))
        .map((p: any) => {
          const freq = getWordFreq(`${p.title} ${p.abstract}`);
          
          // Calculate similarity to all "liked" papers
          const likeScore = likes.length > 0 
            ? Math.max(...likes.map(l => cosineSimilarity(freq, l)))
            : 0.5;

          // Calculate similarity to all "disliked" papers
          const dislikeScore = dislikes.length > 0
            ? Math.max(...dislikes.map(d => cosineSimilarity(freq, d)))
            : 0;

          return {
            ...p,
            description: p.abstract,
            authors: (p.authors || []).map((a: any) => a.name),
            score: likeScore - (dislikeScore * 0.5) // Penalty for matching dislikes
          };
        })
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 15);

      setRecommendations(candidates);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (swipedIds.size >= 0) fetchRecommendations();
  }, [swipedIds.size === 0]);

  return (
    <Page name="Discover">
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        
        <div style={{ position: 'absolute', top: '20px', textAlign: 'center', zIndex: 10 }}>
          <h1 style={{ fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IonIcon icon={sparklesOutline} color="secondary" />
            Scholar Discovery
          </h1>
          <p style={{ color: 'var(--ion-color-step-600)', margin: '4px 0' }}>Swipe right to save, left to ignore</p>
        </div>

        <div style={{ width: '100%', maxWidth: '400px', height: '550px', position: 'relative' }}>
          <AnimatePresence>
            {stack.length > 0 ? (
              stack.map((paper, index) => (
                <SwipeCard 
                  key={paper.title} 
                  paper={paper} 
                  isTop={index === stack.length - 1} 
                  onSwipe={(dir) => handleSwipe(paper, dir)}
                />
              ))
            ) : isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <IonSpinner name="crescent" color="primary" />
                <p>Training AI on your preferences...</p>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <IonIcon icon={refreshOutline} style={{ fontSize: '48px', color: 'var(--ion-color-step-300)' }} />
                <h3>Out of papers!</h3>
                <IonButton fill="clear" onClick={fetchRecommendations}>Fetch More</IonButton>
              </div>
            )}
          </AnimatePresence>
        </div>

        {stack.length > 0 && (
          <div style={{ display: 'flex', gap: '40px', marginTop: '30px', zIndex: 10 }}>
            <div 
              onClick={() => handleSwipe(stack[stack.length-1], 'left')}
              style={{ 
                width: '64px', height: '64px', borderRadius: '50%', background: 'white', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', color: '#ff4b2b', cursor: 'pointer'
              }}
            >
              <IonIcon icon={closeOutline} style={{ fontSize: '32px' }} />
            </div>
            <div 
              onClick={() => handleSwipe(stack[stack.length-1], 'right')}
              style={{ 
                width: '64px', height: '64px', borderRadius: '50%', background: 'white', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', color: '#00e676', cursor: 'pointer'
              }}
            >
              <IonIcon icon={checkmarkOutline} style={{ fontSize: '32px' }} />
            </div>
          </div>
        )}
      </div>
    </Page>
  );
};

const SwipeCard = ({ paper, isTop, onSwipe }: { paper: any, isTop: boolean, onSwipe: (dir: 'left' | 'right') => void }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const colorRight = useTransform(x, [50, 150], ["rgba(0,230,118,0)", "rgba(0,230,118,0.2)"]);
  const colorLeft = useTransform(x, [-150, -50], ["rgba(255,75,43,0.2)", "rgba(255,75,43,0)"]);

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x > 100) onSwipe('right');
    else if (info.offset.x < -100) onSwipe('left');
  };

  return (
    <motion.div
      style={{ 
        position: 'absolute', width: '100%', height: '100%', x, rotate, opacity,
        cursor: isTop ? 'grab' : 'default',
        zIndex: isTop ? 10 : 1
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ x: x.get() < 0 ? -500 : 500, opacity: 0, transition: { duration: 0.3 } }}
    >
      <motion.div style={{ 
        width: '100%', height: '100%', background: 'white', borderRadius: '24px',
        padding: '24px', display: 'flex', flexDirection: 'column',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        border: '1px solid var(--ion-border-color)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Swipe Overlays */}
        <motion.div style={{ position: 'absolute', inset: 0, background: colorRight, pointerEvents: 'none' }} />
        <motion.div style={{ position: 'absolute', inset: 0, background: colorLeft, pointerEvents: 'none' }} />

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <IonBadge color="secondary" style={{ marginBottom: '12px' }}>{paper.year}</IonBadge>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.2, margin: '0 0 8px', color: '#1a1a1a' }}>{paper.title}</h2>
          <p style={{ color: 'var(--ion-color-step-600)', marginBottom: '16px', fontSize: '0.9rem' }}>{toList(paper.authors)}</p>
          
          <div style={{ height: '1px', background: '#eee', margin: '16px 0' }} />
          
          <h3 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#999', marginBottom: '8px' }}>Abstract</h3>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: '#444' }}>
            {paper.description || "No abstract available for this paper."}
          </p>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <IonText color="medium" style={{ fontSize: '0.8rem' }}>{paper.numCitations} Citations</IonText>
          {paper.url && (
            <IonButton fill="clear" size="small" href={paper.url} target="_blank" onClick={e => e.stopPropagation()}>
              <IonIcon slot="start" icon={openOutline} />
              Details
            </IonButton>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DiscoverPage;