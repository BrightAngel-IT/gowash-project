import db from '../config/database.js';

// Helper to calculate distance
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return parseFloat(d.toFixed(1));
};

// Helper to parse legacy notes for old orders
const parseLegacyNotes = (order) => {
    let cleanNotes = order.notes || '';
    
    // Always clean notes to avoid displaying legacy tags
    if (cleanNotes) {
        cleanNotes = cleanNotes.replace(/\[Items:[\s\S]*?\]/g, '').replace(/\[Add-ons:[\s\S]*?\]/g, '').trim();
    }

    if (order.itemsList && order.itemsList.length > 0) {
        order.notes = cleanNotes;
        return order;
    }

    if (!order.notes || !order.notes.includes('[Items:')) {
        order.notes = cleanNotes;
        return order;
    }

    let itemsList = [];
    try {
        const match = order.notes.match(/\[Items:\s*([\s\S]+?)\]/);
        if (match) {
            if (match[1].includes(':')) {
                const services = match[1].split(' | ');
                services.forEach(srv => {
                    const parts = srv.split(': ');
                    if (parts.length === 2) {
                        const srvName = parts[0].trim();
                        const srvItems = parts[1].trim();
                        srvItems.split(',').forEach(itemStr => {
                            const itemStrTrim = itemStr.trim();
                            if (!itemStrTrim) return;
                            const lastXIndex = itemStrTrim.lastIndexOf('x');
                            let name = itemStrTrim;
                            let qty = 1;
                            if (lastXIndex !== -1 && lastXIndex > 0) {
                                name = itemStrTrim.substring(0, lastXIndex).trim();
                                qty = parseInt(itemStrTrim.substring(lastXIndex + 1).trim()) || 1;
                            }
                            itemsList.push({
                                item_id: name.toLowerCase().replace(/\s+/g, '_'),
                                item_name: `${srvName} - ${name}`,
                                quantity: qty,
                                price_per_unit: '-',
                                total_price: '-'
                            });
                        });
                    }
                });
            } else {
                match[1].split(',').forEach(itemStr => {
                    const itemStrTrim = itemStr.trim();
                    if (!itemStrTrim) return;
                    const lastXIndex = itemStrTrim.lastIndexOf('x');
                    let name = itemStrTrim;
                    let qty = 1;
                    if (lastXIndex !== -1 && lastXIndex > 0) {
                        name = itemStrTrim.substring(0, lastXIndex).trim();
                        qty = parseInt(itemStrTrim.substring(lastXIndex + 1).trim()) || 1;
                    }
                    itemsList.push({
                        item_id: name.toLowerCase().replace(/\s+/g, '_'),
                        item_name: name,
                        quantity: qty,
                        price_per_unit: '-',
                        total_price: '-'
                    });
                });
            }
        }
        cleanNotes = cleanNotes.replace(/\[Items:.*?\]/g, '').replace(/\[Add-ons:.*?\]/g, '').trim();
    } catch (e) {
        console.log('Error parsing legacy items', e);
    }

    order.itemsList = itemsList;
    order.notes = cleanNotes;
    return order;
};

// Create a new order
export const createOrder = async (req, res) => {
    const { userId, serviceId, items, pickupDate, pickupTime, address, laundryId, notes, totalPrice: reqTotalPrice, orderItems, deliveryFee, customerLat, customerLng } = req.body;

    console.log('📦 New Order Request:', { userId, laundryId, itemsCount: items, deliveryFee, customerLat, customerLng });

    if (!userId || (!serviceId && (!orderItems || orderItems.length === 0)) || !items || !pickupDate || !pickupTime || !address || !laundryId) {
        return res.status(400).json({ message: "Incomplete order data. All fields including Laundry and Items are required." });
    }

    try {
        // Use the first service ID from orderItems if not provided directly
        const mainServiceId = serviceId || (orderItems && orderItems.length > 0 ? orderItems[0].serviceId : null);

        // Check laundry existence and get coordinates
        const laundry = await db.query('SELECT id, name, lat, lng FROM laundries WHERE id = $1', [laundryId]);
        if (laundry.rows.length === 0) {
            return res.status(400).json({ message: `Branch ID ${laundryId} not found. Please select a valid laundry.` });
        }
        
        const laundryLat = laundry.rows[0].lat;
        const laundryLng = laundry.rows[0].lng;

        // Get user details
        const users = await db.query('SELECT name FROM users WHERE id = $1', [userId]);
        if (users.rows.length === 0) {
            return res.status(400).json({ message: "User not found. Please log in again." });
        }
        const customerName = users.rows[0].name;

        // Use the delivery fee from the frontend (which includes fixed base fee + any express fees)
        let finalDeliveryFee = deliveryFee !== undefined ? deliveryFee : 125;

        // Calculate total price: items + finalDeliveryFee
        const totalPrice = (reqTotalPrice - (deliveryFee || 0)) + finalDeliveryFee;

        // Insert master order
        const result = await db.query(
            `INSERT INTO orders (user_id, service_id, items, total_price, delivery_fee, status, pickup_date, pickup_time, address, customer_name, laundry_id, notes, customer_lat, customer_lng) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
            [userId, mainServiceId, items, totalPrice, finalDeliveryFee, 'Pending', pickupDate, pickupTime, address, customerName, laundryId, notes || '', customerLat, customerLng]
        );

        const orderId = result.rows[0].id;

        // Insert individual order items if provided
        if (orderItems && Array.isArray(orderItems)) {
            for (const item of orderItems) {
                await db.query(
                    `INSERT INTO order_items (order_id, service_id, item_id, item_name, quantity, price_per_unit, total_price, pieces) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [orderId, item.serviceId, item.itemId, item.itemName, item.quantity, item.pricePerUnit, item.totalPrice, item.pieces || null]
                );
            }
        }

        // Get the created order with master service details (or default)
        const newOrder = await db.query(
            `SELECT 
                o.*, 
                COALESCE(s.name, 'Multi-Service') as "serviceName", 
                COALESCE(s.color, '#4facfe') as "serviceColor", 
                l.name as "laundryName"
             FROM orders o 
             LEFT JOIN services s ON o.service_id = s.id 
             JOIN laundries l ON o.laundry_id = l.id
             WHERE o.id = $1`,
            [orderId]
        );

        console.log('✅ Order created successfully:', orderId);
        res.status(201).json(newOrder.rows[0]);
    } catch (error) {
        console.error('❌ Order insertion failed:', error);
        res.status(500).json({
            message: "Failed to place order due to a database error.",
            error: error.message,
            detail: error.detail
        });
    }
};

// Get orders (filtered by user or all for admin)
export const getUserOrders = async (req, res) => {
    const userId = parseInt(req.query.userId);
    const laundryId = req.query.laundryId;

    try {
        let queryText = `
            SELECT 
                o.*, 
                s.name as "serviceName", 
                s.color as "serviceColor", 
                l.name as "laundryName",
                COALESCE(
                    (SELECT json_agg(oi.*) FROM order_items oi WHERE oi.order_id = o.id),
                    '[]'::json
                ) as "itemsList"
            FROM orders o 
            LEFT JOIN services s ON o.service_id = s.id
            LEFT JOIN laundries l ON o.laundry_id = l.id
            WHERE 1=1
        `;
        let params = [];

        if (laundryId) {
            params.push(laundryId);
            queryText += ` AND o.laundry_id = $${params.length}`;
        }

        if (userId) {
            params.push(userId);
            queryText += ` AND o.user_id = $${params.length}`;
        }

        queryText += ' ORDER BY o.created_at DESC';

        const result = await db.query(queryText, params);
        const orders = result.rows.map(parseLegacyNotes);
        res.json(orders);
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get single order by ID
export const getOrderById = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT o.*, s.name as "serviceName", s.color as "serviceColor", 
                    l.name as "laundryName", l.address as "laundryAddress",
                    l.lat as "laundry_lat", l.lng as "laundry_lng",
                    COALESCE(
                        (SELECT json_agg(oi.*) FROM order_items oi WHERE oi.order_id = o.id),
                        '[]'::json
                    ) as "itemsList"
             FROM orders o 
             LEFT JOIN services s ON o.service_id = s.id 
             LEFT JOIN laundries l ON o.laundry_id = l.id
             WHERE o.id = $1`,
            [req.params.id]
        );

        if (result.rows.length > 0) {
            res.json(parseLegacyNotes(result.rows[0]));
        } else {
            res.status(404).json({ message: "Order not found" });
        }
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// Update order status (admin only)
export const updateOrderStatus = async (req, res) => {
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ message: "Status is required" });
    }

    const validStatuses = ['Pending', 'Confirmed', 'Pickup', 'Washing', 'Drying', 'Ready', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
    }

    try {
        await db.query('UPDATE orders SET status = $1 WHERE id = $2', [status, req.params.id]);

        const result = await db.query(
            `SELECT o.*, s.name as "serviceName", s.color as "serviceColor", 
                    l.name as "laundryName", l.address as "laundryAddress",
                    l.lat as "laundry_lat", l.lng as "laundry_lng"
             FROM orders o 
             LEFT JOIN services s ON o.service_id = s.id 
             LEFT JOIN laundries l ON o.laundry_id = l.id
             WHERE o.id = $1`,
            [req.params.id]
        );

        if (result.rows.length > 0) {
            const updatedOrder = result.rows[0];

            // Notify Driver if status is Confirmed (Pickup) or Ready (Delivery)
            const io = req.app.get('io');
            if (status === 'Confirmed' || status === 'Ready') {
                if (io) {
                    io.emit('new_driver_job', updatedOrder);
                    console.log(`📡 Emitted new_driver_job for order #${updatedOrder.id} with status ${status}`);
                }
            }

            // Always notify the customer about status change
            if (io) {
                io.to(`user_${updatedOrder.user_id}`).emit('order_status_update', updatedOrder);
                console.log(`📡 Emitted order_status_update to user_${updatedOrder.user_id} for order #${updatedOrder.id}`);
            }

            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: "Order not found" });
        }
    } catch (error) {
        console.error('Update order error:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get order statistics (admin only)
export const getOrderStats = async (req, res) => {
    const { laundryId } = req.query;

    try {
        let baseQuery = 'WHERE 1=1';
        let params = [];

        if (laundryId) {
            params.push(laundryId);
            baseQuery += ' AND laundry_id = $1';
        }

        const totalResult = await db.query(`SELECT COUNT(*) as "totalOrders", SUM(total_price) as "totalRevenue" FROM orders ${baseQuery}`, params);
        const statusCounts = await db.query(`
            SELECT 
                SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as "pendingOrders",
                SUM(CASE WHEN status IN ('Washing', 'Drying', 'Ready') THEN 1 ELSE 0 END) as "activeOrders",
                SUM(CASE WHEN status = 'Delivered' THEN 1 ELSE 0 END) as "completedOrders"
            FROM orders
            ${baseQuery}
        `, params);

        const byStatus = await db.query(`
            SELECT status, COUNT(*) as count 
            FROM orders 
            ${baseQuery}
            GROUP BY status
        `, params);

        const ordersByStatus = {};
        byStatus.rows.forEach(row => {
            ordersByStatus[row.status] = row.count;
        });

        res.json({
            totalOrders: parseInt(totalResult.rows[0].totalOrders) || 0,
            totalRevenue: parseFloat(totalResult.rows[0].totalRevenue) || 0,
            pendingOrders: parseInt(statusCounts.rows[0].pendingOrders) || 0,
            activeOrders: parseInt(statusCounts.rows[0].activeOrders) || 0,
            completedOrders: parseInt(statusCounts.rows[0].completedOrders) || 0,
            ordersByStatus
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// Edit an order (update items, total price, and details)
export const editOrder = async (req, res) => {
    const orderId = req.params.id;
    const { items, totalPrice: reqTotalPrice, orderItems, deliveryFee, pickupDate, pickupTime, address, notes, customerLat, customerLng, serviceId } = req.body;
    
    try {
        // Check if order exists and is Pending
        const orderCheck = await db.query('SELECT status FROM orders WHERE id = $1', [orderId]);
        if (orderCheck.rows.length === 0) {
            return res.status(404).json({ message: "Order not found" });
        }
        if (orderCheck.rows[0].status !== 'Pending') {
            return res.status(400).json({ message: "Only 'Pending' orders can be edited." });
        }
        
        // Use the delivery fee from the frontend (which includes fixed base fee + any express fees)
        let finalDeliveryFee = deliveryFee !== undefined ? deliveryFee : 125;
        const totalPrice = (reqTotalPrice - (deliveryFee || 0)) + finalDeliveryFee;
        
        // Delete existing items
        await db.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);
        
        // Insert new items
        if (orderItems && Array.isArray(orderItems)) {
            for (const item of orderItems) {
                await db.query(
                    `INSERT INTO order_items (order_id, service_id, item_id, item_name, quantity, price_per_unit, total_price, pieces) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [orderId, item.serviceId, item.itemId, item.itemName, item.quantity, item.pricePerUnit, item.totalPrice, item.pieces || null]
                );
            }
        }
        
        // Update order record including logistics details
        await db.query(
            `UPDATE orders 
             SET items = $1, total_price = $2, delivery_fee = $3, 
                 pickup_date = COALESCE($4, pickup_date), 
                 pickup_time = COALESCE($5, pickup_time), 
                 address = COALESCE($6, address), 
                 notes = COALESCE($7, notes),
                 customer_lat = COALESCE($8, customer_lat),
                 customer_lng = COALESCE($9, customer_lng),
                 service_id = COALESCE($11, service_id)
             WHERE id = $10`, 
            [
                items, 
                totalPrice, 
                finalDeliveryFee, 
                pickupDate || null, 
                pickupTime || null, 
                address || null, 
                notes || null, 
                customerLat || null, 
                customerLng || null, 
                orderId,
                serviceId || null
            ]
        );
        
        res.json({ message: "Order updated successfully" });
    } catch (error) {
        console.error('Edit order error:', error);
        res.status(500).json({ message: "Server error" });
    }
};
