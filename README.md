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
- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `GET  /api/users` — Search/explore users
- `GET  /api/projects` — Get projects
- `POST /api/messages/request` — Send message request
