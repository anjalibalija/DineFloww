# TableMate AI

Full-stack AI-based restaurant table booking platform.

## Setup Instructions

1. **Clone the repository.**
2. **Setup Environment Variables:**
   - Copy `.env.example` to `.env` in the root directory.
   - Update `MONGO_URI` and `JWT_SECRET` as needed.

### Backend Setup

1. Open terminal and navigate to the `backend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the application:
   - For development: `npm run dev`
   - For production: `npm start`

### Frontend Setup

1. Open another terminal and navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

### Seeding Data

To populate the database with initial restaurants, tables, and an admin user, run the following command from the `backend` directory:
```bash
node seed/seedData.js
```

### Default Logins

**Admin:**
- Email: `admin@tablemate.com`
- Password: `adminpassword`

**Test User:**
- Email: `user@test.com`
- Password: `userpassword`
