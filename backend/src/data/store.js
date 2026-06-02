// In-memory mock database
export const users = [
    { id: 1, name: "John Doe", email: "user@gowash.com", password: "password", phone: "1234567890", role: "customer" },
    { id: 2, name: "Super Admin", email: "admin@gowash.com", password: "admin", phone: "0987654321", role: "admin" },
    { id: 3, name: "Agent Smith", email: "agent@gowash.com", password: "password", phone: "1122334455", role: "agent" },
    { id: 4, name: "Jane Smith", email: "jane@example.com", password: "password", phone: "5556667777", role: "customer" }
];

export const services = [
    { id: 1, name: "Wash & Press", price: 350, unit: "kg", description: "Washing and steam pressing", icon: "shirt-outline", color: "#4facfe" },
    { id: 2, name: "Only Wash", price: 200, unit: "kg", description: "Washing and folding only", icon: "water-outline", color: "#00f2fe" },
    { id: 3, name: "Only Press", price: 150, unit: "item", description: "Steam pressing only", icon: "thermometer-outline", color: "#43e97b" },
    { id: 4, name: "Dry Clean", price: 800, unit: "item", description: "Specialized dry cleaning", icon: "leaf-outline", color: "#fa709a" },
    { id: 5, name: "Express", price: 1000, unit: "load", description: "Same day delivery", icon: "flash-outline", color: "#FF6B6B" }
];

export const orders = [
    {
        id: "2401",
        userId: 1,
        serviceId: 1,
        items: 12,
        totalPrice: 4200,
        status: "Washing",
        pickupDate: "2026-02-06",
        pickupTime: "10:00 AM - 12:00 PM",
        address: "123 Green Valley, Colombo 03",
        customerName: "John Doe",
        createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
        id: "2398",
        userId: 1,
        serviceId: 4,
        items: 5,
        totalPrice: 4000,
        status: "Ready",
        pickupDate: "2026-02-05",
        pickupTime: "02:00 PM - 04:00 PM",
        address: "123 Green Valley, Colombo 03",
        customerName: "John Doe",
        createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
        id: "2405",
        userId: 1,
        serviceId: 2,
        items: 8,
        totalPrice: 1600,
        status: "Pending",
        pickupDate: "2026-02-07",
        pickupTime: "09:00 AM - 11:00 AM",
        address: "45 Lake Drive, Colombo 07",
        customerName: "John Doe",
        createdAt: new Date(Date.now() - 1800000).toISOString()
    },
    {
        id: "2402",
        userId: 4,
        serviceId: 5,
        items: 1,
        totalPrice: 1000,
        status: "Delivered",
        pickupDate: "2026-02-04",
        pickupTime: "03:00 PM - 05:00 PM",
        address: "78 Park Avenue, Colombo 05",
        customerName: "Jane Smith",
        createdAt: new Date(Date.now() - 172800000).toISOString()
    },
    {
        id: "2399",
        userId: 4,
        serviceId: 3,
        items: 10,
        totalPrice: 1500,
        status: "Ready",
        pickupDate: "2026-02-05",
        pickupTime: "11:00 AM - 01:00 PM",
        address: "78 Park Avenue, Colombo 05",
        customerName: "Jane Smith",
        createdAt: new Date(Date.now() - 90000000).toISOString()
    }
];

export const feedback = [];
