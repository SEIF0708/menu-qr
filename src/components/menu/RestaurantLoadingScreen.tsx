import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSignedImage } from "@/lib/use-signed-image";

interface RestaurantLoadingScreenProps {
  restaurantName?: string;
  restaurantLogo?: string | null;
  primaryColor?: string;
  accentColor?: string;
}

const MESSAGES = [
  "Preparing fresh ingredients...",
  "Getting today's specials ready...",
  "Cooking something delicious...",
  "Almost ready...",
  "Welcome to our restaurant..."
];

export function RestaurantLoadingScreen({
  restaurantName = "Our Restaurant",
  restaurantLogo,
  primaryColor = "hsl(var(--primary))",
  accentColor = "hsl(var(--accent))",
}: RestaurantLoadingScreenProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const logoUrl = useSignedImage(restaurantLogo);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="min-h-dvh flex flex-col items-center justify-center bg-background fixed inset-0 z-[100] px-6"
    >
      <div className="flex flex-col items-center max-w-sm w-full">
        {/* Restaurant Logo */}
        {logoUrl ? (
          <motion.img 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            src={logoUrl} 
            alt={restaurantName} 
            className="size-20 rounded-2xl object-cover shadow-xl mb-8 border border-border/50"
          />
        ) : (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="size-20 rounded-2xl shadow-xl mb-8 border border-border/50 grid place-items-center bg-muted"
          >
            <span className="text-3xl font-display font-bold text-primary">{restaurantName.charAt(0)}</span>
          </motion.div>
        )}

        {/* Premium Pizza SVG Animation */}
        <div className="relative size-32 sm:size-40 mb-8">
           <PizzaAnimation primaryColor={primaryColor} />
        </div>

        {/* Restaurant Name */}
        <h1 className="text-2xl font-display font-bold text-foreground text-center mb-1">
          {restaurantName}
        </h1>

        {/* Rotating Messages */}
        <div className="h-6 mb-8 flex items-center justify-center overflow-hidden w-full relative">
          <AnimatePresence mode="wait">
            <motion.p
              key={messageIndex}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-sm font-medium text-muted-foreground absolute text-center"
            >
              {MESSAGES[messageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Premium Progress Indicator */}
        <div className="w-full mt-2 flex flex-col items-center">
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-4 relative">
             <motion.div 
               initial={{ width: "0%" }}
               animate={{ width: "100%" }}
               transition={{ duration: 4, ease: "easeInOut" }}
               className="absolute top-0 bottom-0 left-0 rounded-full"
               style={{ backgroundColor: primaryColor }}
             />
          </div>
          <p className="text-xs font-serif italic text-muted-foreground/80">
            "Fresh food, just a moment away."
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Pizza Slicing Animation
function PizzaAnimation({ primaryColor }: { primaryColor: string }) {
  return (
    <div className="relative w-full h-full drop-shadow-2xl">
      <svg viewBox="0 0 100 100" className="w-full h-full" style={{ color: primaryColor }}>
        {/* Wooden Board */}
        <circle cx="50" cy="50" r="48" fill="#8B5A2B" />
        <circle cx="50" cy="50" r="46" fill="#A0522D" />
        
        {/* Pizza Crust */}
        <circle cx="50" cy="50" r="40" fill="#E8B073" stroke="#C28742" strokeWidth="2" />
        {/* Cheese Base */}
        <circle cx="50" cy="50" r="35" fill="#FFCF54" />
        
        {/* Pepperoni */}
        <circle cx="35" cy="28" r="5" fill="#D32F2F" />
        <circle cx="62" cy="32" r="4.5" fill="#D32F2F" />
        <circle cx="45" cy="65" r="5" fill="#D32F2F" />
        <circle cx="28" cy="52" r="4" fill="#D32F2F" />
        <circle cx="70" cy="55" r="5" fill="#D32F2F" />
        <circle cx="50" cy="45" r="4.5" fill="#D32F2F" />
        <circle cx="58" cy="18" r="3.5" fill="#D32F2F" />
        
        {/* Basil Leaves */}
        <path d="M 40 40 Q 45 35 45 42 Q 40 45 40 40" fill="#2E7D32" />
        <path d="M 60 50 Q 65 55 60 60 Q 55 55 60 50" fill="#2E7D32" />
        <path d="M 30 60 Q 35 65 30 70 Q 25 65 30 60" fill="#2E7D32" />

        {/* The Cutter Lines (Looping Slices) */}
        <motion.line x1="50" y1="10" x2="50" y2="90" stroke="#B87333" strokeWidth="1.5" strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 1, 1, 0] }}
          transition={{ duration: 4, repeat: Infinity, times: [0, 0.1, 0.8, 0.9, 1] }} 
        />
        <motion.line x1="15.35" y1="30" x2="84.65" y2="70" stroke="#B87333" strokeWidth="1.5" strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 1, 1, 0] }}
          transition={{ duration: 4, repeat: Infinity, times: [0.1, 0.2, 0.8, 0.9, 1] }} 
        />
        <motion.line x1="15.35" y1="70" x2="84.65" y2="30" stroke="#B87333" strokeWidth="1.5" strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 1, 1, 0] }}
          transition={{ duration: 4, repeat: Infinity, times: [0.2, 0.3, 0.8, 0.9, 1] }} 
        />

        {/* Steam Waves */}
        <motion.path d="M 30 20 Q 35 10 30 0" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6"
          initial={{ pathLength: 0, y: 10, opacity: 0 }}
          animate={{ pathLength: 1, y: -10, opacity: [0, 0.6, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        />
        <motion.path d="M 70 25 Q 65 15 70 5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6"
          initial={{ pathLength: 0, y: 10, opacity: 0 }}
          animate={{ pathLength: 1, y: -10, opacity: [0, 0.6, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: 1 }}
        />
        <motion.path d="M 50 15 Q 55 5 50 -5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6"
          initial={{ pathLength: 0, y: 10, opacity: 0 }}
          animate={{ pathLength: 1, y: -10, opacity: [0, 0.6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: 0 }}
        />
      </svg>
      
      {/* Crumbs Particles via Framer Motion */}
      <Crumb x="50%" y="20%" delay={0.15} />
      <Crumb x="30%" y="40%" delay={0.25} />
      <Crumb x="70%" y="60%" delay={0.35} />
      <Crumb x="45%" y="80%" delay={0.2} />
    </div>
  );
}

function Crumb({ x, y, delay }: { x: string, y: string, delay: number }) {
  return (
    <motion.div
      className="absolute size-1.5 rounded-full bg-[#C28742]"
      style={{ left: x, top: y }}
      initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
      animate={{ 
        scale: [0, 1, 0.5, 0], 
        opacity: [0, 1, 1, 0],
        x: [0, Math.random() * 20 - 10, Math.random() * 30 - 15],
        y: [0, Math.random() * -20 - 10, Math.random() * 10 + 20]
      }}
      transition={{ duration: 1.5, repeat: Infinity, delay: delay }}
    />
  );
}
