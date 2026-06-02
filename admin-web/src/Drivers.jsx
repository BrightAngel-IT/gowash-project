import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Users, Search, Shield, Eye, CheckCircle, XCircle
} from 'lucide-react';
import './Drivers.css';
import { API_URL } from './config';

function Drivers() {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        fetchDrivers();
    }, []);

    const fetchDrivers = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/drivers`);
            setDrivers(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching drivers:", error);
            setLoading(false);
        }
    };

    const updateDriverStatus = async (driverId, newStatus) => {
        try {
            await axios.patch(`${API_URL}/drivers/${driverId}/status`, { status: newStatus });
            fetchDrivers();
            if (selectedDriver && selectedDriver.id === driverId) {
                setSelectedDriver({ ...selectedDriver, status: newStatus });
            }
        } catch (error) {
            alert("Failed to update status");
        }
    };

    const filteredDrivers = filter === 'All'
        ? drivers
        : drivers.filter(d => d.status === filter);

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': case 'approved': return 'green';
            case 'pending': case 'pending_approval': return 'yellow';
            case 'rejected': case 'suspended': return 'red';
            default: return 'gray';
        }
    };

    return (
        <div className="drivers-container">
            <div className="section-header">
                <div className="header-title">
                    <Users size={24} />
                    <h2>Driver Management</h2>
                </div>
                <div className="header-actions">
                    <div className="search-box">
                        <Search size={18} />
                        <input type="text" placeholder="Search drivers..." />
                    </div>
                </div>
            </div>

            <div className="drivers-stats">
                <div className="stat-card">
                    <h3>Total Drivers</h3>
                    <p>{drivers.length}</p>
                </div>
                <div className="stat-card">
                    <h3>Active</h3>
                    <p>{drivers.filter(d => d.status === 'active' || d.status === 'approved').length}</p>
                </div>
                <div className="stat-card pending">
                    <h3>Pending Approval</h3>
                    <p>{drivers.filter(d => d.status === 'pending_approval').length}</p>
                </div>
            </div>

            <div className="card">
                <div className="card-header filter-header">
                    <h3>Driver List</h3>
                    <div className="filter-buttons">
                        {['All', 'active', 'pending_approval', 'suspended'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`filter-btn ${filter === status ? 'active' : ''}`}
                            >
                                {status === 'pending_approval' ? 'Pending' : status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="table-container">
                    <table className="drivers-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Driver</th>
                                <th>Contact</th>
                                <th>Vehicle</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDrivers.map(driver => (
                                <tr key={driver.id}>
                                    <td>#{driver.id}</td>
                                    <td>
                                        <div className="driver-cell">
                                            <div className="driver-avatar">
                                                {driver.profile_image_url ? (
                                                    <img src={driver.profile_image_url} alt="Profile" />
                                                ) : (
                                                    <span>{driver.name?.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="driver-name">{driver.name}</p>
                                                <p className="driver-email">{driver.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <p>{driver.phone}</p>
                                        <p className="sub-text">NIC: {driver.nic_number}</p>
                                    </td>
                                    <td>
                                        <p className="vehicle-plate">{driver.vehicle_number}</p>
                                        <p className="sub-text">{driver.vehicle_type}</p>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${getStatusColor(driver.status)}`}>
                                            {driver.status === 'pending_approval' ? 'Pending' : driver.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="view-btn"
                                            onClick={() => setSelectedDriver(driver)}
                                        >
                                            <Eye size={18} /> View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Driver Details Modal */}
            {selectedDriver && (
                <div className="modal-overlay" onClick={() => setSelectedDriver(null)}>
                    <div className="modal-content driver-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Driver Details</h3>
                            <button className="close-btn" onClick={() => setSelectedDriver(null)}>×</button>
                        </div>

                        <div className="modal-body driver-details-body">
                            <div className="driver-profile-header">
                                <div className="large-avatar">
                                    {selectedDriver.profile_image_url ? (
                                        <img src={selectedDriver.profile_image_url} alt="Profile" />
                                    ) : (
                                        <span>{selectedDriver.name?.charAt(0)}</span>
                                    )}
                                </div>
                                <div className="driver-main-info">
                                    <h2>{selectedDriver.name}</h2>
                                    <p>{selectedDriver.email}</p>
                                    <p>{selectedDriver.phone}</p>
                                    <div className="status-actions">
                                        <span className={`status-badge ${getStatusColor(selectedDriver.status)}`}>
                                            {selectedDriver.status}
                                        </span>
                                        {selectedDriver.status === 'pending_approval' && (
                                            <div className="approval-buttons">
                                                <button
                                                    className="approve-btn"
                                                    onClick={() => updateDriverStatus(selectedDriver.id, 'active')}
                                                >
                                                    <CheckCircle size={16} /> Approve
                                                </button>
                                                <button
                                                    className="reject-btn"
                                                    onClick={() => updateDriverStatus(selectedDriver.id, 'rejected')}
                                                >
                                                    <XCircle size={16} /> Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="details-grid">
                                <div className="detail-section">
                                    <h4>Information</h4>
                                    <p><strong>NIC:</strong> {selectedDriver.nic_number}</p>
                                    <p><strong>License:</strong> {selectedDriver.license_number}</p>
                                    <p><strong>Address:</strong> {selectedDriver.home_address || 'N/A'}</p>
                                </div>
                                <div className="detail-section">
                                    <h4>Vehicle</h4>
                                    <p><strong>Type:</strong> {selectedDriver.vehicle_type}</p>
                                    <p><strong>Number:</strong> {selectedDriver.vehicle_number}</p>
                                </div>
                                <div className="detail-section">
                                    <h4>Bank Details</h4>
                                    <p><strong>Bank:</strong> {selectedDriver.bank_name}</p>
                                    <p><strong>Branch:</strong> {selectedDriver.branch_name}</p>
                                    <p><strong>Account Info:</strong> {selectedDriver.account_number} ({selectedDriver.account_holder_name})</p>
                                </div>
                            </div>

                            <div className="documents-section">
                                <h4>Verification Documents</h4>
                                <div className="docs-grid">
                                    <DocumentCard title="License Front" url={selectedDriver.license_front_image_url} />
                                    <DocumentCard title="License Back" url={selectedDriver.license_back_image_url} />
                                    <DocumentCard title="NIC Front" url={selectedDriver.nic_front_image_url} />
                                    <DocumentCard title="NIC Back" url={selectedDriver.nic_back_image_url} />
                                    <DocumentCard title="Vehicle Front" url={selectedDriver.vehicle_front_image_url} />
                                    <DocumentCard title="Vehicle Back" url={selectedDriver.vehicle_back_image_url} />
                                    <DocumentCard title="Vehicle Book" url={selectedDriver.vehicle_book_image_url} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const DocumentCard = ({ title, url }) => (
    <div className="doc-card">
        <p>{title}</p>
        {url ? (
            <a href={url} target="_blank" rel="noopener noreferrer">
                <img src={url} alt={title} className="doc-preview" />
            </a>
        ) : (
            <div className="doc-missing">Missing</div>
        )}
    </div>
);

export default Drivers;
