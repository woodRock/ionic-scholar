import React, { useMemo, useState, useEffect } from 'react';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonMenuButton, 
  IonContent, 
  IonSpinner,
  IonIcon,
  IonButton,
  IonCard,
  IonCardContent,
  IonText,
  IonBadge
} from '@ionic/react';
import { shareSocialOutline, expandOutline, scanOutline, contractOutline, closeOutline } from 'ionicons/icons';
import ForceGraph2D from 'react-force-graph-2d';
import { motion } from 'framer-motion';
import Page from '../components/Page';
import { useLibrary } from '../api/library';
import { useNavigate } from 'react-router-dom';

const NetworkMapPage: React.FC = () => {
  const [library] = useLibrary();
  const navigate = useNavigate();
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [hoverNode, setHoverNode] = useState<any>(null);
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [graphData, setGraphData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [linkFilter, setLinkFilter] = useState<'all' | 'author' | 'tag'>('all');

  // --- Process library into Graph Data ---
  useEffect(() => {
    if (library.length === 0) return;

    // 1. Identify "Domains" (top tags) for coloring
    const tagCounts: Record<string, number> = {};
    library.forEach((p: any) => (p.keywords || []).forEach((t: string) => tagCounts[t] = (tagCounts[t] || 0) + 1));
    const topTags = Object.entries(tagCounts).sort(([, a], [, b]) => b - a).slice(0, 8).map(([t]) => t);
    const domainColors = ['#ff4b2b', '#00e676', '#3880ff', '#feb019', '#ff0080', '#7044ff', '#2dd36f', '#eb445a'];

    const nodes = library.map((paper: any) => {
      const primaryTag = (paper.keywords || []).find((t: string) => topTags.includes(t));
      const colorIndex = primaryTag ? topTags.indexOf(primaryTag) : -1;
      
      return {
        id: paper.bid,
        title: paper.title,
        authors: paper.authors,
        year: paper.year,
        tags: paper.keywords || [],
        citations: paper.numCitations || 0,
        val: Math.sqrt(paper.numCitations || 1) + 3,
        color: colorIndex !== -1 ? domainColors[colorIndex] : '#4b5563',
        neighbors: [],
        links: []
      };
    });

    const nodeById: any = Object.fromEntries(nodes.map((n: any) => [n.id, n]));
    const links: any[] = [];
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const sharedAuthors = a.authors.filter((author: string) => b.authors.includes(author));
        const sharedTags = a.tags.filter((tag: string) => b.tags.includes(tag));

        if (sharedAuthors.length > 0 || sharedTags.length > 1) {
          const type = sharedAuthors.length > 0 ? 'author' : 'tag';
          const link = { source: a.id, target: b.id, type, value: sharedAuthors.length + (sharedTags.length * 0.5) };
          links.push(link);
          a.neighbors.push(b);
          b.neighbors.push(a);
          a.links.push(link);
          b.links.push(link);
        }
      }
    }

    setGraphData({ nodes, links });
    setIsLoading(false);
  }, [library]);

  const handleNodeClick = (node: any) => {
    if (selectedNode?.id === node.id) {
      setSelectedNode(null);
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
    } else {
      setSelectedNode(node);
      const neighbors = new Set([node.id, ...node.neighbors.map((n: any) => n.id)]);
      const links = new Set(node.links);
      setHighlightNodes(neighbors);
      setHighlightLinks(links);
    }
  };

  return (
    <Page name="Research Map">
      <div style={{ position: 'relative', height: '100%', width: '100%', background: '#020617' }}>
        
        {/* Modern Floating UI */}
        <div style={{ 
          position: 'absolute', top: '24px', left: '24px', zIndex: 10, maxWidth: '300px'
        }}>
          <div style={{ 
            color: 'white', background: 'rgba(15, 23, 42, 0.9)', padding: '16px', 
            borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <IonIcon icon={shareSocialOutline} color="secondary" />
              Research Clusters
            </h2>
            <p style={{ margin: '8px 0 12px', fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>
              Papers are grouped by domain. Node size indicates citation impact. Click to reveal connections.
            </p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <IonBadge color="light" style={{ fontSize: '0.6rem' }}>{library.length} PAPERS</IonBadge>
              <IonBadge color="secondary" style={{ fontSize: '0.6rem' }}>{graphData.links.length} LINKS</IonBadge>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <IonSpinner name="crescent" color="primary" />
            <p style={{ color: 'white', marginTop: '16px', letterSpacing: '0.1em', fontSize: '0.8rem' }}>CALCULATING CLUSTERS...</p>
          </div>
        ) : (
          <ForceGraph2D
            graphData={graphData}
            backgroundColor="#020617"
            nodeRelSize={1}
            nodeColor={(node: any) => {
              if (highlightNodes.size > 0 && !highlightNodes.has(node.id)) return 'rgba(31, 41, 55, 0.5)';
              return node.color;
            }}
            linkColor={(link: any) => {
              if (highlightLinks.size > 0 && !highlightLinks.has(link)) return 'rgba(31, 41, 55, 0.1)';
              return link.type === 'author' ? 'rgba(255,255,255,0.3)' : 'rgba(0, 230, 118, 0.2)';
            }}
            linkWidth={(link: any) => highlightLinks.has(link) ? 3 : 1}
            linkDirectionalParticles={(link: any) => highlightLinks.has(link) ? 2 : 0}
            linkDirectionalParticleWidth={2}
            onNodeClick={handleNodeClick}
            onNodeHover={node => setHoverNode(node)}
            nodePointerAreaPaint={(node: any, color, ctx) => {
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(node.x, node.y, node.val + 2, 0, 2 * Math.PI, false);
              ctx.fill();
            }}
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const isHighlighted = highlightNodes.has(node.id) || node === hoverNode;
              const size = node.val;
              
              // Draw Node Circle
              ctx.beginPath();
              ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
              ctx.fillStyle = (highlightNodes.size > 0 && !isHighlighted) ? 'rgba(31, 41, 55, 0.5)' : node.color;
              ctx.fill();

              // Conditional Label Rendering
              const shouldShowLabel = isHighlighted || (globalScale > 1.5 && node.citations > 50);
              
              if (shouldShowLabel) {
                const label = node.title;
                const fontSize = Math.max(4, 12 / globalScale);
                ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
                const textWidth = ctx.measureText(label).width;
                
                ctx.fillStyle = 'rgba(2, 6, 23, 0.8)';
                ctx.fillRect(node.x - textWidth/2 - 2, node.y + size + 2, textWidth + 4, fontSize + 2);
                
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillStyle = isHighlighted ? '#fff' : '#94a3b8';
                ctx.fillText(label, node.x, node.y + size + 3);
              }
            }}
          />
        )}

        {/* Dynamic Detail Panel */}
        {selectedNode && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            style={{ 
              position: 'absolute', bottom: '24px', left: '50%', x: '-50%', zIndex: 20,
              width: '90%', maxWidth: '500px'
            }}
          >
            <div style={{ 
              background: 'rgba(15, 23, 42, 0.95)', color: 'white', borderRadius: '24px', 
              padding: '24px', border: '1px solid var(--ion-color-primary)',
              backdropFilter: 'blur(20px)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <IonBadge color="primary" mode="ios">{selectedNode.year}</IonBadge>
                  <IonBadge color="secondary" mode="ios" style={{ marginLeft: '8px' }}>{selectedNode.citations} CITATIONS</IonBadge>
                </div>
                <IonButton fill="clear" color="light" size="small" onClick={() => { setSelectedNode(null); setHighlightNodes(new Set()); setHighlightLinks(new Set()); }} style={{ margin: -10 }}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </div>
              
              <h3 style={{ fontWeight: 800, margin: '0 0 8px', fontSize: '1.2rem', lineHeight: 1.3 }}>{selectedNode.title}</h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '16px' }}>{selectedNode.authors.join(', ')}</p>
              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <IonButton fill="solid" shape="round" onClick={() => navigate(`/page/Book/${encodeURIComponent(selectedNode.title)}`)} style={{ flex: 1 }}>
                  Open Details
                </IonButton>
                <IonButton fill="outline" shape="round" color="light" onClick={() => window.open(selectedNode.url, '_blank')} disabled={!selectedNode.url}>
                  View PDF
                </IonButton>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                <p style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '8px' }}>
                  Connections ({selectedNode.neighbors.length})
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {selectedNode.tags.slice(0, 5).map((t: string) => (
                    <IonBadge key={t} style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: '0.6rem' }}>#{t}</IonBadge>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Map Legend */}
        <div style={{ position: 'absolute', bottom: '24px', right: '24px', textAlign: 'right', color: '#475569', fontSize: '0.7rem', fontWeight: 600 }}>
          <p>SCROLL TO ZOOM</p>
          <p>DRAG TO PAN</p>
          <p>CLICK NODE TO FOCUS</p>
        </div>

      </div>
    </Page>
  );
};

export default NetworkMapPage;