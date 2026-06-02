import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Plus, 
    Edit3, 
    Trash2, 
    X, 
    Save, 
    Shirt, 
    Droplets, 
    Thermometer, 
    Wind, 
    Zap, 
    Layers,
    Search,
    CheckCircle2,
    Info
} from 'lucide-react';
import './SuperAdmin.css'; // Reuse some styles
import { API_URL } from './config';

const Services = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentService, setCurrentService] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        unit: 'kg',
        description: '',
        icon: 'shirt-outline',
        color: '#4facfe',
        is_active: true
    });

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/services`);
            setServices(res.data);
        } catch (err) {
            console.error('Error fetching services:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (service = null) => {
        if (service) {
            setCurrentService(service);
            setFormData({
                name: service.name,
                price: service.price,
                unit: service.unit,
                description: service.description || '',
                icon: service.icon || 'shirt-outline',
                color: service.color || '#4facfe',
                is_active: service.is_active
            });
        } else {
            setCurrentService(null);
            setFormData({
                name: '',
                price: '',
                unit: 'kg',
                description: '',
                icon: 'shirt-outline',
                color: '#4facfe',
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentService) {
                await axios.put(`${API_URL}/services/${currentService.id}`, formData);
            } else {
                await axios.post(`${API_URL}/services`, formData);
            }
            fetchServices();
            setIsModalOpen(false);
        } catch (err) {
            console.error('Error saving service:', err);
            alert('Failed to save service');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this service?')) {
            try {
                await axios.delete(`${API_URL}/services/${id}`);
                fetchServices();
            } catch (err) {
                console.error('Error deleting service:', err);
            }
        }
    };

    const getIconComponent = (iconName) => {
        switch(iconName) {
            case 'shirt-outline': return <Shirt size={24} />;
            case 'water-outline': return <Droplets size={24} />;
            case 'thermometer-outline': return <Thermometer size={24} />;
            case 'leaf-outline': return <Wind size={24} />;
            case 'flash-outline': return <Zap size={24} />;
            default: return <Layers size={24} />;
        }
    };

    return (
        <div className="services-container" style={{ padding: '24px' }}>
            <div className="super-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h2 style={{ fontSize: '28px', fontWeight: '800', margin: 0 }}>Master Services</h2>
                    <p style={{ color: '#64748b', margin: '4px 0 0' }}>Manage the laundry services available in the mobile app</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        padding: '12px 24px', 
                        background: 'linear-gradient(135deg, #4c669f 0%, #3b5998 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        boxShadow: '0 10px 15px -3px rgba(59, 89, 152, 0.3)'
                    }}
                >
                    <Plus size={20} /> Add Service
                </button>
            </div>

            <div className="services-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                {services.map(service => (
                    <div key={service.id} className="service-card-pro" style={{ 
                        background: 'white', 
                        borderRadius: '24px', 
                        padding: '24px', 
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
                        border: '1px solid #f1f5f9',
                        position: 'relative',
                        transition: 'transform 0.2s'
                    }}>
                        <div style={{ 
                            width: '56px', 
                            height: '56px', 
                            borderRadius: '16px', 
                            background: `${service.color}15`, 
                            color: service.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '20px'
                        }}>
                            {getIconComponent(service.icon)}
                        </div>
                        
                        <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>{service.name}</h3>
                        <p style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.5', marginBottom: '20px', minHeight: '40px' }}>
                            {service.description}
                        </p>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                            <div>
                                <span style={{ fontSize: '20px', fontWeight: '900', color: 'var(--primary)' }}>LKR {service.price}</span>
                                <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '4px' }}>/ {service.unit}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleOpenModal(service)} style={{ padding: '8px', borderRadius: '10px', border: 'none', background: '#f1f5f9', color: '#64748b', cursor: 'pointer' }}><Edit3 size={16} /></button>
                                <button onClick={() => handleDelete(service.id)} style={{ padding: '8px', borderRadius: '10px', border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                            </div>
                        </div>

                        {!service.is_active && (
                            <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', color: '#94a3b8' }}>INACTIVE</div>
                        )}
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal-content-pro" style={{ background: 'white', borderRadius: '28px', width: '100%', maxWidth: '500px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: '800' }}>{currentService ? 'Edit Service' : 'Add New Service'}</h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gap: '20px' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Service Name</label>
                                    <input 
                                        type="text" 
                                        value={formData.name} 
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
                                        required
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Base Price (LKR)</label>
                                        <input 
                                            type="number" 
                                            value={formData.price} 
                                            onChange={(e) => setFormData({...formData, price: e.target.value})}
                                            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
                                            required
                                        />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Unit</label>
                                        <select 
                                            value={formData.unit} 
                                            onChange={(e) => setFormData({...formData, unit: e.target.value})}
                                            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
                                        >
                                            <option value="kg">Per KG</option>
                                            <option value="item">Per Item</option>
                                            <option value="load">Per Load</option>
                                            <option value="sqft">Per Sqft</option>
                                            <option value="pair">Per Pair</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Description</label>
                                    <textarea 
                                        value={formData.description} 
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        rows="3"
                                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', resize: 'none' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Icon</label>
                                        <select 
                                            value={formData.icon} 
                                            onChange={(e) => setFormData({...formData, icon: e.target.value})}
                                            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
                                        >
                                            <option value="shirt-outline">Shirt</option>
                                            <option value="water-outline">Water/Wash</option>
                                            <option value="thermometer-outline">Iron/Press</option>
                                            <option value="leaf-outline">Dry Clean</option>
                                            <option value="flash-outline">Express</option>
                                            <option value="infinite-outline">Steam</option>
                                            <option value="browsers-outline">Curtain</option>
                                            <option value="grid-outline">Carpet</option>
                                            <option value="footsteps-outline">Shoe</option>
                                            <option value="layers-outline">Leather</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Theme Color</label>
                                        <input 
                                            type="color" 
                                            value={formData.color} 
                                            onChange={(e) => setFormData({...formData, color: e.target.value})}
                                            style={{ width: '100%', height: '48px', padding: '4px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: 'white' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                style={{ 
                                    width: '100%', 
                                    marginTop: '32px', 
                                    padding: '16px', 
                                    background: 'linear-gradient(135deg, #4c669f 0%, #3b5998 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '16px',
                                    fontWeight: '800',
                                    fontSize: '16px',
                                    cursor: 'pointer',
                                    boxShadow: '0 10px 15px -3px rgba(59, 89, 152, 0.3)'
                                }}
                            >
                                {currentService ? 'Save Changes' : 'Create Service'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Services;
