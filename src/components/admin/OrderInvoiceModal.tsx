import { useRef, useState, useEffect } from "react";
import { Printer, X, Download, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/cart";
import { orderLabel, type AdminOrder } from "@/lib/order-admin";
import { useBrandLogo } from "@/lib/brand";
import { useContactInfo } from "@/lib/contact";
import { toast } from "sonner";

export function OrderInvoiceModal({
  order,
  isOpen,
  onClose,
}: {
  order: AdminOrder;
  isOpen: boolean;
  onClose: () => void;
}) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const brand = useBrandLogo();
  const contact = useContactInfo();
  const [logoUrl, setLogoUrl] = useState<string>("/logo.png");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    if (brand.url && !brand.url.endsWith(".svg")) {
      setLogoUrl(brand.url);
    } else {
      setLogoUrl("/logo.png");
    }
  }, [brand.url]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current) return;
    setIsGeneratingPdf(true);
    const toastId = toast.loading("ইনভয়েস PDF তৈরি হচ্ছে...");

    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const element = invoiceRef.current;
      const invoiceCode = order.order_no ? String(order.order_no).padStart(4, "0") : order.id.slice(0, 8).toUpperCase();

      const opt = {
        margin: [6, 8, 6, 8], // mm (top, right, bottom, left)
        filename: `Invoice-INV-${invoiceCode}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          logging: false,
        },
        jsPDF: {
          unit: "mm" as const,
          format: "a4" as const,
          orientation: "portrait" as const,
        },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };

      await html2pdf().set(opt).from(element).save();
      toast.success("ইনভয়েস PDF সফলভাবে ডাউনলোড হয়েছে!", { id: toastId });
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("PDF তৈরি ব্যর্থ হয়েছে। অনুগ্রহ করে 'প্রিন্ট' অপশন ব্যবহার করুন।", { id: toastId });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const invoiceNo = `INV-${order.order_no ? String(order.order_no).padStart(4, "0") : order.id.slice(0, 8).toUpperCase()}`;
  const orderDate = new Date(order.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const orderTime = new Date(order.created_at).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      {/* Modal Container */}
      <div className="bg-background text-foreground border border-border w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[96vh] print:m-0 print:p-0 print:border-none print:shadow-none print:max-h-none print:w-full print:rounded-none">
        
        {/* Screen Action Bar (Hidden during print) */}
        <div className="p-3 sm:p-4 border-b border-border bg-card flex flex-wrap items-center justify-between gap-3 print:hidden sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              A4 Invoice
            </span>
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">
              ({orderLabel(order)})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isGeneratingPdf}
              onClick={handleDownloadPdf}
              className="gap-1.5 font-medium border-emerald-600/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>PDF তৈরি হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Download PDF</span>
                </>
              )}
            </Button>

            <Button
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 bg-stone-900 text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </Button>

            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full w-8 h-8">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable Preview Wrapper (Supports mobile/tab scrolling so A4 proportions stay true) */}
        <div className="overflow-x-auto overflow-y-auto bg-stone-100 dark:bg-stone-950 p-2 sm:p-6 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          {/* Printable & Downloadable A4 Sheet Container */}
          <div
            ref={invoiceRef}
            id="printable-invoice"
            className="w-[794px] min-w-[794px] min-h-[1100px] bg-white text-stone-900 p-10 sm:p-12 shadow-xl border border-stone-200/80 rounded-sm relative flex flex-col justify-between font-sans print:w-full print:min-w-0 print:min-h-0 print:p-0 print:border-none print:shadow-none print:rounded-none"
          >
            {/* Top Section */}
            <div>
              {/* Header: Brand Identity & Invoice Meta */}
              <div className="flex items-start justify-between gap-6 pb-6">
                {/* Brand Logo & Store Info */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-stone-50 border border-stone-200/80 rounded-xl p-1.5 flex items-center justify-center overflow-hidden">
                    <img
                      src={logoUrl}
                      alt="Ibn Mobarak Art Gallery"
                      className="w-full h-full object-contain"
                      crossOrigin="anonymous"
                      onError={() => setLogoUrl("/logo.png")}
                    />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-serif font-black tracking-tight text-stone-900 uppercase">
                      Ibn Mobarak Art Gallery
                    </h1>
                    <p className="text-xs font-semibold text-amber-700 tracking-wide mt-0.5">
                      প্রিমিয়াম ইসলামিক আর্ট, ক্যানভাস ও ক্যালিগ্রাফি সামগ্রী
                    </p>
                    <div className="mt-2 text-[11px] text-stone-600 space-y-0.5 leading-relaxed font-normal">
                      <p>{contact.address || "House 37/3, Rasulpur R/A, Donia, Jatrabari, Dhaka 1236"}</p>
                      <p>
                        Hotline:{" "}
                        <span className="font-semibold text-stone-800">
                          {contact.phone || "01677-870998"}
                        </span>
                        {contact.phoneSecondary ? ` | ${contact.phoneSecondary}` : " | 01780-283161"}
                      </p>
                      <p>Website: <span className="font-medium text-stone-800">ibnmobarak.art</span></p>
                    </div>
                  </div>
                </div>

                {/* Invoice Meta Box */}
                <div className="text-right shrink-0">
                  <div className="inline-block px-3 py-1 bg-stone-900 text-white rounded text-[11px] font-bold uppercase tracking-widest mb-2 print:border print:border-black print:text-black print:bg-transparent">
                    INVOICE / ক্যাশ মেমো
                  </div>
                  <div className="text-base font-bold text-stone-900 font-mono tracking-tight">
                    #{invoiceNo}
                  </div>
                  <div className="text-[11px] text-stone-600 mt-1">
                    তারিখ: <span className="font-semibold text-stone-800">{orderDate}</span> ({orderTime})
                  </div>
                  <div className="text-[11px] font-medium text-stone-700 mt-0.5">
                    পদ্ধতি: <span className="font-semibold text-stone-900">Cash on Delivery (COD)</span>
                  </div>
                  <div className="mt-2">
                    <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-stone-100 text-stone-800 border border-stone-300">
                      Status: {order.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Decorative Divider */}
              <div className="relative my-2">
                <div className="h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
                <span className="absolute left-1/2 -top-2 -translate-x-1/2 bg-white px-2 text-amber-700 text-[10px]">
                  ❖
                </span>
              </div>

              {/* Customer & Delivery Partition */}
              <div className="grid grid-cols-2 gap-4 my-6 p-4 rounded-xl bg-stone-50/70 border border-stone-200/80">
                {/* Customer Information */}
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-900/80 block mb-1">
                    BILL & SHIP TO (গ্রাহকের তথ্য)
                  </span>
                  <div className="text-sm font-bold text-stone-900">
                    {order.customer_name}
                  </div>
                  <div className="text-xs font-semibold text-stone-800 font-mono mt-0.5">
                    {order.customer_phone}
                  </div>
                  {order.customer_email ? (
                    <div className="text-[11px] text-stone-600 mt-0.5 font-mono">
                      {order.customer_email}
                    </div>
                  ) : null}
                  <div className="text-xs text-stone-700 mt-1.5 leading-relaxed">
                    {order.address}
                    {order.city ? `, ${order.city}` : ""}
                  </div>
                </div>

                {/* Delivery & Tracking Meta */}
                <div className="text-right flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-900/80 block mb-1">
                      DELIVERY & COURIER (ডেলিভারি ট্র্যাকিং)
                    </span>
                    {order.courier_consignment_id ? (
                      <div className="text-xs font-mono font-semibold text-stone-800">
                        Steadfast ID: #{order.courier_consignment_id}
                      </div>
                    ) : (
                      <div className="text-xs text-stone-500">
                        Courier: Standard Home Delivery
                      </div>
                    )}
                    {order.courier_tracking_code ? (
                      <div className="text-[11px] font-mono text-stone-600 mt-0.5">
                        Tracking: {order.courier_tracking_code}
                      </div>
                    ) : null}
                  </div>

                  {order.notes && (
                    <div className="mt-2 text-[11px] text-stone-700 bg-white p-2 rounded-lg border border-stone-200/80 text-left">
                      <span className="font-semibold text-stone-900">বিশেষ নোট:</span>{" "}
                      {order.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="mt-6 border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-stone-100 border-b border-stone-200 text-stone-700 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">আইটেম ও বিবরণ (Item Description)</th>
                      <th className="py-2.5 px-3 text-right">একক মূল্য</th>
                      <th className="py-2.5 px-3 text-center">পরিমাণ</th>
                      <th className="py-2.5 px-3 text-right">মোট টাকা</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {(order.items ?? []).map((item, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/50">
                        <td className="py-3 px-3 text-center text-stone-500 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-stone-900 text-xs">
                            {item.name}
                          </div>
                          {item.size ? (
                            <div className="inline-block mt-0.5 px-1.5 py-0.5 bg-stone-100 text-[10px] font-medium text-stone-600 rounded">
                              Size / ভ্যারিয়েন্ট: {item.size}
                            </div>
                          ) : null}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-stone-800">
                          {formatBDT(Number(item.price))}
                        </td>
                        <td className="py-3 px-3 text-center font-bold font-mono text-stone-900">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-3 text-right font-bold font-mono text-stone-900">
                          {formatBDT(Number(item.price) * Number(item.quantity))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation Box */}
              <div className="mt-5 flex justify-end">
                <div className="w-72 space-y-2 text-xs">
                  <div className="flex justify-between py-1 text-stone-600 border-b border-stone-100">
                    <span>Subtotal (আইটেম মূল্য)</span>
                    <span className="font-mono font-medium text-stone-800">
                      {formatBDT(Number(order.subtotal))}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 text-stone-600 border-b border-stone-100">
                    <span>Delivery Charge (ডেলিভারি চার্জ)</span>
                    <span className="font-mono font-medium text-stone-800">
                      {formatBDT(Number(order.delivery_fee))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 px-3.5 rounded-xl bg-stone-900 text-white font-bold text-sm print:bg-transparent print:text-black print:border-2 print:border-black mt-2 shadow-sm">
                    <span className="text-xs uppercase tracking-wide">সর্বমোট প্রদেয় / Total COD:</span>
                    <span className="font-mono text-base text-amber-300 print:text-black">
                      {formatBDT(Number(order.total))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section: Official Seal, Terms & Signature */}
            <div className="pt-8 border-t border-stone-200 mt-8">
              <div className="grid grid-cols-2 items-end gap-6">
                {/* Official Note & Assurance */}
                <div>
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>অফিসিয়াল অথেনটিক ইনভয়েস</span>
                  </div>
                  <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                    অনুগ্রহ করে ডেলিভারি ম্যানের সামনে পার্সেলটি চেক করে রিসিভ করুন।
                    যেকোনো অভিযোগ বা সহায়তার জন্য কল করুন:{" "}
                    <span className="font-semibold text-stone-800">
                      {contact.phone || "01677-870998"}
                    </span>
                  </p>
                  <p className="text-[10px] text-stone-500 mt-1 font-medium italic">
                    Ibn Mobarak Art Gallery-এর সাথে থাকার জন্য ধন্যবাদ!
                  </p>
                </div>

                {/* Signature Block */}
                <div className="text-right">
                  <div className="inline-block text-center">
                    <div className="w-44 border-b border-stone-400 pb-1 mb-1">
                      <span className="font-serif italic text-xs text-stone-400">
                        Ibn Mobarak
                      </span>
                    </div>
                    <div className="text-[10px] font-bold text-stone-700 uppercase tracking-wider">
                      Authorized Signature & Seal
                    </div>
                    <div className="text-[9px] text-stone-500">
                      (কর্তৃপক্ষের স্বাক্ষর ও সিল)
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Micro Footer */}
              <div className="mt-6 pt-3 border-t border-stone-100 text-center text-[10px] text-stone-400 tracking-wider">
                Ibn Mobarak Art Gallery • House 37/3, Rasulpur R/A, Donia, Jatrabari, Dhaka 1236 • Web: www.ibnmobarak.art
              </div>
            </div>
          </div>
        </div>

        {/* Global Print Styles */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body {
                background: #ffffff !important;
                color: #000000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body * {
                visibility: hidden;
              }
              #printable-invoice, #printable-invoice * {
                visibility: visible;
              }
              #printable-invoice {
                position: absolute;
                left: 0;
                top: 0;
                width: 100% !important;
                max-width: 100% !important;
                min-width: 0 !important;
                margin: 0 !important;
                padding: 10mm 12mm !important;
                border: none !important;
                box-shadow: none !important;
                background: #ffffff !important;
              }
              @page {
                size: A4 portrait;
                margin: 0;
              }
            }
          `
        }} />
      </div>
    </div>
  );
}

