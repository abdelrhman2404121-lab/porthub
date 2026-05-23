# PortfolioHub 🚀

A professional networking platform for individuals and companies.

## Tech Stack
- **Backend:** Node.js, Express, MongoDB (Atlas), Mongoose, JWT
- **Frontend:** HTML, CSS, Vanilla JS

## Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
# Copy the example file
copy .env.example .env
```
Then open `.env` and fill in:
- `MONGO_URI` — get this from [MongoDB Atlas](https://cloud.mongodb.com)
- `JWT_SECRET` — any random secret string
- `PORT` — leave as 5000

### 4. Run the server
```bash
npm run dev
```

### 5. Open in browser
```
http://localhost:5000
```

> ⚠️ Never open the HTML files directly — always use `http://localhost:5000`

## Pages
| URL | Page |
|-----|------|
| `/` | Home |
| `/login` | Login |
| `/register` | Register |
| `/dashboard` | Dashboard |
| `/explore` | Explore users |
| `/profile?id=me` | My Profile |
| `/messages` | Messages |
| `/settings` | Settings |
| `/admin` | Admin panel |

## API Endpoints
All API routes are prefixed with `/api/`
- **Auth**: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
- **Users**: `/api/users/profile`, `/api/users/settings`, `/api/users/experience`, `/api/users/education`, `/api/users/requests`
- **Projects**: `/api/projects` (Create, Read, Update, Delete)
- **Messages**: `/api/messages` (Conversations, room chats)
- **Comments/Ratings**: `/api/comments` (Add, Delete, Admin Moderation)
- **Admin**: `/api/admin/stats`, `/api/admin/users`, `/api/admin/comments`

## Backend Architecture Documentation
A comprehensive technical manual detailing the entire backend design from A to Z has been generated as a PDF on the root of the project:
👉 **[backend_architecture_guide.pdf](backend_architecture_guide.pdf)**

This report covers:
1. MVC Architecture & System Design Flow
2. Backend Folder/File Structural Blueprints
3. Mongoose Schemas & Subdocument Array CRUD Operations
4. JWT + Cookie Session Flow & Authentication Guards
5. Detailed REST API Endpoint Reference tables
6. Multer-Powered Secure File Upload Setup
7. Centralized Error Handling & Input Validation Systems
8. Real-time Messaging Mechanics & Viewer Analytics
