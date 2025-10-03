"use client";
import { Viewer, Entity, CameraFlyTo } from "resium";
import { Cartesian3, Color, Ion, createWorldTerrainAsync, CallbackProperty, ScreenSpaceEventType, Cartesian2 } from "cesium";
import { useEffect, useRef, useState } from "react";
import { GoogleGenerativeAI } from '@google/generative-ai';

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

// Real-life campus problems for each building
const campusProblems = {
  "Library": {
    type: "Daily Quest",
    title: "📚 Digital Library Management Crisis",
    description: "The library's digital catalog system has crashed during exam season! Students can't find books, reserve study rooms, or access online resources. The librarian needs help implementing a robust search algorithm and database optimization to handle the high traffic.",
    problem: "Design and implement a fast search system for the library database that can handle 1000+ concurrent users searching for books, journals, and study materials.",
    solution: "Create a search algorithm with indexing, implement caching mechanisms, and design a user-friendly interface for book reservations.",
    difficulty: "Medium",
    reward: "🏆 Library VIP Access + 50 Points"
  },
  "Cafeteria": {
    type: "Block Problem", 
    title: "🍽️ Smart Queue Management System",
    description: "Long queues during lunch hours are causing chaos! Students are missing classes waiting for food. The cafeteria needs an intelligent queue management system to optimize food service and reduce waiting times.",
    problem: "Develop a queue optimization algorithm that predicts peak hours, manages food inventory, and provides real-time wait time estimates to students.",
    solution: "Implement dynamic queue management, food demand prediction using historical data, and a mobile app for pre-ordering.",
    difficulty: "Hard",
    reward: "🍕 Free Meal Vouchers + 75 Points"
  },
  "Lab": {
    type: "Challenge Spot",
    title: "🔬 Equipment Maintenance Alert System", 
    description: "Critical lab equipment keeps breaking down unexpectedly, disrupting experiments and research projects. Students need a predictive maintenance system to prevent equipment failures.",
    problem: "Create an IoT-based monitoring system that tracks equipment health, predicts failures, and schedules maintenance automatically.",
    solution: "Design sensor integration, implement machine learning for failure prediction, and create a dashboard for lab technicians.",
    difficulty: "Expert",
    reward: "⚗️ Lab Equipment Priority Access + 100 Points"
  },
  "Admin Block": {
    type: "Daily Quest",
    title: "📋 Student Services Automation",
    description: "The admin office is overwhelmed with student requests for certificates, transcripts, and approvals. Manual processing is slow and error-prone, causing delays in student applications.",
    problem: "Automate the student services workflow to handle certificate requests, transcript generation, and approval processes efficiently.",
    solution: "Build a digital workflow system with automated document generation, approval routing, and student notification system.",
    difficulty: "Medium", 
    reward: "📜 Fast-Track Certificate Processing + 60 Points"
  },
  "Sports Ground": {
    type: "Block Problem",
    title: "⚽ Smart Sports Facility Booking",
    description: "Sports ground bookings are chaotic with double-bookings and no-show issues. Students can't plan their training sessions effectively, and equipment is often missing or damaged.",
    problem: "Design a comprehensive booking and equipment management system for the sports facilities with real-time availability and equipment tracking.",
    solution: "Create a booking platform with calendar integration, equipment RFID tracking, and automated penalty system for no-shows.",
    difficulty: "Hard",
    reward: "🏅 Sports Equipment Priority Booking + 80 Points"
  },
  "Hostel": {
    type: "Challenge Spot", 
    title: "🏠 Smart Hostel Management System",
    description: "Hostel residents face issues with maintenance requests, visitor management, and resource allocation. The hostel warden needs a comprehensive system to manage 500+ students efficiently.",
    problem: "Develop an integrated hostel management system covering maintenance requests, visitor tracking, room allocation, and resource monitoring.",
    solution: "Build a multi-module system with mobile app integration, automated maintenance scheduling, and visitor management with QR codes.",
    difficulty: "Expert",
    reward: "🏠 Hostel Room Upgrade Priority + 120 Points"
  },
  "Auditorium": {
    type: "Daily Quest",
    title: "🎭 Event Management & AV System",
    description: "The auditorium's audio-visual system is outdated and unreliable. Events are frequently disrupted by technical issues, and event scheduling conflicts cause chaos.",
    problem: "Modernize the auditorium's AV system and create an intelligent event management platform to prevent scheduling conflicts and technical issues.",
    solution: "Implement smart AV controls, automated event scheduling with conflict detection, and real-time technical monitoring system.",
    difficulty: "Medium",
    reward: "🎪 Event Hosting Priority + 70 Points"
  }
};

const INITIAL_POSITION = Cartesian3.fromDegrees(77.960148, 29.891012, 800);

// Dummy users for leaderboard
const dummyUsers = [
  { id: 1, name: "Arjun Sharma", avatar: "👨‍💻", problemsSolved: 12, currentStreak: 5, level: "Expert", points: 2450, badge: "🏆" },
  { id: 2, name: "Priya Singh", avatar: "👩‍💻", problemsSolved: 10, currentStreak: 3, level: "Advanced", points: 2100, badge: "⚡" },
  { id: 3, name: "Rajesh Kumar", avatar: "👨‍🔬", problemsSolved: 8, currentStreak: 7, level: "Expert", points: 1950, badge: "🔬" },
  { id: 4, name: "Kavya Reddy", avatar: "👩‍🔬", problemsSolved: 9, currentStreak: 2, level: "Advanced", points: 1800, badge: "📊" },
  { id: 5, name: "Vikram Gupta", avatar: "👨‍💼", problemsSolved: 7, currentStreak: 4, level: "Intermediate", points: 1650, badge: "💻" },
  { id: 6, name: "Ananya Joshi", avatar: "👩‍🎓", problemsSolved: 6, currentStreak: 1, level: "Intermediate", points: 1400, badge: "🎯" },
  { id: 7, name: "Rohit Agarwal", avatar: "👨‍🎨", problemsSolved: 5, currentStreak: 6, level: "Intermediate", points: 1200, badge: "🐛" },
  { id: 8, name: "Sneha Patel", avatar: "👩‍🚀", problemsSolved: 4, currentStreak: 2, level: "Beginner", points: 950, badge: "🧩" },
];

// Problem solving statistics
const problemStats = {
  "Library": { solved: 23, solving: 5, attempts: 45, difficulty: "Medium" },
  "Cafeteria": { solved: 18, solving: 8, attempts: 38, difficulty: "Hard" },
  "Lab": { solved: 12, solving: 3, attempts: 25, difficulty: "Expert" },
  "Admin Block": { solved: 31, solving: 7, attempts: 52, difficulty: "Medium" },
  "Sports Ground": { solved: 15, solving: 4, attempts: 28, difficulty: "Hard" },
  "Hostel": { solved: 8, solving: 2, attempts: 18, difficulty: "Expert" },
  "Auditorium": { solved: 26, solving: 6, attempts: 41, difficulty: "Medium" },
};

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI('AIzaSyAu1g-P4Qmp6x_xsygOOBYMQvYdfLTSHX0');

export default function CampusMap() {
  const viewerRef = useRef<any>(null);
  const resetTimeout = useRef<any>(null);
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [stats, setStats] = useState({ explored: 0, total: pins.length });
  const [exploredPins, setExploredPins] = useState<Set<number>>(new Set());
  const [entityIdSuffix] = useState(() => Math.random().toString(36).substr(2, 9));
  const [leaderboardVisible, setLeaderboardVisible] = useState(true);
  const [currentUser] = useState({ name: "You", avatar: "🎮", problemsSolved: 0, points: 0, level: "Rookie" });
  
  // AI Bot states
  const [botVisible, setBotVisible] = useState(false);
  const [botMessage, setBotMessage] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [botMood, setBotMood] = useState<"happy" | "thinking" | "excited" | "helpful">("happy");
  const [botLevel, setBotLevel] = useState(1);
  const [botXP, setBotXP] = useState(0);

  // Test function to manually trigger modal
  const testModal = () => {
    console.log('Test modal triggered');
    console.log('Setting selected pin to:', pins[0]);
    setSelectedPin(pins[0]); // Set first pin as selected
    console.log('Selected pin state should now be:', pins[0].name);
  };

  // Debug function to list all entities
  const debugEntities = () => {
    if (viewerRef.current?.cesiumElement) {
      const viewer = viewerRef.current.cesiumElement;
      console.log('All entities:', viewer.entities.values);
      console.log('Entity count:', viewer.entities.values.length);
      viewer.entities.values.forEach((entity: any, index: number) => {
        console.log(`Entity ${index}:`, entity.id, entity.name);
      });
    }
  };

  // Test function to create a simple clickable entity
  const createTestEntity = () => {
    if (viewerRef.current?.cesiumElement) {
      const viewer = viewerRef.current.cesiumElement;
      const testEntity = viewer.entities.add({
        id: 'test-entity-' + Date.now(),
        name: 'Test Entity',
        position: Cartesian3.fromDegrees(77.96, 29.891, 0),
        billboard: {
          image: '/target.png',
          width: 50,
          height: 50,
          verticalOrigin: 1,
        }
      });
      console.log('Created test entity:', testEntity);
    }
  };

  // AI Bot Functions
  const sendMessageToBot = async () => {
    if (!userMessage.trim()) return;
    
    setIsTyping(true);
    setBotMood("thinking");
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `You are CodeBot, a gamified AI assistant for students learning programming and building projects. You're enthusiastic, helpful, and use gaming terminology. 

User's question: "${userMessage}"

Respond as CodeBot with:
- Gaming language and excitement
- Practical coding advice
- Encouragement and motivation
- Keep it concise (2-3 sentences max)
- Use emojis appropriately
- Be supportive and helpful

Current context: Student is working on campus projects and coding challenges.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Simulate typing effect
      setBotMessage("");
      for (let i = 0; i < text.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 30));
        setBotMessage(text.slice(0, i + 1));
      }
      
      setBotMood("happy");
      setBotXP(prev => prev + 10);
      
      // Level up logic
      if (botXP >= botLevel * 100) {
        setBotLevel(prev => prev + 1);
        setBotMood("excited");
        setTimeout(() => setBotMood("happy"), 3000);
      }
      
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      setBotMessage("🚨 Oops! I'm having connection issues! Try again in a moment! ⚡");
      setBotMood("helpful");
    }
    
    setIsTyping(false);
    setUserMessage("");
  };

  const getBotAvatar = () => {
    switch (botMood) {
      case "happy": return "🤖";
      case "thinking": return "🤔";
      case "excited": return "🚀";
      case "helpful": return "💡";
      default: return "🤖";
    }
  };

  const getBotGreeting = () => {
    const greetings = [
      "Hey there, coding warrior! 🗡️ Ready to build something amazing?",
      "Welcome to the arena, developer! ⚔️ What project shall we conquer today?",
      "Greetings, future tech legend! 🌟 Let's code some magic together!",
      "Hello, digital architect! 🏗️ Time to create something incredible!",
      "Salutations, code ninja! 🥷 Ready for your next mission?"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  useEffect(() => {
    if (viewerRef.current?.cesiumElement) {
      const viewer = viewerRef.current.cesiumElement;

      // Clear existing entities to prevent duplicates
      viewer.entities.removeAll();

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

      viewer.screenSpaceEventHandler.setInputAction(resetCamera, ScreenSpaceEventType.WHEEL);
      viewer.screenSpaceEventHandler.setInputAction(resetCamera, ScreenSpaceEventType.PINCH_START);

      // 🎮 Hover detection
      viewer.screenSpaceEventHandler.setInputAction((movement: any) => {
        const pickedObject = viewer.scene.pick(movement.endPosition);
        if (pickedObject && pickedObject.id) {
          const pinId = pickedObject.id._id || pickedObject.id.id;
          if (pinId && pinId.startsWith('pin-')) {
            setHoveredPin(pinId);
            document.body.style.cursor = 'pointer';
          }
        } else {
          setHoveredPin(null);
          document.body.style.cursor = 'default';
        }
      }, ScreenSpaceEventType.MOUSE_MOVE);

      // 🎯 Click detection - Enhanced debugging
      viewer.screenSpaceEventHandler.setInputAction((movement: any) => {
        console.log('=== CLICK EVENT TRIGGERED ===');
        console.log('Click position:', movement.position);
        console.log('Viewer exists:', !!viewer);
        console.log('Scene exists:', !!viewer.scene);
        
        // Try multiple picking methods
        const pickedObject = viewer.scene.pick(movement.position);
        console.log('Picked object:', pickedObject);
        
        if (pickedObject && pickedObject.id) {
          console.log('Picked object ID:', pickedObject.id._id || pickedObject.id.id);
          const pinId = pickedObject.id._id || pickedObject.id.id;
          if (pinId && pinId.startsWith('pin-')) {
            console.log('✅ Pin clicked:', pinId);
            // Extract pin index from ID like "pin-0-abc123"
            const pinIndex = parseInt(pinId.split('-')[1]);
            console.log('Setting selected pin:', pins[pinIndex]);
            setSelectedPin(pins[pinIndex]);
            
            // Update explored count only if not explored before
            if (!exploredPins.has(pinIndex)) {
              setExploredPins(prev => new Set(prev).add(pinIndex));
              setStats(prev => ({ ...prev, explored: prev.explored + 1 }));
            }
            
            // Prevent camera reset when clicking on pins
            return;
          }
        }
        
        // Try alternative picking method
        const pickedObjects = viewer.scene.drillPick(movement.position);
        console.log('Drill picked objects:', pickedObjects);
        
        for (const obj of pickedObjects) {
          if (obj.id) {
            const pinId = obj.id._id || obj.id.id;
            if (pinId && pinId.startsWith('pin-')) {
              console.log('✅ Pin clicked via drill pick:', pinId);
              const pinIndex = parseInt(pinId.split('-')[1]);
              setSelectedPin(pins[pinIndex]);
              
              if (!exploredPins.has(pinIndex)) {
                setExploredPins(prev => new Set(prev).add(pinIndex));
                setStats(prev => ({ ...prev, explored: prev.explored + 1 }));
              }
              return;
            }
          }
        }
     
        console.log('❌ No pin detected, resetting camera');
        // Only reset camera if not clicking on a pin
        resetCamera();
      }, ScreenSpaceEventType.LEFT_CLICK);

      // Add a simple click listener to the canvas as backup
      const canvas = viewer.canvas;
      if (canvas) {
        const handleCanvasClick = (event: MouseEvent) => {
          console.log('=== CANVAS CLICK EVENT ===');
          console.log('Canvas click at:', event.clientX, event.clientY);
          
          // Convert screen coordinates to Cesium coordinates
          const rect = canvas.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          
          const pickedObject = viewer.scene.pick(new Cartesian2(x, y));
          console.log('Canvas picked object:', pickedObject);
          
          if (pickedObject && pickedObject.id) {
            const pinId = pickedObject.id._id || pickedObject.id.id;
            if (pinId && pinId.startsWith('pin-')) {
              console.log('✅ Canvas click detected pin:', pinId);
              const pinIndex = parseInt(pinId.split('-')[1]);
              setSelectedPin(pins[pinIndex]);
              
              if (!exploredPins.has(pinIndex)) {
                setExploredPins(prev => new Set(prev).add(pinIndex));
                setStats(prev => ({ ...prev, explored: prev.explored + 1 }));
              }
            }
          }
        };
        
        canvas.addEventListener('click', handleCanvasClick);
        
        // Cleanup function
        return () => {
          canvas.removeEventListener('click', handleCanvasClick);
          document.body.style.cursor = 'default';
          if (viewerRef.current?.cesiumElement) {
            viewerRef.current.cesiumElement.entities.removeAll();
          }
        };
      }
    }

    return () => {
      document.body.style.cursor = 'default';
      // Clean up entities when component unmounts
      if (viewerRef.current?.cesiumElement) {
        viewerRef.current.cesiumElement.entities.removeAll();
      }
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
        zIndex: 2000,
        padding: "20px",
        background: "linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)",
        pointerEvents: "auto"
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
            <button
              onClick={() => {
                console.log('Leaderboard button clicked!');
                setLeaderboardVisible(!leaderboardVisible);
              }}
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "12px",
                color: "#00ff9d",
                padding: "6px 12px",
                border: "1px solid rgba(0,255,157,0.3)",
                borderRadius: "4px",
                background: "rgba(0,0,0,0.3)",
                cursor: "pointer",
                marginLeft: "10px",
                pointerEvents: "auto"
              }}
            >
              {leaderboardVisible ? "📊 HIDE BOARD" : "🏆 SHOW BOARD"}
            </button>
            <button
              onClick={() => {
                console.log('Bot button clicked!');
                setBotVisible(!botVisible);
              }}
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "12px",
                color: "#ff6b6b",
                padding: "6px 12px",
                border: "1px solid rgba(255,107,107,0.3)",
                borderRadius: "4px",
                background: "rgba(0,0,0,0.3)",
                cursor: "pointer",
                marginLeft: "10px",
                pointerEvents: "auto"
              }}
            >
              {botVisible ? "🤖 HIDE BOT" : "🚀 SUMMON BOT"}
            </button>
            <button
              onClick={() => {
                console.log('Test modal button clicked!');
                testModal();
              }}
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "12px",
                color: "#ff6b6b",
                padding: "6px 12px",
                border: "1px solid rgba(255,107,107,0.3)",
                borderRadius: "4px",
                background: "rgba(0,0,0,0.3)",
                cursor: "pointer",
                marginLeft: "10px",
                pointerEvents: "auto"
              }}
            >
              🧪 TEST MODAL
            </button>
            <div style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "10px",
              color: "#00ff9d",
              marginLeft: "10px",
              padding: "4px 8px",
              border: "1px solid rgba(0,255,157,0.3)",
              borderRadius: "4px",
              background: "rgba(0,0,0,0.3)"
            }}>
              Selected: {selectedPin ? selectedPin.name : "None"}
            </div>
            <button
              onClick={() => {
                console.log('Debug button clicked!');
                debugEntities();
              }}
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "10px",
                color: "#4ecdc4",
                padding: "4px 8px",
                border: "1px solid rgba(78,205,196,0.3)",
                borderRadius: "4px",
                background: "rgba(0,0,0,0.3)",
                cursor: "pointer",
                marginLeft: "10px",
                pointerEvents: "auto"
              }}
            >
              🔍 DEBUG
            </button>
            <button
              onClick={() => {
                console.log('Test entity button clicked!');
                createTestEntity();
              }}
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "10px",
                color: "#ff6b6b",
                padding: "4px 8px",
                border: "1px solid rgba(255,107,107,0.3)",
                borderRadius: "4px",
                background: "rgba(0,0,0,0.3)",
                cursor: "pointer",
                marginLeft: "10px",
                pointerEvents: "auto"
              }}
            >
              ➕ TEST ENTITY
            </button>
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

      {/* Real-time Leaderboard - Bottom Right */}
      {leaderboardVisible && (
        <div style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          zIndex: 2000,
          pointerEvents: "auto",
          width: "320px",
          maxHeight: "400px",
          overflowY: "auto"
        }}>
          <div style={{
            background: "linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(26,31,58,0.95) 100%)",
            border: "3px solid",
            borderImage: "linear-gradient(135deg, #00ff9d, #00d4ff) 1",
            borderRadius: "16px",
            padding: "20px",
            backdropFilter: "blur(15px)",
            boxShadow: "0 15px 50px rgba(0,0,0,0.8), inset 0 0 30px rgba(0,255,157,0.1)",
            animation: "leaderboardSlideIn 0.5s ease-out, glow 3s infinite"
          }}>
            {/* Leaderboard Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "15px"
            }}>
              <div style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: "16px",
                fontWeight: "bold",
                color: "#00ff9d",
                textShadow: "0 0 15px rgba(0,255,157,0.6)",
                letterSpacing: "2px"
              }}>
                🏆 LEADERBOARD
              </div>
              <button
                onClick={() => setLeaderboardVisible(false)}
                style={{
                  background: "rgba(255,0,0,0.2)",
                  border: "1px solid rgba(255,0,0,0.4)",
                  borderRadius: "6px",
                  color: "#ff6b6b",
                  fontSize: "14px",
                  width: "24px",
                  height: "24px",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                ✕
              </button>
            </div>

            {/* Current User */}
            <div style={{
              background: "linear-gradient(135deg, rgba(0,255,157,0.2), rgba(0,212,255,0.2))",
              border: "2px solid rgba(0,255,157,0.4)",
              borderRadius: "10px",
              padding: "12px",
              marginBottom: "15px"
            }}>
              <div style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "14px",
                fontWeight: "bold",
                color: "#00ff9d",
                textAlign: "center"
              }}>
                {currentUser.avatar} {currentUser.name} - {currentUser.level}
              </div>
              <div style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "12px",
                color: "rgba(255,255,255,0.8)",
                textAlign: "center",
                marginTop: "4px"
              }}>
                {currentUser.problemsSolved} Problems • {currentUser.points} Points
              </div>
            </div>

            {/* Top Players */}
            <div style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "12px",
              color: "#ffe66d",
              fontWeight: "bold",
              marginBottom: "10px",
              textTransform: "uppercase",
              letterSpacing: "1px"
            }}>
              🎯 TOP PLAYERS
            </div>

            {dummyUsers.slice(0, 5).map((user, index) => (
              <div key={user.id} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                marginBottom: "8px",
                background: index < 3 ? 
                  `linear-gradient(135deg, ${index === 0 ? 'rgba(255,215,0,0.2)' : index === 1 ? 'rgba(192,192,192,0.2)' : 'rgba(205,127,50,0.2)'}, transparent)` :
                  "rgba(255,255,255,0.05)",
                border: index < 3 ? 
                  `2px solid ${index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : '#cd7f32'}` :
                  "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                transition: "all 0.3s"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    color: index < 3 ? 
                      (index === 0 ? "#ffd700" : index === 1 ? "#c0c0c0" : "#cd7f32") :
                      "rgba(255,255,255,0.6)"
                  }}>
                    {index + 1}
                  </div>
                  <div style={{ fontSize: "18px" }}>{user.avatar}</div>
                  <div>
                    <div style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: "13px",
                      fontWeight: "bold",
                      color: "rgba(255,255,255,0.9)"
                    }}>
                      {user.name}
                    </div>
                    <div style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: "10px",
                      color: "rgba(255,255,255,0.6)"
                    }}>
                      {user.level} • {user.currentStreak}🔥 streak
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "#00ff9d"
                  }}>
                    {user.points}
                  </div>
                  <div style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "10px",
                    color: "rgba(255,255,255,0.6)"
                  }}>
                    {user.problemsSolved} solved
                  </div>
                </div>
              </div>
            ))}

            {/* Live Activity */}
            <div style={{
              marginTop: "15px",
              padding: "10px",
              background: "rgba(0,212,255,0.1)",
              border: "1px solid rgba(0,212,255,0.3)",
              borderRadius: "8px",
              animation: "liveActivity 2s infinite"
            }}>
              <div style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "11px",
                color: "#00d4ff",
                fontWeight: "bold",
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "1px"
              }}>
                🔴 LIVE ACTIVITY
              </div>
              <div style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "10px",
                color: "rgba(255,255,255,0.8)",
                lineHeight: "1.4"
              }}>
                • Priya Singh solving Cafeteria Queue<br/>
                • Rajesh Kumar completed Lab Equipment<br/>
                • Kavya Reddy attempting Library Search<br/>
                • Vikram Gupta joined the arena
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI CodeBot - Top Right */}
      {botVisible && (
        <div style={{
          position: "absolute",
          top: "90px",
          right: "20px",
          zIndex: 2000,
          pointerEvents: "auto",
          width: "380px",
          maxHeight: "500px"
        }}>
          <div style={{
            background: "linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(26,31,58,0.95) 100%)",
            border: "3px solid",
            borderImage: "linear-gradient(135deg, #ff6b6b, #4ecdc4) 1",
            borderRadius: "16px",
            padding: "20px",
            backdropFilter: "blur(15px)",
            boxShadow: "0 15px 50px rgba(0,0,0,0.8), inset 0 0 30px rgba(255,107,107,0.1)",
            animation: "leaderboardSlideIn 0.5s ease-out, glow 3s infinite"
          }}>
            {/* Bot Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "15px"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}>
                <div style={{
                  fontSize: "32px",
                  animation: botMood === "thinking" ? "bounce 1s infinite" : "none"
                }}>
                  {getBotAvatar()}
                </div>
                <div>
                  <div style={{
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "16px",
                    fontWeight: "bold",
                    color: "#ff6b6b",
                    textShadow: "0 0 15px rgba(255,107,107,0.6)",
                    letterSpacing: "2px"
                  }}>
                    CodeBot v2.0
                  </div>
                  <div style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "12px",
                    color: "#4ecdc4",
                    fontWeight: "bold"
                  }}>
                    Level {botLevel} • {botXP} XP
                  </div>
                </div>
              </div>
              <button
                onClick={() => setBotVisible(false)}
                style={{
                  background: "rgba(255,0,0,0.2)",
                  border: "1px solid rgba(255,0,0,0.4)",
                  borderRadius: "6px",
                  color: "#ff6b6b",
                  fontSize: "14px",
                  width: "24px",
                  height: "24px",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                ✕
              </button>
            </div>

            {/* Bot Status */}
            <div style={{
              background: "rgba(78,205,196,0.1)",
              border: "1px solid rgba(78,205,196,0.3)",
              borderRadius: "8px",
              padding: "10px",
              marginBottom: "15px",
              textAlign: "center"
            }}>
              <div style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "12px",
                color: "#4ecdc4",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "1px"
              }}>
                {botMood === "thinking" ? "🤔 ANALYZING..." : 
                 botMood === "excited" ? "🚀 LEVEL UP!" : 
                 botMood === "helpful" ? "💡 READY TO HELP" : "🤖 ONLINE"}
              </div>
            </div>

            {/* Chat Area */}
            <div style={{
              background: "rgba(0,0,0,0.3)",
              border: "2px solid rgba(255,107,107,0.3)",
              borderRadius: "12px",
              padding: "15px",
              marginBottom: "15px",
              minHeight: "120px",
              maxHeight: "200px",
              overflowY: "auto"
            }}>
              {botMessage ? (
                <div style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "14px",
                  color: "rgba(255,255,255,0.9)",
                  lineHeight: "1.5"
                }}>
                  {botMessage}
                  {isTyping && <span style={{ animation: "blink 1s infinite" }}>|</span>}
                </div>
              ) : (
                <div style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "14px",
                  color: "rgba(255,255,255,0.7)",
                  lineHeight: "1.5",
                  textAlign: "center",
                  fontStyle: "italic"
                }}>
                  {getBotGreeting()}
                </div>
              )}
            </div>

            {/* Input Area */}
            <div style={{
              display: "flex",
              gap: "10px",
              alignItems: "center"
            }}>
              <input
                type="text"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessageToBot()}
                placeholder="Ask CodeBot anything about coding..."
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "rgba(0,0,0,0.5)",
                  border: "2px solid rgba(255,107,107,0.3)",
                  borderRadius: "8px",
                  color: "white",
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
              <button
                onClick={sendMessageToBot}
                disabled={isTyping || !userMessage.trim()}
                style={{
                  padding: "12px 16px",
                  background: isTyping || !userMessage.trim() ? 
                    "rgba(255,255,255,0.2)" : 
                    "linear-gradient(135deg, #ff6b6b, #4ecdc4)",
                  border: "none",
                  borderRadius: "8px",
                  color: "white",
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "14px",
                  fontWeight: "bold",
                  cursor: isTyping || !userMessage.trim() ? "not-allowed" : "pointer",
                  transition: "all 0.3s"
                }}
              >
                {isTyping ? "⏳" : "🚀"}
              </button>
            </div>

            {/* Quick Actions */}
            <div style={{
              marginTop: "15px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px"
            }}>
              {[
                "Help with React",
                "Debug my code",
                "Project ideas",
                "Learn algorithms"
              ].map((action, index) => (
                <button
                  key={index}
                  onClick={() => setUserMessage(action)}
                  style={{
                    padding: "8px 12px",
                    background: "rgba(78,205,196,0.1)",
                    border: "1px solid rgba(78,205,196,0.3)",
                    borderRadius: "6px",
                    color: "#4ecdc4",
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "11px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    transition: "all 0.3s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(78,205,196,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(78,205,196,0.1)";
                  }}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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

      {/* Campus Problem Modal */}
      {selectedPin && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 2000,
          pointerEvents: "auto",
          width: "500px",
          maxWidth: "90vw",
          maxHeight: "80vh",
          overflowY: "auto"
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
            {/* Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "25px"
            }}>
              <div style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: "22px",
                fontWeight: "bold",
                color: "#00ff9d",
                textShadow: "0 0 20px rgba(0,255,157,0.6)",
                maxWidth: "80%"
              }}>
                {campusProblems[selectedPin.name as keyof typeof campusProblems]?.title || `${selectedPin.name} Challenge`}
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

            {/* Problem Type Badge */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px"
            }}>
              <div style={{
                background: `linear-gradient(135deg, ${pinTypeInfo[selectedPin.type as keyof typeof pinTypeInfo].color}20, ${pinTypeInfo[selectedPin.type as keyof typeof pinTypeInfo].color}10)`,
                border: `2px solid ${pinTypeInfo[selectedPin.type as keyof typeof pinTypeInfo].color}40`,
                borderRadius: "8px",
                padding: "8px 16px",
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "12px",
                color: pinTypeInfo[selectedPin.type as keyof typeof pinTypeInfo].color,
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "1px"
              }}>
                {campusProblems[selectedPin.name as keyof typeof campusProblems]?.type || pinTypeInfo[selectedPin.type as keyof typeof pinTypeInfo].name}
              </div>
              <div style={{
                background: "rgba(255,230,109,0.2)",
                border: "2px solid rgba(255,230,109,0.4)",
                borderRadius: "8px",
                padding: "8px 16px",
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "12px",
                color: "#ffe66d",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "1px"
              }}>
                {campusProblems[selectedPin.name as keyof typeof campusProblems]?.difficulty || "Medium"}
              </div>
            </div>

            {/* Problem Statistics */}
            <div style={{
              background: "rgba(0,212,255,0.1)",
              border: "2px solid rgba(0,212,255,0.3)",
              borderRadius: "12px",
              padding: "15px",
              marginBottom: "20px"
            }}>
              <div style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "14px",
                color: "#00d4ff",
                fontWeight: "bold",
                marginBottom: "12px",
                textTransform: "uppercase",
                letterSpacing: "1px",
                textAlign: "center"
              }}>
                📊 PROBLEM STATISTICS
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginBottom: "10px"
              }}>
                <div style={{
                  background: "rgba(0,255,157,0.1)",
                  border: "1px solid rgba(0,255,157,0.3)",
                  borderRadius: "8px",
                  padding: "8px",
                  textAlign: "center"
                }}>
                  <div style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "16px",
                    fontWeight: "bold",
                    color: "#00ff9d"
                  }}>
                    {problemStats[selectedPin.name as keyof typeof problemStats]?.solved || 0}
                  </div>
                  <div style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "10px",
                    color: "rgba(255,255,255,0.7)"
                  }}>
                    SOLVED
                  </div>
                </div>
                <div style={{
                  background: "rgba(255,230,109,0.1)",
                  border: "1px solid rgba(255,230,109,0.3)",
                  borderRadius: "8px",
                  padding: "8px",
                  textAlign: "center"
                }}>
                  <div style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "16px",
                    fontWeight: "bold",
                    color: "#ffe66d"
                  }}>
                    {problemStats[selectedPin.name as keyof typeof problemStats]?.solving || 0}
                  </div>
                  <div style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "10px",
                    color: "rgba(255,255,255,0.7)"
                  }}>
                    SOLVING NOW
                  </div>
                </div>
                <div style={{
                  background: "rgba(255,107,107,0.1)",
                  border: "1px solid rgba(255,107,107,0.3)",
                  borderRadius: "8px",
                  padding: "8px",
                  textAlign: "center"
                }}>
                  <div style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "16px",
                    fontWeight: "bold",
                    color: "#ff6b6b"
                  }}>
                    {problemStats[selectedPin.name as keyof typeof problemStats]?.attempts || 0}
                  </div>
                  <div style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "10px",
                    color: "rgba(255,255,255,0.7)"
                  }}>
                    TOTAL ATTEMPTS
                  </div>
                </div>
                <div style={{
                  background: "rgba(78,205,196,0.1)",
                  border: "1px solid rgba(78,205,196,0.3)",
                  borderRadius: "8px",
                  padding: "8px",
                  textAlign: "center"
                }}>
                  <div style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "16px",
                    fontWeight: "bold",
                    color: "#4ecdc4"
                  }}>
                    {problemStats[selectedPin.name as keyof typeof problemStats]?.difficulty || "Medium"}
                  </div>
                  <div style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "10px",
                    color: "rgba(255,255,255,0.7)"
                  }}>
                    DIFFICULTY
                  </div>
                </div>
              </div>
            </div>

            {/* Problem Description */}
            <div style={{
              background: "rgba(0,0,0,0.3)",
              border: "2px solid rgba(0,212,255,0.3)",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "20px"
            }}>
              <div style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "14px",
                color: "#00d4ff",
                fontWeight: "bold",
                marginBottom: "12px",
                textTransform: "uppercase",
                letterSpacing: "1px"
              }}>
                📋 Problem Description
              </div>
              <div style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "15px",
                color: "rgba(255,255,255,0.9)",
                lineHeight: "1.6",
                marginBottom: "15px"
              }}>
                {campusProblems[selectedPin.name as keyof typeof campusProblems]?.description || "A challenging problem awaits at this location!"}
              </div>
              <div style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "13px",
                color: "#ff6b6b",
                fontWeight: "bold",
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "1px"
              }}>
                🎯 Challenge:
              </div>
              <div style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "14px",
                color: "rgba(255,255,255,0.8)",
                lineHeight: "1.5",
                fontStyle: "italic"
              }}>
                {campusProblems[selectedPin.name as keyof typeof campusProblems]?.problem || "Solve the challenge to unlock rewards!"}
              </div>
            </div>

            {/* Solution Hint */}
            <div style={{
              background: "rgba(0,255,157,0.1)",
              border: "2px solid rgba(0,255,157,0.3)",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "25px"
            }}>
              <div style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "14px",
                color: "#00ff9d",
                fontWeight: "bold",
                marginBottom: "12px",
                textTransform: "uppercase",
                letterSpacing: "1px"
              }}>
                💡 Solution Approach
              </div>
              <div style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "14px",
                color: "rgba(255,255,255,0.8)",
                lineHeight: "1.5"
              }}>
                {campusProblems[selectedPin.name as keyof typeof campusProblems]?.solution || "Think creatively and apply your technical skills!"}
              </div>
            </div>

            {/* Reward */}
            <div style={{
              background: "rgba(255,230,109,0.1)",
              border: "2px solid rgba(255,230,109,0.3)",
              borderRadius: "12px",
              padding: "15px",
              marginBottom: "25px"
            }}>
              <div style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "14px",
                color: "#ffe66d",
                fontWeight: "bold",
                textAlign: "center",
                textTransform: "uppercase",
                letterSpacing: "1px"
              }}>
                🏆 Reward: {campusProblems[selectedPin.name as keyof typeof campusProblems]?.reward || "50 Points + Special Access"}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: "flex",
              gap: "15px"
            }}>
              <button
                onClick={() => {
                  // Here you can implement the actual problem solving logic
                  alert(`Starting to solve: ${campusProblems[selectedPin.name as keyof typeof campusProblems]?.title}`);
                  setSelectedPin(null);
                }}
                style={{
                  flex: 1,
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
                ⚔️ SOLVE PROBLEM
              </button>
              <button
                onClick={() => setSelectedPin(null)}
                style={{
                  padding: "15px 25px",
                  background: "rgba(255,255,255,0.1)",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderRadius: "10px",
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: "rgba(255,255,255,0.8)",
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  transition: "all 0.3s",
                  pointerEvents: "auto"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                CLOSE
              </button>
            </div>
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
        
        @keyframes leaderboardSlideIn {
          from { 
            opacity: 0;
            transform: translateX(100%);
          }
          to { 
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(0,255,157,0.3);
          }
          50% { 
            box-shadow: 0 0 30px rgba(0,255,157,0.6), 0 0 40px rgba(0,212,255,0.4);
          }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        @keyframes liveActivity {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
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
            id={`pin-${idx}-${entityIdSuffix}`}
            key={`pin-${idx}-${entityIdSuffix}`}
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
            onClick={() => {
              console.log('Entity onClick triggered for:', pin.name);
              setSelectedPin(pin);
            }}
          />
        ))}
      </Viewer>
    </div>
  );
}