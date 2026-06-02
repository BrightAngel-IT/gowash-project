-- GoWash Database Schema (PostgreSQL)

-- Laundries Table
CREATE TABLE IF NOT EXISTS laundries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    manager_name VARCHAR(255),
    opening_time VARCHAR(20),
    closing_time VARCHAR(20),
    image_url TEXT,
    username VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    lat DECIMAL(9, 6),
    lng DECIMAL(9, 6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'agent', 'superadmin')),
    laundry_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (laundry_id) REFERENCES laundries(id) ON DELETE SET NULL
);

-- Services Table
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    color VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    service_id INT NOT NULL,
    laundry_id INT,
    items INT NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(10, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Pickup', 'Washing', 'Drying', 'Ready', 'Delivered', 'Cancelled')),
    pickup_date DATE NOT NULL,
    pickup_time VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    customer_name VARCHAR(255),
    notes TEXT,
    customer_lat DECIMAL(9, 6),
    customer_lng DECIMAL(9, 6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
    FOREIGN KEY (laundry_id) REFERENCES laundries(id) ON DELETE SET NULL
);

-- Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    order_id INT,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    service_id INT NOT NULL,
    item_id VARCHAR(100),
    item_name VARCHAR(255),
    quantity INT NOT NULL,
    price_per_unit DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    pieces INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT
);

-- Insert Default Admin User
INSERT INTO users (name, email, password, phone, role) VALUES
('Super Admin', 'superadmin@gowash.com', 'admin123', '0987654321', 'superadmin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (name, email, password, phone, role) VALUES
('Admin User', 'admin@gowash.com', 'admin', '1122334455', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert Sample Laundries
INSERT INTO laundries (name, address, phone, email, manager_name, opening_time, closing_time, image_url, username, password, lat, lng) VALUES
('GoWash Central', '123 Main St, Colombo', '0112233445', 'central@gowash.com', 'Amal Perera', '08:00 AM', '08:00 PM', 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?q=80&w=2070&auto=format&fit=crop', 'central', 'admin123', 6.9147, 79.8778),
('GoWash Kandy', '45 Hill Rd, Kandy', '0812233445', 'kandy@gowash.com', 'Kasun Silva', '09:00 AM', '07:00 PM', 'https://images.unsplash.com/photo-1545173168-9f1947eebb9f?q=80&w=2071&auto=format&fit=crop', 'kandy', 'admin123', 7.2906, 80.6337),
('GoWash Galle', '78 Beach Rd, Galle', '0912233445', 'galle@gowash.com', 'Samith Fernado', '08:30 AM', '07:30 PM', 'https://images.unsplash.com/photo-1518131340027-e98218933b93?q=80&w=2071&auto=format&fit=crop', 'galle', 'admin123', 6.0367, 80.2170);

INSERT INTO users (name, email, password, phone, role) VALUES
('John Doe', 'user@gowash.com', 'password', '1234567890', 'customer')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (name, email, password, phone, role, laundry_id) VALUES
('Agent Smith', 'agent@gowash.com', 'password', '1122334455', 'agent', 1)
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (name, email, password, phone, role) VALUES
('Jane Smith', 'jane@example.com', 'password', '5556667777', 'customer')
ON CONFLICT (email) DO NOTHING;

-- Insert Services
INSERT INTO services (name, price, unit, description, icon, color) VALUES
('Wash & Press', 350.00, 'kg', 'Washing and professional steam pressing', 'shirt-outline', '#4facfe'),
('Only Wash', 200.00, 'kg', 'Expert washing and precise folding', 'water-outline', '#00f2fe'),
('Only Press', 150.00, 'item', 'High-heat professional steam pressing', 'thermometer-outline', '#43e97b'),
('Dry Clean', 800.00, 'item', 'Specialized non-aqueous dry cleaning', 'leaf-outline', '#fa709a'),
('Express', 1000.00, 'load', 'Priority processing with same-day delivery', 'flash-outline', '#FF6B6B'),
('Steam Iron', 180.00, 'item', 'Vertical steam treatment for delicate fabrics', 'infinite-outline', '#8E2DE2'),
('Curtain Care', 1200.00, 'item', 'Deep cleaning for heavy drapes and curtains', 'browsers-outline', '#f9d423'),
('Carpet Clean', 2500.00, 'sqft', 'Industrial deep cleaning for all rug types', 'grid-outline', '#30cfd0'),
('Shoe Care', 1500.00, 'pair', 'Complete restoration and cleaning for shoes', 'footsteps-outline', '#3f0d12'),
('Leather Care', 3000.00, 'item', 'Specialized cleaning for leather jackets/bags', 'layers-outline', '#6a11cb');

-- Insert Sample Orders
-- Drivers Table
CREATE TABLE IF NOT EXISTS drivers (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    vehicle_number VARCHAR(50) NOT NULL,
    vehicle_type VARCHAR(50) DEFAULT 'Tuk Tuk',
    -- Verification details
    nic_number VARCHAR(20),
    license_number VARCHAR(20),
    home_address TEXT,
    profile_image_url TEXT,
    license_front_image_url TEXT,
    license_back_image_url TEXT,
    nic_front_image_url TEXT,
    nic_back_image_url TEXT,
    vehicle_front_image_url TEXT,
    vehicle_back_image_url TEXT,
    vehicle_book_image_url TEXT,
    -- Bank details for payouts
    bank_name VARCHAR(100),
    branch_name VARCHAR(100),
    account_holder_name VARCHAR(255),
    account_number VARCHAR(50),
    -- Operational status
    status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy', 'pending_approval', 'active', 'rejected')),
    current_lat DECIMAL(9, 6),
    current_lng DECIMAL(9, 6),
    rating DECIMAL(3, 2) DEFAULT 5.00,
    total_earnings DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- Ride Assignments Table
CREATE TABLE IF NOT EXISTS ride_assignments (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    driver_id INT NOT NULL,
    status VARCHAR(50) DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'arrived', 'picked_up', 'delivered', 'cancelled')),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
);

-- Insert Sample Drivers
-- Assuming user_id 5 and 6 will be drivers (need to create them first or use existing)
INSERT INTO users (name, email, password, phone, role) VALUES
('Ravi Silva', 'ravi@driver.com', 'driver123', '0771234567', 'agent'),
('Sunil Perera', 'sunil@driver.com', 'driver123', '0777654321', 'agent')
ON CONFLICT (email) DO NOTHING;

INSERT INTO drivers (user_id, vehicle_number, vehicle_type, status)
SELECT id, 'WP-ABC-1234', 'Tuk Tuk', 'online' FROM users WHERE email = 'ravi@driver.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO drivers (user_id, vehicle_number, vehicle_type, status)
SELECT id, 'WP-XYZ-9876', 'Tuk Tuk', 'offline' FROM users WHERE email = 'sunil@driver.com'
ON CONFLICT (user_id) DO NOTHING;

-- Laundry Time Slots Pricing Table
CREATE TABLE IF NOT EXISTS laundry_time_slots (
    id SERIAL PRIMARY KEY,
    laundry_id INT NOT NULL,
    label VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (laundry_id) REFERENCES laundries(id) ON DELETE CASCADE
);

-- Master Items Table
CREATE TABLE IF NOT EXISTS master_items (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(100),
    category VARCHAR(100),
    base_price DECIMAL(10, 2)
);

-- Laundry Item Prices Table
CREATE TABLE IF NOT EXISTS laundry_item_prices (
    id SERIAL PRIMARY KEY,
    laundry_id INT NOT NULL,
    item_id VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) DEFAULT 'item',
    FOREIGN KEY (laundry_id) REFERENCES laundries(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES master_items(id) ON DELETE CASCADE,
    UNIQUE(laundry_id, item_id)
);

-- Laundry Service Item Prices Table
CREATE TABLE IF NOT EXISTS laundry_service_item_prices (
    id SERIAL PRIMARY KEY,
    laundry_id INT NOT NULL,
    service_id INT NOT NULL,
    item_id VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) DEFAULT 'item',
    FOREIGN KEY (laundry_id) REFERENCES laundries(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES master_items(id) ON DELETE CASCADE,
    UNIQUE(laundry_id, service_id, item_id)
);

-- Insert Master Items
INSERT INTO master_items (id, name, icon, category, base_price) VALUES
('shirt', 'Shirt', 'shirt-outline', 'Tops', 150.00),
('tshirt', 'T-Shirt', 'shirt', 'Tops', 100.00),
('blouse', 'Blouse', 'woman-outline', 'Tops', 150.00),
('trouser', 'Trouser', 'body-outline', 'Bottoms', 150.00),
('jeans', 'Jeans', 'body', 'Bottoms', 200.00),
('shorts', 'Shorts', 'browsers-outline', 'Bottoms', 100.00),
('saree', 'Saree', 'color-palette-outline', 'Dresses', 500.00),
('dress', 'Dress', 'woman-outline', 'Dresses', 350.00),
('suit', 'Suit (2Pcs)', 'briefcase-outline', 'Formal', 800.00),
('jacket', 'Jacket', 'snow-outline', 'Formal', 600.00),
('bedsheet', 'Bed Sheet', 'bed-outline', 'Household', 300.00),
('towel', 'Towel', 'layers-outline', 'Household', 150.00),
('curtain', 'Curtain (m)', 'browsers-outline', 'Premium', 400.00),
('rug', 'Rug/Carpet', 'grid-outline', 'Premium', 1200.00),
('shoes', 'Shoes', 'footsteps-outline', 'Premium', 1500.00),
('suit_leather', 'Leather Jacket', 'layers-outline', 'Premium', 3000.00),
('underwear', 'Underwear', 'shield-outline', 'Others', 50.00),
('socks', 'Socks', 'footsteps-outline', 'Others', 50.00)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    icon = EXCLUDED.icon, 
    category = EXCLUDED.category, 
    base_price = EXCLUDED.base_price;
