import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Lock, Save, Store, Clock, Phone, Mail, MapPin, DollarSign, Plus, Trash2 } from 'lucide-react';

import './Settings.css';
import { API_URL } from './config';

const MatrixCell = ({ item, s, handleUpdateItemPrice, updatingItemId }) => {
    const initialPrice = item.service_prices?.[s.id]?.price || item.current_price;
    const initialUnit = item.service_prices?.[s.id]?.unit || item.current_unit || 'item';
    const [price, setPrice] = useState(initialPrice);
    const [unit, setUnit] = useState(initialUnit);
    
    useEffect(() => {
        setPrice(item.service_prices?.[s.id]?.price || item.current_price);
        setUnit(item.service_prices?.[s.id]?.unit || item.current_unit || 'item');
    }, [item, s.id]);

    const hasChanged = String(price) !== String(initialPrice) || String(unit) !== String(initialUnit);

    return (
        <div className="matrix-cell-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div className="matrix-input-wrapper" style={{ display: 'inline-flex', alignItems: 'center', background: '#f8fafc', borderRadius: '10px', padding: '4px 10px', border: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', marginRight: '6px' }}>LKR</span>
                <input 
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    disabled={updatingItemId === `${item.id}-${s.id}`}
                    style={{ width: '65px', border: 'none', background: 'transparent', outline: 'none', fontWeight: '800', color: 'var(--primary)', textAlign: 'right' }}
                />
            </div>
            
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <select 
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    disabled={updatingItemId === `${item.id}-${s.id}`}
                    style={{ 
                        fontSize: '10px', 
                        fontWeight: '700', 
                        padding: '4px 8px', 
                        borderRadius: '6px', 
                        border: '1px solid #e2e8f0', 
                        background: 'white', 
                        color: '#64748b',
                        outline: 'none',
                        cursor: 'pointer'
                    }}
                >
                    <option value="item">Piece (PC)</option>
                    <option value="kg">Kilo (KG)</option>
                    <option value="load">Load</option>
                </select>

                {hasChanged && (
                    <button 
                        onClick={() => handleUpdateItemPrice(item.id, s.id, price, unit)}
                        disabled={updatingItemId === `${item.id}-${s.id}`}
                        style={{
                            background: '#10B981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                        }}
                        title="Save Changes"
                    >
                        Save
                    </button>
                )}
            </div>
            
            {updatingItemId === `${item.id}-${s.id}` && <div className="tiny-loader"></div>}
        </div>
    );
};

const Settings = ({ currentUser }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);

    // Profile State
    const [profile, setProfile] = useState({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || ''
    });

    // Laundry State (Only for Laundry Admin)
    const [laundry, setLaundry] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        opening_time: '',
        closing_time: ''
    });

    const [timeSlots, setTimeSlots] = useState([]);
    const [newSlot, setNewSlot] = useState({ label: '', price: '' });
    
    // Item Prices State
    const [itemPrices, setItemPrices] = useState([]);
    const [updatingItemId, setUpdatingItemId] = useState(null);
    const [services, setServices] = useState([]);
    const [selectedServiceId, setSelectedServiceId] = useState(null);

    useEffect(() => {
        if (currentUser.laundry_id) {
            if (activeTab === 'laundry') {
                fetchLaundryDetails();
            } else if (activeTab === 'pricing') {
                fetchTimeSlots();
            } else if (activeTab === 'items') {
                fetchServices();
                fetchItemPrices();
            }
        }
    }, [activeTab, currentUser, selectedServiceId]);

    const fetchServices = async () => {
        try {
            const res = await axios.get(`${API_URL}/services`);
            setServices(res.data);
            if (!selectedServiceId && res.data.length > 0) {
                setSelectedServiceId(res.data[0].id);
            }
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };

    const fetchItemPrices = async () => {
        try {
            setLoading(true);
            // Fetch all prices for all services in one go
            const res = await axios.get(`${API_URL}/item-prices`, {
                params: { 
                    laundryId: currentUser.laundry_id,
                    allServices: true
                }
            });
            setItemPrices(res.data);
        } catch (error) {
            console.error('Error fetching item prices:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateItemPrice = async (itemId, serviceId, price, unit) => {
        try {
            setUpdatingItemId(`${itemId}-${serviceId}`);
            await axios.post(`${API_URL}/item-prices`, {
                laundry_id: currentUser.laundry_id,
                service_id: serviceId,
                item_id: itemId,
                price: parseFloat(price),
                unit: unit
            });
            // Update local state
            setItemPrices(prev => prev.map(row => 
                row.id === itemId ? { 
                    ...row, 
                    service_prices: { 
                        ...row.service_prices, 
                        [serviceId]: { price, unit } 
                    } 
                } : row
            ));
        } catch (error) {
            console.error('Error updating item price:', error);
            alert('Failed to update price.');
        } finally {
            setUpdatingItemId(null);
        }
    };





    const fetchTimeSlots = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/time-slots`, {
                params: { laundryId: currentUser.laundry_id }
            });
            setTimeSlots(res.data);
        } catch (error) {
            console.error('Error fetching time slots:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTimeSlot = async (e) => {
        e.preventDefault();
        if (!newSlot.label || newSlot.price === '') return;
        setLoading(true);
        try {
            await axios.post(`${API_URL}/time-slots`, {
                laundry_id: currentUser.laundry_id,
                ...newSlot
            });
            setNewSlot({ label: '', price: '' });
            fetchTimeSlots();
        } catch (error) {
            console.error('Error adding time slot:', error);
            alert('Failed to add time slot.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTimeSlot = async (id) => {
        if (!window.confirm('Delete this pricing slot?')) return;
        try {
            await axios.delete(`${API_URL}/time-slots/${id}`);
            fetchTimeSlots();
        } catch (error) {
            console.error('Error deleting time slot:', error);
        }
    };


    const fetchLaundryDetails = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/laundries/${currentUser.laundry_id}`);
            setLaundry(res.data);
        } catch (error) {
            console.error('Error fetching laundry:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Updated user profile endpoint needed or reuse existing
            // Since we don't have a direct "update my profile" endpoint easily exposed for admins in previous context,
            // we assumed /user/profile works for logged in user.
            // However, the previous userController.js used query param userId. 
            // We should use that.

            // Wait, admin login might not populate ID same way as user. 
            // Let's assume we can pass userId.
            // If it's a laundry admin, they are in 'laundries' table? 
            // If 'is_direct_branch' is true, they are a laundry, not a user in 'users' table.
            // Check Login.jsx: 
            // if (laundryRes.rows.length > 0) -> user.id = `l-${laundry.id}`.

            if (currentUser.is_direct_branch) {
                // It's a laundry account, so "Profile" is actually Laundry Basic Info?
                // Or maybe we just disable Profile tab for direct laundry accounts and force Laundry Settings.
                alert("Please use 'Laundry Settings' to update your branch information.");
                return;
            }

            await axios.put(`${API_URL}/user/profile?userId=${currentUser.id}`, profile);
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Update error:', error);
            alert('Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleLaundryUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.put(`${API_URL}/laundries/${currentUser.laundry_id}`, laundry);
            alert('Laundry settings updated successfully!');
        } catch (error) {
            console.error('Update error:', error);
            alert('Failed to update laundry settings.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-container">
            <div className="settings-header">
                <h2>Settings</h2>
                <div className="tabs">
                    {!currentUser.is_direct_branch && (
                        <button
                            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                            onClick={() => setActiveTab('profile')}
                        >
                            <User size={18} /> My Profile
                        </button>
                    )}
                    {(currentUser.role === 'admin' && currentUser.laundry_id) && (
                        <>
                            <button
                                className={`tab-btn ${activeTab === 'laundry' ? 'active' : ''}`}
                                onClick={() => setActiveTab('laundry')}
                            >
                                <Store size={18} /> Laundry Settings
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'pricing' ? 'active' : ''}`}
                                onClick={() => setActiveTab('pricing')}
                            >
                                <Clock size={18} /> Time Pricing
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'items' ? 'active' : ''}`}
                                onClick={() => setActiveTab('items')}
                            >
                                <Plus size={18} /> Item Pricing
                            </button>
                        </>
                    )}


                </div>
            </div>

            <div className="settings-content">
                {activeTab === 'profile' && !currentUser.is_direct_branch && (
                    <div className="card settings-card">
                        <h3>Personal Information</h3>
                        <form onSubmit={handleProfileUpdate}>
                            <div className="form-group">
                                <label>Full Name</label>
                                <div className="input-with-icon">
                                    <User size={18} />
                                    <input
                                        type="text"
                                        value={profile.name}
                                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <div className="input-with-icon">
                                    <Mail size={18} />
                                    <input
                                        type="email"
                                        value={profile.email}
                                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Phone Number</label>
                                <div className="input-with-icon">
                                    <Phone size={18} />
                                    <input
                                        type="tel"
                                        value={profile.phone}
                                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button type="submit" className="save-btn" disabled={loading}>
                                <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                )}

                {activeTab === 'laundry' && (
                    <div className="card settings-card">
                        <h3>Laundry Branch Details</h3>
                        <form onSubmit={handleLaundryUpdate}>
                            <div className="form-group">
                                <label>Branch Name</label>
                                <div className="input-with-icon">
                                    <Store size={18} />
                                    <input
                                        type="text"
                                        value={laundry.name}
                                        onChange={(e) => setLaundry({ ...laundry, name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Address</label>
                                <div className="input-with-icon">
                                    <MapPin size={18} />
                                    <input
                                        type="text"
                                        value={laundry.address}
                                        onChange={(e) => setLaundry({ ...laundry, address: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="row">
                                <div className="form-group col">
                                    <label>Opening Time</label>
                                    <div className="input-with-icon">
                                        <Clock size={18} />
                                        <input
                                            type="text"
                                            value={laundry.opening_time}
                                            onChange={(e) => setLaundry({ ...laundry, opening_time: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-group col">
                                    <label>Closing Time</label>
                                    <div className="input-with-icon">
                                        <Clock size={18} />
                                        <input
                                            type="text"
                                            value={laundry.closing_time}
                                            onChange={(e) => setLaundry({ ...laundry, closing_time: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="form-group col">
                                    <label>Contact Email</label>
                                    <div className="input-with-icon">
                                        <Mail size={18} />
                                        <input
                                            type="email"
                                            value={laundry.email}
                                            onChange={(e) => setLaundry({ ...laundry, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-group col">
                                    <label>Contact Phone</label>
                                    <div className="input-with-icon">
                                        <Phone size={18} />
                                        <input
                                            type="tel"
                                            value={laundry.phone}
                                            onChange={(e) => setLaundry({ ...laundry, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <button type="submit" className="save-btn" disabled={loading}>
                                <Save size={18} /> {loading ? 'Saving...' : 'Update Laundry Details'}
                            </button>
                        </form>
                    </div>
                )}

                {activeTab === 'pricing' && (

                    <div className="pricing-settings">
                        <div className="card settings-card">
                            <h3>Add New Time-based Pricing</h3>
                            <p className="tab-hint">Set extra charges for specific pickup windows or turnaround times (e.g. "Express - 6 Hours").</p>
                            <form onSubmit={handleAddTimeSlot} className="add-slot-form">
                                <div className="row">
                                    <div className="form-group col">
                                        <label>Label / Window</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 8AM - 10AM (Morning)"
                                            value={newSlot.label}
                                            onChange={(e) => setNewSlot({ ...newSlot, label: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col">
                                        <label>Extra Fee (LKR)</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={newSlot.price}
                                            onChange={(e) => setNewSlot({ ...newSlot, price: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="col-auto">
                                        <button type="submit" className="add-btn" disabled={loading}>
                                            <Plus size={18} /> Add Slot
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="card settings-card">
                            <h3>Current Pricing Windows</h3>
                            <div className="slots-list">
                                {timeSlots.length === 0 ? (
                                    <p className="empty-msg">No custom time pricing set yet.</p>
                                ) : (
                                    timeSlots.map(slot => (
                                        <div key={slot.id} className="slot-item">
                                            <div className="slot-info">
                                                <Clock size={16} />
                                                <span className="slot-label">{slot.label}</span>
                                            </div>
                                            <div className="slot-actions">
                                                <span className="slot-price">LKR {slot.price}</span>
                                                <button 
                                                    className="delete-btn-icon" 
                                                    onClick={() => handleDeleteTimeSlot(slot.id)}
                                                    title="Delete Slot"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'items' && (
                    <div className="items-settings">
                        <div className="settings-section-header" style={{ marginBottom: '32px' }}>
                            <h3>Master Price Matrix</h3>
                            <p className="tab-hint">Configure prices for every item across all your services in one place. Changes are saved automatically.</p>
                        </div>
                        
                        {loading && itemPrices.length === 0 ? (
                            <div className="loading-state" style={{ textAlign: 'center', padding: '40px' }}>
                                <div className="spinner"></div>
                                <p>Loading price matrix...</p>
                            </div>
                        ) : (
                            <div className="price-matrix-container" style={{ overflowX: 'auto', background: 'white', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                                            <th style={{ padding: '24px', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', minWidth: '200px' }}>Item Details</th>
                                            {services.map(s => (
                                                <th key={s.id} style={{ padding: '24px', fontSize: '12px', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', textAlign: 'center', minWidth: '140px' }}>
                                                    {s.name}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.from(new Set(itemPrices.map(item => item.category))).map(category => (
                                            <React.Fragment key={category}>
                                                <tr style={{ background: '#f1f5f9' }}>
                                                    <td colSpan={services.length + 1} style={{ padding: '12px 24px', fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                        {category}
                                                    </td>
                                                </tr>
                                                {itemPrices.filter(item => item.category === category).map(item => (
                                                    <tr key={item.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                                        <td style={{ padding: '20px 24px' }}>
                                                            <div style={{ fontWeight: '700', color: '#1e293b' }}>{item.name}</div>
                                                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Base: LKR {item.base_price}</div>
                                                        </td>
                                                        {services.map(s => (
                                                            <td key={s.id} style={{ padding: '20px 24px', textAlign: 'center' }}>
                                                                <MatrixCell item={item} s={s} handleUpdateItemPrice={handleUpdateItemPrice} updatingItemId={updatingItemId} />
                                                            </td>
                                                        ))}

                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>

    );
};

export default Settings;
