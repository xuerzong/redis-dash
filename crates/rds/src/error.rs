use std::io;

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
};

#[derive(Debug)]
pub(crate) struct AppError {
    status: StatusCode,
    message: String,
}

impl AppError {
    pub(crate) fn new(status: StatusCode, message: impl Into<String>) -> Self {
        Self {
            status,
            message: message.into(),
        }
    }
}

impl From<String> for AppError {
    fn from(value: String) -> Self {
        Self::new(StatusCode::INTERNAL_SERVER_ERROR, value)
    }
}

impl From<io::Error> for AppError {
    fn from(value: io::Error) -> Self {
        let status = if value.kind() == io::ErrorKind::NotFound {
            StatusCode::NOT_FOUND
        } else {
            StatusCode::INTERNAL_SERVER_ERROR
        };
        Self::new(status, value.to_string())
    }
}

impl From<axum::Error> for AppError {
    fn from(value: axum::Error) -> Self {
        Self::new(StatusCode::INTERNAL_SERVER_ERROR, value.to_string())
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        (self.status, self.message).into_response()
    }
}
