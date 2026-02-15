import {
  IonButton,
  IonIcon,
  IonText,
  IonBadge,
  useIonToast,
  IonSpinner
} from "@ionic/react";
import React, { useEffect, useState } from "react";
import { 
  bookOutline, 
  closeOutline, 
  checkmarkOutline, 
  star,
  starOutline
} from "ionicons/icons";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import Page from "../components/Page";
import { useLibrary, Book } from "../api/library";
import { toList } from "../api/scholar";
import PDFReader from "../components/PDFReader";

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
                  <ReadSwipeCard 
                    key={paper.bid} 
                    paper={paper} 
                    isTop={isTop}
                    index={index}
                    totalInStack={arr.length}
                    onSwipe={(dir) => handleSwipe(paper, dir)}
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

const ReadSwipeCard = ({ paper, isTop, index, totalInStack, onSwipe, onRate }: { paper: any, isTop: boolean, index: number, totalInStack: number, onSwipe: (dir: 'left' | 'right') => void, onRate: (r: number) => void }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  
  const addOpacity = useTransform(x, [50, 120], [0, 1]);
  const skipOpacity = useTransform(x, [-120, -50], [1, 0]);

  const scale = isTop ? 1 : 1 - (totalInStack - 1 - index) * 0.05;
  const yOffset = isTop ? 0 : (totalInStack - 1 - index) * 15;

  const handleDragEnd = (_: any, info: any) => {
    const threshold = 100;
    const velocity = info.velocity.x;
    
    if (info.offset.x > threshold || velocity > 400) {
      onSwipe('right');
    } else if (info.offset.x < -threshold || velocity < -400) {
      onSwipe('left');
    }
  };

  return (
    <motion.div
      style={{ 
        position: 'absolute', width: '100%', height: '520px', x, rotate, opacity,
        cursor: isTop ? 'grab' : 'default',
        zIndex: isTop ? 10 : index,
        transformOrigin: 'bottom center',
        y: yOffset
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale, opacity: 1 }}
      exit={{ 
        x: x.get() > 0 ? 800 : (x.get() < 0 ? -800 : (Math.random() > 0.5 ? 800 : -800)), 
        opacity: 0, 
        scale: 0.5,
        rotate: x.get() > 0 ? 45 : -45,
        transition: { duration: 0.4 } 
      }}
      whileTap={isTop ? { scale: 1.02 } : {}}
    >
      <div style={{ 
        width: '100%', height: '100%', background: 'white', borderRadius: '28px',
        padding: '24px', display: 'flex', flexDirection: 'column',
        boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
        border: '1px solid rgba(0,0,0,0.05)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <motion.div style={{ position: 'absolute', top: '40px', left: '20px', opacity: addOpacity, border: '4px solid #00e676', color: '#00e676', padding: '4px 12px', borderRadius: '8px', fontSize: '2rem', fontWeight: '900', rotate: '-15deg', zIndex: 20 }}>ADD</motion.div>
        <motion.div style={{ position: 'absolute', top: '40px', right: '20px', opacity: skipOpacity, border: '4px solid #ff4b2b', color: '#ff4b2b', padding: '4px 12px', borderRadius: '8px', fontSize: '2rem', fontWeight: '900', rotate: '15deg', zIndex: 20 }}>SKIP</motion.div>

        <div style={{ flex: 1, overflowY: 'auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <IonBadge color="primary" mode="ios" style={{ marginBottom: '16px', padding: '6px 16px' }}>
            {Math.round(((paper.progress?.current || 0) / (paper.progress?.total || 1)) * 100)}% READ
          </IonBadge>
          
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1.3, margin: '0 0 12px', color: '#111' }}>
            {paper.title}
          </h2>
          
          <p style={{ color: 'var(--ion-color-step-600)', marginBottom: '20px', fontSize: '0.95rem', fontWeight: '500' }}>
            {toList(paper.authors)}
          </p>
          
          <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
            {[1, 2, 3, 4, 5].map(r => (
              <IonIcon 
                key={r} 
                icon={r <= (paper.rating || 0) ? star : starOutline} 
                color="warning" 
                onClick={(e) => { e.stopPropagation(); onRate(r); }}
                style={{ fontSize: '1.5rem', cursor: 'pointer' }}
              />
            ))}
          </div>

          <div style={{ width: '40px', height: '2px', background: 'var(--ion-color-primary)', marginBottom: '24px', opacity: 0.3 }} />
          
          <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#444', textAlign: 'justify' }}>
            {paper.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default ReadPage;