"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import ROSLIB from "roslib";
import ConnectionStatusBar from "@/components/ConnectionStatusBar";
import { useRos } from "@/contexts/RosContext";

interface RobotPosition {
  x: number;
  y: number;
  theta: number;
  heading: string;
  timestamp: string;
}

interface Marker {
  id: number;
  x: number;
  y: number;
  heading: string;
  timestamp: string;
  status: string;
}

export default function Home() {
  const [robotPos, setRobotPos] = useState<RobotPosition | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const { isConnected, getRos, robotNamespace, connectionStatus, ensureConnection } = useRos();

  // Ensure connection is maintained when component mounts
  useEffect(() => {
    if (ensureConnection) {
      ensureConnection();
    }
  }, [ensureConnection]);

  // Subscribe to odometry
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

    const odom = new ROSLIB.Topic({
      ros: ros,
      name: getTopicPath('walk_engine_odometry'),
      messageType: "nav_msgs/Odometry",
    });

    const callback = (msg: any) => {
      const { position, orientation } = msg.pose.pose;
      const theta = Math.atan2(
        2 * (orientation.w * orientation.z + orientation.x * orientation.y),
        1 - 2 * (orientation.y * orientation.y + orientation.z * orientation.z)
      );

      setRobotPos({
        x: position.x,
        y: position.y,
        theta,
        heading: getCardinalDirection(theta),
        timestamp: new Date().toLocaleTimeString(),
      });
    };

    odom.subscribe(callback);
    return () => odom.unsubscribe();
  }, [isConnected, getRos]);

  const getCardinalDirection = (theta: number) => {
    const degrees = theta * (180 / Math.PI);
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round((((degrees % 360) + 360) % 360) / 45) % 8;
    return directions[index];
  };


  return (
    <div className="min-h-screen p-6 bg-white">
      {/* Removed animated background elements for white mode */}

      {/* Header */}
      <header className="mb-8">
        <div className="bg-white border border-gray-200 shadow-sm rounded-md p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {/* Back Button */}
                <button
                  onClick={() => {
                    const basePath = window.location.hostname === "localhost" ? "/" : "/autodrive-dashboard";
                    window.location.href = basePath;
                  }}
                  className="flex items-center gap-2 px-2 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-150"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-xs font-medium">Back</span>
                </button>
                <h1 className="text-sm font-semibold text-gray-900">
                  Map & Navigation
                </h1>
              </div>
            </div>

            <div className="flex gap-3">
              {/* Additional controls can be added here if needed */}
            </div>
          </div>
        </div>
      </header>

      {/* Connection Status Bar */}
      <ConnectionStatusBar showFullControls={false} />

    </div>
  );
}