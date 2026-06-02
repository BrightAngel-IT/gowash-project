import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Plus,
    MapPin,
    Phone,
    Mail,
    User,
    Clock,
    Edit3,
    Trash2,
    X,
    ExternalLink,
    Loader2,
    CheckCircle2
} from 'lucide-react';
import './SuperAdmin.css';
import { API_URL } from './config';

const SuperAdminPanel = () => {
    const [laundries, setLaundries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentLaundry, setCurrentLaundry] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        manager_name: '',
        opening_time: '',
        closing_time: '',
        status: 'active',
        username: '',
        password: '',
        image_url: ''
    });

    useEffect(() => {
        fetchLaundries();
    }, []);

    const fetchLaundries = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/laundries`);
            setLaundries(res.data);
        } catch (err) {
            console.error('Error fetching laundries:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredLaundries = laundries.filter(l =>
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.manager_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        total: laundries.length,
        active: laundries.filter(l => l.status === 'active').length,
        inactive: laundries.filter(l => l.status === 'inactive').length
    };

    const handleOpenModal = (laundry = null) => {
        if (laundry) {
            setCurrentLaundry(laundry);
            setFormData({
                name: laundry.name,
                address: laundry.address,
                phone: laundry.phone || '',
                email: laundry.email || '',
                manager_name: laundry.manager_name || '',
                opening_time: laundry.opening_time || '',
                closing_time: laundry.closing_time || '',
                status: laundry.status || 'active',
                username: laundry.username || '',
                password: laundry.password || '',
                image_url: laundry.image_url || ''
            });
        } else {
            setCurrentLaundry(null);
            setFormData({
                name: '',
                address: '',
                phone: '',
                email: '',
                manager_name: '',
                opening_time: '08:00 AM',
                closing_time: '08:00 PM',
                status: 'active',
                username: '',
                password: '',
                image_url: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentLaundry(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (currentLaundry) {
                await axios.put(`${API_URL}/laundries/${currentLaundry.id}`, formData);
            } else {
                await axios.post(`${API_URL}/laundries`, formData);
            }
            await fetchLaundries();
            handleCloseModal();
        } catch (err) {
            console.error('Error saving laundry:', err);
            const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to save laundry details';
            alert(`Error: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this laundry? This action cannot be undone.')) {
            try {
                await axios.delete(`${API_URL}/laundries/${id}`);
                fetchLaundries();
            } catch (err) {
                console.error('Error deleting laundry:', err);
            }
        }
    };

    return (
        <div className="super-admin-container">
            <div className="super-header">
                <div>
                    <h2>Laundry Management</h2>
                    <p className="text-muted">Manage your business locations and branches</p>
                </div>
                <div className="header-right">
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="Search laundries..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="add-laundry-btn" onClick={() => handleOpenModal()}>
                        <Plus size={20} />
                        <span>Register New</span>
                    </button>
                </div>
            </div>

            <div className="stats-summary">
                <div className="mini-stat">
                    <span className="label">Total Branches</span>
                    <span className="value">{stats.total}</span>
                </div>
                <div className="mini-stat">
                    <span className="label">Active</span>
                    <span className="value text-success">{stats.active}</span>
                </div>
                <div className="mini-stat">
                    <span className="label">Inactive</span>
                    <span className="value text-danger">{stats.inactive}</span>
                </div>
            </div>

            {loading ? (
                <div className="loader-container">
                    <Loader2 className="animate-spin" size={48} color="#4facfe" />
                </div>
            ) : (
                <div className="laundry-grid">
                    {filteredLaundries.map(laundry => (
                        <div className="laundry-card" key={laundry.id}>
                            <div className="card-image-box">
                                <img
                                    src={laundry.image_url || `https://images.unsplash.com/photo-1545173168-9f1947eebb7f?q=80&w=600&auto=format&fit=crop`}
                                    alt={laundry.name}
                                />
                                <span className={`status-indicator ${laundry.status}`}>
                                    {laundry.status.toUpperCase()}
                                </span>
                            </div>
                            <div className="card-body">
                                <h3>{laundry.name}</h3>
                                <div className="info-row">
                                    <MapPin size={16} />
                                    <span>{laundry.address}</span>
                                </div>
                                <div className="info-row">
                                    <User size={16} />
                                    <span>Manager: {laundry.manager_name || 'Not assigned'}</span>
                                </div>
                                <div className="info-row">
                                    <Phone size={16} />
                                    <span>{laundry.phone || 'N/A'}</span>
                                </div>
                                <div className="info-row">
                                    <Clock size={16} />
                                    <span>{laundry.opening_time} - {laundry.closing_time}</span>
                                </div>

                                <div className="card-actions">
                                    <button className="action-btn edit" onClick={() => handleOpenModal(laundry)}>
                                        <Edit3 size={16} /> Edit
                                    </button>
                                    <button className="action-btn delete" onClick={() => handleDelete(laundry.id)}>
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="close-modal" onClick={handleCloseModal}>
                            <X size={24} />
                        </button>
                        <div className="modal-header">
                            <h2>{currentLaundry ? 'Edit Laundry Location' : 'Register New Laundry'}</h2>
                            <p className="text-muted">Please fill in all the required information</p>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label>Laundry Name</label>
                                        <div className="input-with-icon">
                                            <Plus size={18} className="input-icon" />
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder="e.g. GoWash Central"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group full-width">
                                        <label>Full Address</label>
                                        <textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            placeholder="Physical location of the laundry"
                                            rows="3"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Phone Number</label>
                                        <div className="input-with-icon">
                                            <Phone size={18} className="input-icon" />
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                placeholder="+94"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Contact Email</label>
                                        <div className="input-with-icon">
                                            <Mail size={18} className="input-icon" />
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                placeholder="branch@gowash.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Manager Name</label>
                                        <div className="input-with-icon">
                                            <User size={18} className="input-icon" />
                                            <input
                                                type="text"
                                                name="manager_name"
                                                value={formData.manager_name}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Operational Status</label>
                                        <select name="status" value={formData.status} onChange={handleInputChange}>
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Opening Time</label>
                                        <div className="input-with-icon">
                                            <Clock size={18} className="input-icon" />
                                            <input
                                                type="text"
                                                name="opening_time"
                                                value={formData.opening_time}
                                                onChange={handleInputChange}
                                                placeholder="08:00 AM"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Closing Time</label>
                                        <div className="input-with-icon">
                                            <Clock size={18} className="input-icon" />
                                            <input
                                                type="text"
                                                name="closing_time"
                                                value={formData.closing_time}
                                                onChange={handleInputChange}
                                                placeholder="08:00 PM"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Portal Username</label>
                                        <input
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleInputChange}
                                            placeholder="e.g. branch_central"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Portal Password</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            placeholder="Create a secure password"
                                            required
                                        />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Laundry Image URL</label>
                                        <input
                                            type="url"
                                            name="image_url"
                                            value={formData.image_url}
                                            onChange={handleInputChange}
                                            placeholder="https://images.unsplash.com/..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="cancel-btn" onClick={handleCloseModal}>Cancel</button>
                                <button type="submit" className="save-btn">
                                    {currentLaundry ? 'Update Laundry' : 'Register Laundry'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminPanel;
