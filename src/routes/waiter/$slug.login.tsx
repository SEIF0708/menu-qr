import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Delete, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/waiter/$slug/login")({
  component: WaiterLogin,
});

function WaiterLogin() {
  const { slug } = Route.useParams();
  const { restaurant } = Route.useRouteContext() as { restaurant: any };
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePress = (num: string) => {
    setError("");
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length >= 4) {
        checkPin(newPin);
      }
    }
  };

  const handleDelete = () => {
    setError("");
    setPin(pin.slice(0, -1));
  };

  const checkPin = async (currentPin: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("waiters")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .eq("pin_code", currentPin)
        .eq("is_active", true)
        .single();

      if (error || !data) {
        if (currentPin.length >= 6 || (error?.code === "PGRST116")) {
           // Not found
           setError("Invalid PIN code");
           setPin("");
        }
      } else {
        // Success
        localStorage.setItem(`waiter_${restaurant.id}`, JSON.stringify({
          id: data.id,
          name: data.name
        }));
        navigate({ to: `/waiter/${slug}` });
      }
    } catch (err) {
      setError("Failed to verify PIN");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="size-16 bg-primary rounded-2xl mx-auto mb-4 grid place-items-center shadow-xl shadow-primary/20">
             <span className="text-primary-foreground font-display font-bold text-2xl italic">M</span>
          </div>
          <h1 className="text-2xl font-display font-bold">Waitstaff Portal</h1>
          <p className="text-muted-foreground">{restaurant.name}</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
           <div className="flex justify-center gap-3 mb-8">
             {[0, 1, 2, 3].map((i) => (
               <div 
                 key={i} 
                 className={`size-4 rounded-full transition-colors ${i < pin.length ? "bg-primary" : "bg-slate-200"}`}
               />
             ))}
           </div>

           {error && (
             <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-center justify-center gap-2 font-medium">
               <ShieldAlert className="size-4" />
               {error}
             </div>
           )}

           <div className="grid grid-cols-3 gap-4">
             {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
               <button
                 key={num}
                 onClick={() => handlePress(num.toString())}
                 disabled={isLoading}
                 className="h-16 text-2xl font-display font-bold rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 transition-colors"
               >
                 {num}
               </button>
             ))}
             <div />
             <button
                 onClick={() => handlePress("0")}
                 disabled={isLoading}
                 className="h-16 text-2xl font-display font-bold rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 transition-colors"
               >
                 0
               </button>
               <button
                 onClick={handleDelete}
                 disabled={isLoading || pin.length === 0}
                 className="h-16 flex items-center justify-center rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 transition-colors text-slate-500"
               >
                 <Delete className="size-6" />
               </button>
           </div>
        </div>
      </div>
    </div>
  );
}
