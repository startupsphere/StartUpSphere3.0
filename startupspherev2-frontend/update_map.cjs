const fs = require('fs');
const file = 'c:/Users/aceucchi/Documents/Capstonev3/StartUpSphere3.0/startupspherev2-frontend/src/3dmap/Startupmap.jsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add engagementMarkers state
if (!code.includes('const [engagementMarkers, setEngagementMarkers]')) {
  code = code.replace(
    'const [startupMarkers, setStartupMarkers] = useState([]);',
    'const [startupMarkers, setStartupMarkers] = useState([]);\n  const [engagementMarkers, setEngagementMarkers] = useState([]);'
  );
}

// 2. Add useEffect to generate engagement data
const useEffectStr = `
  useEffect(() => {
     const mockData = [];
     const baseLng = 123.8907;
     const baseLat = 10.3166;
     const names = [
       "TechHub Cebu Event", "Developers Meetup", "Startup Pitch Night", 
       "AI Hackathon", "Founders Mixer", "Investor Panel", 
       "Web3 Conference", "Design Sprint Workshop", "Cloud Computing Summit", 
       "Local Tech Podcast Live", "University Tech Fair", "FinTech Forum",
       "E-commerce Expo", "AgriTech Showcase", "HealthTech Symposium"
     ];
     for (let i = 0; i < 15; i++) {
       const offsetLng = (Math.random() - 0.5) * 0.05;
       const offsetLat = (Math.random() - 0.5) * 0.05;
       const likes = Math.floor(Math.random() * 500) + 50;
       const comments = Math.floor(Math.random() * 150) + 10;
       const shares = Math.floor(Math.random() * 80) + 5;
       const engagementScore = likes + (comments * 2) + (shares * 3);
       let engagementClass = 1;
       if (engagementScore >= 400) engagementClass = 3;
       else if (engagementScore >= 200) engagementClass = 2;
       mockData.push({
         id: \`engagement-mock-\${i}\`,
         name: names[i],
         locationLng: baseLng + offsetLng,
         locationLat: baseLat + offsetLat,
         likes, comments, shares, engagementScore, engagementClass
       });
     }
     setEngagementMarkers(mockData);
  }, []);
`;
if (!code.includes('const mockData = [];')) {
  code = code.replace(
    '// Preload the stakeholder icon as soon as component mounts',
    useEffectStr + '\n  // Preload the stakeholder icon as soon as component mounts'
  );
}

// 3. Update the useEffect for Heatmap colors and visibility
const useEffectVisibilityStr = `// Update Heatmap colors and visibility based on mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const trlLayers = ["startups-zone-gradients", "startups-zone-core", "startups-unclustered-gradient", "startups-unclustered-core"];
    const engagementLayers = ["engagement-zone-gradients", "engagement-zone-core", "engagement-unclustered-gradient", "engagement-unclustered-core"];

    trlLayers.forEach(layer => {
      if (map.getLayer(layer)) {
        map.setLayoutProperty(layer, 'visibility', showHeatmap && heatmapMode === "TRL" ? 'visible' : 'none');
      }
    });

    engagementLayers.forEach(layer => {
      if (map.getLayer(layer)) {
        map.setLayoutProperty(layer, 'visibility', showHeatmap && heatmapMode === "ENGAGEMENT" ? 'visible' : 'none');
      }
    });
  }, [heatmapMode, showHeatmap]);

  const applyFiltersToMap =`;

code = code.replace(/\/\/ Update Heatmap colors based on mode[\s\S]*?const applyFiltersToMap =/m, useEffectVisibilityStr);


// 4. Create renderEngagementMarkers and put it above renderStartupMarkers
const renderEngStr = `
  const renderEngagementMarkers = (map, markers) => {
    if (!map || !markers || markers.length === 0) return;
    const sourceId = "engagement-src";
    
    const features = markers.map(s => ({
      type: "Feature",
      id: s.id,
      properties: s,
      geometry: { type: "Point", coordinates: [s.locationLng, s.locationLat] }
    }));
    
    const data = { type: "FeatureCollection", features };
    
    if (map.getSource(sourceId)) {
      try { map.getSource(sourceId).setData(data); } catch { }
    } else {
      map.addSource(sourceId, {
        type: "geojson",
        data,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 60,
        clusterProperties: {
          maxEngagementClass: ["max", ["get", "engagementClass"]],
          sumScore: ["+", ["get", "engagementScore"]],
          sumLikes: ["+", ["get", "likes"]],
          sumComments: ["+", ["get", "comments"]],
          sumShares: ["+", ["get", "shares"]]
        }
      });
    }

    const isVisible = showHeatmap && heatmapMode === "ENGAGEMENT" ? "visible" : "none";

    if (!map.getLayer("engagement-zone-gradients")) {
      map.addLayer({
        id: "engagement-zone-gradients",
        type: "circle",
        source: sourceId,
        filter: ["has", "point_count"],
        layout: { visibility: isVisible },
        paint: {
          "circle-color": ["match", ["get", "maxEngagementClass"], 1, "#22c55e", 2, "#eab308", 3, "#ef4444", "#22c55e"],
          "circle-radius": ["step", ["get", "point_count"], 40, 4, 55, 10, 75, 21, 100],
          "circle-blur": 0.8,
          "circle-opacity": 0.7
        }
      });

      map.addLayer({
        id: "engagement-zone-core",
        type: "circle",
        source: sourceId,
        filter: ["has", "point_count"],
        layout: { visibility: isVisible },
        paint: {
          "circle-color": ["match", ["get", "maxEngagementClass"], 1, "#16a34a", 2, "#ca8a04", 3, "#dc2626", "#16a34a"],
          "circle-radius": ["step", ["get", "point_count"], 15, 4, 25, 10, 35, 21, 45],
          "circle-blur": 0.4,
          "circle-opacity": 0.9
        }
      });

      map.addLayer({
        id: "engagement-unclustered-gradient",
        type: "circle",
        source: sourceId,
        filter: ["!", ["has", "point_count"]],
        layout: { visibility: isVisible },
        paint: {
          "circle-color": ["match", ["get", "engagementClass"], 1, "#22c55e", 2, "#eab308", 3, "#ef4444", "#22c55e"],
          "circle-radius": 30,
          "circle-blur": 0.8,
          "circle-opacity": 0.7
        }
      });

      map.addLayer({
        id: "engagement-unclustered-core",
        type: "circle",
        source: sourceId,
        filter: ["!", ["has", "point_count"]],
        layout: { visibility: isVisible },
        paint: {
          "circle-color": ["match", ["get", "engagementClass"], 1, "#16a34a", 2, "#ca8a04", 3, "#dc2626", "#16a34a"],
          "circle-radius": 12,
          "circle-blur": 0.2,
          "circle-opacity": 0.9
        }
      });

      // Events
      const handleClusterClick = (e, layerName) => {
        const features = map.queryRenderedFeatures(e.point, { layers: [layerName] });
        if (!features || !features.length) return;
        const props = features[0].properties;
        setSelectedEngagementData({
          name: \`Cluster of \${props.point_count} Events\`,
          likes: props.sumLikes || 0,
          comments: props.sumComments || 0,
          shares: props.sumShares || 0,
          score: props.sumScore || 0
        });
      };

      map.on('click', 'engagement-zone-core', (e) => handleClusterClick(e, 'engagement-zone-core'));
      map.on('mouseenter', 'engagement-zone-core', () => map.getCanvas().style.cursor = 'pointer');
      map.on('mouseleave', 'engagement-zone-core', () => map.getCanvas().style.cursor = '');

      const handleSingleClick = (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['engagement-unclustered-core', 'engagement-unclustered-gradient'] });
        if (!features || !features.length) return;
        const props = features[0].properties;
        setSelectedEngagementData({
          name: props.name,
          likes: props.likes || 0,
          comments: props.comments || 0,
          shares: props.shares || 0,
          score: props.engagementScore || 0
        });
      };
      
      map.on('click', 'engagement-unclustered-core', handleSingleClick);
      map.on('click', 'engagement-unclustered-gradient', handleSingleClick);
      map.on('mouseenter', 'engagement-unclustered-core', () => map.getCanvas().style.cursor = 'pointer');
      map.on('mouseleave', 'engagement-unclustered-core', () => map.getCanvas().style.cursor = '');
    }
  };
`;
if (!code.includes('const renderEngagementMarkers =')) {
  code = code.replace('const renderStartupMarkers = (map, startupsWithLocation) => {', renderEngStr + '\n  const renderStartupMarkers = (map, startupsWithLocation) => {');
}

// 5. Hook up renderEngagementMarkers inside the component when engagementMarkers changes
// We need an effect that runs renderEngagementMarkers whenever map changes or markers changes.
// The existing app calls loadStartupMarkers on style load. Let's find where that is.
const renderCall = `
  useEffect(() => {
    if (mapInstanceRef.current && engagementMarkers.length > 0) {
      renderEngagementMarkers(mapInstanceRef.current, engagementMarkers);
    }
  }, [engagementMarkers, mapInstanceRef.current]);
`;
if (!code.includes('renderEngagementMarkers(mapInstanceRef.current')) {
  code = code.replace(
    '// Update Heatmap colors and visibility based on mode',
    renderCall + '\n  // Update Heatmap colors and visibility based on mode'
  );
}

fs.writeFileSync(file, code);
console.log("Successfully updated Startupmap.jsx");
