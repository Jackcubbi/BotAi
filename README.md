# -BotAi- - Modern E-Commerce + AI Bot Platform

Full-stack project with:

- Frontend: React + TypeScript + Vite + Tailwind
- Backend: FastAPI + SQLite + JWT auth
- Features: e-commerce, AI bots, creator/admin tools, support chat with history

## Project Structure

```
-BotAi-/
├── frontend/
│   ├── components/
│   ├── contexts/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   ├── public/
│   ├── App.tsx
│   ├── global.css
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── routes/
│   ├── middleware/
│   ├── data/
│   ├── config.py
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── requirements.txt
│   ├── .env
│   └── .env.example
└── README.md
```

## Requirements

- Node.js 18+
- Python 3.11+

## Installation

```bash
# Frontend dependencies
cd frontend
npm install --legacy-peer-deps

# Backend dependencies
cd ../backend
pip install -r requirements.txt

# Backend env
copy .env.example .env
```

## Development

Recommended (2 terminals):

```bash
# Terminal 1 (backend)
cd backend
python main.py

# Terminal 2 (frontend)
cd frontend
npm run dev:frontend
```

Default local URLs:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8081
- API docs: http://localhost:8081/docs

## NPM Scripts (frontend/package.json)

```bash
npm run dev             # concurrently runs dev:backend + dev:frontend
npm run dev:frontend    # Vite dev server
npm run dev:backend     # Uvicorn backend (script currently uses port 8080)
npm run build
npm run typecheck
npm run test
npm run seed
```

## Configuration

Backend uses `backend/.env`.

Example:

```env
PORT=8081
JWT_SECRET=change-this
JWT_EXPIRATION_MINUTES=10080
DATABASE_PATH=data/yourdatabase.db
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8081,http://127.0.0.1:5173,http://127.0.0.1:8081
```

Frontend proxy is configured in `frontend/vite.config.ts` and currently points `/api` to `http://localhost:8081`.

## Recent Updates

- Support chat improvements:
  - archive/continue lifecycle
  - unread/read markers for user/admin
  - per-user unread badges in admin chat list
- Profile sync fix:
  - user profile edits now persist to backend
  - admin support chat now reads current user name/email
- Performance optimization:
  - added DB indexes for support/order/bot query paths
  - parallelized heavy account-page API calls
  - reduced support chat polling churn

## Tech Stack

Frontend:

- React 18
- TypeScript
- Vite
- TailwindCSS
- React Router

Backend:

- FastAPI
- Uvicorn
- SQLite
- Pydantic
- JWT
- SlowAPI

## License

This project does not have a specified license. Please contact the author for more details.

## Screenshots

<img width="1885" height="623" alt="my_bots" src="https://github.com/user-attachments/assets/b75493a0-6c65-4cde-a53d-6c43d823869a" />
<img width="1282" height="844" alt="my_account3" src="https://github.com/user-attachments/assets/fff9e2cd-210a-4552-90ce-f63cc8a1c69d" />
<img width="1276" height="843" alt="my_account2" src="https://github.com/user-attachments/assets/f0061d0a-085a-4271-b1b9-122dcdd5f65e" />
<img width="1280" height="829" alt="my_account1" src="https://github.com/user-attachments/assets/51c2145e-e744-4f70-8700-e30577dab94c" />
<img width="1270" height="835" alt="my_account_support" src="https://github.com/user-attachments/assets/d073eb62-d788-491a-93fa-3a189f3028d7" />
<img width="1903" height="916" alt="creator_dashboard" src="https://github.com/user-attachments/assets/8cb52436-35eb-472e-a8a9-bc9b3fc476e1" />
<img width="1899" height="949" alt="create_new" src="https://github.com/user-attachments/assets/bfc854c4-519c-41b6-a26e-a2b9b86c1ca8" />
<img width="1898" height="944" alt="admin_users_management" src="https://github.com/user-attachments/assets/b3b6ef58-5b29-4ff5-b010-995a87930b09" />
<img width="1911" height="945" alt="admin_support" src="https://github.com/user-attachments/assets/7754a3d9-ae0c-4987-be8a-0a601aa166e0" />
<img width="1909" height="939" alt="admin_dashboard" src="https://github.com/user-attachments/assets/f17fb8a7-5a73-4777-b368-7a6eea89577b" />
<img width="1903" height="950" alt="admin_bot_management" src="https://github.com/user-attachments/assets/6a482d4b-b389-47c9-afd1-ee894e64bee1" />


## Author

**Anatoli Rostsin**

- GitHub: [@Jackcubbi](https://github.com/Jackcubbi)
