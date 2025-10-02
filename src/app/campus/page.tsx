"use client";
import { Viewer, Entity, CameraFlyTo } from "resium";
import { Cartesian3, Color, Ion, createWorldTerrainAsync, CallbackProperty, ScreenSpaceEventType, Cartesian2 } from "cesium";
import { useEffect, useRef, useState } from "react";

Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2NWEyMmI4Ni04YzVmLTQ3MWQtYWEyZC0zNzQ2OWJhZDk0ZjMiLCJpZCI6MzQ2NDA1LCJpYXQiOjE3NTkzNDcxMjZ9.ApAnEtK-b2km71k37fRrSqezOXDhZb3tzNByzHN0Y9M";

type Pin = {
  name: string;
  type: string;
  position: [number, number];
};

const pins: Pin[] = [
  { name: "Library", type: "type1", position: [77.95999, 29.8915] },
  { name: "Cafeteria", type: "type2", position: [77.9605, 29.8905] },
  { name: "Lab", type: "type3", position: [77.9612, 29.891] },
  { name: "Admin Block", type: "type1", position: [77.959, 29.890] },
  { name: "Sports Ground", type: "type2", position: [77.960, 29.8905] },
  { name: "Hostel", type: "type3", position: [77.9615, 29.892] },
  { name: "Auditorium", type: "type1", position: [77.9585, 29.8905] },
];

const pinTypeMap: Record<string, string> = {
  type1: "/gaming.png",
  type2: "/online-game.png",
  type3: "/target.png",
};

const pinTypeInfo = {
  type1: { name: "Challenge Spot", color: "#ff6b6b", icon: "🎯", description: "Elite coding challenges" },
  type2: { name: "Block Problem", color: "#4ecdc4", icon: "🧩", description: "Algorithm puzzles" },
  type3: { name: "Daily Quest", color: "#ffe66d", icon: "⚡", description: "Quick problem solving" },
};

const INITIAL_POSITION = Cartesian3.fromDegrees(77.960148, 29.891012, 800);

export default function CampusMap() {
  const viewerRef = useRef<any>(null);
  const resetTimeout = useRef<any>(null);
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [stats, setStats] = useState({ explored: 0, total: pins.length });
  const [exploredPins, setExploredPins] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (viewerRef.current?.cesiumElement) {
      const viewer = viewerRef.current.cesiumElement;

      // Terrain
      createWorldTerrainAsync().then((terrainProvider) => {
        viewer.terrainProvider = terrainProvider;
      });
      viewer.scene.globe.enableLighting = true;

      // Restrict zoom
      viewer.scene.screenSpaceCameraController.minimumZoomDistance = 800;
      viewer.scene.screenSpaceCameraController.maximumZoomDistance = 2000;

      // 📌 Detect user interaction (pan/zoom)
      const resetCamera = () => {
        if (resetTimeout.current) clearTimeout(resetTimeout.current);
        resetTimeout.current = setTimeout(() => {
          viewer.camera.flyTo({
            destination: INITIAL_POSITION,
            duration: 2.5,
          });
        }, 3000);
      };

      viewer.screenSpaceEventHandler.setInputAction(resetCamera, ScreenSpaceEventType.LEFT_DOWN);
      viewer.screenSpaceEventHandler.setInputAction(resetCamera, ScreenSpaceEventType.WHEEL);
      viewer.screenSpaceEventHandler.setInputAction(resetCamera, ScreenSpaceEventType.PINCH_START);

      // 🎮 Hover detection
      viewer.screenSpaceEventHandler.setInputAction((movement: any) => {
        const pickedObject = viewer.scene.pick(movement.endPosition);
        if (pickedObject && pickedObject.id && pickedObject.id._id) {
          const pinId = pickedObject.id._id;
          if (pinId.startsWith('pin-')) {
            setHoveredPin(pinId);
            document.body.style.cursor = 'pointer';
          }
        } else {
          setHoveredPin(null);
          document.body.style.cursor = 'default';
        }
      }, ScreenSpaceEventType.MOUSE_MOVE);

      // 🎯 Click detection
      viewer.screenSpaceEventHandler.setInputAction((movement: any) => {
        const pickedObject = viewer.scene.pick(movement.position);
        if (pickedObject && pickedObject.id && pickedObject.id._id) {
          const pinId = pickedObject.id._id;
          if (pinId.startsWith('pin-')) {
            const pinIndex = parseInt(pinId.split('-')[1]);
            setSelectedPin(pins[pinIndex]);
            
            // Update explored count only if not explored before
            if (!exploredPins.has(pinIndex)) {
              setExploredPins(prev => new Set(prev).add(pinIndex));
              setStats(prev => ({ ...prev, explored: prev.explored + 1 }));
            }
          }
        }
      }, ScreenSpaceEventType.LEFT_CLICK);
    }

    return () => {
      document.body.style.cursor = 'default';
    };
  }, [exploredPins]);

  // ⬇️ Create a bouncing scale property with hover effect
  const makeBounce = (pinId: string) =>
    new CallbackProperty(() => {
      const t = Date.now() / 300;
      const baseScale = 1 + 0.2 * Math.sin(t);
      const isHovered = hoveredPin === pinId;
      return isHovered ? baseScale * 1.5 : baseScale;
    }, false);

  return (
    <div style={{ 
      width: "100%", 
      height: "100vh",
      position: "relative",
      background: "linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)"
    }}>
      {/* 🎮 Gaming HUD Overlay */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: "20px",
        background: "linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)",
        pointerEvents: "none"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: "28px",
            fontWeight: "bold",
            color: "#00ff9d",
            textShadow: "0 0 10px rgba(0,255,157,0.5), 0 0 20px rgba(0,255,157,0.3)",
            letterSpacing: "3px"
          }}>
            ⚔️ BATTLE ARENA
          </div>
          <div style={{
            display: "flex",
            gap: "15px",
            alignItems: "center"
          }}>
            <div style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "16px",
              color: "#00d4ff",
              textShadow: "0 0 5px rgba(0,212,255,0.5)",
              padding: "10px 20px",
              border: "2px solid rgba(0,212,255,0.4)",
              borderRadius: "8px",
              background: "rgba(0,0,0,0.5)",
              fontWeight: "bold"
            }}>
              📍 {stats.explored}/{stats.total} EXPLORED
            </div>
            <div style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "14px",
              color: "#ffe66d",
              textShadow: "0 0 5px rgba(255,230,109,0.5)",
              padding: "8px 16px",
              border: "1px solid rgba(255,230,109,0.3)",
              borderRadius: "4px",
              background: "rgba(0,0,0,0.3)"
            }}>
              🎯 CLICK TO EXPLORE
            </div>
          </div>
        </div>
      </div>

      {/* Legend - Top Left */}
      <div style={{
        position: "absolute",
        top: "90px",
        left: "20px",
        zIndex: 1000,
        pointerEvents: "none"
      }}>
        <div style={{
          background: "rgba(0,0,0,0.85)",
          border: "2px solid rgba(0,255,157,0.3)",
          borderRadius: "12px",
          padding: "20px",
          backdropFilter: "blur(10px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,255,157,0.1)"
        }}>
          <div style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: "14px",
            fontWeight: "bold",
            color: "#00ff9d",
            marginBottom: "15px",
            letterSpacing: "2px",
            textTransform: "uppercase",
            borderBottom: "2px solid rgba(0,255,157,0.3)",
            paddingBottom: "10px"
          }}>
            🗺️ Mission Types
          </div>
          {Object.entries(pinTypeInfo).map(([key, info]) => (
            <div key={key} style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "12px",
              padding: "8px",
              borderRadius: "6px",
              background: "rgba(255,255,255,0.03)",
              transition: "all 0.3s"
            }}>
              <div style={{
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                filter: `drop-shadow(0 0 8px ${info.color})`,
              }}>
                <img 
                  src={pinTypeMap[key]} 
                  alt={info.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain"
                  }}
                />
              </div>
              <div>
                <div style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: info.color,
                  textShadow: `0 0 10px ${info.color}`,
                  marginBottom: "2px"
                }}>
                  {info.name}
                </div>
                <div style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.6)"
                }}>
                  {info.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mini Stats Panel - Bottom Left */}
      <div style={{
        position: "absolute",
        bottom: "20px",
        left: "20px",
        zIndex: 1000,
        pointerEvents: "none"
      }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(26,31,58,0.9) 100%)",
          border: "2px solid rgba(0,212,255,0.3)",
          borderRadius: "12px",
          padding: "15px 20px",
          backdropFilter: "blur(10px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)"
        }}>
          <div style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: "12px",
            color: "#00d4ff",
            textShadow: "0 0 10px rgba(0,212,255,0.5)",
            marginBottom: "8px"
          }}>
            ⚡ ARENA STATUS
          </div>
          <div style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "11px",
            color: "rgba(255,255,255,0.7)",
            lineHeight: "1.6"
          }}>
            🎮 Interactive: <span style={{ color: "#00ff9d", fontWeight: "bold" }}>ACTIVE</span><br/>
            🌍 Terrain: <span style={{ color: "#00ff9d", fontWeight: "bold" }}>LOADED</span><br/>
            📡 Sync: <span style={{ color: "#00ff9d", fontWeight: "bold" }}>ONLINE</span>
          </div>
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredPin && (
        <div style={{
          position: "absolute",
          bottom: "40px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          pointerEvents: "none",
          padding: "15px 30px",
          background: "linear-gradient(135deg, rgba(0,255,157,0.95) 0%, rgba(0,212,255,0.95) 100%)",
          border: "2px solid rgba(255,255,255,0.4)",
          borderRadius: "12px",
          fontFamily: "'Orbitron', monospace",
          fontSize: "18px",
          fontWeight: "bold",
          color: "#0a0e27",
          textTransform: "uppercase",
          letterSpacing: "2px",
          boxShadow: "0 0 30px rgba(0,255,157,0.8), 0 0 60px rgba(0,212,255,0.6)",
          animation: "pulse 1.5s infinite"
        }}>
          🎯 {pins[parseInt(hoveredPin.split('-')[1])].name}
        </div>
      )}

      {/* Selected Pin Modal */}
      {selectedPin && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 2000,
          pointerEvents: "auto",
          width: "400px",
          maxWidth: "90vw"
        }}>
          <div style={{
            background: "linear-gradient(135deg, rgba(10,14,39,0.98) 0%, rgba(26,31,58,0.98) 100%)",
            border: "3px solid",
            borderImage: "linear-gradient(135deg, #00ff9d, #00d4ff) 1",
            borderRadius: "16px",
            padding: "30px",
            backdropFilter: "blur(20px)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.8), inset 0 0 40px rgba(0,255,157,0.1)",
            animation: "slideIn 0.3s ease-out"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px"
            }}>
              <div style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: "24px",
                fontWeight: "bold",
                color: "#00ff9d",
                textShadow: "0 0 20px rgba(0,255,157,0.6)"
              }}>
                {pinTypeInfo[selectedPin.type as keyof typeof pinTypeInfo].icon} {selectedPin.name}
              </div>
              <button
                onClick={() => setSelectedPin(null)}
                style={{
                  background: "rgba(255,0,0,0.2)",
                  border: "2px solid rgba(255,0,0,0.5)",
                  borderRadius: "8px",
                  color: "#ff6b6b",
                  fontSize: "20px",
                  width: "36px",
                  height: "36px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  transition: "all 0.3s",
                  pointerEvents: "auto"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,0,0,0.4)";
                  e.currentTarget.style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,0,0,0.2)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                ✕
              </button>
            </div>

            <div style={{
              background: `linear-gradient(135deg, ${pinTypeInfo[selectedPin.type as keyof typeof pinTypeInfo].color}20, ${pinTypeInfo[selectedPin.type as keyof typeof pinTypeInfo].color}10)`,
              border: `2px solid ${pinTypeInfo[selectedPin.type as keyof typeof pinTypeInfo].color}40`,
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "20px"
            }}>
              <div style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "14px",
                color: pinTypeInfo[selectedPin.type as keyof typeof pinTypeInfo].color,
                fontWeight: "bold",
                marginBottom: "10px",
                textTransform: "uppercase",
                letterSpacing: "1px"
              }}>
                Mission Type: {pinTypeInfo[selectedPin.type as keyof typeof pinTypeInfo].name}
              </div>
              <div style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "16px",
                color: "rgba(255,255,255,0.9)",
                lineHeight: "1.6"
              }}>
                {pinTypeInfo[selectedPin.type as keyof typeof pinTypeInfo].description}
              </div>
            </div>

            <button
              onClick={() => setSelectedPin(null)}
              style={{
                width: "100%",
                padding: "15px",
                background: "linear-gradient(135deg, #00ff9d, #00d4ff)",
                border: "none",
                borderRadius: "10px",
                fontFamily: "'Orbitron', monospace",
                fontSize: "16px",
                fontWeight: "bold",
                color: "#0a0e27",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "2px",
                transition: "all 0.3s",
                boxShadow: "0 5px 25px rgba(0,255,157,0.4)",
                pointerEvents: "auto"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 35px rgba(0,255,157,0.6)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 5px 25px rgba(0,255,157,0.4)";
              }}
            >
              ⚔️ START MISSION
            </button>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;600;700&display=swap');
        
        @keyframes pulse {
          0%, 100% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.05); }
        }
        
        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }
          to { 
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        
        .cesium-widget-credits {
          display: none !important;
        }
      `}</style>

      <Viewer
        full
        ref={viewerRef}
        skyBox={false}
        baseLayerPicker={false}
        timeline={false}
        animation={false}
        navigationHelpButton={false}
        geocoder={false}
        homeButton={false}
        sceneModePicker={false}
        fullscreenButton={false}
        infoBox={false}
        selectionIndicator={false}
        scene3DOnly={true}
      >
        {/* Initial camera */}
        <CameraFlyTo destination={INITIAL_POSITION} />

        {/* Campus border with gaming glow */}
        <Entity
          name="Campus Area"
          polygon={{
            hierarchy: [
              Cartesian3.fromDegrees(77.95775, 29.8911),
              Cartesian3.fromDegrees(77.9591, 29.8891),
              Cartesian3.fromDegrees(77.961, 29.8897),
              Cartesian3.fromDegrees(77.9622, 29.8914),
              Cartesian3.fromDegrees(77.9619, 29.8927),
              Cartesian3.fromDegrees(77.9599, 29.8928),
            ],
            material: Color.fromCssColorString('rgba(0, 255, 157, 0.05)'),
            outline: true,
            outlineColor: Color.fromCssColorString('#00ff9d'),
            outlineWidth: 4,
          }}
          description={"🎮 Campus Battle Arena"}
        />

        {/* Pins with bouncing scale and hover */}
        {pins.map((pin, idx) => (
          <Entity
            id={`pin-${idx}`}
            key={idx}
            name={pin.name}
            position={Cartesian3.fromDegrees(...pin.position)}
            billboard={{
              image: pinTypeMap[pin.type],
              width: 42,
              height: 42,
              verticalOrigin: 1,
              scale: makeBounce(`pin-${idx}`),
              pixelOffset: new Cartesian2(0, -20),
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            }}
            description={`🎯 ${pin.name} | Type: ${pin.type}`}
          />
        ))}
      </Viewer>
    </div>
  );
}