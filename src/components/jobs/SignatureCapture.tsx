"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

interface SignatureCaptureProps {
  onSignatureChange: (dataUrl: string | null) => void;
}

export function SignatureCapture({ onSignatureChange }: SignatureCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, []);

  const getCoordinates = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in event) {
      return {
        x: event.touches[0].clientX - rect.left,
        y: event.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: (event as React.MouseEvent).clientX - rect.left,
        y: (event as React.MouseEvent).clientY - rect.top
      };
    }
  };

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    setIsDrawing(true);
    const coords = getCoordinates(event);
    if (!coords || !canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    }
  };

  const draw = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    if (!isDrawing) return;
    
    const coords = getCoordinates(event);
    if (!coords || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      if (canvasRef.current) {
        const dataUrl = canvasRef.current.toDataURL("image/png");
        // Only trigger change if canvas has content (not empty)
        onSignatureChange(dataUrl);
      }
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onSignatureChange(null);
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="border rounded-md bg-white overflow-hidden relative" style={{ width: "100%", maxWidth: "500px", height: "200px" }}>
        <canvas
          ref={canvasRef}
          width={500}
          height={200}
          className="cursor-crosshair w-full h-full touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <Button 
          type="button"
          variant="outline" 
          size="icon" 
          className="absolute top-2 right-2 h-8 w-8 bg-white/80 hover:bg-white"
          onClick={clearSignature}
          title="Clear Signature"
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Sign in the box above</p>
    </div>
  );
}
