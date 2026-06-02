import React, { useState } from 'react';
import { Download, FileText, DollarSign, Users, Calendar } from 'lucide-react';
import './Reports.css';
import { API_URL } from './config';

function Reports({ currentUser }) {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [status, setStatus] = useState('All');
    const [downloading, setDownloading] = useState(false);

    const downloadReport = async (reportType) => {
        setDownloading(true);
        try {
            let url = `${API_URL}/reports/${reportType}`;
            const params = new URLSearchParams();

            if (currentUser?.laundry_id) {
                params.append('laundryId', currentUser.laundry_id);
            }

            if (reportType === 'orders' || reportType === 'revenue') {
                if (startDate) params.append('startDate', startDate);
                if (endDate) params.append('endDate', endDate);
                if (reportType === 'orders' && status !== 'All') params.append('status', status);
            }

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url);
            const blob = await response.blob();

            // Create download link
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `${reportType}-report-${Date.now()}.csv`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);

        } catch (error) {
            alert('Failed to download report');
            console.error(error);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="reports-container">
            <div className="reports-header">
                <h2>Download Reports</h2>
                <p>Generate and download various reports in CSV format</p>
            </div>

            {/* Date Range Filter */}
            <div className="filter-card">
                <h3><Calendar size={20} /> Date Range Filter</h3>
                <div className="date-filters">
                    <div className="filter-group">
                        <label>Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        <label>End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        <label>Status (Orders Only)</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value)}>
                            <option value="All">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Washing">Washing</option>
                            <option value="Ready">Ready</option>
                            <option value="Delivered">Delivered</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Report Cards */}
            <div className="reports-grid">
                <ReportCard
                    icon={<FileText size={32} />}
                    title="Orders Report"
                    description="Download detailed order information including customer details, services, and status"
                    color="blue"
                    onDownload={() => downloadReport('orders')}
                    disabled={downloading}
                />

                <ReportCard
                    icon={<DollarSign size={32} />}
                    title="Revenue Report"
                    description="Download revenue breakdown by service and status with totals and analytics"
                    color="green"
                    onDownload={() => downloadReport('revenue')}
                    disabled={downloading}
                />

                <ReportCard
                    icon={<Users size={32} />}
                    title="Customer Report"
                    description="Download customer list with order history, total spent, and engagement metrics"
                    color="purple"
                    onDownload={() => downloadReport('customers')}
                    disabled={downloading}
                />
            </div>

            <div className="report-info">
                <p><strong>Note:</strong> All reports are generated in CSV format and can be opened in Excel, Google Sheets, or any spreadsheet application.</p>
            </div>
        </div>
    );
}

const ReportCard = ({ icon, title, description, color, onDownload, disabled }) => (
    <div className={`report-card ${color}`}>
        <div className="report-icon">{icon}</div>
        <h3>{title}</h3>
        <p>{description}</p>
        <button
            className="download-btn"
            onClick={onDownload}
            disabled={disabled}
        >
            <Download size={18} />
            {disabled ? 'Downloading...' : 'Download CSV'}
        </button>
    </div>
);

export default Reports;
