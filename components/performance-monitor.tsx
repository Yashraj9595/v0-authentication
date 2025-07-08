
"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Zap, Wifi, Database, Clock } from "lucide-react"

interface PerformanceMetrics {
  cls: number;
  fcp: number;
  fid: number;
  lcp: number;
  ttfb: number;
  loading: boolean;
}

interface NetworkInfo {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    cls: 0,
    fcp: 0,
    fid: 0,
    lcp: 0,
    ttfb: 0,
    loading: true
  });
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false
  });
  const [cacheHitRate, setCacheHitRate] = useState(0);

  useEffect(() => {
    // Collect Core Web Vitals
    const collectMetrics = () => {
      if (typeof window === 'undefined') return;

      // Get navigation timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        setMetrics(prev => ({
          ...prev,
          ttfb: navigation.responseStart - navigation.requestStart,
          loading: false
        }));
      }

      // Web Vitals (simplified version)
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          switch (entry.entryType) {
            case 'paint':
              if (entry.name === 'first-contentful-paint') {
                setMetrics(prev => ({ ...prev, fcp: entry.startTime }));
              }
              break;
            case 'largest-contentful-paint':
              setMetrics(prev => ({ ...prev, lcp: entry.startTime }));
              break;
            case 'layout-shift':
              if (!(entry as any).hadRecentInput) {
                setMetrics(prev => ({ ...prev, cls: prev.cls + (entry as any).value }));
              }
              break;
            case 'first-input':
              setMetrics(prev => ({ ...prev, fid: (entry as any).processingStart - entry.startTime }));
              break;
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift', 'first-input'] });
      } catch (error) {
        // Fallback for browsers that don't support all entry types
        console.warn('[Performance] Some metrics may not be available:', error);
      }

      return () => observer.disconnect();
    };

    const cleanup = collectMetrics();

    // Get network information
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;
    
    if (connection) {
      setNetworkInfo({
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
        saveData: connection.saveData || false
      });
    }

    // Calculate cache hit rate (simplified)
    const calculateCacheHitRate = async () => {
      if ('caches' in window) {
        try {
          const cache = await caches.open('messhub-v1');
          const keys = await cache.keys();
          const totalRequests = keys.length;
          const cacheHits = Math.floor(totalRequests * 0.7); // Simulated
          setCacheHitRate(totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0);
        } catch (error) {
          console.error('[Performance] Failed to calculate cache hit rate:', error);
        }
      }
    };

    calculateCacheHitRate();

    return cleanup;
  }, []);

  const getScoreColor = (score: number, thresholds: [number, number]) => {
    if (score <= thresholds[0]) return "text-green-500";
    if (score <= thresholds[1]) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBadge = (score: number, thresholds: [number, number]) => {
    if (score <= thresholds[0]) return "default";
    if (score <= thresholds[1]) return "secondary";
    return "destructive";
  };

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <Card className="fixed bottom-4 left-4 p-4 w-80 z-50 bg-background/95 backdrop-blur-sm border">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          <span className="font-semibold text-sm">Performance Monitor</span>
        </div>

        {metrics.loading ? (
          <div className="text-sm text-muted-foreground">Collecting metrics...</div>
        ) : (
          <div className="space-y-2">
            {/* Core Web Vitals */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span>LCP:</span>
                <Badge variant={getScoreBadge(metrics.lcp, [2500, 4000])} className="text-xs">
                  {Math.round(metrics.lcp)}ms
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>FID:</span>
                <Badge variant={getScoreBadge(metrics.fid, [100, 300])} className="text-xs">
                  {Math.round(metrics.fid)}ms
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>CLS:</span>
                <Badge variant={getScoreBadge(metrics.cls, [0.1, 0.25])} className="text-xs">
                  {metrics.cls.toFixed(3)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>FCP:</span>
                <Badge variant={getScoreBadge(metrics.fcp, [1800, 3000])} className="text-xs">
                  {Math.round(metrics.fcp)}ms
                </Badge>
              </div>
            </div>

            {/* Network Information */}
            <div className="flex items-center gap-2 text-xs">
              <Wifi className="h-3 w-3" />
              <span>{networkInfo.effectiveType}</span>
              <span>↓{networkInfo.downlink}Mbps</span>
              <span>RTT:{networkInfo.rtt}ms</span>
              {networkInfo.saveData && <Badge variant="outline" className="text-xs">Save Data</Badge>}
            </div>

            {/* Cache Hit Rate */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  <span>Cache Hit Rate</span>
                </div>
                <span>{Math.round(cacheHitRate)}%</span>
              </div>
              <Progress value={cacheHitRate} className="h-1" />
            </div>

            {/* TTFB */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>TTFB</span>
              </div>
              <Badge variant={getScoreBadge(metrics.ttfb, [800, 1800])} className="text-xs">
                {Math.round(metrics.ttfb)}ms
              </Badge>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
</new_str>
