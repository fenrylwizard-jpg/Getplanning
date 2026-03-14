import T from "@/components/T";
import { ShoppingCart, Package, Truck, ClipboardList, Search } from "lucide-react";

export default function AchatsTab() {
    return (
        <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="bg-[#080d1a]/80 border border-white/5 rounded-2xl p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />
                <div className="relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-4">
                        <ShoppingCart size={32} className="text-orange-400" />
                    </div>
                    <h3 className="text-xl font-black text-white mb-2"><T k="hub_achats" /></h3>
                    <p className="text-gray-400 text-sm max-w-md mx-auto"><T k="hub_achats_desc" /></p>
                </div>
            </div>

            {/* Placeholder Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { icon: Package, label: "hub_purchase_orders", desc: "hub_purchase_orders_desc", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
                    { icon: Truck, label: "hub_deliveries", desc: "hub_deliveries_desc", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                    { icon: Search, label: "hub_supplier_tracking", desc: "hub_supplier_tracking_desc", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
                ].map(({ icon: Icon, label, desc, color, bg, border }) => (
                    <div key={label} className={`${bg} border ${border} rounded-2xl p-6 flex flex-col items-center text-center`}>
                        <Icon size={28} className={`${color} mb-3`} />
                        <h4 className="text-sm font-bold text-white mb-1"><T k={label} /></h4>
                        <p className="text-xs text-gray-500"><T k={desc} /></p>
                    </div>
                ))}
            </div>

            {/* Coming Soon Table */}
            <div className="bg-[#080d1a]/80 border border-white/5 rounded-2xl p-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                    <ClipboardList size={16} className="text-orange-400" /> <T k="hub_order_list" />
                </h3>
                <div className="flex flex-col items-center justify-center py-12 opacity-40">
                    <ShoppingCart size={48} className="mb-3 text-gray-600" />
                    <p className="text-gray-500 text-sm font-bold"><T k="hub_coming_soon" /></p>
                    <p className="text-gray-600 text-xs mt-1"><T k="hub_achats_coming_desc" /></p>
                </div>
            </div>
        </div>
    );
}
