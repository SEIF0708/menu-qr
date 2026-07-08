import { createFileRoute } from "@tanstack/react-router";
import { useMyRestaurant } from "@/lib/use-restaurant";
import { useTables, useCreateTable, useUpdateTable, useDeleteTable } from "@/lib/use-tables";
import { useTranslation } from "react-i18next";
import { useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Printer, Plus, Trash2, Edit2, Lock, Table as TableIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/tables")({
  component: TablesPage,
});

function TablesPage() {
  const { t } = useTranslation();
  const { data: restaurant } = useMyRestaurant();
  const { data: tables = [], isLoading } = useTables(restaurant?.id);
  const createTable = useCreateTable(restaurant?.id);
  const updateTable = useUpdateTable(restaurant?.id);
  const deleteTable = useDeleteTable(restaurant?.id);

  const [isCreating, setIsCreating] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newTableNumber, setNewTableNumber] = useState<number | "">("");

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName || newTableNumber === "" || !restaurant) return;

    const qr_identifier = `${restaurant.slug}-table-${newTableNumber}-${Math.random().toString(36).substring(2, 7)}`;
    
    try {
      await createTable.mutateAsync({
        name: newTableName,
        table_number: Number(newTableNumber),
        qr_identifier,
      });
      setIsCreating(false);
      setNewTableName("");
      setNewTableNumber("");
      toast.success("Table created successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to create table");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this table?")) return;
    try {
      await deleteTable.mutateAsync(id);
      toast.success("Table deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete table");
    }
  };

  const handleToggleActive = async (table: any) => {
    try {
      await updateTable.mutateAsync({ id: table.id, is_active: !table.is_active });
      toast.success(table.is_active ? "Table disabled" : "Table enabled");
    } catch (error: any) {
      toast.error(error.message || "Failed to update table");
    }
  };

  if (restaurant?.subscription_status === "unpaid") {
    return (
      <div className="max-w-4xl">
        <header className="mb-8">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">{t("nav.tables")}</p>
          <h1 className="text-3xl font-display font-bold">{t("tables.title")}</h1>
        </header>
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-8 flex flex-col items-center text-center">
           <Lock className="size-12 mb-4 text-orange-500" />
           <h2 className="text-xl font-bold mb-2 text-orange-900">{t("tables.disabled")}</h2>
           <p className="max-w-md text-orange-800">{t("tables.disabledHint")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">{t("nav.tables")}</p>
          <h1 className="text-3xl font-display font-bold">{t("tables.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("tables.subtitle")}</p>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            <Plus className="size-4" /> {t("tables.addTable")}
          </button>
        )}
      </header>

      {isCreating && (
        <div className="bg-card border border-border p-6 rounded-2xl mb-8 shadow-sm animate-fade-in">
          <h2 className="text-lg font-bold mb-4">{t("tables.createTable")}</h2>
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium mb-1.5">{t("tables.tableName")}</label>
              <input
                type="text"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:outline-none"
                placeholder={t("tables.tableNamePlaceholder")}
              />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium mb-1.5">{t("tables.tableNumber")}</label>
              <input
                type="number"
                value={newTableNumber}
                onChange={(e) => setNewTableNumber(e.target.value ? Number(e.target.value) : "")}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:outline-none"
                placeholder={t("tables.numberPlaceholder")}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
              <button type="button" onClick={() => setIsCreating(false)} className="flex-1 px-5 py-2.5 rounded-xl font-medium border border-border hover:bg-muted transition-colors">
                {t("tables.cancel")}
              </button>
              <button type="submit" disabled={createTable.isPending} className="flex-1 px-5 py-2.5 rounded-xl font-medium bg-primary text-primary-foreground disabled:opacity-50 transition-colors">
                {createTable.isPending ? t("tables.creating") : t("tables.save")}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Loading tables...</div>
      ) : tables.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 border border-dashed border-border rounded-2xl">
          <TableIcon className="size-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="font-display font-bold text-lg mb-1">{t("tables.empty")}</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">{t("tables.emptyHint")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map((table) => (
            <TableCard key={table.id} table={table} origin={origin} restaurantSlug={restaurant?.slug} onDelete={() => handleDelete(table.id)} onToggleActive={() => handleToggleActive(table)} />
          ))}
        </div>
      )}
    </div>
  );
}

function TableCard({ table, origin, restaurantSlug, onDelete, onToggleActive }: any) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const url = `${origin}/menu/${restaurantSlug}?table=${table.qr_identifier}`;

  const download = () => {
    const canvas = ref.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `table-${table.table_number}-${restaurantSlug}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };
  
  const printQr = () => {
    const canvas = ref.current?.querySelector("canvas");
    if (!canvas) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Print QR - Table ${table.table_number}</title></head>
          <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;">
            <h1 style="font-family:sans-serif;margin-bottom:20px;">Table ${table.table_number}</h1>
            <img src="${canvas.toDataURL("image/png")}" style="width:300px;height:300px;"/>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  return (
    <div className={cn("bg-card border rounded-2xl p-5 flex flex-col transition-colors", table.is_active ? "border-border" : "border-muted-foreground/30 opacity-70")}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg">{table.name}</h3>
          <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded mt-1 inline-block">Table {table.table_number}</span>
        </div>
        <div className="flex gap-1">
           <button onClick={onToggleActive} className="p-2 text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors" title={table.is_active ? "Disable Table" : "Enable Table"}>
             <span className={cn("size-2.5 rounded-full inline-block", table.is_active ? "bg-green-500" : "bg-red-500")} />
           </button>
           <button onClick={onDelete} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors" title="Delete Table">
             <Trash2 className="size-4" />
           </button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center my-4">
        <div ref={ref} className={cn("bg-white p-4 rounded-xl shadow-sm border border-border", !table.is_active && "opacity-50 grayscale")}>
          <QRCodeCanvas value={url} size={150} fgColor="#000" level="H" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mt-auto">
        <button onClick={download} disabled={!table.is_active} className="inline-flex justify-center items-center gap-2 bg-muted text-foreground px-3 py-2 rounded-xl text-xs font-medium hover:bg-muted/80 transition-colors disabled:opacity-50">
          <Download className="size-3.5" /> {t("tables.download")}
        </button>
        <button onClick={printQr} disabled={!table.is_active} className="inline-flex justify-center items-center gap-2 bg-muted text-foreground px-3 py-2 rounded-xl text-xs font-medium hover:bg-muted/80 transition-colors disabled:opacity-50">
          <Printer className="size-3.5" /> {t("tables.print")}
        </button>
      </div>
    </div>
  );
}
