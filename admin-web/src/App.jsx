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
  Contact
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

  const [newOrder, setNewOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  // Create a simple notification beep sound using Web Audio API
  const audioRef = React.useRef(null);

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

  const filteredOrders = filter === 'All' ? orders : orders.filter(o => o.status === filter);

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
          <h2>{activeTab}</h2>
          <div className="header-actions">
            <div className="search-box">
              <Search size={18} />
              <input type="text" placeholder="Search orders..." />
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
                <OrdersTable orders={orders.slice(0, 5)} updateStatus={updateStatus} onView={setSelectedOrder} />
              </div>
            </>
          )}

          {activeTab === 'Orders' && (
            <div className="card">
              <div className="card-header filter-header">
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

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content professional-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header-professional" style={{ background: '#4c669f' }}>
              <div className="header-top">
                <div className="status-badge-new" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
                  ORDER DETAILS
                </div>
                <button className="close-modal-btn-pro" onClick={() => setSelectedOrder(null)}>
                  <X size={20} />
                </button>
              </div>
              <div className="order-number-large">
                <span>Order #</span>{selectedOrder.id}
              </div>
              <p className="order-time-ago">{new Date(selectedOrder.created_at).toLocaleString()}</p>
            </div>

            <div className="modal-body-pro">
              <div className="customer-section">
                <div className="customer-avatar-pro" style={{ background: 'var(--primary)' }}>
                  {selectedOrder.customer_name?.charAt(0) || 'C'}
                </div>
                <div className="customer-info">
                  <h3>{selectedOrder.customer_name}</h3>
                  <p>{selectedOrder.laundryName} branch</p>
                </div>
                <div className="total-amount-badge">
                  LKR {selectedOrder.total_price}
                </div>
              </div>

              <div className="order-items-detail card">
                <div className="card-header" style={{ padding: '12px 20px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px' }}>Itemized Breakdown</h4>
                </div>
                <div className="items-list-pro" style={{ padding: '10px' }}>
                  {selectedOrder.itemsList && selectedOrder.itemsList.length > 0 &&
                    selectedOrder.itemsList.map((item, idx) => (
                      <div key={idx} className="item-row-pro" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: idx === selectedOrder.itemsList.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: '600', fontSize: '14px' }}>{item.item_name} <span style={{ color: '#64748b', fontWeight: '400' }}>x {item.quantity} {item.pieces ? `(${item.pieces} pc)` : ''}</span></p>
                          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>LKR {item.price_per_unit} per unit</p>
                        </div>
                        <p style={{ margin: 0, fontWeight: '700', color: 'var(--primary)' }}>LKR {item.total_price}</p>
                      </div>
                    ))
                  }
                  {(!selectedOrder.itemsList || selectedOrder.itemsList.length === 0) && (
                    <p style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No item details available</p>
                  )}
                  {selectedOrder.delivery_fee > 0 && (
                    <div className="item-row-pro" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f8fafc', borderTop: '1px dashed #cbd5e1' }}>
                      <p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: '#64748b' }}>Delivery Charge</p>
                      <p style={{ margin: 0, fontWeight: '700', color: 'var(--primary)' }}>LKR {selectedOrder.delivery_fee}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="order-details-grid">
                <div className="detail-item-pro">
                  <div className="icon-box blue"><Shirt size={18} /></div>
                  <div className="detail-text">
                    <label>Master Service</label>
                    <p>{selectedOrder.serviceName}</p>
                  </div>
                </div>
                <div className="detail-item-pro">
                  <div className="icon-box purple"><Clock size={18} /></div>
                  <div className="detail-text">
                    <label>Pickup Date</label>
                    <p>{selectedOrder.pickup_date}</p>
                    <p className="sub-text">{selectedOrder.pickup_time}</p>
                  </div>
                </div>
                <div className="detail-item-pro full-width">
                  <div className="icon-box green"><MapPin size={18} /></div>
                  <div className="detail-text">
                    <label>Delivery Address</label>
                    <p>{selectedOrder.address}</p>
                  </div>
                </div>
                {selectedOrder.notes && (
                  <div className="detail-item-pro full-width">
                    <div className="icon-box yellow" style={{ background: '#fef3c7', color: '#f59e0b' }}><AlertCircle size={18} /></div>
                    <div className="detail-text">
                      <label>Order Notes</label>
                      <p style={{ fontSize: '13px', fontWeight: '400' }}>{selectedOrder.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '20px 28px' }}>
              <button className="save-btn" style={{ width: '100%' }} onClick={() => setSelectedOrder(null)}>Done</button>
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
            <th>Service</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td className="order-id">#{order.id}</td>
              <td>{order.customer_name || `User ${order.user_id}`}</td>
              <td>
                <span className="service-badge">
                  {order.serviceName}
                </span>
              </td>
              <td>{order.items}</td>
              <td className="price">LKR {order.total_price}</td>
              <td>
                <span className={`status-badge ${getStatusClass(order.status)}`}>
                  {order.status}
                </span>
              </td>
              <td>
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
                  className="status-select"
                  style={{ marginLeft: '8px', padding: '8px', color: 'var(--primary)' }}
                  onClick={() => onView(order)}
                  title="View Details"
                >
                  <Search size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default App;
