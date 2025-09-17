import { useFocusSessionLoad } from "./use-focus-session-load";
import { useFocusSessionUpdate } from "./use-focus-session-update";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Target, AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";
import { animate, createScope, createTimer } from "animejs";

// Digital Segment Display Component with Anime.js Animation
const DigitalSegment = ({
  digit,
  className,
  animationDelay = 0,
}: {
  digit: string;
  className?: string;
  animationDelay?: number;
}) => {
  const segmentRef = useRef<HTMLDivElement>(null);
  const scope = useRef<{ revert: () => void } | null>(null);

  useEffect(() => {
    if (!segmentRef.current) return;

    const segments = {
      "0": [1, 1, 1, 1, 1, 1, 0],
      "1": [0, 1, 1, 0, 0, 0, 0],
      "2": [1, 1, 0, 1, 1, 0, 1],
      "3": [1, 1, 1, 1, 0, 0, 1],
      "4": [0, 1, 1, 0, 0, 1, 1],
      "5": [1, 0, 1, 1, 0, 1, 1],
      "6": [1, 0, 1, 1, 1, 1, 1],
      "7": [1, 1, 1, 0, 0, 0, 0],
      "8": [1, 1, 1, 1, 1, 1, 1],
      "9": [1, 1, 1, 1, 0, 1, 1],
      ":": [0, 0, 0, 0, 0, 0, 0], // Special case for colon
    };

    const segmentStates = segments[digit as keyof typeof segments] || [
      0, 0, 0, 0, 0, 0, 0,
    ];

    // Clean up previous scope
    if (scope.current) {
      scope.current.revert();
    }

    // Create new scope for this digit
    scope.current = createScope({ root: segmentRef.current }).add(() => {
      const segmentElements = segmentRef.current?.querySelectorAll(".segment");
      if (!segmentElements) return;

      // Snake-like drawing animation: top to bottom, left to right
      const animationSequence = [
        { selector: ".segment-a", delay: 0 },
        { selector: ".segment-b", delay: 100 },
        { selector: ".segment-c", delay: 200 },
        { selector: ".segment-d", delay: 300 },
        { selector: ".segment-e", delay: 400 },
        { selector: ".segment-f", delay: 500 },
        { selector: ".segment-g", delay: 600 },
      ];

      // First, reset all segments to grey (off state)
      animationSequence.forEach(({ selector }) => {
        const element = segmentRef.current?.querySelector(selector);
        if (!element) return;

        // Start with grey state
        element.classList.add("bg-stone-300/40");
        element.classList.remove(
          "bg-orange-500",
          "shadow-orange-500/60",
          "shadow-lg",
        );
      });

      // Then animate each segment with snake-like flow
      animationSequence.forEach(({ selector, delay }) => {
        const element = segmentRef.current?.querySelector(selector);
        if (!element) return;

        const segmentIndex = parseInt(
          selector
            .split("-")[1]
            .replace("a", "0")
            .replace("b", "1")
            .replace("c", "2")
            .replace("d", "3")
            .replace("e", "4")
            .replace("f", "5")
            .replace("g", "6"),
        );
        const shouldBeActive = segmentStates[segmentIndex] === 1;

        if (shouldBeActive) {
          // Create snake-like drawing animation for active segments
          animate(element, {
            scale: [0.8, 1.1, 1],
            opacity: [0.3, 0.7, 1],
            rotateX: [0, 5, 0],
            duration: 400,
            delay: delay + animationDelay,
            ease: "outElastic(1, 0.8)",
            begin: () => {
              // Start drawing the segment
              element.classList.remove("bg-stone-300/40");
              element.classList.add(
                "bg-orange-500",
                "shadow-orange-500/60",
                "shadow-lg",
              );
            },
          });
        } else {
          // Keep inactive segments grey with a subtle animation
          animate(element, {
            scale: [1, 0.95, 1],
            opacity: [0.3, 0.4, 0.4],
            duration: 200,
            delay: delay + animationDelay,
            ease: "easeOutQuad",
          });
        }
      });
    });

    return () => {
      if (scope.current) {
        scope.current.revert();
      }
    };
  }, [digit, animationDelay]);

  return (
    <div ref={segmentRef} className={`relative w-16 h-24 ${className || ""}`}>
      {/* Segment A (top) */}
      <div
        className="segment segment-a absolute top-0 left-2 w-12 h-2 rounded-sm bg-stone-300/40"
        style={{ transform: "skewY(-2deg)" }}
      />
      {/* Segment B (top right) */}
      <div
        className="segment segment-b absolute top-2 right-0 w-2 h-10 rounded-sm bg-stone-300/40"
        style={{ transform: "skewX(-2deg)" }}
      />
      {/* Segment C (bottom right) */}
      <div
        className="segment segment-c absolute bottom-2 right-0 w-2 h-10 rounded-sm bg-stone-300/40"
        style={{ transform: "skewX(-2deg)" }}
      />
      {/* Segment D (bottom) */}
      <div
        className="segment segment-d absolute bottom-0 left-2 w-12 h-2 rounded-sm bg-stone-300/40"
        style={{ transform: "skewY(2deg)" }}
      />
      {/* Segment E (bottom left) */}
      <div
        className="segment segment-e absolute bottom-2 left-0 w-2 h-10 rounded-sm bg-stone-300/40"
        style={{ transform: "skewX(2deg)" }}
      />
      {/* Segment F (top left) */}
      <div
        className="segment segment-f absolute top-2 left-0 w-2 h-10 rounded-sm bg-stone-300/40"
        style={{ transform: "skewX(2deg)" }}
      />
      {/* Segment G (middle) */}
      <div
        className="segment segment-g absolute top-1/2 left-2 w-12 h-2 rounded-sm bg-stone-300/40 -translate-y-1"
        style={{ transform: "translateY(-50%) skewY(-1deg)" }}
      />
    </div>
  );
};

// Colon Separator Component with Animation
const ColonSeparator = ({
  animationDelay = 0,
}: {
  animationDelay?: number;
}) => {
  const colonRef = useRef<HTMLDivElement>(null);
  const scope = useRef<{ revert: () => void } | null>(null);

  useEffect(() => {
    if (!colonRef.current) return;

    scope.current = createScope({ root: colonRef.current }).add(() => {
      const dots = colonRef.current?.querySelectorAll(".colon-dot");
      if (!dots) return;

      // Animate colon dots with snake-like flow
      dots.forEach((dot, index) => {
        animate(dot, {
          scale: [0.5, 1.2, 1],
          opacity: [0, 0.8, 1],
          rotateY: [0, 180, 0],
          duration: 300,
          delay: animationDelay + index * 150,
          ease: "outElastic(1, 0.6)",
        });
      });
    });

    return () => {
      if (scope.current) {
        scope.current.revert();
      }
    };
  }, [animationDelay]);

  return (
    <div
      ref={colonRef}
      className="flex flex-col justify-center items-center h-24 w-4"
    >
      <div className="colon-dot w-2 h-2 bg-orange-500 rounded-full shadow-orange-500/60 shadow-lg mb-2" />
      <div className="colon-dot w-2 h-2 bg-orange-500 rounded-full shadow-orange-500/60 shadow-lg" />
    </div>
  );
};

// Focus Timer Component
const FocusTimer = ({ startTime }: { startTime: string }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<{ cancel: () => void } | null>(null);
  const startTimestampRef = useRef<number>(0);

  useEffect(() => {
    startTimestampRef.current = new Date(startTime).getTime();

    // Create anime.js timer for precise timing
    timerRef.current = createTimer({
      duration: 1000, // 1 second intervals
      loop: true,
      frameRate: 60, // High frame rate for smooth updates
      onUpdate: () => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTimestampRef.current) / 1000);
        setElapsedTime(elapsed);
      },
    });

    return () => {
      if (timerRef.current) {
        timerRef.current.cancel();
      }
    };
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const timeString = formatTime(elapsedTime);
  const digits = timeString.split("");

  return (
    <div className="text-center">
      {/* Digital Display */}
      <div className="bg-stone-100 border-2 border-stone-300 rounded-lg p-6 mb-4 shadow-2xl">
        <div className="flex justify-center items-center gap-2">
          {digits.map((digit, index) => (
            <div key={index}>
              {digit === ":" ? (
                <ColonSeparator animationDelay={index * 50} />
              ) : (
                <DigitalSegment
                  digit={digit}
                  animationDelay={index * 50} // Stagger animations across digits
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Dust Particle Component
const DustParticle = ({
  id,
  size,
  color,
  initialX,
  initialY,
}: {
  id: number;
  size: number;
  color: string;
  initialX: number;
  initialY: number;
}) => {
  return (
    <div
      className={`dust-particle-${id} absolute rounded-full opacity-60`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        left: `${initialX}%`,
        top: `${initialY}%`,
        transform: "translate(-50%, -50%)",
      }}
    />
  );
};

// Dust Animation System
const DustAnimation = () => {
  const root = useRef<HTMLDivElement>(null);
  const scope = useRef<{ revert: () => void } | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  // Generate dust particles with different sizes and colors
  const dustParticles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        size: Math.random() * 4 + 1, // 1-5px
        color: [
          "hsl(var(--primary) / 0.3)",
          "hsl(var(--secondary) / 0.2)",
          "hsl(var(--accent) / 0.25)",
          "hsl(var(--muted-foreground) / 0.15)",
        ][Math.floor(Math.random() * 4)],
        initialX: Math.random() * 100,
        initialY: Math.random() * 100,
      })),
    [],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!root.current) return;

    scope.current = createScope({ root: root.current }).add(() => {
      // Animate each dust particle
      dustParticles.forEach((particle) => {
        animate(`.dust-particle-${particle.id}`, {
          x: [
            { to: 0, duration: 2000 + Math.random() * 3000, ease: "inOutSine" },
            {
              to: (Math.random() - 0.5) * 100,
              duration: 2000 + Math.random() * 3000,
              ease: "inOutSine",
            },
          ],
          y: [
            { to: 0, duration: 2000 + Math.random() * 3000, ease: "inOutSine" },
            {
              to: (Math.random() - 0.5) * 100,
              duration: 2000 + Math.random() * 3000,
              ease: "inOutSine",
            },
          ],
          opacity: [
            {
              to: 0.1,
              duration: 1000 + Math.random() * 2000,
              ease: "inOutSine",
            },
            {
              to: 0.6,
              duration: 1000 + Math.random() * 2000,
              ease: "inOutSine",
            },
          ],
          loop: true,
          alternate: true,
        });
      });
    });

    return () => scope.current?.revert();
  }, [dustParticles]);

  // Update dust positions based on mouse and scroll
  useEffect(() => {
    if (!root.current) return;

    const dustElements = root.current.querySelectorAll(
      '[class*="dust-particle-"]',
    );
    dustElements.forEach((element, index) => {
      const particle = dustParticles[index];
      if (particle) {
        const mouseInfluence = 0.1;
        const scrollInfluence = 0.05;

        const mouseX = (mousePosition.x - 50) * mouseInfluence;
        const mouseY = (mousePosition.y - 50) * mouseInfluence;
        const scrollOffset = scrollY * scrollInfluence;

        (element as HTMLElement).style.transform =
          `translate(calc(-50% + ${mouseX}px + ${scrollOffset}px), calc(-50% + ${mouseY}px))`;
      }
    });
  }, [mousePosition, scrollY, dustParticles]);

  return (
    <div
      ref={root}
      className="fixed inset-0 pointer-events-none overflow-hidden"
    >
      {dustParticles.map((particle) => (
        <DustParticle
          key={particle.id}
          id={particle.id}
          size={particle.size}
          color={particle.color}
          initialX={particle.initialX}
          initialY={particle.initialY}
        />
      ))}
    </div>
  );
};

const FocusSessionView = () => {
  const [state] = useFocusSessionLoad();
  const [
    updateState,
    { completeSession, abandonSession, incrementInterruptions },
  ] = useFocusSessionUpdate();

  if (state.status === "idle" || state.status === "busy") {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6 relative overflow-hidden">
        <DustAnimation />
        <div className="text-center space-y-6 z-10">
          <h1
            className="text-4xl font-bold text-foreground"
            style={{ fontFamily: "cursive" }}
          >
            FOCUSING IN PROGRESS
          </h1>
          <p className="text-muted-foreground text-lg">
            {state.status === "idle"
              ? "Initializing..."
              : "Loading your session..."}
          </p>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6 relative overflow-hidden">
        <DustAnimation />
        <div className="text-center space-y-6 z-10">
          <h1
            className="text-4xl font-bold text-destructive"
            style={{ fontFamily: "cursive" }}
          >
            SESSION ERROR
          </h1>
          <p className="text-destructive text-lg">{state.message}</p>
        </div>
      </div>
    );
  }

  const { hasActiveSession, session } = state.data;

  if (!hasActiveSession || !session) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6 relative overflow-hidden">
        <DustAnimation />
        <div className="text-center space-y-6 z-10 max-w-md">
          <h1
            className="text-4xl font-bold text-foreground"
            style={{ fontFamily: "cursive" }}
          >
            NO ACTIVE SESSION
          </h1>
          <div className="space-y-4">
            <p className="text-muted-foreground text-lg">
              You don&apos;t have an active focus session.
            </p>
            <p className="text-sm text-muted-foreground">
              To start a focus session, mark a task as &quot;pending&quot; in
              your tasks list.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6 relative">
      <DustAnimation />

      {/* Speech Bubbles */}
      <div className="absolute top-16 right-8 z-10">
        <div
          className="bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-medium"
          style={{ fontFamily: "cursive" }}
        >
          Stay focused!
        </div>
      </div>

      <div
        className="bg-secondary/30 text-secondary-foreground px-4 py-2 rounded-full text-sm font-medium mb-4"
        style={{ fontFamily: "cursive" }}
      >
        You&apos;re doing great!
      </div>

      <div className="text-center space-y-8 z-10 max-w-lg">
        <h1
          className="text-4xl font-bold text-foreground"
          style={{ fontFamily: "cursive" }}
        >
          FOCUS SESSION ACTIVE
        </h1>

        {/* Focus Timer */}
        <FocusTimer startTime={session.startedAt} />

        {session.task && (
          <div className="space-y-6 bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border/50">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">
                {session.task.title}
              </h2>
              {session.task.description && (
                <p className="text-muted-foreground">
                  {session.task.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Estimated:</span>
                <span className="font-medium text-foreground">
                  {session.task.estimatedDurationMinutes} min
                </span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Interruptions:</span>
                <span className="font-medium text-foreground">
                  {session.totalInterruptions}
                </span>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button
                size="lg"
                variant="default"
                className="px-8"
                onClick={completeSession}
                disabled={updateState.status === "busy"}
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                {updateState.status === "busy"
                  ? "Completing..."
                  : "Complete Session"}
              </Button>
              <Button
                size="lg"
                variant="destructive"
                className="px-8"
                onClick={abandonSession}
                disabled={updateState.status === "busy"}
              >
                <XCircle className="h-5 w-5 mr-2" />
                {updateState.status === "busy"
                  ? "Abandoning..."
                  : "Abandon Session"}
              </Button>
            </div>

            {/* Interruption Tracking */}
            <div className="flex gap-3 justify-center mt-4">
              <Button
                size="sm"
                variant="outline"
                className="px-4"
                onClick={incrementInterruptions}
                disabled={updateState.status === "busy"}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Track Interruption
              </Button>
            </div>

            {/* Update Status Messages */}
            {updateState.status === "error" && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-destructive text-sm text-center">
                  {updateState.message}
                </p>
              </div>
            )}

            {updateState.status === "success" && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-green-600 text-sm text-center">
                  Session updated successfully!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export { FocusSessionView };
