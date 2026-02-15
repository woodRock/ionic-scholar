import React from 'react';
import { motion, useMotionValue, useTransform } from "framer-motion";
import { IonBadge, IonButton, IonIcon, IonText } from "@ionic/react";
import { openOutline, star, starOutline } from "ionicons/icons";
import { toList } from "../api/scholar";

interface SwipeCardProps {
  item: any;
  isTop: boolean;
  onSwipe: (direction: 'left' | 'right') => void;
  // Customization
  rightLabel?: string;
  leftLabel?: string;
  rightColor?: string;
  leftColor?: string;
  badgeColor?: string;
  showRating?: boolean;
  onRate?: (rating: number) => void;
  primaryActionLabel?: string;
  primaryActionIcon?: string;
  onPrimaryAction?: () => void;
}

const SwipeCard: React.FC<SwipeCardProps> = ({ 
  item, 
  isTop, 
  onSwipe,
  rightLabel = "LIKE",
  leftLabel = "NOPE",
  rightColor = "#00e676",
  leftColor = "#ff4b2b",
  badgeColor = "secondary",
  showRating = false,
  onRate,
  primaryActionLabel = "Read",
  primaryActionIcon = openOutline,
  onPrimaryAction
}) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  
  // Visual indicators
  const rightOpacity = useTransform(x, [50, 120], [0, 1]);
  const leftOpacity = useTransform(x, [-120, -50], [1, 0]);

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
        zIndex: isTop ? 10 : 1,
        transformOrigin: 'bottom center'
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
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
        {/* Visual Overlays */}
        <motion.div style={{ 
          position: 'absolute', top: '40px', left: '20px', opacity: rightOpacity, 
          border: `4px solid ${rightColor}`, color: rightColor, padding: '4px 12px', 
          borderRadius: '8px', fontSize: '2rem', fontWeight: '900', rotate: '-15deg', zIndex: 20 
        }}>{rightLabel}</motion.div>
        
        <motion.div style={{ 
          position: 'absolute', top: '40px', right: '20px', opacity: leftOpacity, 
          border: `4px solid ${leftColor}`, color: leftColor, padding: '4px 12px', 
          borderRadius: '8px', fontSize: '2rem', fontWeight: '900', rotate: '15deg', zIndex: 20 
        }}>{leftLabel}</motion.div>

        <div style={{ flex: 1, overflowY: 'auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '16px' }}>
            <IonBadge color={badgeColor} mode="ios" style={{ padding: '6px 16px' }}>
              {item.year || 'NEW'}
            </IonBadge>
          </div>
          
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.3, margin: '0 0 12px', color: '#111' }}>
            {item.title}
          </h2>
          
          <p style={{ color: 'var(--ion-color-step-600)', marginBottom: '20px', fontSize: '0.9rem', fontWeight: '500' }}>
            {toList(item.authors || [])}
          </p>
          
          {showRating && onRate && (
            <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
              {[1, 2, 3, 4, 5].map(r => (
                <IonIcon 
                  key={r} 
                  icon={r <= (item.rating || 0) ? star : starOutline} 
                  color="warning" 
                  onClick={(e) => { e.stopPropagation(); onRate(r); }}
                  style={{ fontSize: '1.5rem', cursor: 'pointer' }}
                />
              ))}
            </div>
          )}

          <div style={{ width: '40px', height: '2px', background: 'var(--ion-color-step-200)', marginBottom: '24px' }} />
          
          <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#444', textAlign: 'justify' }}>
            {item.description || item.abstract || "No abstract available for this paper."}
          </p>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f5f5f5', paddingTop: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <IonText color="medium" style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '700' }}>Citations</IonText>
            <IonText style={{ fontWeight: '800' }}>{item.numCitations || 0}</IonText>
          </div>
          
          {onPrimaryAction ? (
            <IonButton fill="clear" size="small" onClick={(e) => { e.stopPropagation(); onPrimaryAction(); }}>
              <IonIcon slot="start" icon={primaryActionIcon} />
              {primaryActionLabel}
            </IonButton>
          ) : (
            item.url && (
              <IonButton fill="clear" size="small" href={item.url} target="_blank" onClick={e => e.stopPropagation()}>
                <IonIcon slot="end" icon={openOutline} />
                Details
              </IonButton>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SwipeCard;