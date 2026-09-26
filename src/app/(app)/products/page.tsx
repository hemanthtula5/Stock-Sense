"use client";

import { useState, useEffect } from "react";
import { Plus, PackageSearch } from "lucide-react";
import styles from "./products.module.css";

type Product = {
  id: number;
  name: string;
  sku: string;
  category: string;
  unitOfMeasure: string;
  initialStock: number;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    unitOfMeasure: "",
    initialStock: "0",
  });

  const fetchProducts = async () => {
    const res = await fetch("/api/products");
    if (res.ok) {
      const data = await res.json();
      setProducts(data);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/products", {
      method: "POST",
      body: JSON.stringify(formData),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      setShowModal(false);
      setFormData({ name: "", sku: "", category: "", unitOfMeasure: "", initialStock: "0" });
      fetchProducts();
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Products</h1>
          <p className={styles.subtitle}>Manage your inventory catalog</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '5px' }} />
          New Product
        </button>
      </header>

      {products.length === 0 ? (
        <div className={styles.emptyState}>
          <PackageSearch size={64} className={styles.emptyIcon} />
          <h3>No products found</h3>
          <p>Get started by creating your first product.</p>
          <button className="btn-secondary" onClick={() => setShowModal(true)} style={{ marginTop: '1rem' }}>
            Create Product
          </button>
        </div>
      ) : (
        <div className="card">
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU / Code</th>
                  <th>Category</th>
                  <th>UoM</th>
                  <th>Initial Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className={styles.boldCell}>{p.name}</td>
                    <td>{p.sku}</td>
                    <td><span className={styles.badge}>{p.category}</span></td>
                    <td>{p.unitOfMeasure}</td>
                    <td className={styles.stockCell}>{p.initialStock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Create New Product</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Product Name</label>
                <input required type="text" className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label>SKU / Code</label>
                <input required type="text" className="input-field" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Category</label>
                  <input required type="text" className="input-field" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Unit of Measure</label>
                  <input required type="text" className="input-field" placeholder="e.g. kg, units" value={formData.unitOfMeasure} onChange={e => setFormData({...formData, unitOfMeasure: e.target.value})} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Initial Stock (Optional)</label>
                <input type="number" className="input-field" value={formData.initialStock} onChange={e => setFormData({...formData, initialStock: e.target.value})} />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
