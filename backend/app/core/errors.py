import logging
from typing import Any, Dict

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

logger = logging.getLogger("plant_doctors.api")


class AppError(Exception):
    status_code = 500
    code = "internal_error"
    message = "Unexpected server error."

    def __init__(self, message: str = None, details: Dict[str, Any] = None):
        super().__init__(message or self.message)
        self.message = message or self.message
        self.details = details or {}


class ValidationError(AppError):
    status_code = 422
    code = "validation_error"
    message = "Invalid request."


class AuthenticationError(AppError):
    status_code = 401
    code = "authentication_error"
    message = "Authentication required."


class AuthorizationError(AppError):
    status_code = 403
    code = "authorization_error"
    message = "Access denied."


class DependencyError(AppError):
    status_code = 503
    code = "dependency_unavailable"
    message = "Required dependency unavailable."


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def handle_app_error(_: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": exc.code,
                "message": exc.message,
                "details": exc.details,
            },
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled server exception at %s", request.url.path, exc_info=exc)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "internal_error",
                "message": "Unexpected server error.",
            },
        )

