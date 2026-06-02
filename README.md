# Inltoor

A structural engineering learning app.

## Installation & Running Guide

### Backend (Python)

1. **Create a virtual environment** (recommended):
	```powershell
	python -m venv .venv
	.venv\Scripts\Activate.ps1
	```
	Or for bash:
	```bash
	python -m venv .venv
	source .venv/bin/activate
	```

1. (a) ** If no env shown:**
	```.venv\Scripts\Activate.ps1	```

2. **Install dependencies:**
	```bash
	pip install -r requirements.txt
	```

3. **Run the backend server:**
	```bash
	uvicorn app.main:app --reload
	```
	The API will be available at [http://localhost:8000](http://localhost:8000).

### Frontend (Next.js)

1. **Navigate to the frontend directory:**
	```bash
	cd frontend
	```

2. **Install frontend dependencies:**
	```bash
	npm install
	```

3. **Start the frontend development server:**
	```bash
	npm run dev
	```
	The frontend will be available at [http://localhost:3000](http://localhost:3000).


### Running Backend Tests

1. Make sure your virtual environment is activated and dependencies are installed.
2. Run tests using pytest:
	```bash
	pytest
	```
	This will discover and run all tests in the tests/ directory.

### Notes
- The backend uses FastAPI and is configured to allow CORS from the frontend.
- Make sure both backend and frontend are running for full functionality. (Use different terminals for this)
- For production, additional configuration may be required.

### Frontend
- npm install -D tailwindcss postcss autoprefixer
- npx tailwindcss init -p

## Goal
To make structural engineering interactive, visual, and fun for learners.
