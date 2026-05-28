const fs = require('fs');
const file = 'c:/Users/aceucchi/Documents/Capstonev3/StartUpSphere3.0/startupspherev2-frontend/src/3dmap/Startupmap.jsx';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(/\r\n/g, '\n');

function injectAfter(searchStr, injectStr) {
  const index = code.indexOf(searchStr);
  if (index === -1) throw new Error("Could not find: " + searchStr);
  code = code.substring(0, index + searchStr.length) + "\n" + injectStr + code.substring(index + searchStr.length);
}

function replaceExact(searchStr, replaceStr) {
  const index = code.indexOf(searchStr);
  if (index === -1) throw new Error("Could not find exact string!");
  code = code.substring(0, index) + replaceStr + code.substring(index + searchStr.length);
}

if (!code.includes('EngagementChart')) {
  injectAfter('import Login from "../modals/Login";', 'import EngagementChart from "../components/EngagementChart";');
}

if (!code.includes('heatmapMode')) {
  injectAfter('const [showHeatmap, setShowHeatmap] = useState(true);', `
  const [heatmapMode, setHeatmapMode] = useState("TRL");
  const [selectedEngagementData, setSelectedEngagementData] = useState(null);
  const [engagementMarkers, setEngagementMarkers] = useState([]);
  const heatmapModeRef = useRef("TRL");
  useEffect(() => { heatmapModeRef.current = heatmapMode; }, [heatmapMode]);
`);
}

if (!code.includes('setEngagementMarkers(mockData)')) {
  const mockDataStr = `
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
       const views = Math.floor(Math.random() * 2000) + 100;
       const bookmarks = Math.floor(Math.random() * 80) + 5;
       const engagementScore = likes + views + bookmarks;
       mockData.push({
         id: \`engagement-mock-\${i}\`,
         name: names[i],
         locationLng: baseLng + offsetLng,
         locationLat: baseLat + offsetLat,
         likes, views, bookmarks, engagementScore
       });
     }
     
     // Add distinct blue zones (low engagement)
     mockData.push({
       id: 'engagement-mock-blue-1',
       name: "Local Tech Meetup (Quiet Zone)",
       locationLng: baseLng + 0.08,
       locationLat: baseLat - 0.08,
       likes: 2, views: 8, bookmarks: 1, engagementScore: 11
     });
     mockData.push({
       id: 'engagement-mock-blue-2',
       name: "New Founder Intro (Developing)",
       locationLng: baseLng - 0.07,
       locationLat: baseLat + 0.06,
       likes: 0, views: 5, bookmarks: 0, engagementScore: 5
     });
     
     setEngagementMarkers(mockData);
  }, []);
`;
  injectAfter('// Preload the stakeholder icon as soon as component mounts', mockDataStr);
}

if (!code.includes('renderEngagementMarkers(map, markers)')) {
  const renderEngStr = `
  const renderEngagementMarkers = (map, markers) => {
    if (!map || !markers || markers.length === 0) return;
    if (!map.isStyleLoaded()) {
      map.once('styledata', () => {
        if (map.isStyleLoaded()) renderEngagementMarkers(map, markers);
      });
      return;
    }
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
        clusterRadius: 50,
        clusterProperties: {
          sumScore: ["+", ["get", "engagementScore"]],
          sumLikes: ["+", ["get", "likes"]],
          sumViews: ["+", ["get", "views"]],
          sumBookmarks: ["+", ["get", "bookmarks"]]
        }
      });
    }

    const isVisible = showHeatmap && heatmapModeRef.current === "ENGAGEMENT" ? "visible" : "none";

    // TRUE MAPBOX HEATMAP LAYER for density gradients
    if (!map.getLayer("engagement-heatmap-layer")) {
      map.addLayer({
        id: "engagement-heatmap-layer",
        type: "heatmap",
        source: sourceId,
        layout: { visibility: isVisible },
        paint: {
          "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["coalesce", ["get", "sumScore"], ["get", "engagementScore"], 0],
            0, 0.1,
            15, 1,
            3000, 3
          ],
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0, 3,
            14, 15
          ],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0, "rgba(59, 130, 246, 0)",
            0.1, "rgba(59, 130, 246, 0.2)",
            0.5, "rgba(234, 179, 8, 0.5)",
            1, "rgba(239, 68, 68, 0.8)"
          ],
          "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0, 50,
            9, 100,
            15, 250
          ],
          "heatmap-opacity": 1
        }
      });
    }

    // Invisible circles on top to allow clicking the clusters/points
    if (!map.getLayer("engagement-click-zone")) {
      map.addLayer({
        id: "engagement-click-zone",
        type: "circle",
        source: sourceId,
        layout: { visibility: isVisible },
        paint: {
          "circle-radius": 30,
          "circle-color": "transparent",
          "circle-opacity": 0
        }
      });

      // Events for clicking engagement zones
      const handleZoneClick = (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['engagement-click-zone'] });
        if (!features || !features.length) return;
        const props = features[0].properties;
        setSelectedEngagementData({
          name: props.point_count ? \`Zone of \${props.point_count} Events\` : (props.name || "Event"),
          likes: props.sumLikes || props.likes || 0,
          views: props.sumViews || props.views || 0,
          bookmarks: props.sumBookmarks || props.bookmarks || 0,
          score: props.sumScore || props.engagementScore || 0
        });
      };

      map.on('click', 'engagement-click-zone', handleZoneClick);
      map.on('mouseenter', 'engagement-click-zone', () => map.getCanvas().style.cursor = 'pointer');
      map.on('mouseleave', 'engagement-click-zone', () => map.getCanvas().style.cursor = '');
    }
  };
`;
  // IMPORTANT: Inject BEFORE renderStartupMarkers so it doesn't nest!
  injectAfter('// Render startups using a Mapbox symbol layer (professional marker)', renderEngStr);
}

// EXACT string replacement for toggleHeatmapVisibility
const oldToggle = `  const toggleHeatmapVisibility = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    setShowHeatmap((prev) => {
      const next = !prev;
      const layers = ["startups-heatmap", "startups-zone-gradients", "startups-zone-core", "startups-zone-count", "startups-unclustered-gradient", "startups-unclustered-core"];
      layers.forEach(layerId => {
        if (map.getLayer(layerId)) {
          try {
            map.setLayoutProperty(
              layerId,
              "visibility",
              next ? "visible" : "none"
            );
          } catch (e) {
            console.error(\`Error toggling \${layerId} visibility:\`, e);
          }
        }
      });
      return next;
    });
  };`;

const newToggle = `  const toggleHeatmapVisibility = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    setShowHeatmap((prev) => {
      const next = !prev;
      const layers = [
        "startups-heatmap", "startups-zone-gradients", "startups-zone-core", "startups-zone-count", 
        "startups-unclustered-gradient", "startups-unclustered-core",
        "engagement-heatmap-layer", "engagement-click-zone"
      ];
      layers.forEach(layerId => {
        if (map.getLayer(layerId)) {
          try {
            map.setLayoutProperty(layerId, "visibility", next ? "visible" : "none");
          } catch (e) {}
        }
      });
      return next;
    });
  };

  useEffect(() => {
    if (mapInstanceRef.current && engagementMarkers.length > 0) {
      const map = mapInstanceRef.current;
      if (map.isStyleLoaded()) {
        renderEngagementMarkers(map, engagementMarkers);
      } else {
        map.once('styledata', () => {
          if (map.isStyleLoaded()) renderEngagementMarkers(map, engagementMarkers);
        });
      }
    }
  }, [engagementMarkers, mapInstanceRef.current]);

  // Update Heatmap colors and visibility based on mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const trlLayers = ["startups-heatmap", "startups-zone-gradients", "startups-zone-core", "startups-zone-count", "startups-unclustered-gradient", "startups-unclustered-core"];
    const engagementLayers = ["engagement-heatmap-layer", "engagement-click-zone"];

    trlLayers.forEach(layer => {
      if (map.getLayer(layer)) {
        try { map.setLayoutProperty(layer, 'visibility', showHeatmap && heatmapMode === "TRL" ? 'visible' : 'none'); } catch (e) {}
      }
    });

    engagementLayers.forEach(layer => {
      if (map.getLayer(layer)) {
        try { map.setLayoutProperty(layer, 'visibility', showHeatmap && heatmapMode === "ENGAGEMENT" ? 'visible' : 'none'); } catch (e) {}
      }
    });
  }, [heatmapMode, showHeatmap]);`;

if (code.includes('const toggleHeatmapVisibility = () => {') && !code.includes('engagement-heatmap-layer", "engagement-click-zone"')) {
  replaceExact(oldToggle, newToggle);
}

// Add the calls to renderEngagementMarkers inside the style loaded map calls
if (code.includes('loadStakeholders(map);\\n      loadStartupMarkers(map);') && !code.includes('renderEngagementMarkers(map, engagementMarkers);')) {
  // Regex to safely inject
  code = code.replace(/loadStakeholders\(map\);\s*loadStartupMarkers\(map\);/, 'loadStakeholders(map);\n      loadStartupMarkers(map);\n      renderEngagementMarkers(map, engagementMarkers);');
  code = code.replace(/loadStartupMarkers\(map\);\s*\/\/ loadInvestorMarkers/, 'loadStartupMarkers(map);\n      renderEngagementMarkers(map, engagementMarkers);\n      // loadInvestorMarkers');
}

// Replace Heatmap Legend with regex
const legendRegex = /\{\/\* Heatmap Legend \*\/\}\s*<div[\s\S]*?Heatmap Legend<\/h3>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/m;
if (legendRegex.test(code) && !code.includes('Heatmap Mode')) {
  code = code.replace(legendRegex, `{/* Heatmap Legend */}
      <div
        className={\`absolute bottom-14 left-4 bg-white bg-opacity-95 backdrop-blur-md p-4 rounded-lg shadow-lg border border-gray-100 z-[10000] transition-transform duration-500 ease-in-out \${showHeatmap && showLegend ? "translate-x-0 opacity-100" : "-translate-x-[150%] opacity-0 pointer-events-none"
          }\`}
        style={{ width: "260px" }}
      >
        <h3 className="text-sm font-semibold text-gray-800 mb-3 border-b border-gray-100 pb-2">Heatmap Mode</h3>
        
        <div className="flex bg-gray-100 rounded-lg p-1 mb-4 pointer-events-auto cursor-pointer">
          <button
            onClick={(e) => { e.stopPropagation(); setHeatmapMode("TRL"); }}
            className={\`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors \${heatmapMode === "TRL" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}\`}
          >
            TRL Level
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setHeatmapMode("ENGAGEMENT"); }}
            className={\`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors \${heatmapMode === "ENGAGEMENT" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}\`}
          >
            Engagement
          </button>
        </div>

        <h3 className="text-sm font-semibold text-gray-800 mb-3 border-b border-gray-100 pb-2">Legend</h3>
        <div className="space-y-3 text-xs">
          {heatmapMode === "TRL" ? (
            <>
              <div className="flex items-start gap-2">
                <span className="w-3 h-3 mt-0.5 rounded-full bg-red-500 shadow-sm border border-red-200 shrink-0"></span>
                <div className="flex flex-col">
                  <span className="text-gray-800 font-bold">Red (High)</span>
                  <span className="text-gray-600">TRL 7-9: Market-ready / Deployed</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-3 h-3 mt-0.5 rounded-full bg-yellow-500 shadow-sm border border-yellow-200 shrink-0"></span>
                <div className="flex flex-col">
                  <span className="text-gray-800 font-bold">Yellow (Mid)</span>
                  <span className="text-gray-600">TRL 4-6: Prototype / Testing</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-3 h-3 mt-0.5 rounded-full bg-green-500 shadow-sm border border-green-200 shrink-0"></span>
                <div className="flex flex-col">
                  <span className="text-gray-800 font-bold">Green (Low)</span>
                  <span className="text-gray-600">TRL 1-3: Basic Research / Concept</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-2">
                <span className="w-3 h-3 mt-0.5 rounded-full bg-red-500 opacity-80 shadow-sm border border-red-200 shrink-0"></span>
                <div className="flex flex-col">
                  <span className="text-gray-800 font-bold">Red (High)</span>
                  <span className="text-gray-600">Score 15+: Extremely active engagement zone</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-3 h-3 mt-0.5 rounded-full bg-blue-500 opacity-30 shadow-sm border border-blue-200 shrink-0"></span>
                <div className="flex flex-col">
                  <span className="text-gray-800 font-bold">Blue (Low)</span>
                  <span className="text-gray-600">Score 0-14: Quiet or developing area</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {selectedEngagementData && (
        <EngagementChart 
          data={selectedEngagementData} 
          onClose={() => setSelectedEngagementData(null)} 
        />
      )}`);
}

fs.writeFileSync(file, code);
console.log("Success! Updated with TRUE WebGL Heatmap and blue zones.");
