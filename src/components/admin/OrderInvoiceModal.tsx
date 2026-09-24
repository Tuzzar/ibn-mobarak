import { useRef } from "react";
import { Printer, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/cart";
import { orderLabel, type AdminOrder } from "@/lib/order-admin";

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

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      {/* Container - hide screen buttons during print */}
      <div className="bg-background text-foreground border border-border w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[95vh] print:m-0 print:p-0 print:border-none print:shadow-none print:max-h-none print:w-full print:rounded-none">
        {/* Screen Action Bar (Hidden in print) */}
        <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-gold font-bold">
              Invoice Preview
            </span>
            <span className="text-xs text-muted-foreground">
              ({orderLabel(order)})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Printer className="w-4 h-4" /> Print Invoice
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Printable Invoice Area */}
        <div
          ref={invoiceRef}
          className="p-8 sm:p-12 overflow-y-auto print:overflow-visible bg-white text-stone-900 font-sans print:p-0 print:text-black"
          id="printable-invoice"
        >
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-6 pb-6 border-b border-stone-200">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-stone-900">
                IBN MOBARAK ART GALLERY
              </h1>
              <p className="text-xs text-stone-600 font-medium mt-0.5">
                প্রিমিয়াম ইসলামিক আর্ট, ক্যানভাস ও ক্যালিগ্রাফি সামগ্রী
              </p>
              <div className="mt-2 text-xs text-stone-600 space-y-0.5 leading-relaxed">
                <p>House 37/3, Rasulpur R/A, Donia, Jatrabari, Dhaka 1236</p>
                <p>
                  Hotline:{" "}
                  <span className="font-semibold text-stone-800">
                    01677-870998
                  </span>{" "}
                  | 01780-283161
                </p>
                <p>Website: ibnmobarak.art</p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block px-3 py-1 bg-stone-900 text-white rounded text-xs font-bold uppercase tracking-widest mb-2 print:border print:border-black print:text-black print:bg-transparent">
                INVOICE / ক্যাশ মেমো
              </div>
              <div className="text-sm font-semibold text-stone-900 font-mono">
                #{invoiceNo}
              </div>
              <div className="text-xs text-stone-600 mt-1">
                Date: {orderDate} ({orderTime})
              </div>
              <div className="text-xs font-medium text-stone-700 mt-1">
                Payment: Cash on Delivery (COD)
              </div>
            </div>
          </div>

          {/* Customer / Bill To Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 p-4 rounded-xl bg-stone-50 border border-stone-200 print:bg-transparent print:border-stone-300">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 block mb-1">
                Bill & Ship To (গ্রাহকের তথ্য)
              </span>
              <div className="text-base font-bold text-stone-900">
                {order.customer_name}
              </div>
              <div className="text-sm font-semibold text-stone-800 font-mono mt-0.5">
                {order.customer_phone}
              </div>
              <div className="text-xs text-stone-700 mt-1 leading-relaxed">
                {order.address}
                {order.city ? `, ${order.city}` : ""}
              </div>
            </div>

            <div className="sm:text-right flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 block mb-1">
                  Order Status & Delivery
                </span>
                <span className="inline-block px-2.5 py-0.5 text-xs font-semibold uppercase rounded bg-stone-200 text-stone-800 print:border print:border-stone-400">
                  {order.status}
                </span>
                {order.courier_consignment_id ? (
                  <div className="mt-2 text-xs font-mono text-stone-700">
                    Steadfast: #{order.courier_consignment_id}
                  </div>
                ) : null}
              </div>
              {order.notes && (
                <div className="mt-2 text-xs italic text-stone-600 bg-white/80 p-2 rounded border border-stone-200 print:border-stone-300 text-left">
                  <span className="font-semibold not-italic">Note:</span>{" "}
                  {order.notes}
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="mt-6 border border-stone-200 rounded-xl overflow-hidden print:border-stone-300">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-stone-100 border-b border-stone-200 text-stone-700 font-bold uppercase tracking-wider text-[11px] print:bg-stone-50">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {(order.items ?? []).map((item, idx) => (
                  <tr key={idx} className="hover:bg-stone-50/50">
                    <td className="py-3 px-3 text-center text-stone-500 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-stone-900">
                        {item.name}
                      </div>
                      {item.size ? (
                        <div className="text-[11px] text-stone-500">
                          Size: {item.size}
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

          {/* Pricing Totals Box */}
          <div className="mt-5 flex justify-end">
            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between py-1 text-stone-600">
                <span>Subtotal (আইটেম মূল্য)</span>
                <span className="font-mono font-medium">
                  {formatBDT(Number(order.subtotal))}
                </span>
              </div>
              <div className="flex justify-between py-1 text-stone-600">
                <span>Delivery Charge (ডেলিভারি চার্জ)</span>
                <span className="font-mono font-medium">
                  {formatBDT(Number(order.delivery_fee))}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5 px-3 rounded-lg bg-stone-900 text-white font-bold text-sm print:bg-transparent print:text-black print:border-2 print:border-black mt-2">
                <span>Total COD / সর্বমোট:</span>
                <span className="font-mono text-base">
                  {formatBDT(Number(order.total))}
                </span>
              </div>
            </div>
          </div>

          {/* Notice & Signatures */}
          <div className="mt-12 pt-6 border-t border-stone-200 grid grid-cols-2 items-end text-xs text-stone-600">
            <div>
              <p className="font-medium text-stone-800">
                Ibn Mobarak Art Gallery-এর সাথে থাকার জন্য ধন্যবাদ!
              </p>
              <p className="text-[11px] text-stone-500 mt-1">
                ডেলিভারি সংক্রান্ত বা কোনো সমস্যা হলে কল করুন: 01677-870998
              </p>
            </div>
            <div className="text-right">
              <div className="inline-block border-t border-stone-400 pt-1.5 px-6 text-center text-[11px] font-semibold text-stone-700">
                Authorized Signature
              </div>
            </div>
          </div>
        </div>

        {/* Global Print Styles */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
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
                width: 100%;
                margin: 0;
                padding: 10mm;
              }
              @page {
                size: A4;
                margin: 10mm;
              }
            }
          `
        }} />
      </div>
    </div>
  );
}
