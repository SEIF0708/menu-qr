import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/waiter/$slug")({
  beforeLoad: async ({ params: { slug } }) => {
    const { data: restaurant } = await supabase
      .from("restaurants_public")
      .select("*")
      .eq("slug", slug)
      .single();

    if (!restaurant) {
      throw redirect({ to: "/" });
    }

    return { restaurant };
  },
  component: WaiterLayout,
});

function WaiterLayout() {
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 font-sans">
      <Outlet />
    </div>
  );
}
