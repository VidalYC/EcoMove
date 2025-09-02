from fastapi import FastAPI
from .core.config import settings
from .api.routers import users, stations, transports, loans, payments

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

app.include_router(users.router)
app.include_router(stations.router)
app.include_router(transports.router)
app.include_router(loans.router)
app.include_router(payments.router)

# Ejecución: uvicorn app.main:app --reload
