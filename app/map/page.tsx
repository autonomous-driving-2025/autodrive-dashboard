"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import dynamic from 'next/dynamic';
import ROSLIB from "roslib";
import ConnectionStatusBar from "@/components/ConnectionStatusBar";
import { useRos } from "@/contexts/RosContext";
import usePathWorker from "@/hooks/usePathWorker";

// Dynamically import MapComponent with no SSR
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-screen">Loading map...</div>
});

interface Position {
  lat: number;
  lon: number;
}


export default function Home() {
  const [position, setPosition] = useState<Position | null>(null);
  const { path, addPosition, clearPath } = usePathWorker();
  const { isConnected, getRos, robotNamespace, connectionStatus, ensureConnection } = useRos();

  // Ensure connection is maintained when component mounts
  useEffect(() => {
    if (ensureConnection) {
      ensureConnection();
    }
  }, [ensureConnection]);

  // Subscribe to /navsat/fix
  useEffect(() => {
    if (!isConnected) return;

    const ros = getRos();

    // Helper function to format topic paths correctly
    const getTopicPath = (topic: string): string => {
      if (!robotNamespace || robotNamespace === '') {
        return `/${topic}`;
      }
      return `/${robotNamespace}/${topic}`;
    };

    const navsat_sub = new ROSLIB.Topic({
      ros: ros,
      name: getTopicPath('gnss/fix'),
      messageType: "sensor_msgs/NavSatFix",
    });

    const callback = (msg: any) => {
      const latitude = msg.latitude
      const longitude = msg.longitude
      console.log("lat: %d, lon: %d", latitude, longitude);

      const newPosition = {
        lat: latitude,
        lon: longitude
      };

      setPosition(newPosition);
      // Add position to worker for processing
      addPosition(newPosition);
    };

    navsat_sub.subscribe(callback);
    return () => navsat_sub.unsubscribe();
  }, [isConnected, getRos, addPosition]);

  // Debug: Log path updates
  useEffect(() => {
    console.log('Path updated. Total points:', path.length);
  }, [path]);


  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Map fills entire page */}
      <MapComponent position={position} path={path}/>

      {/* Connection Status Bar floating on top */}
      <div className="absolute top-6 left-0 right-0 z-[1000] px-6">
        <ConnectionStatusBar showFullControls={false} />
      </div>

      {/* Clear Path Button */}
      <div className="absolute bottom-6 right-6 z-[1000]">
        <button
          onClick={clearPath}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg transition-colors flex items-center gap-2"
          title="Clear path and cache"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear Path
        </button>
        
        {/* Path info badge */}
        {path.length > 0 && (
          <div className="mt-2 bg-white bg-opacity-90 px-3 py-1 rounded-lg shadow text-sm text-gray-700">
            {path.length} points cached
          </div>
        )}
      </div>

    </div>
  );
}