"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Settings2, 
  History, 
  LogOut,
  User,
  SlidersHorizontal,
  Box
} from "lucide-react";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Products", href: "/products", icon: Package },
  ];

  const operations = [
    { name: "Receipts", href: "/operations/receipts", icon: ArrowDownToLine },
    { name: "Deliveries", href: "/operations/deliveries", icon: ArrowUpFromLine },
    { name: "Transfers", href: "/operations/transfers", icon: Box },
    { name: "Adjustments", href: "/operations/adjustments", icon: SlidersHorizontal },
    { name: "Move History", href: "/operations/history", icon: History },
  ];

  const settings = [
    { name: "Warehouse", href: "/settings/warehouse", icon: Settings2 },
  ];

  const renderLinks = (items: { name: string; href: string; icon: any }[]) => {
    return items.map((item) => {
      const Icon = item.icon;
      const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
      
      return (
        <Link 
          key={item.href} 
          href={item.href} 
          className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
        >
          <Icon size={20} />
          <span>{item.name}</span>
        </Link>
      );
    });
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <Package size={28} />
        <div>Stock<span>Sense</span></div>
      </div>
      
      <nav className={styles.nav}>
        {renderLinks(navItems)}
        
        <div className={styles.sectionTitle}>Operations</div>
        {renderLinks(operations)}
        
        <div className={styles.sectionTitle}>Settings</div>
        {renderLinks(settings)}
      </nav>

      <div className={styles.profileSection}>
        <Link href="/profile" className={styles.navLink}>
          <User size={20} />
          <span>My Profile</span>
        </Link>
        <button className={styles.logoutBtn} onClick={() => window.location.href = '/'}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
