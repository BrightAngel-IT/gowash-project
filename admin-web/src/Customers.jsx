import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Mail, Phone, Calendar, User, Search, RefreshCw, Loader2, ArrowLeft, ShoppingBag, DollarSign, Clock } from 'lucide-react';
import './Customers.css';
import { API_URL } from './config';

const Customers = ({ currentUser }) => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeRole, setActiveRole] = useState('customer'); // Default to customer

    // Detailed View State
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerOrders, setCustomerOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    useEffect(() => {
        if (!selectedCustomer) {
            fetchCustomers();
        }
    }, [currentUser, selectedCustomer, activeRole]);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const params = { role: activeRole };
            if (currentUser?.laundry_id) {
                params.laundryId = currentUser.laundry_id;
            }
            const res = await axios.get(`${API_URL}/users`, { params });
            setCustomers(res.data);
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewProfile = async (customer) => {
        setSelectedCustomer(customer);
        setOrdersLoading(true);
        try {
            const params = { userId: customer.id };
            // Ensure we filter by laundry ONLY if the current user is a Laundry Admin
            // If SuperAdmin, they see ALL orders for that user
            if (currentUser?.laundry_id) {
                params.laundryId = currentUser.laundry_id;
            }

            const res = await axios.get(`${API_URL}/orders`, { params });
            setCustomerOrders(res.data);
        } catch (error) {
            console.error('Error fetching customer orders:', error);
        } finally {
            setOrdersLoading(false);
        }
    };

    const handleBack = () => {
        setSelectedCustomer(null);
        setCustomerOrders([]);
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.phone && c.phone.includes(searchQuery))
    );

    // Calculate customer stats
    const totalSpent = customerOrders.reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0);
    const completedOrdersCount = customerOrders.filter(o => o.status === 'Delivered').length;

    if (selectedCustomer) {
        return (
            <div className="customers-container">
                <div className="profile-header">
                    <button className="back-btn" onClick={handleBack}>
                        <ArrowLeft size={18} /> Back to {activeRole === 'customer' ? 'Customers' : 'Agents'}
                    </button>
                </div>

                <div className="profile-content">
                    {/* Customer Info Card */}
                    <div className="profile-info-card">
                        <div className={`profile-avatar-large ${activeRole === 'agent' ? 'agent-avatar' : ''}`}>
                            {selectedCustomer.name.charAt(0).toUpperCase()}
                        </div>
                        <h2 className="profile-name">{selectedCustomer.name}</h2>
                        <div className="profile-details">
                            <div className="detail-item">
                                <Mail size={16} /> <span>{selectedCustomer.email}</span>
                            </div>
                            {selectedCustomer.phone && (
                                <div className="detail-item">
                                    <Phone size={16} /> <span>{selectedCustomer.phone}</span>
                                </div>
                            )}
                            <div className="detail-item">
                                <Calendar size={16} />
                                <span>Joined {new Date(selectedCustomer.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats & Orders */}
                    <div className="profile-main">
                        <div className="stats-row">
                            <div className="stat-box blue">
                                <div className="stat-icon-bg">
                                    <ShoppingBag size={24} />
                                </div>
                                <div className="stat-text">
                                    <label>Total Orders</label>
                                    <h3>{customerOrders.length}</h3>
                                </div>
                            </div>
                            <div className="stat-box green">
                                <div className="stat-icon-bg">
                                    <DollarSign size={24} />
                                </div>
                                <div className="stat-text">
                                    <label>Total {activeRole === 'customer' ? 'Spent' : 'Revenue'}</label>
                                    <h3>LKR {totalSpent.toFixed(2)}</h3>
                                </div>
                            </div>
                            <div className="stat-box purple">
                                <div className="stat-icon-bg">
                                    <Clock size={24} />
                                </div>
                                <div className="stat-text">
                                    <label>Completed</label>
                                    <h3>{completedOrdersCount}</h3>
                                </div>
                            </div>
                        </div>

                        <div className="orders-section">
                            <h3>Order History</h3>
                            {ordersLoading ? (
                                <div className="loader-container">
                                    <Loader2 className="animate-spin" size={32} color="#4facfe" />
                                </div>
                            ) : customerOrders.length === 0 ? (
                                <div className="empty-state-small">
                                    <p>No orders found for this {activeRole}.</p>
                                </div>
                            ) : (
                                <div className="table-container">
                                    <table className="orders-table">
                                        <thead>
                                            <tr>
                                                <th>Order ID</th>
                                                <th>Service</th>
                                                <th>Date</th>
                                                <th>Total</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {customerOrders.map(order => (
                                                <tr key={order.id}>
                                                    <td className="order-id">#{order.id}</td>
                                                    <td>{order.serviceName}</td>
                                                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                                    <td className="price">LKR {order.total_price}</td>
                                                    <td>
                                                        <span className={`status-badge status-${order.status.toLowerCase()}`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="customers-container">
            <div className="page-header">
                <div>
                    <h2>{currentUser?.role === 'superadmin' ? 'User Management' : 'My Customers'}</h2>
                    <p className="subtitle">
                        {currentUser?.role === 'superadmin'
                            ? 'Manage customers and agents in the system'
                            : 'Manage and view your customer database'}
                    </p>
                </div>
                <div className="header-actions">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder={`Search ${activeRole}s...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {currentUser?.role === 'superadmin' && (
                <div className="filter-tabs">
                    <button
                        className={`tab-btn ${activeRole === 'customer' ? 'active' : ''}`}
                        onClick={() => setActiveRole('customer')}
                    >
                        Customers
                    </button>
                    <button
                        className={`tab-btn ${activeRole === 'agent' ? 'active' : ''}`}
                        onClick={() => setActiveRole('agent')}
                    >
                        Agents
                    </button>
                </div>
            )}

            {loading ? (
                <div className="loader-container">
                    <Loader2 className="animate-spin" size={48} color="#4facfe" />
                </div>
            ) : (
                <div className="table-card">
                    {filteredCustomers.length === 0 ? (
                        <div className="empty-state">
                            <User size={64} />
                            <h3>No {activeRole}s found</h3>
                            <p>Once {activeRole}s are registered, they will appear here.</p>
                        </div>
                    ) : (
                        <table className="customers-table">
                            <thead>
                                <tr>
                                    <th>{activeRole === 'customer' ? 'Customer' : 'Agent'} Name</th>
                                    <th>Contact Info</th>
                                    <th>Role</th>
                                    <th>Joined Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.map(customer => (
                                    <tr key={customer.id}>
                                        <td>
                                            <div className="customer-cell">
                                                <div className={`avatar-circle ${activeRole === 'agent' ? 'agent-avatar' : ''}`}>
                                                    {customer.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="customer-name">{customer.name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="contact-info">
                                                <div className="contact-row">
                                                    <Mail size={14} /> <span>{customer.email}</span>
                                                </div>
                                                {customer.phone && (
                                                    <div className="contact-row">
                                                        <Phone size={14} /> <span>{customer.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`role-badge ${customer.role}`}>
                                                {customer.role.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="date-cell">
                                                <Calendar size={14} />
                                                <span>{new Date(customer.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <button className="view-btn" onClick={() => handleViewProfile(customer)}>
                                                View Profile
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default Customers;
