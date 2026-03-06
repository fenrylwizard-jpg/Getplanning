"use client";
import React from "react";

export default function EEGLogo({ className }: { className?: string }) {
  return (
    <div className={`eeg-logo-container ${className || ""}`}>
      <div className="eeg-cube">
        <div className="eeg-face eeg-front">E</div>
        <div className="eeg-face eeg-back">E</div>
        <div className="eeg-face eeg-right">G</div>
        <div className="eeg-face eeg-left">G</div>
        <div className="eeg-face eeg-top"><span className="eeg-rotated-letter">E</span></div>
        <div className="eeg-face eeg-bottom"><span className="eeg-rotated-letter">E</span></div>
      </div>
      <style jsx>{`
        .eeg-logo-container {
          width: 75px;
          height: 75px;
          perspective: 1500px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 20px;
        }
        
        .eeg-cube {
          position: relative;
          width: 57px;
          height: 57px;
          transform-style: preserve-3d;
          animation: rotateCube 12s infinite linear;
        }
        
        .eeg-face {
          position: absolute;
          width: 57px;
          height: 57px;
          border: 2px solid rgba(255,255,255,0.9);
          box-shadow: inset 0 0 10px rgba(0,0,0,0.2), 0 0 5px rgba(255,255,255,0.3);
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 38px;
          font-family: 'Outfit', Arial, sans-serif;
          color: white;
          line-height: 1;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          backface-visibility: hidden;
        }
        
        .eeg-rotated-letter {
          transform: rotate(-90deg);
          display: inline-block;
        }
        
        .eeg-front  { transform: rotateY(  0deg) translateZ(28.5px); background: rgb(0, 75, 135); }
        .eeg-back   { transform: rotateY(180deg) translateZ(28.5px); background: rgb(0, 75, 135); }
        .eeg-right  { transform: rotateY( 90deg) translateZ(28.5px); background: rgb(0, 133, 202); }
        .eeg-left   { transform: rotateY(-90deg) translateZ(28.5px); background: rgb(0, 133, 202); }
        .eeg-top    { transform: rotateX( 90deg) translateZ(28.5px); background: rgb(253, 185, 19); }
        .eeg-bottom { transform: rotateX(-90deg) translateZ(28.5px); background: rgb(253, 185, 19); }
        
        @keyframes rotateCube {
          0% { transform: rotateX(-35.264deg) rotateY(-45deg); }
          100% { transform: rotateX(-35.264deg) rotateY(315deg); }
        }
      `}</style>
    </div>
  );
}
