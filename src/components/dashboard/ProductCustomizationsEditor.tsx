import React, { useState } from "react";
import { Plus, Trash2, GripVertical, Settings2, Link } from "lucide-react";
import { useTranslation } from "react-i18next";
import { pickLocalized } from "@/lib/format";

export function SizesEditor({ sizes, setSizes }: { sizes: any[], setSizes: (s: any[]) => void }) {
  const { t } = useTranslation();
  
  const addSize = () => setSizes([...sizes, { name_en: "", name_fr: "", name_ar: "", price: 0, is_available: true, display_order: sizes.length }]);
  const updateSize = (idx: number, field: string, val: any) => {
    const next = [...sizes];
    next[idx] = { ...next[idx], [field]: val };
    setSizes(next);
  };
  const removeSize = (idx: number) => setSizes(sizes.filter((_, i) => i !== idx));

  return (
    <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border mt-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm flex items-center gap-2"><Settings2 className="size-4 text-primary" /> Product Sizes</h4>
        <button type="button" onClick={addSize} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 font-medium">+ Add Size</button>
      </div>
      
      {sizes.length === 0 && <p className="text-xs text-muted-foreground italic">No sizes added. Click 'Add Size' to create one.</p>}
      
      <div className="space-y-3">
        {sizes.map((s, idx) => (
          <div key={idx} className="flex flex-col sm:flex-row gap-3 bg-card p-3 rounded-lg border border-border items-start sm:items-center">
            <div className="flex-1 grid grid-cols-3 gap-2 w-full">
              <input placeholder="Name (EN) e.g. Large" value={s.name_en} onChange={e => updateSize(idx, "name_en", e.target.value)} className="w-full text-xs px-2 py-1.5 border border-border rounded bg-background" />
              <input placeholder="Name (FR)" value={s.name_fr} onChange={e => updateSize(idx, "name_fr", e.target.value)} className="w-full text-xs px-2 py-1.5 border border-border rounded bg-background" />
              <input placeholder="Name (AR)" dir="rtl" value={s.name_ar} onChange={e => updateSize(idx, "name_ar", e.target.value)} className="w-full text-xs px-2 py-1.5 border border-border rounded bg-background" />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input type="number" step="0.01" placeholder="Price" value={s.price} onChange={e => updateSize(idx, "price", Number(e.target.value))} className="w-20 text-xs px-2 py-1.5 border border-border rounded bg-background" />
              <button type="button" onClick={() => removeSize(idx)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded"><Trash2 className="size-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ModifiersEditor({ groups, setGroups }: { groups: any[], setGroups: (g: any[]) => void }) {
  const { t } = useTranslation();
  
  const addGroup = () => setGroups([...groups, { name_en: "", name_fr: "", name_ar: "", is_required: false, min_selections: 0, max_selections: null, display_order: groups.length, modifiers: [] }]);
  const updateGroup = (idx: number, field: string, val: any) => {
    const next = [...groups];
    next[idx] = { ...next[idx], [field]: val };
    setGroups(next);
  };
  const removeGroup = (idx: number) => setGroups(groups.filter((_, i) => i !== idx));

  const addMod = (gIdx: number) => {
    const next = [...groups];
    next[gIdx].modifiers = [...(next[gIdx].modifiers || []), { name_en: "", name_fr: "", name_ar: "", price: 0, is_available: true }];
    setGroups(next);
  };
  const updateMod = (gIdx: number, mIdx: number, field: string, val: any) => {
    const next = [...groups];
    next[gIdx].modifiers[mIdx] = { ...next[gIdx].modifiers[mIdx], [field]: val };
    setGroups(next);
  };
  const removeMod = (gIdx: number, mIdx: number) => {
    const next = [...groups];
    next[gIdx].modifiers = next[gIdx].modifiers.filter((_: any, i: number) => i !== mIdx);
    setGroups(next);
  };

  return (
    <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border mt-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm flex items-center gap-2"><Settings2 className="size-4 text-primary" /> Modifier Groups (Toppings, Options)</h4>
        <button type="button" onClick={addGroup} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 font-medium">+ Add Group</button>
      </div>

      {groups.length === 0 && <p className="text-xs text-muted-foreground italic">No modifier groups added.</p>}

      <div className="space-y-4">
        {groups.map((g, gIdx) => (
          <div key={gIdx} className="bg-card p-3 rounded-lg border border-border shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 grid sm:grid-cols-3 gap-2">
                <input placeholder="Group Name (EN) e.g. Choose Toppings" value={g.name_en} onChange={e => updateGroup(gIdx, "name_en", e.target.value)} className="w-full text-xs px-2 py-1.5 border border-border rounded bg-background font-medium" />
                <input placeholder="Group Name (FR)" value={g.name_fr} onChange={e => updateGroup(gIdx, "name_fr", e.target.value)} className="w-full text-xs px-2 py-1.5 border border-border rounded bg-background font-medium" />
                <input placeholder="Group Name (AR)" dir="rtl" value={g.name_ar} onChange={e => updateGroup(gIdx, "name_ar", e.target.value)} className="w-full text-xs px-2 py-1.5 border border-border rounded bg-background font-medium" />
              </div>
              <button type="button" onClick={() => removeGroup(gIdx)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded shrink-0"><Trash2 className="size-4" /></button>
            </div>
            
            <div className="flex flex-wrap gap-4 mb-4 bg-muted/50 p-2 rounded text-xs items-center">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={g.is_required} onChange={e => updateGroup(gIdx, "is_required", e.target.checked)} />
                Required
              </label>
              <div className="flex items-center gap-1.5">
                Min: <input type="number" min="0" value={g.min_selections} onChange={e => updateGroup(gIdx, "min_selections", Number(e.target.value))} className="w-12 px-1 py-0.5 border border-border rounded bg-background" />
              </div>
              <div className="flex items-center gap-1.5">
                Max (optional): <input type="number" min="1" value={g.max_selections || ""} onChange={e => updateGroup(gIdx, "max_selections", e.target.value ? Number(e.target.value) : null)} className="w-12 px-1 py-0.5 border border-border rounded bg-background" placeholder="Any" />
              </div>
            </div>

            <div className="space-y-2 pl-4 border-l-2 border-border/50">
              {(g.modifiers || []).map((m: any, mIdx: number) => (
                <div key={mIdx} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <div className="flex-1 grid grid-cols-3 gap-2 w-full">
                    <input placeholder="Option (EN) e.g. Extra Cheese" value={m.name_en} onChange={e => updateMod(gIdx, mIdx, "name_en", e.target.value)} className="w-full text-xs px-2 py-1.5 border border-border rounded bg-background" />
                    <input placeholder="Option (FR)" value={m.name_fr} onChange={e => updateMod(gIdx, mIdx, "name_fr", e.target.value)} className="w-full text-xs px-2 py-1.5 border border-border rounded bg-background" />
                    <input placeholder="Option (AR)" dir="rtl" value={m.name_ar} onChange={e => updateMod(gIdx, mIdx, "name_ar", e.target.value)} className="w-full text-xs px-2 py-1.5 border border-border rounded bg-background" />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs text-muted-foreground">+</span>
                    <input type="number" step="0.01" placeholder="Price" value={m.price} onChange={e => updateMod(gIdx, mIdx, "price", Number(e.target.value))} className="w-16 text-xs px-2 py-1.5 border border-border rounded bg-background" />
                    <button type="button" onClick={() => removeMod(gIdx, mIdx)} className="p-1 text-destructive hover:bg-destructive/10 rounded"><XIcon className="size-3" /></button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addMod(gIdx)} className="text-[11px] text-muted-foreground hover:text-primary mt-1">+ Add Option</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function XIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;
}

export function CrossSellsEditor({ crossSells, setCrossSells, availableProducts, lang }: { crossSells: any[], setCrossSells: (c: any[]) => void, availableProducts: any[], lang: string }) {
  const addLink = () => setCrossSells([...crossSells, { cross_sell_product_id: "", display_order: crossSells.length }]);
  const updateLink = (idx: number, id: string) => {
    const next = [...crossSells];
    next[idx].cross_sell_product_id = id;
    setCrossSells(next);
  };
  const removeLink = (idx: number) => setCrossSells(crossSells.filter((_, i) => i !== idx));

  return (
    <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border mt-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm flex items-center gap-2"><Link className="size-4 text-primary" /> Cross-Sells (Usually taken with)</h4>
        <button type="button" onClick={addLink} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 font-medium">+ Add Link</button>
      </div>

      {crossSells.length === 0 && <p className="text-xs text-muted-foreground italic">No products linked.</p>}

      <div className="space-y-2">
        {crossSells.map((c, idx) => (
          <div key={idx} className="flex gap-2">
            <select value={c.cross_sell_product_id} onChange={(e) => updateLink(idx, e.target.value)} className="flex-1 text-xs px-2 py-1.5 border border-border rounded bg-card">
              <option value="">Select a product...</option>
              {availableProducts.map(p => (
                <option key={p.id} value={p.id}>{pickLocalized(p, "name", lang) || "—"}</option>
              ))}
            </select>
            <button type="button" onClick={() => removeLink(idx)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded border border-transparent hover:border-destructive/20 bg-card"><Trash2 className="size-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
