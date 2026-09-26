"use client";

import { useState } from "react";
import { Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Box, Filter } from "lucide-react";
import styles from "./dashboard.module.css";

export default function Dashboard() {
  const [filterType, setFilterType] = useState("All");

  const kpis = [
    { title: "Total Products", value: "1,245", icon: Package, color: "var(--info)" },
    { title: "Low Stock Items", value: "12", icon: AlertTriangle, color: "var(--warning)" },
    { title: "Pending Receipts", value: "8", icon: ArrowDownToLine, color: "var(--success)" },
    { title: "Pending Deliveries", value: "15", icon: ArrowUpFromLine, color: "var(--danger)" },
    { title: "Scheduled Transfers", value: "3", icon: Box, color: "var(--primary-color)" },
  ];

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Inventory Dashboard</h1>
          <p className={styles.subtitle}>Overview of your warehouse operations</p>
        </div>
      </header>

      <div className={styles.kpiGrid}>
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className={`card ${styles.kpiCard}`}>
              <div className={styles.kpiIconContainer} style={{ backgroundColor: `${kpi.color}15`, color: kpi.color }}>
                <Icon size={24} />
              </div>
              <div className={styles.kpiInfo}>
                <h3 className={styles.kpiTitle}>{kpi.title}</h3>
                <p className={styles.kpiValue}>{kpi.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.mainSection}>
        <div className={styles.filtersSection}>
          <div className={styles.filterHeader}>
            <Filter size={18} />
            <h2>Dynamic Filters</h2>
          </div>
          <div className={styles.filterGroup}>
            <label>Document Type</label>
            <select className="input-field" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option>All Types</option>
              <option>Receipts</option>
              <option>Delivery</option>
              <option>Internal</option>
              <option>Adjustments</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label>Status</label>
            <select className="input-field">
              <option>All Statuses</option>
              <option>Draft</option>
              <option>Waiting</option>
              <option>Ready</option>
              <option>Done</option>
              <option>Canceled</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label>Warehouse/Location</label>
            <select className="input-field">
              <option>All Locations</option>
              <option>Main Warehouse</option>
              <option>Production Floor</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label>Product Category</label>
            <select className="input-field">
              <option>All Categories</option>
              <option>Raw Materials</option>
              <option>Finished Goods</option>
            </select>
          </div>
        </div>

        <div className={`card ${styles.tableSection}`}>
          <div className={styles.tableHeader}>
            <h2>Recent Operations</h2>
            <button className="btn-secondary">View All</button>
          </div>
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>WH/IN/0001</td>
                  <td>Receipt</td>
                  <td><span className={styles.badge} data-status="done">Done</span></td>
                  <td>2 mins ago</td>
                </tr>
                <tr>
                  <td>WH/OUT/0045</td>
                  <td>Delivery</td>
                  <td><span className={styles.badge} data-status="ready">Ready</span></td>
                  <td>1 hour ago</td>
                </tr>
                <tr>
                  <td>WH/INT/0012</td>
                  <td>Internal</td>
                  <td><span className={styles.badge} data-status="waiting">Waiting</span></td>
                  <td>3 hours ago</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
