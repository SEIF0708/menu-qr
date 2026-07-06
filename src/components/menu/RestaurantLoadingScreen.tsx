import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSignedImage } from "@/lib/use-signed-image";
import LottieLib from "lottie-react";
import pizzaAnimation from "@/assets/pizza-animation.json";

// Safe interop for Vite/CommonJS default exports
const Lottie = (LottieLib as any).default || LottieLib;

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
  const [isClient, setIsClient] = useState(false);
  const logoUrl = useSignedImage(restaurantLogo);

  useEffect(() => {
    setIsClient(true);
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

        {/* Premium Pizza Lottie Animation */}
        <div className="relative size-32 sm:size-40 mb-8">
           {isClient && <Lottie animationData={pizzaAnimation} loop={true} className="w-full h-full drop-shadow-2xl" />}
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


