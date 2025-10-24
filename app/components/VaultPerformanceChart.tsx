'use client';

import { useEffect, useRef } from 'react';

interface PerformanceData {
  timestamp: number;
  value: number;
}

interface VaultPerformanceChartProps {
  data: PerformanceData[];
  period: '24h' | '7d' | '30d' | 'all';
  height?: number;
  showTooltip?: boolean;
}

export default function VaultPerformanceChart({ 
  data, 
  period, 
  height = 60,
  showTooltip = false 
}: VaultPerformanceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Calculate metrics
    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue;
    const startValue = data[0].value;
    const endValue = data[data.length - 1].value;
    const percentChange = ((endValue - startValue) / startValue) * 100;
    const isPositive = percentChange >= 0;

    // Set up dimensions
    const width = rect.width;
    const padding = 10;
    const chartHeight = height - (padding * 2);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw performance line
    ctx.beginPath();
    ctx.strokeStyle = isPositive ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)';
    ctx.lineWidth = 2;

    data.forEach((point, i) => {
      const x = (i / (data.length - 1)) * width;
      const normalizedValue = valueRange === 0 ? 0.5 : (point.value - minValue) / valueRange;
      const y = height - (normalizedValue * chartHeight + padding);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Fill area under the line
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = isPositive ? 
      'rgba(34, 197, 94, 0.1)' : 
      'rgba(239, 68, 68, 0.1)';
    ctx.fill();

    // Add tooltip if enabled
    if (showTooltip) {
      canvas.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const dataIndex = Math.floor((x / width) * (data.length - 1));
        const point = data[dataIndex];
        
        if (point) {
          // Clear previous tooltip
          ctx.clearRect(0, 0, width, height);
          
          // Redraw chart
          ctx.beginPath();
          // ... (repeat chart drawing code)
          
          // Draw tooltip
          const tooltipX = (dataIndex / (data.length - 1)) * width;
          const normalizedValue = valueRange === 0 ? 0.5 : (point.value - minValue) / valueRange;
          const tooltipY = height - (normalizedValue * chartHeight + padding);
          
          ctx.beginPath();
          ctx.arc(tooltipX, tooltipY, 4, 0, Math.PI * 2);
          ctx.fillStyle = isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
          ctx.fill();
          
          // Draw tooltip text
          ctx.font = '12px Inter';
          ctx.fillStyle = '#fff';
          const tooltipText = `${point.value.toFixed(2)} USDC`;
          const textWidth = ctx.measureText(tooltipText).width;
          const textX = Math.min(Math.max(tooltipX - textWidth / 2, 0), width - textWidth);
          ctx.fillText(tooltipText, textX, tooltipY - 10);
        }
      };
    }

  }, [data, period, height, showTooltip]);

  return (
    <div className="performance-chart">
      <canvas 
        ref={canvasRef} 
        style={{ 
          width: '100%', 
          height: `${height}px`,
          display: 'block'
        }}
      />
      <style jsx>{`
        .performance-chart {
          position: relative;
          width: 100%;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}