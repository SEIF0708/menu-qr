import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMyRestaurant } from "@/lib/use-restaurant";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tag, Sparkles, Clock, Megaphone, ArrowUpRight, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { useAdminPromotions, useDeletePromotion, useCreatePromotion, useAdminRecommendations, useDeleteRecommendation, useCreateRecommendation } from "@/lib/promotions-service";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/dashboard/promotions")({
  component: PromotionsDashboard,
});

function PromotionsDashboard() {
  console.log("Promotions Dashboard Loaded");
  const { t } = useTranslation();
  const { data: restaurant } = useMyRestaurant();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-amber-500" />
          Promotions & Upselling
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage featured items, special combos, happy hours, and upselling rules.
        </p>
      </div>

      <Tabs defaultValue="banners" className="w-full">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="banners" className="gap-2">
            <Megaphone className="w-4 h-4" /> Banners
          </TabsTrigger>
          <TabsTrigger value="combos" className="gap-2">
            <Tag className="w-4 h-4" /> Combos
          </TabsTrigger>
          <TabsTrigger value="happy_hour" className="gap-2">
            <Clock className="w-4 h-4" /> Happy Hour
          </TabsTrigger>
          <TabsTrigger value="upselling" className="gap-2">
            <ArrowUpRight className="w-4 h-4" /> Upselling Rules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="banners" className="mt-6">
          <BannersTab restaurantId={restaurant?.id} />
        </TabsContent>
        <TabsContent value="combos" className="mt-6">
          <CombosTab restaurantId={restaurant?.id} />
        </TabsContent>
        <TabsContent value="happy_hour" className="mt-6">
          <HappyHourTab restaurantId={restaurant?.id} />
        </TabsContent>
        <TabsContent value="upselling" className="mt-6">
          <UpsellingTab restaurantId={restaurant?.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BannersTab({ restaurantId }: { restaurantId?: string }) {
  const { data: banners, isLoading } = useAdminPromotions(restaurantId, 'banner');
  const deleteMutation = useDeletePromotion();
  const createMutation = useCreatePromotion();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  const handleCreate = async () => {
    if (!title || !restaurantId) return;
    await createMutation.mutateAsync({
      restaurant_id: restaurantId,
      type: 'banner',
      title_en: title,
      description_en: desc,
      is_active: true
    });
    setOpen(false);
    setTitle("");
    setDesc("");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Promotional Banners</CardTitle>
          <CardDescription>Display a banner at the top of your menu.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> Create Banner
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Banner</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Free Dessert Weekend!" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. Get a free dessert with any main course." />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={!title || createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Banner"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading...</p>
        ) : banners?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No banners active. Create one to highlight a special offer.
          </div>
        ) : (
          <div className="space-y-4">
            {banners?.map(b => (
              <div key={b.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-semibold">{b.title_en}</h4>
                  <p className="text-sm text-muted-foreground">{b.description_en}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={b.is_active ? "default" : "secondary"}>
                    {b.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: b.id, restaurant_id: restaurantId! })}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CombosTab({ restaurantId }: { restaurantId?: string }) {
  const { data: combos, isLoading } = useAdminPromotions(restaurantId, 'combo');
  const deleteMutation = useDeletePromotion();
  const createMutation = useCreatePromotion();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");

  const handleCreate = async () => {
    if (!title || !price || !restaurantId) return;
    await createMutation.mutateAsync({
      restaurant_id: restaurantId,
      type: 'combo',
      title_en: title,
      description_en: desc,
      is_active: true,
      metadata_json: { price: Number(price) }
    });
    setOpen(false);
    setTitle("");
    setDesc("");
    setPrice("");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Combo Meals</CardTitle>
          <CardDescription>Group items together for a special price.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> Create Combo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Combo</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Combo Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Burger & Fries Meal" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. A classic cheeseburger with large fries and a drink." />
              </div>
              <div className="space-y-2">
                <Label>Combo Price</Label>
                <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={!title || !price || createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Combo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading...</p>
        ) : combos?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No combos created yet.
          </div>
        ) : (
          <div className="space-y-4">
            {combos?.map(c => (
              <div key={c.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-semibold">{c.title_en}</h4>
                  <p className="text-sm text-muted-foreground">{c.description_en}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: c.id, restaurant_id: restaurantId! })}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HappyHourTab({ restaurantId }: { restaurantId?: string }) {
  const { data: happyHours, isLoading } = useAdminPromotions(restaurantId, 'happy_hour');
  const deleteMutation = useDeletePromotion();
  const createMutation = useCreatePromotion();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [discount, setDiscount] = useState("");
  const [startHour, setStartHour] = useState("");
  const [endHour, setEndHour] = useState("");

  const handleCreate = async () => {
    if (!title || !discount || !startHour || !endHour || !restaurantId) return;
    
    // Convert times to dummy dates for today
    const [startH, startM] = startHour.split(":");
    const [endH, endM] = endHour.split(":");
    const startDate = new Date();
    startDate.setHours(Number(startH), Number(startM), 0, 0);
    const endDate = new Date();
    endDate.setHours(Number(endH), Number(endM), 0, 0);

    await createMutation.mutateAsync({
      restaurant_id: restaurantId,
      type: 'happy_hour',
      title_en: title,
      is_active: true,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      metadata_json: { discount_percent: Number(discount) }
    });
    setOpen(false);
    setTitle("");
    setDiscount("");
    setStartHour("");
    setEndHour("");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Happy Hours</CardTitle>
          <CardDescription>Automatically discount items during specific hours.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> Create Happy Hour
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Happy Hour</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Afternoon Special" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input type="time" value={startHour} onChange={e => setStartHour(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input type="time" value={endHour} onChange={e => setEndHour(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Discount Percentage (%)</Label>
                <Input type="number" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="e.g. 20" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={!title || !discount || !startHour || !endHour || createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Happy Hour"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading...</p>
        ) : happyHours?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No happy hours scheduled.
          </div>
        ) : (
          <div className="space-y-4">
            {happyHours?.map(h => (
              <div key={h.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-semibold">{h.title_en}</h4>
                  <p className="text-sm text-muted-foreground">
                    From {new Date(h.start_date!).toLocaleTimeString()} to {new Date(h.end_date!).toLocaleTimeString()}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: h.id, restaurant_id: restaurantId! })}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}



function UpsellingTab({ restaurantId }: { restaurantId?: string }) {
  const { data: recs, isLoading } = useAdminRecommendations(restaurantId);
  const deleteMutation = useDeleteRecommendation();
  const createMutation = useCreateRecommendation();
  const [open, setOpen] = useState(false);
  const [primaryId, setPrimaryId] = useState("");
  const [recId, setRecId] = useState("");

  const { data: products } = useQuery({
    enabled: !!restaurantId,
    queryKey: ["products-list", restaurantId],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name_en").eq("restaurant_id", restaurantId!);
      return data;
    }
  });

  const handleCreate = async () => {
    if (!primaryId || !recId || !restaurantId) return;
    await createMutation.mutateAsync({
      restaurant_id: restaurantId,
      primary_product_id: primaryId,
      recommended_product_id: recId,
    });
    setOpen(false);
    setPrimaryId("");
    setRecId("");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Upselling Rules</CardTitle>
          <CardDescription>Suggest "You may also like" products to customers.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Upselling Rule</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>When customer views this product:</Label>
                <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={primaryId} onChange={(e) => setPrimaryId(e.target.value)}>
                  <option value="">Select a product...</option>
                  {products?.map(p => <option key={p.id} value={p.id}>{p.name_en}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Recommend this product:</Label>
                <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={recId} onChange={(e) => setRecId(e.target.value)}>
                  <option value="">Select a product...</option>
                  {products?.map(p => <option key={p.id} value={p.id}>{p.name_en}</option>)}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={!primaryId || !recId || createMutation.isPending}>
                {createMutation.isPending ? "Adding..." : "Add Rule"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading...</p>
        ) : recs?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No upselling rules defined. Start recommending sides or drinks!
          </div>
        ) : (
          <div className="space-y-4">
            {recs?.map(r => (
              <div key={r.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="font-semibold">{r.primary_product?.name_en}</span>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                  <span className="text-amber-600 font-medium">{r.recommended_product?.name_en}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: r.id, restaurant_id: restaurantId! })}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
