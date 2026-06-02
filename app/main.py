import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.beam_routes import router as beam_router
from app.api.challenge_routes import router as challenge_router

app = FastAPI(
    title="Inltoor API",
    description="Structural engineering learning engine",
)

# ALLOWED_ORIGINS env var lets you add production URLs without changing code.
# e.g. on Render: ALLOWED_ORIGINS=https://inltoor.vercel.app
_extra = os.getenv("ALLOWED_ORIGINS", "")
allow_origins = ["http://localhost:3000"] + [o.strip() for o in _extra.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(beam_router)
app.include_router(challenge_router)

@app.get("/")
def root():
    return {"message": "Welcome to Inltoor"}

@app.get("/health")
def health():
    return {"status": "ok"}