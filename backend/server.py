import json
import logging
import os
from pathlib import Path
from typing import Dict, List

from anthropic.types import Message
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from agent_dashboard.backend.routes import (
    conversation_routes,
    dashboard_agent_routes,
    dashboard_conversation_routes,
    team_routes,
)

log = logging.getLogger(__name__)

app = FastAPI()


origins = [
    "http://localhost:11252",  # Allow Next.js frontend
    "http://llmteam.zhuhome.duckdns.org",
    "https://llmteam.zhuhome.duckdns.org",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard_agent_routes.router)
app.include_router(dashboard_conversation_routes.router)
app.include_router(conversation_routes.router)
app.include_router(team_routes.router)


def register_exception(app: FastAPI):
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):

        exc_str = f'{exc}'.replace('\n', ' ').replace('   ', ' ')
        # or logger.error(f'{exc}')
        log.error(request, exc_str)
        content = {'status_code': 10422, 'message': exc_str, 'data': None}
        return JSONResponse(content=content, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)


@app.get('/')
def root():
    return {'message': "we're up!"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=11251)
