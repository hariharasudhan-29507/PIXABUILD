"use client";

import { useState } from "react";
import { Plus, Search, Edit2, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { FURNITURE_CATALOG, FurnitureItem } from "@/data/furnitureData";
import { recordActivity } from "@/lib/supabase";

export default function AdminCatalogPage() {
  const [items, setItems] = useState<FurnitureItem[]>(FURNITURE_CATALOG);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "Sofa",
    price: 399,
    color: "Natural Oak",
    material: "Solid Oak",
    dimensions: "180 x 85 x 75 cm",
  });

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;

    const created: FurnitureItem = {
      item_id: "item-" + Date.now(),
      name: newItem.name,
      category: newItem.category,
      subcategory: `${newItem.category} Collection`,
      price: Number(newItem.price),
      is_sale: false,
      color: newItem.color,
      material: newItem.material,
      dimensions: newItem.dimensions,
      stock_note: "In Stock (Admin Added)",
      stock_count: 10,
      image_url: "/catalog/sofa_1.jpg",
      cutout_url: "/catalog/cutouts/sofa_1.png",
      thumbnail_url: "/catalog/sofa_1.jpg",
      description: "Custom architecturally curated furniture piece.",
      tags: [newItem.category.toLowerCase(), "custom", "curated"],
    };

    setItems([created, ...items]);
    recordActivity("ADMIN_CATALOG_ITEM_ADDED", { name: created.name, price: created.price });
    setModalOpen(false);
    setNewItem({ name: "", category: "Sofa", price: 399, color: "Natural Oak", material: "Solid Oak", dimensions: "180 x 85 x 75 cm" });
  };

  const removeItem = (id: string) => {
    if (confirm("Remove this item from catalog?")) {
      const updated = items.filter((i) => i.item_id !== id);
      setItems(updated);
      recordActivity("ADMIN_CATALOG_ITEM_REMOVED", { item_id: id });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <h1 className="text-2xl font-heading text-[#30352D]">
            CATALOG INVENTORY MANAGEMENT
          </h1>
          <p className="text-xs text-[#74736B]">
            Maintain physical dimensions, materials, pricing, and 3D depth parameters.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Furniture Item</span>
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8C7965]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items by name or category..."
          className="w-full text-xs rounded-lg border border-[var(--border-strong)] bg-[#FFFFFF] pl-9 pr-3 py-2 text-[#30352D]"
        />
      </div>

      <div className="pixa-card bg-[#FFFFFF] p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[#F7F5F0] text-[#8C7965] font-semibold">
                <th className="py-3 px-4">Preview</th>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Dimensions</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filtered.map((item) => (
                <tr key={item.item_id} className="hover:bg-[#F7F5F0]/50 transition-colors">
                  <td className="py-2 px-4">
                    <img src={item.image_url} alt={item.name} className="h-10 w-10 object-contain rounded bg-[#F7F5F0]" />
                  </td>
                  <td className="py-3 px-4 font-medium text-[#30352D]">{item.name}</td>
                  <td className="py-3 px-4 text-[#74736B]">{item.category}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[#74736B]">{item.dimensions}</td>
                  <td className="py-3 px-4 font-mono font-bold text-[#30352D]">${item.price.toFixed(2)}</td>
                  <td className="py-3 px-4 font-semibold text-[#78816A]">{item.stock_count}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => removeItem(item.item_id)}
                      className="p-1 text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="pixa-card bg-[#FFFFFF] max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-serif text-lg text-[#30352D]">Add Catalog Piece</h3>
              <button onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full border rounded p-2 bg-[#F7F5F0]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium mb-1">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full border rounded p-2 bg-[#F7F5F0]"
                  >
                    <option value="Sofa">Sofa</option>
                    <option value="Coffee Table">Coffee Table</option>
                    <option value="Display Cabinet">Display Cabinet</option>
                    <option value="Dining Chair">Dining Chair</option>
                    <option value="Bed Frame">Bed Frame</option>
                    <option value="Office Desk">Office Desk</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Price ($)</label>
                  <input
                    type="number"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                    className="w-full border rounded p-2 bg-[#F7F5F0]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium mb-1">Color Finish</label>
                  <input
                    type="text"
                    value={newItem.color}
                    onChange={(e) => setNewItem({ ...newItem, color: e.target.value })}
                    className="w-full border rounded p-2 bg-[#F7F5F0]"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Dimensions</label>
                  <input
                    type="text"
                    value={newItem.dimensions}
                    onChange={(e) => setNewItem({ ...newItem, dimensions: e.target.value })}
                    className="w-full border rounded p-2 bg-[#F7F5F0]"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary py-1.5 px-3">
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-1.5 px-4">
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
