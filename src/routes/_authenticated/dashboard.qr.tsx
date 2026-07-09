import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMyRestaurant } from "@/lib/use-restaurant";
import { QRCodeCanvas } from "qrcode.react";
import { useRef } from "react";
import { Download, Printer, Copy, Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/qr")({ component: QrPage });

function QrPage() {
  const { t } = useTranslation();
  const { data: restaurant } = useMyRestaurant();
  const ref = useRef<HTMLDivElement>(null);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = restaurant ? `${origin}/menu/${restaurant.slug}` : "";

  const download = () => {
    const canvas = ref.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `bonplan-${restaurant?.slug}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };
  const print = () => window.print();
  const copy = async () => { await navigator.clipboard.writeText(url); toast.success(t("common.copied")); };

  if (restaurant?.subscription_status === "unpaid") {
    return (
      <div className="max-w-4xl">
        <header className="mb-8">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">{t("nav.qr")}</p>
          <h1 className="text-3xl font-display font-bold">{t("qr.title")}</h1>
        </header>
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-8 flex flex-col items-center text-center">
           <Lock className="size-12 mb-4 text-orange-500" />
           <h2 className="text-xl font-bold mb-2 text-orange-900">QR Code Disabled</h2>
           <p className="max-w-md text-orange-800">Your menu is currently inactive. Please upgrade your subscription to generate and download your QR code.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <header className="mb-8">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">{t("nav.qr")}</p>
        <h1 className="text-3xl font-display font-bold">{t("qr.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("qr.subtitle")}</p>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center print:border-0">
          <div ref={ref} className="bg-white p-6 rounded-xl border border-border">
            {url && <QRCodeCanvas value={url} size={240} fgColor="#4A1D1F" level="H" includeMargin />}
          </div>
          <p className="mt-4 text-xs font-mono text-muted-foreground break-all text-center">{url}</p>
          <div className="flex gap-2 mt-6 flex-wrap justify-center print:hidden">
            <button onClick={download} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium"><Download className="size-4" /> {t("qr.download")}</button>
            <button onClick={print} className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-full text-sm font-medium"><Printer className="size-4" /> {t("qr.print")}</button>
            <button onClick={copy} className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-full text-sm font-medium"><Copy className="size-4" /> {t("qr.copyLink")}</button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 print:hidden">
          <h3 className="font-display text-xl font-semibold mb-4">{t("qr.instructionsTitle")}</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3"><span className="font-mono text-accent">01</span> {t("qr.i1")}</li>
            <li className="flex gap-3"><span className="font-mono text-accent">02</span> {t("qr.i2")}</li>
            <li className="flex gap-3"><span className="font-mono text-accent">03</span> {t("qr.i3")}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
