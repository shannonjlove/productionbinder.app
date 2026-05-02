import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const StudioTimer = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [targetTime, setTargetTime] = useState(60); // default 60 seconds
  const [mode, setMode] = useState<"countdown" | "stopwatch">("countdown");

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => {
          if (mode === "countdown") {
            if (prevTime <= 0) {
              setIsRunning(false);
              return 0;
            }
            return prevTime - 1;
          } else {
            return prevTime + 1;
          }
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, mode]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStart = () => {
    if (!isRunning && mode === "countdown" && time === 0) {
      setTime(targetTime);
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(mode === "countdown" ? targetTime : 0);
  };

  const handleModeChange = (newMode: "countdown" | "stopwatch") => {
    setMode(newMode);
    setIsRunning(false);
    setTime(newMode === "countdown" ? targetTime : 0);
  };

  const handleTargetTimeChange = (value: string) => {
    const seconds = parseInt(value) || 0;
    setTargetTime(seconds);
    if (!isRunning && mode === "countdown") {
      setTime(seconds);
    }
  };

  const getTimeColor = () => {
    if (mode === "stopwatch") return "text-foreground";
    
    const percentage = (time / targetTime) * 100;
    if (percentage <= 10) return "text-destructive";
    if (percentage <= 25) return "text-orange-500";
    return "text-foreground";
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Live Studio Timer</h3>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={mode === "countdown" ? "default" : "outline"}
              size="sm"
              onClick={() => handleModeChange("countdown")}
            >
              Countdown
            </Button>
            <Button
              variant={mode === "stopwatch" ? "default" : "outline"}
              size="sm"
              onClick={() => handleModeChange("stopwatch")}
            >
              Stopwatch
            </Button>
          </div>
        </div>

        {mode === "countdown" && !isRunning && (
          <div className="space-y-2">
            <Label htmlFor="target-time">Target Time (seconds)</Label>
            <Input
              id="target-time"
              type="number"
              value={targetTime}
              onChange={(e) => handleTargetTimeChange(e.target.value)}
              placeholder="Enter seconds"
            />
          </div>
        )}

        <div className="text-center">
          <div className={`text-6xl font-mono font-bold ${getTimeColor()} transition-colors`}>
            {formatTime(time)}
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Button
            onClick={handleStart}
            size="lg"
            className="gap-2"
          >
            {isRunning ? (
              <>
                <Pause className="h-5 w-5" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                Start
              </>
            )}
          </Button>
          
          <Button
            onClick={handleReset}
            size="lg"
            variant="outline"
            className="gap-2"
          >
            <RotateCcw className="h-5 w-5" />
            Reset
          </Button>
        </div>

        {mode === "countdown" && (
          <div className="flex gap-2">
            {[30, 60, 120, 300].map((seconds) => (
              <Button
                key={seconds}
                variant="secondary"
                size="sm"
                onClick={() => {
                  setTargetTime(seconds);
                  setTime(seconds);
                  setIsRunning(false);
                }}
                className="flex-1"
              >
                {seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}
              </Button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
