import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart,
  Users,
  Package,
  Settings,
  LogOut,
  Search,
  Shirt,
  DollarSign,
  Truck,
  Clock,
  FileDown,
  Store,
  Layout,
  MapPin,
  Calendar,
  X,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Contact,
  Phone,
  Copy,
  Check
} from 'lucide-react';
import Login from './Login';
import Reports from './Reports';
import SuperAdminPanel from './SuperAdminPanel';
import Customers from './Customers';
import Drivers from './Drivers';
import SettingsPage from './Settings';
import Services from './Services';
import './App.css';

import { API_URL } from './config';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ totalOrders: 0, revenue: 0, pending: 0, washing: 0 });
  const [activeTab, setActiveTab] = useState('Overview');
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedField, setCopiedField] = useState(null);

  const [newOrder, setNewOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  // Create a simple notification beep sound using Web Audio API
  const audioRef = React.useRef(null);

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  useEffect(() => {
    // Initialize audio with a notification sound
    const audio = new Audio();
    audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi78OScTgwNUKXh8LdjHAU7k9nyz3kqBSh+zPLaizsKGGS56+mmVRILTKXh8bllHgU2jdXzzn0pBSh+zPDajzsKGGS56+mmVRILTKXh8bllHgU2jdXzzn0pBSh+zPDajzsKGGS56+mmVRILTKXh8bllHgU2jdXzzn0pBSh+zPDajzsKGGS56+mmVRILTKXh8bllHgU2jdXzzn0pBSh+zPDajzsKGGS56+mmVRILTKXh8bllHgU2jdXzzn0pBSh+zPDajzsKGGS56+mmVRILTKXh8bllHgU2jdXzzn0pBSh+zPDajzsKGGS56+mmVRILTKXh8bllHgU2jdXzzn0pBSh+zPDajzsKGGS56+mmVRILTKXh8bllHgU2jdXzzn0pBSh+zPDajzsKGGS56+mmVRILTKXh8bllHgU2jdXzzn0pBSh+zPDajzsKGGS56+mmVRIL';
    audioRef.current = audio;

    // FIX: Unlock audio on first user interaction
    const unlockAudio = () => {
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }).catch(e => console.log("Audio unlock failed", e));
      }
      document.removeEventListener('click', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);

    return () => document.removeEventListener('click', unlockAudio);
  }, []);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('gowash_token');
    const user = localStorage.getItem('gowash_user');

    if (token && user) {
      const userData = JSON.parse(user);
      if (userData.role === 'admin' || userData.role === 'superadmin') {
        setCurrentUser(userData);
        setIsAuthenticated(true);
        if (userData.role === 'superadmin') {
          setActiveTab('Laundries');
        }
      }
    }
  }, []);

  useEffect(() => {
    let interval;
    if (isAuthenticated) {
      fetchOrders(); // Initial fetch
      interval = setInterval(fetchOrders, 5000); // Poll every 5s
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAuthenticated, currentUser?.role]);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    if (user.role === 'superadmin') {
      setActiveTab('Laundries');
    } else {
      setActiveTab('Overview');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gowash_token');
    localStorage.removeItem('gowash_user');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setNewOrder(null);
    stopNotification(); // Stop any playing notification sound
    sessionStorage.removeItem('last_seen_order'); // Clear last seen order
  };

  const fetchOrders = async () => {
    try {
      const laundryId = currentUser?.laundry_id;
      const [ordersRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/orders`, { params: { role: currentUser?.role, laundryId } }),
        axios.get(`${API_URL}/stats/orders`, { params: { laundryId } })
      ]);

      if (ordersRes.data) {
        const fetchedOrders = ordersRes.data;
        setOrders(fetchedOrders);

        // Keep selected order updated with real-time driver/laundry status changes
        setSelectedOrder(prev => {
          if (!prev) return null;
          const updated = fetchedOrders.find(o => o.id === prev.id);
          return updated ? { ...prev, ...updated } : prev;
        });

        // Check for new pending orders (for both admin and superadmin)
        const pending = fetchedOrders.filter(o => o.status === 'Pending');
        if (pending.length > 0) {
          // Sort to get the latest by ID
          const latest = [...pending].sort((a, b) => b.id - a.id)[0];

          const lastSeen = sessionStorage.getItem('last_seen_order');
          if (!lastSeen || parseInt(lastSeen) < latest.id) {
            setNewOrder(latest);
            sessionStorage.setItem('last_seen_order', latest.id);
            playNotification();
          }
        }
      }

      if (statsRes.data) {
        const s = statsRes.data;
        setStats({
          totalOrders: s.totalOrders,
          revenue: s.totalRevenue,
          pending: s.pendingOrders,
          washing: s.activeOrders
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const playNotification = () => {
    try {
      if (audioRef.current) {
        audioRef.current.loop = true;
        audioRef.current.volume = 0.5;
        audioRef.current.play().catch(e => console.log("Audio play failed (interaction needed):", e));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const stopNotification = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.loop = false;
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      if (newOrder && newOrder.id === id) {
        setNewOrder(null);
        stopNotification();
      }
      await axios.patch(`${API_URL}/orders/${id}/status`, { status: newStatus });
      fetchOrders();
    } catch (error) {
      alert("Failed to update status");
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesFilter = filter === 'All' ? true : o.status === filter;
    if (!searchQuery.trim()) return matchesFilter;

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      String(o.id).includes(q) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
      (o.customerPhone && o.customerPhone.toLowerCase().includes(q)) ||
      (o.driverName && o.driverName.toLowerCase().includes(q)) ||
      (o.driverPhone && o.driverPhone.toLowerCase().includes(q)) ||
      (o.driverVehicleNumber && o.driverVehicleNumber.toLowerCase().includes(q)) ||
      (o.laundryName && o.laundryName.toLowerCase().includes(q)) ||
      (o.serviceName && o.serviceName.toLowerCase().includes(q)) ||
      (o.address && o.address.toLowerCase().includes(q));

    return matchesFilter && matchesSearch;
  });

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <Shirt size={32} />
            <div>
              <h1>GoWash</h1>
              <p>Admin Portal</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {currentUser?.role === 'superadmin' ? (
            <>
              <SidebarItem icon={<Package size={20} />} label="All Orders & Dispatch" active={activeTab === 'Orders' || activeTab === 'Overview'} onClick={() => setActiveTab('Orders')} />
              <SidebarItem icon={<Store size={20} />} label="Laundries" active={activeTab === 'Laundries'} onClick={() => setActiveTab('Laundries')} />
              <SidebarItem icon={<Users size={20} />} label="Customers" active={activeTab === 'Customers'} onClick={() => setActiveTab('Customers')} />
               <SidebarItem icon={<Truck size={20} />} label="Drivers" active={activeTab === 'Drivers'} onClick={() => setActiveTab('Drivers')} />
               <SidebarItem icon={<Shirt size={20} />} label="Services" active={activeTab === 'Services'} onClick={() => setActiveTab('Services')} />
               <SidebarItem icon={<FileDown size={20} />} label="Global Reports" active={activeTab === 'Reports'} onClick={() => setActiveTab('Reports')} />

              <SidebarItem icon={<Settings size={20} />} label="System Settings" active={activeTab === 'Settings'} onClick={() => setActiveTab('Settings')} />
            </>
          ) : (
            <>
              <SidebarItem icon={<BarChart size={20} />} label="Overview" active={activeTab === 'Overview'} onClick={() => setActiveTab('Overview')} />
               <SidebarItem icon={<Package size={20} />} label="Orders" active={activeTab === 'Orders'} onClick={() => setActiveTab('Orders')} />
               <SidebarItem icon={<Shirt size={20} />} label="Services" active={activeTab === 'Services'} onClick={() => setActiveTab('Services')} />
               <SidebarItem icon={<FileDown size={20} />} label="Reports" active={activeTab === 'Reports'} onClick={() => setActiveTab('Reports')} />

              <SidebarItem icon={<Settings size={20} />} label="Settings" active={activeTab === 'Settings'} onClick={() => setActiveTab('Settings')} />
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="header">
          <h2>{activeTab === 'Orders' ? 'Live Orders & Logistics Dispatch' : activeTab}</h2>
          <div className="header-actions">
            <div className="search-box-active">
              <Search size={18} color="#64748b" />
              <input
                type="text"
                placeholder="Search order #, customer, driver, plate..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeTab !== 'Orders' && activeTab !== 'Overview') {
                    setActiveTab('Orders');
                  }
                }}
              />
              {searchQuery && (
                <button className="clear-search-btn" onClick={() => setSearchQuery('')} title="Clear search">
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="user-info">
              <span className="user-name">{currentUser?.name}</span>
              <div className="user-avatar">{currentUser?.name?.charAt(0) || 'A'}</div>
            </div>
            <button className="mobile-logout-btn" onClick={handleLogout} title="Logout">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <div className="content-area">
          {activeTab === 'Laundries' && <SuperAdminPanel />}

          {activeTab === 'Overview' && (
            <>
              <div className="stats-grid">
                <StatCard title="Total Revenue" value={`LKR ${stats.revenue.toLocaleString()}`} icon={<DollarSign />} color="green" />
                <StatCard title="Total Orders" value={stats.totalOrders} icon={<Package />} color="blue" />
                <StatCard title="Pending Pickup" value={stats.pending} icon={<Truck />} color="yellow" />
                <StatCard title="In Processing" value={stats.washing} icon={<Clock />} color="purple" />
              </div>

              <div className="card">
                <div className="card-header">
                  <h3>Recent Orders</h3>
                  <button className="link-btn" onClick={() => setActiveTab('Orders')}>View All</button>
                </div>
                <OrdersTable orders={filteredOrders.slice(0, 5)} updateStatus={updateStatus} onView={setSelectedOrder} />
              </div>
            </>
          )}

          {activeTab === 'Orders' && (
            <div className="card">
              <div className="card-header filter-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div className="filter-buttons">
                  {['All', 'Pending', 'Confirmed', 'Pickup', 'Washing', 'Drying', 'Ready', 'Delivered', 'Cancelled'].map(status => (
                    <button
                      key={status}
                      onClick={() => setFilter(status)}
                      className={`filter-btn ${filter === status ? 'active' : ''}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
                {searchQuery && (
                  <div className="search-active-pill">
                    <Search size={13} />
                    <span>Search: "{searchQuery}" ({filteredOrders.length} found)</span>
                    <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'inherit' }}>
                      <X size={13} />
                    </button>
                  </div>
                )}
              </div>
              <OrdersTable orders={filteredOrders} updateStatus={updateStatus} onView={setSelectedOrder} />
            </div>
          )}

           {activeTab === 'Customers' && (
            <Customers currentUser={currentUser} />
          )}

          {activeTab === 'Services' && (
            <Services currentUser={currentUser} />
          )}

          {activeTab === 'Drivers' && (

            <Drivers currentUser={currentUser} />
          )}

          {activeTab === 'Reports' && (
            <Reports currentUser={currentUser} />
          )}

          {activeTab === 'Settings' && (
            <SettingsPage currentUser={currentUser} />
          )}
        </div>
      </main>

      {/* New Order Notification Modal - Only for admin users */}
      {newOrder && currentUser?.role === 'admin' && (
        <div className="modal-overlay">
          <div className="modal-content professional-modal">
            <div className="modal-header-professional">
              <div className="header-top">
                <div className="status-badge-new">
                  <AlertCircle size={14} /> NEW ORDER
                </div>
                <button
                  className="close-modal-btn-pro"
                  onClick={() => {
                    setNewOrder(null);
                    stopNotification();
                  }}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="order-number-large">
                <span>Order #</span>{newOrder.id}
              </div>
              <p className="order-time-ago">Just now</p>
            </div>

            <div className="modal-body-pro">
              <div className="customer-section">
                <div className="customer-avatar-pro">
                  {newOrder.customer_name?.charAt(0) || 'C'}
                </div>
                <div className="customer-info">
                  <h3>{newOrder.customer_name}</h3>
                  <p>Customer</p>
                </div>
                <div className="total-amount-badge">
                  LkR {newOrder.total_price}
                </div>
              </div>

              <div className="order-details-grid">
                <div className="detail-item-pro">
                  <div className="icon-box blue">
                    <Shirt size={18} />
                  </div>
                  <div className="detail-text">
                    <label>Service</label>
                    <p>{newOrder.serviceName} • {newOrder.items} Items</p>
                  </div>
                </div>

                <div className="detail-item-pro">
                  <div className="icon-box purple">
                    <Clock size={18} />
                  </div>
                  <div className="detail-text">
                    <label>Pickup Time</label>
                    <p>{newOrder.pickup_date}</p>
                    <p className="sub-text">{newOrder.pickup_time}</p>
                  </div>
                </div>

                <div className="detail-item-pro full-width">
                  <div className="icon-box green">
                    <MapPin size={18} />
                  </div>
                  <div className="detail-text">
                    <label>Delivery Address</label>
                    <p>{newOrder.address || 'No location provided'}</p>
                  </div>
                </div>
              </div>

              <div className="modal-actions-pro">
                <button
                  className="btn-pro btn-reject-pro"
                  onClick={() => {
                    updateStatus(newOrder.id, 'Cancelled');
                    setNewOrder(null);
                    stopNotification();
                  }}
                >
                  Decline Order
                </button>
                <button
                  className="btn-pro btn-accept-pro"
                  onClick={() => {
                    updateStatus(newOrder.id, 'Confirmed');
                    setNewOrder(null);
                    stopNotification();
                  }}
                >
                  Accept Order <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Investigation & Dispatch Modal (Uber / PickMe Level) */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content professional-modal investigation-modal" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header-professional" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
              <div className="header-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="status-badge-new" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.4)' }}>
                    🛺 DISPATCH & INVESTIGATION
                  </div>
                  <span className={`status-badge status-${(selectedOrder.status || '').toLowerCase()}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <button className="close-modal-btn-pro" onClick={() => setSelectedOrder(null)}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div className="order-number-large">
                    <span>Order #</span>{selectedOrder.id}
                  </div>
                  <p className="order-time-ago" style={{ marginTop: '4px' }}>
                    Created: {new Date(selectedOrder.created_at).toLocaleString()}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>Total Amount</span>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#38bdf8' }}>
                    LKR {selectedOrder.total_price}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-body-pro" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>

              {/* Escalation / In-Transit Delay Alert Banner */}
              {selectedOrder.rideStatus === 'picked_up' && ['Pending', 'Confirmed', 'Pickup'].includes(selectedOrder.status) ? (
                <div className="escalation-alert-banner">
                  <div className="escalation-icon-box">
                    <AlertCircle size={22} />
                  </div>
                  <div className="escalation-content">
                    <h4>⚠️ In-Transit Notice: Clothes Picked Up by Driver</h4>
                    <p>
                      Driver <strong>{selectedOrder.driverName || 'Assigned Driver'}</strong> ({selectedOrder.driverVehicleNumber || 'Tuk Tuk'}) collected the clothes from customer <strong>{selectedOrder.customer_name}</strong>, but <strong>{selectedOrder.laundryName || 'the laundry partner'}</strong> has not yet checked them into the washing facility.
                    </p>
                  </div>
                  {selectedOrder.driverPhone && (
                    <a href={`tel:${selectedOrder.driverPhone}`} className="escalation-btn">
                      <Phone size={14} /> Call Driver Now
                    </a>
                  )}
                </div>
              ) : selectedOrder.status === 'Ready' && selectedOrder.rideStatus !== 'completed' && selectedOrder.rideStatus !== 'delivered' ? (
                <div className="escalation-alert-banner info">
                  <div className="escalation-icon-box">
                    <CheckCircle size={22} />
                  </div>
                  <div className="escalation-content">
                    <h4>🧺 Laundry Processing Complete: Awaiting Return Dispatch</h4>
                    <p>
                      <strong>{selectedOrder.laundryName || 'The laundry'}</strong> has cleaned and packaged the order. Ready for return delivery to customer <strong>{selectedOrder.customer_name}</strong>.
                    </p>
                  </div>
                  {selectedOrder.driverPhone && (
                    <a href={`tel:${selectedOrder.driverPhone}`} className="escalation-btn" style={{ background: '#2563eb' }}>
                      <Phone size={14} /> Dispatch Driver
                    </a>
                  )}
                </div>
              ) : null}

              {/* Uber / PickMe Style Journey Tracker */}
              <div className="uber-journey-tracker">
                <div className="journey-header">
                  <h4>Live Order & Delivery Lifecycle</h4>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                    Current Phase: <strong style={{ color: '#0f172a' }}>{selectedOrder.status}</strong>
                  </span>
                </div>

                <div className="journey-stepper-row">
                  {/* Connecting track line with dynamic fill */}
                  <div className="journey-track-line">
                    <div
                      className="journey-track-progress"
                      style={{
                        width: selectedOrder.status === 'Delivered' ? '100%' :
                               selectedOrder.status === 'Ready' ? '82%' :
                               ['Washing', 'Drying'].includes(selectedOrder.status) ? '65%' :
                               selectedOrder.rideStatus === 'picked_up' ? '48%' :
                               selectedOrder.driverName ? '30%' : '10%'
                      }}
                    />
                  </div>

                  {/* Step 1: Placed */}
                  <div className="journey-step-item completed">
                    <div className="step-node-icon">
                      <CheckCircle size={16} />
                    </div>
                    <span className="step-label">Order Placed</span>
                  </div>

                  {/* Step 2: Driver Assigned */}
                  <div className={`journey-step-item ${selectedOrder.driverName ? 'completed' : 'active'}`}>
                    <div className="step-node-icon">
                      <Truck size={16} />
                    </div>
                    <span className="step-label">Driver Assigned</span>
                  </div>

                  {/* Step 3: Picked Up */}
                  <div className={`journey-step-item ${
                    selectedOrder.rideStatus === 'picked_up' || ['Washing', 'Drying', 'Ready', 'Delivered'].includes(selectedOrder.status)
                      ? 'completed'
                      : (selectedOrder.status === 'Pickup' ? 'active' : '')
                  }`}>
                    <div className="step-node-icon">
                      <Package size={16} />
                    </div>
                    <span className="step-label">Driver Picked Up</span>
                  </div>

                  {/* Step 4: At Laundry Hub */}
                  <div className={`journey-step-item ${
                    ['Washing', 'Drying', 'Ready', 'Delivered'].includes(selectedOrder.status)
                      ? 'completed'
                      : (selectedOrder.rideStatus === 'picked_up' ? 'active' : '')
                  }`}>
                    <div className="step-node-icon">
                      <Store size={16} />
                    </div>
                    <span className="step-label">At Laundry Hub</span>
                  </div>

                  {/* Step 5: Washing / Processing */}
                  <div className={`journey-step-item ${
                    ['Ready', 'Delivered'].includes(selectedOrder.status)
                      ? 'completed'
                      : (['Washing', 'Drying'].includes(selectedOrder.status) ? 'active' : '')
                  }`}>
                    <div className="step-node-icon">
                      <Shirt size={16} />
                    </div>
                    <span className="step-label">Washing & Care</span>
                  </div>

                  {/* Step 6: Delivered */}
                  <div className={`journey-step-item ${selectedOrder.status === 'Delivered' ? 'completed' : ''}`}>
                    <div className="step-node-icon">
                      <CheckCircle size={16} />
                    </div>
                    <span className="step-label">Delivered</span>
                  </div>
                </div>
              </div>

              {/* Tri-Party Logistics Cards (Driver, Laundry Hub, Customer) */}
              <div className="tri-party-grid">

                {/* 1. Driver Card */}
                <div className="logistics-party-card">
                  <div>
                    <div className="party-card-header">
                      <div className="party-tag">
                        <Truck size={14} /> Assigned Driver
                      </div>
                      <span className="party-badge-pill driver">
                        {selectedOrder.driverOperationalStatus ? selectedOrder.driverOperationalStatus.toUpperCase() : (selectedOrder.driverName ? 'ASSIGNED' : 'UNASSIGNED')}
                      </span>
                    </div>

                    <div className="party-avatar-row">
                      <div className="party-avatar driver-av">
                        {selectedOrder.driverName ? selectedOrder.driverName.charAt(0) : '🛺'}
                      </div>
                      <div className="party-names">
                        <h4>{selectedOrder.driverName || 'No Driver Assigned'}</h4>
                        <p className="party-subtext">
                          {selectedOrder.driverVehicleType || 'Tuk Tuk'} • ⭐ {selectedOrder.driverRating || '4.9'}
                        </p>
                      </div>
                    </div>

                    <div className="party-meta-list">
                      <div className="party-meta-row">
                        <span style={{ fontWeight: 600 }}>Plate:</span>
                        {selectedOrder.driverVehicleNumber ? (
                          <span className="driver-plate-tag">{selectedOrder.driverVehicleNumber}</span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>Pending</span>
                        )}
                      </div>
                      <div className="party-meta-row">
                        <span style={{ fontWeight: 600 }}>Ride:</span>
                        <span className={`driver-status-chip ${selectedOrder.rideStatus || 'unassigned'}`}>
                          {selectedOrder.rideStatus ? selectedOrder.rideStatus.replace('_', ' ').toUpperCase() : 'NO ACTIVE RIDE'}
                        </span>
                      </div>
                      <div className="party-meta-row">
                        <Phone size={13} />
                        <span>{selectedOrder.driverPhone || 'No phone registered'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="party-call-actions">
                    {selectedOrder.driverPhone ? (
                      <>
                        <a href={`tel:${selectedOrder.driverPhone}`} className="btn-party-call">
                          <Phone size={14} /> Call Driver
                        </a>
                        <button
                          className="btn-party-copy"
                          onClick={() => copyToClipboard(selectedOrder.driverPhone, 'driver')}
                          title="Copy Phone"
                        >
                          {copiedField === 'driver' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                        </button>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', padding: '6px' }}>
                        Driver not assigned yet
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Laundry Hub Card */}
                <div className="logistics-party-card">
                  <div>
                    <div className="party-card-header">
                      <div className="party-tag">
                        <Store size={14} /> Laundry Hub
                      </div>
                      <span className="party-badge-pill laundry">
                        PARTNER
                      </span>
                    </div>

                    <div className="party-avatar-row">
                      <div className="party-avatar laundry-av">
                        {selectedOrder.laundryName ? selectedOrder.laundryName.charAt(0) : '🧺'}
                      </div>
                      <div className="party-names">
                        <h4>{selectedOrder.laundryName || 'Central Hub'}</h4>
                        <p className="party-subtext">
                          Mgr: {selectedOrder.laundryManager || 'Branch Head'}
                        </p>
                      </div>
                    </div>

                    <div className="party-meta-list">
                      <div className="party-meta-row">
                        <MapPin size={13} />
                        <span style={{ fontSize: '11.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {selectedOrder.laundryAddress || 'Colombo'}
                        </span>
                      </div>
                      <div className="party-meta-row">
                        <Phone size={13} />
                        <span>{selectedOrder.laundryPhone || '0112345678'}</span>
                      </div>
                      <div className="party-meta-row">
                        <Clock size={13} />
                        <span style={{ fontSize: '11.5px', color: '#64748b' }}>Facility: Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="party-call-actions">
                    {selectedOrder.laundryPhone ? (
                      <>
                        <a href={`tel:${selectedOrder.laundryPhone}`} className="btn-party-call">
                          <Phone size={14} /> Call Hub
                        </a>
                        <button
                          className="btn-party-copy"
                          onClick={() => copyToClipboard(selectedOrder.laundryPhone, 'laundry')}
                          title="Copy Phone"
                        >
                          {copiedField === 'laundry' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                        </button>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', padding: '6px' }}>
                        No phone registered
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Customer Card */}
                <div className="logistics-party-card">
                  <div>
                    <div className="party-card-header">
                      <div className="party-tag">
                        <Users size={14} /> Customer Client
                      </div>
                      <span className="party-badge-pill customer">
                        CLIENT
                      </span>
                    </div>

                    <div className="party-avatar-row">
                      <div className="party-avatar customer-av">
                        {selectedOrder.customer_name ? selectedOrder.customer_name.charAt(0) : 'C'}
                      </div>
                      <div className="party-names">
                        <h4>{selectedOrder.customer_name || `User #${selectedOrder.user_id}`}</h4>
                        <p className="party-subtext">{selectedOrder.customerEmail || 'Registered Customer'}</p>
                      </div>
                    </div>

                    <div className="party-meta-list">
                      <div className="party-meta-row">
                        <Phone size={13} />
                        <span>{selectedOrder.customerPhone || 'No phone registered'}</span>
                      </div>
                      <div className="party-meta-row">
                        <MapPin size={13} />
                        <span style={{ fontSize: '11.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {selectedOrder.address || 'Colombo Area'}
                        </span>
                      </div>
                      <div className="party-meta-row">
                        <Calendar size={13} />
                        <span style={{ fontSize: '11.5px' }}>{selectedOrder.pickup_date} ({selectedOrder.pickup_time})</span>
                      </div>
                    </div>
                  </div>

                  <div className="party-call-actions">
                    {selectedOrder.customerPhone ? (
                      <>
                        <a href={`tel:${selectedOrder.customerPhone}`} className="btn-party-call">
                          <Phone size={14} /> Call Customer
                        </a>
                        <button
                          className="btn-party-copy"
                          onClick={() => copyToClipboard(selectedOrder.customerPhone, 'customer')}
                          title="Copy Phone"
                        >
                          {copiedField === 'customer' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                        </button>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', padding: '6px' }}>
                        No phone registered
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Itemized Order Breakdown */}
              <div className="order-items-detail card" style={{ margin: 0 }}>
                <div className="card-header" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>
                    Items & Package Details ({selectedOrder.serviceName})
                  </h4>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{selectedOrder.items} items listed</span>
                </div>
                <div className="items-list-pro" style={{ padding: '10px' }}>
                  {selectedOrder.itemsList && selectedOrder.itemsList.length > 0 ? (
                    selectedOrder.itemsList.map((item, idx) => (
                      <div key={idx} className="item-row-pro" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: idx === selectedOrder.itemsList.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: '600', fontSize: '14px' }}>
                            {item.item_name} <span style={{ color: '#64748b', fontWeight: '400' }}>x {item.quantity} {item.pieces ? `(${item.pieces} pc)` : ''}</span>
                          </p>
                          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>LKR {item.price_per_unit} per unit</p>
                        </div>
                        <p style={{ margin: 0, fontWeight: '700', color: 'var(--primary)' }}>LKR {item.total_price}</p>
                      </div>
                    ))
                  ) : (
                    <p style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', margin: 0 }}>Standard laundry service bundle</p>
                  )}
                  {selectedOrder.delivery_fee > 0 && (
                    <div className="item-row-pro" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f8fafc', borderTop: '1px dashed #cbd5e1' }}>
                      <p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: '#64748b' }}>Tuk Delivery & Logistics Fee</p>
                      <p style={{ margin: 0, fontWeight: '700', color: 'var(--primary)' }}>LKR {selectedOrder.delivery_fee}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Notes if any */}
              {selectedOrder.notes && (
                <div style={{ background: '#fef3c7', padding: '12px 16px', borderRadius: '12px', border: '1px solid #fde68a', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <AlertCircle size={18} color="#d97706" />
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#92400e', display: 'block' }}>Customer Instructions</span>
                    <span style={{ fontSize: '13px', color: '#78350f' }}>{selectedOrder.notes}</span>
                  </div>
                </div>
              )}

              {/* Super Admin Status Management in Modal */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', display: 'block' }}>Override Order Status</span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Change lifecycle state if discrepancy is resolved</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select
                    className="status-select"
                    value={selectedOrder.status}
                    onChange={(e) => {
                      const newSt = e.target.value;
                      updateStatus(selectedOrder.id, newSt);
                      setSelectedOrder(prev => ({ ...prev, status: newSt }));
                    }}
                    style={{ fontSize: '13px', padding: '8px 12px' }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Pickup">Pickup</option>
                    <option value="Washing">Washing</option>
                    <option value="Drying">Drying</option>
                    <option value="Ready">Ready</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

            </div>

            <div className="modal-footer" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9' }}>
              <button className="save-btn" style={{ minWidth: '140px' }} onClick={() => setSelectedOrder(null)}>
                Close Investigation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const SidebarItem = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`sidebar-item ${active ? 'active' : ''}`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const StatCard = ({ title, value, icon, color }) => (
  <div className="stat-card">
    <div className="stat-info">
      <p className="stat-title">{title}</p>
      <h3 className="stat-value">{value}</h3>
    </div>
    <div className={`stat-icon ${color}`}>{icon}</div>
  </div>
);

const OrdersTable = ({ orders, updateStatus, onView }) => {
  const getStatusClass = (status) => {
    switch (status) {
      case 'Pending': return 'status-pending';
      case 'Confirmed': return 'status-confirmed';
      case 'Pickup': return 'status-pickup';
      case 'Washing': return 'status-washing';
      case 'Drying': return 'status-drying';
      case 'Ready': return 'status-ready';
      case 'Delivered': return 'status-delivered';
      case 'Cancelled': return 'status-cancelled';
      default: return 'status-default';
    }
  };

  return (
    <div className="table-container">
      <table className="orders-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Laundry Hub</th>
            <th>Assigned Driver (Tuk)</th>
            <th>Service & Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>Investigate & Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                No orders match your filter or search query.
              </td>
            </tr>
          ) : (
            orders.map(order => (
              <tr key={order.id}>
                <td className="order-id">#{order.id}</td>
                <td>
                  <div style={{ fontWeight: 600 }}>{order.customer_name || `User #${order.user_id}`}</div>
                  {order.customerPhone && (
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>📞 {order.customerPhone}</div>
                  )}
                </td>
                <td>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: '#334155' }}>
                    {order.laundryName || 'Central Hub'}
                  </span>
                  {order.laundryPhone && (
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>📞 {order.laundryPhone}</div>
                  )}
                </td>
                <td>
                  <div className="driver-pill-cell">
                    {order.driverName ? (
                      <>
                        <div className="driver-pill-row">
                          <span>🛺</span>
                          <span>{order.driverName}</span>
                        </div>
                        {order.driverVehicleNumber && (
                          <span className="driver-plate-tag">{order.driverVehicleNumber}</span>
                        )}
                        <span className={`driver-status-chip ${order.rideStatus || 'assigned'}`}>
                          {order.rideStatus === 'picked_up' ? '📦 Clothes Picked Up' :
                           order.rideStatus === 'delivered' ? '✅ Delivered' :
                           order.rideStatus === 'arrived' ? '📍 At Spot' :
                           '🛵 Assigned'}
                        </span>
                      </>
                    ) : (
                      <span className="driver-status-chip unassigned">Unassigned</span>
                    )}
                  </div>
                </td>
                <td>
                  <span className="service-badge">{order.serviceName}</span>
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px' }}>
                    {order.items} Items
                  </div>
                </td>
                <td className="price">LKR {order.total_price}</td>
                <td>
                  <span className={`status-badge ${getStatusClass(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <select
                      className="status-select"
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Pickup">Pickup</option>
                      <option value="Washing">Washing</option>
                      <option value="Drying">Drying</option>
                      <option value="Ready">Ready</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    <button
                      className="btn-track-investigate"
                      onClick={() => onView(order)}
                      title="Investigate & Track Logistics"
                    >
                      <Search size={13} />
                      <span>Track</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default App;
