import db from '../config/database.js';

// Generate CSV report for orders
export const generateOrdersCSV = async (req, res) => {
    const { startDate, endDate, status, laundryId } = req.query;

    try {
        let queryText = `
            SELECT o.id, o.customer_name as "customerName", s.name as "serviceName", o.items, o.total_price as "totalPrice", 
                   o.status, o.pickup_date as "pickupDate", o.pickup_time as "pickupTime", o.address, o.created_at as "createdAt",
                   l.name as "laundryName"
            FROM orders o
            JOIN services s ON o.service_id = s.id
            JOIN laundries l ON o.laundry_id = l.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (laundryId) {
            queryText += ` AND o.laundry_id = $${paramCount++}`;
            params.push(laundryId);
        }
        if (startDate) {
            queryText += ` AND o.created_at >= $${paramCount++}`;
            params.push(startDate);
        }
        if (endDate) {
            queryText += ` AND o.created_at <= $${paramCount++}`;
            params.push(endDate + ' 23:59:59');
        }
        if (status && status !== 'All') {
            queryText += ` AND o.status = $${paramCount++}`;
            params.push(status);
        }

        queryText += ' ORDER BY o.created_at DESC';

        const result = await db.query(queryText, params);
        const orders = result.rows;

        // Generate CSV
        const headers = ['Order ID', 'Laundry', 'Customer', 'Service', 'Items', 'Total (LKR)', 'Status', 'Pickup Date', 'Pickup Time', 'Address', 'Created At'];
        const csvRows = [headers.join(',')];

        orders.forEach(order => {
            const row = [
                order.id,
                `"${order.laundryName || 'N/A'}"`,
                `"${order.customerName || 'N/A'}"`,
                `"${order.serviceName}"`,
                order.items,
                order.totalPrice,
                order.status,
                order.pickupDate,
                `"${order.pickupTime}"`,
                `"${order.address}"`,
                new Date(order.createdAt).toLocaleString()
            ];
            csvRows.push(row.join(','));
        });

        const csv = csvRows.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=orders-report-${Date.now()}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('Generate orders CSV error:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// Generate revenue report
export const generateRevenueReport = async (req, res) => {
    const { startDate, endDate, laundryId } = req.query;

    try {
        let queryText = 'SELECT o.*, s.name as "serviceName" FROM orders o JOIN services s ON o.service_id = s.id WHERE 1=1';
        const params = [];
        let paramCount = 1;

        if (laundryId) {
            queryText += ` AND o.laundry_id = $${paramCount++}`;
            params.push(laundryId);
        }
        if (startDate) {
            queryText += ` AND o.created_at >= $${paramCount++}`;
            params.push(startDate);
        }
        if (endDate) {
            queryText += ` AND o.created_at <= $${paramCount++}`;
            params.push(endDate + ' 23:59:59');
        }

        const result = await db.query(queryText, params);
        const orders = result.rows;

        // Calculate revenue by service
        const servicesResult = await db.query('SELECT * FROM services');
        const services = servicesResult.rows;
        const revenueByService = {};

        services.forEach(service => {
            const serviceOrders = orders.filter(o => parseInt(o.service_id) === parseInt(service.id));
            revenueByService[service.name] = {
                orders: serviceOrders.length,
                revenue: serviceOrders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0)
            };
        });

        // Calculate revenue by status
        const statuses = ['Pending', 'Washing', 'Ready', 'Delivered'];
        const revenueByStatus = {};

        statuses.forEach(status => {
            const statusOrders = orders.filter(o => o.status === status);
            revenueByStatus[status] = {
                orders: statusOrders.length,
                revenue: statusOrders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0)
            };
        });

        const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
        const totalOrders = orders.length;

        // Generate CSV
        const csvRows = [];
        csvRows.push(laundryId ? 'GoWash Laundry Revenue Report' : 'GoWash Global Revenue Report');
        csvRows.push(`Generated: ${new Date().toLocaleString()}`);
        csvRows.push('');
        csvRows.push('Summary');
        csvRows.push(`Total Orders,${totalOrders}`);
        csvRows.push(`Total Revenue,LKR ${totalRevenue.toFixed(2)}`);
        csvRows.push('');
        csvRows.push('Revenue by Service');
        csvRows.push('Service,Orders,Revenue (LKR)');
        Object.entries(revenueByService).forEach(([service, data]) => {
            csvRows.push(`${service},${data.orders},${data.revenue.toFixed(2)}`);
        });
        csvRows.push('');
        csvRows.push('Revenue by Status');
        csvRows.push('Status,Orders,Revenue (LKR)');
        Object.entries(revenueByStatus).forEach(([status, data]) => {
            csvRows.push(`${status},${data.orders},${data.revenue.toFixed(2)}`);
        });

        const csv = csvRows.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=revenue-report-${Date.now()}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('Generate revenue report error:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// Generate customer report
export const generateCustomerReport = async (req, res) => {
    const { laundryId } = req.query;

    try {
        let customers = [];
        if (laundryId) {
            // Only get customers who have ordered from this laundry
            const result = await db.query(`
                SELECT DISTINCT u.* 
                FROM users u
                JOIN orders o ON u.id = o.user_id
                WHERE o.laundry_id = $1 AND u.role = 'customer'
            `, [laundryId]);
            customers = result.rows;
        } else {
            // Get all customers (SuperAdmin)
            const result = await db.query("SELECT * FROM users WHERE role = 'customer'");
            customers = result.rows;
        }

        const customerData = await Promise.all(customers.map(async (customer) => {
            // Get orders for this customer, optionally filtered by laundry
            let orderQuery = 'SELECT * FROM orders WHERE user_id = $1';
            let params = [customer.id];

            if (laundryId) {
                orderQuery += ' AND laundry_id = $2';
                params.push(laundryId);
            }
            orderQuery += ' ORDER BY created_at DESC';

            const ordersResult = await db.query(orderQuery, params);
            const orders = ordersResult.rows;

            const totalSpent = orders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
            const lastOrder = orders.length > 0 ? new Date(orders[0].created_at).toLocaleDateString() : 'N/A';

            return {
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                totalOrders: orders.length,
                totalSpent,
                lastOrder
            };
        }));

        // Sort by total spent
        customerData.sort((a, b) => b.totalSpent - a.totalSpent);

        // Generate CSV
        const headers = ['Customer Name', 'Email', 'Phone', 'Total Orders', 'Total Spent (LKR)', 'Last Order'];
        const csvRows = [headers.join(',')];

        customerData.forEach(customer => {
            const row = [
                `"${customer.name}"`,
                customer.email,
                customer.phone,
                customer.totalOrders,
                customer.totalSpent.toFixed(2),
                customer.lastOrder
            ];
            csvRows.push(row.join(','));
        });

        const csv = csvRows.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=customer-report-${Date.now()}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('Generate customer report error:', error);
        res.status(500).json({ message: "Server error" });
    }
};
