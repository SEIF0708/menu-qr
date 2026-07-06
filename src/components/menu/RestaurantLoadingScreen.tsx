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

const SliceSVG = ({ index }: { index: number }) => {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 overflow-visible drop-shadow-sm">
      <defs>
        <filter id="crust-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.2" />
        </filter>
      </defs>
      <g transform="translate(50, 50)">
        {/* Crust */}
        <path d="M 0 0 L -24 -41.57 A 48 48 0 0 1 24 -41.57 Z" fill="#E89B53" stroke="#C47335" strokeWidth="1" strokeLinejoin="round" filter="url(#crust-shadow)" />
        {/* Cheese */}
        <path d="M 0 0 L -22 -38.1 A 44 44 0 0 1 22 -38.1 Z" fill="#FFB300" />
        {/* Cheese highlight */}
        <path d="M 0 0 L -18 -31.1 A 36 36 0 0 1 18 -31.1 Z" fill="#FFCA28" />

        {/* Toppings based on index */}
        {index % 2 === 0 ? (
          <>
            <circle cx="-8" cy="-28" r="4.5" fill="#D32F2F" />
            <circle cx="10" cy="-22" r="5" fill="#C62828" />
            <circle cx="2" cy="-12" r="3.5" fill="#D32F2F" />
            {/* Basil */}
            <path d="M -12 -18 Q -16 -16 -12 -12 Q -8 -16 -12 -18 Z" fill="#2E7D32" />
          </>
        ) : (
          <>
            <circle cx="-10" cy="-20" r="4" fill="#C62828" />
            <circle cx="6" cy="-28" r="4.5" fill="#D32F2F" />
            <circle cx="-2" cy="-18" r="3.5" fill="#C62828" />
            {/* Olive */}
            <circle cx="12" cy="-14" r="2.5" fill="#212121" />
            <circle cx="12" cy="-14" r="1" fill="#424242" />
          </>
        )}
      </g>
    </svg>
  );
};

function PizzaSpinner() {
  const [sliceSlots, setSliceSlots] = useState([1, 2, 3, 4, 5]);
  const [movingSliceIndex, setMovingSliceIndex] = useState(-1);

  useEffect(() => {
    let empty = 0;
    const interval = setInterval(() => {
      const targetSliceSlot = (empty - 1 + 6) % 6;
      setSliceSlots(prevSlots => {
        const nextSlots = [...prevSlots];
        const sliceToMoveIndex = nextSlots.findIndex(s => ((s % 6) + 6) % 6 === targetSliceSlot);
        if (sliceToMoveIndex !== -1) {
          nextSlots[sliceToMoveIndex] += 1;
          setMovingSliceIndex(sliceToMoveIndex);
        }
        return nextSlots;
      });
      empty = targetSliceSlot;
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative size-32 sm:size-40 mb-8 rounded-full shadow-inner p-2">
      {sliceSlots.map((slot, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 origin-center"
          initial={false}
          animate={{ 
            rotate: slot * 60,
            scale: movingSliceIndex === i ? [1, 1.15, 1] : 1,
            zIndex: movingSliceIndex === i ? 10 : 1,
          }}
          transition={{ 
            rotate: { type: "spring", stiffness: 80, damping: 12 },
            scale: { duration: 0.6, ease: "easeInOut" }
          }}
        >
          <SliceSVG index={i} />
        </motion.div>
      ))}
    </div>
  );
}

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
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="min-h-dvh flex flex-col items-center justify-center bg-background fixed inset-0 z-[100] px-6"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.02 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="flex flex-col items-center max-w-sm w-full"
      >
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

        {/* Premium Custom Pizza Spinner */}
        <PizzaSpinner />

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
      </motion.div>
    </motion.div>
  );
}


