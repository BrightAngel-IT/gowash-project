import pool from '../config/database.js';

export const getLaundryItemPrices = async (req, res) => {
    try {
        const { laundryId, serviceId, allServices } = req.query;
        if (!laundryId) {
            return res.status(400).json({ message: "Laundry ID is required" });
        }

        if (allServices === 'true') {
            // Get all items and their prices for all services in a matrix format
            const itemsRes = await pool.query('SELECT * FROM master_items ORDER BY category, name');
            const pricesRes = await pool.query(
                'SELECT item_id, service_id, price, unit FROM laundry_service_item_prices WHERE laundry_id = $1',
                [laundryId]
            );
            const laundryPricesRes = await pool.query(
                'SELECT item_id, price, unit FROM laundry_item_prices WHERE laundry_id = $1',
                [laundryId]
            );

            // Create a map of general laundry prices/units
            const laundryPriceMap = {};
            laundryPricesRes.rows.forEach(p => {
                laundryPriceMap[p.item_id] = { price: p.price, unit: p.unit };
            });

            // Create a nested map of service specific prices/units
            const servicePriceMap = {};
            pricesRes.rows.forEach(p => {
                if (!servicePriceMap[p.item_id]) servicePriceMap[p.item_id] = {};
                servicePriceMap[p.item_id][p.service_id] = { price: p.price, unit: p.unit };
            });

            // Build the matrix
            const matrix = itemsRes.rows.map(item => ({
                ...item,
                current_price: laundryPriceMap[item.id]?.price || item.base_price,
                current_unit: laundryPriceMap[item.id]?.unit || 'item',
                service_prices: servicePriceMap[item.id] || {}
            }));

            return res.json(matrix);
        } else if (serviceId) {
            // Get prices for a specific service
            const result = await pool.query(`
                SELECT 
                    mi.id, 
                    mi.name, 
                    mi.icon, 
                    mi.category, 
                    mi.base_price,
                    COALESCE(lsip.price, lip.price, mi.base_price) as current_price,
                    COALESCE(lsip.unit, lip.unit, 'item') as current_unit,
                    lsip.id as service_override_id,
                    lip.id as laundry_override_id
                FROM master_items mi
                LEFT JOIN laundry_item_prices lip ON mi.id = lip.item_id AND lip.laundry_id = $1
                LEFT JOIN laundry_service_item_prices lsip ON mi.id = lsip.item_id AND lsip.laundry_id = $1 AND lsip.service_id = $2
                ORDER BY mi.category, mi.name
            `, [laundryId, serviceId]);
            return res.json(result.rows);
        } else {
            // Get general laundry prices
            const result = await pool.query(`
                SELECT 
                    mi.id, 
                    mi.name, 
                    mi.icon, 
                    mi.category, 
                    mi.base_price,
                    COALESCE(lip.price, mi.base_price) as current_price,
                    COALESCE(lip.unit, 'item') as current_unit,
                    lip.id as override_id
                FROM master_items mi
                LEFT JOIN laundry_item_prices lip ON mi.id = lip.item_id AND lip.laundry_id = $1
                ORDER BY mi.category, mi.name
            `, [laundryId]);
            return res.json(result.rows);
        }
    } catch (error) {
        console.error('Get item prices error:', error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateLaundryItemPrice = async (req, res) => {
    try {
        const { laundry_id, service_id, item_id, price, unit } = req.body;
        
        if (!laundry_id || !item_id || price === undefined) {
            return res.status(400).json({ message: "Laundry ID, Item ID and Price are required" });
        }

        const finalUnit = unit || 'item';

        if (service_id) {
            // Update service-specific price and unit
            const result = await pool.query(`
                INSERT INTO laundry_service_item_prices (laundry_id, service_id, item_id, price, unit)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (laundry_id, service_id, item_id)
                DO UPDATE SET price = $4, unit = $5
                RETURNING *
            `, [laundry_id, service_id, item_id, price, finalUnit]);
            res.json(result.rows[0]);
        } else {
            // Update general laundry price and unit
            const result = await pool.query(`
                INSERT INTO laundry_item_prices (laundry_id, item_id, price, unit)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (laundry_id, item_id)
                DO UPDATE SET price = $3, unit = $4
                RETURNING *
            `, [laundry_id, item_id, price, finalUnit]);
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error('Update item price error:', error);
        res.status(500).json({ message: "Server error" });
    }
};
