# GoWash Backend API

Backend server for the GoWash laundry service application.

## Features

- User authentication (Login/Register)
- Service management
- Order management
- User profile management
- Admin dashboard support
- Mobile app support

## Installation

```bash
npm install
```

## Running the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Services
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get service by ID

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get orders (filtered by user or all for admin)
- `GET /api/orders/:id` - Get order by ID
- `PATCH /api/orders/:id/status` - Update order status
- `GET /api/stats/orders` - Get order statistics (admin)

### Users
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/users` - Get all users (admin)
- `GET /api/stats/users` - Get user statistics (admin)

### Health Check
- `GET /api/health` - Server health check

## Demo Credentials

### Admin
- Email: `admin@gowash.com`
- Password: `admin`

### Customer
- Email: `user@gowash.com`
- Password: `password`

### Agent
- Email: `agent@gowash.com`
- Password: `password`

## Environment Variables

Create a `.env` file:

```
PORT=5000
```

## Tech Stack

- Node.js
- Express.js
- CORS
- In-memory data store (for demo purposes)

## Notes

This is a demo backend using in-memory storage. For production, integrate with a real database (MongoDB, PostgreSQL, etc.).
