import {
  IonButton,
  IonIcon,
  IonText,
  IonBadge,
  useIonToast,
} from "@ionic/react";
import React, { useEffect, useState } from "react";
import { 
  bookOutline, 
  closeOutline, 
  checkmarkOutline, 
  star,
  starOutline
} from "ionicons/icons";
import { motion, AnimatePresence } from "framer-motion";
import Page from "../components/Page";
import { useLibrary } from "../api/library";
import { toList } from "../api/scholar";
import PDFReader from "../components/PDFReader";
import SwipeCard from "../components/SwipeCard";

const ReadPage = () => {
  const [library, , , , , update] = useLibrary();
  const [stack, setStack] = useState<any[]>([]);
  const [readerOpen, setReaderOpen] = useState(false);
  const [activePaper, setActivePaper] = useState<any>(null);
  const [present] = useIonToast();

  // Filter library for unread papers
  useEffect(() => {
    if (library.length > 0 && stack.length === 0) {
      const unread = library
        .filter((b: any) => !b.inReadingList && (b.progress?.current || 0) < (b.progress?.total || 1))
        .sort(() => Math.random() - 0.5)
        .slice(0, 15);
      setStack(unread);
    }
  }, [library, stack.length]);

  const handleSwipe = (paper: any, direction: 'left' | 'right') => {
    if (direction === 'right') {
      update(paper.bid, { inReadingList: true });
      present({ message: "Added to Reading List!", duration: 1000, color: "success", position: 'bottom' });
    }
    setStack(prev => prev.filter(p => p.bid !== paper.bid));
  };

  const setRating = (paper: any, rating: number) => {
    update(paper.bid, { rating });
    
    // Update local stack state so the UI reflects the change immediately
    setStack(prev => prev.map(p => 
      p.bid === paper.bid ? { ...p, rating } : p
    ));

    present({
      message: `Rated ${rating} stars.`,
      duration: 1500,
      color: "primary"
    });
  };

  return (
    <Page name="Reading Queue">
      <div style={{ 
        height: 'calc(100vh - 56px)', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        padding: '24px 20px',
        overflow: 'hidden',
        background: 'var(--ion-background-color)'
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontWeight: 800, margin: 0, fontSize: '1.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <IonIcon icon={bookOutline} color="primary" />
            Reading Queue
          </h1>
          <p style={{ color: 'var(--ion-color-step-600)', fontSize: '0.9rem', marginTop: '4px' }}>Swipe right to add to your Reading List</p>
        </div>

        <div style={{ width: '100%', maxWidth: '380px', flex: 1, position: 'relative', perspective: '1000px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <AnimatePresence mode="popLayout">
            {stack.length > 0 ? (
              stack.slice(-3).map((paper, index, arr) => {
                if (!paper.title) return null;
                const isTop = index === arr.length - 1;
                return (
                  <SwipeCard 
                    key={paper.bid} 
                    item={paper} 
                    isTop={isTop}
                    onSwipe={(dir) => handleSwipe(paper, dir)}
                    rightLabel="ADD"
                    leftLabel="SKIP"
                    badgeColor="primary"
                    showRating={true}
                    onRate={(r) => setRating(paper, r)}
                  />
                );
              })
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', padding: '40px' }}
              >
                <IonIcon icon={checkmarkOutline} color="success" style={{ fontSize: '64px' }} />
                <h3>Queue Empty!</h3>
                <p>Check back later for more suggestions.</p>
                <IonButton fill="outline" shape="round" onClick={() => setStack([])}>Refresh</IonButton>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {stack.length > 0 && (
          <div style={{ display: 'flex', gap: '32px', marginTop: '24px', zIndex: 10, paddingBottom: '20px' }}>
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

        {activePaper && (
          <PDFReader 
            isOpen={readerOpen} 
            onClose={() => setReaderOpen(false)} 
            url={activePaper.url || ""} 
            book={activePaper}
            bid={activePaper.bid}
          />
        )}
      </div>
    </Page>
  );
};

export default ReadPage;