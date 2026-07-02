const errorMiddleware = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";

    // Handle Mongoose duplicate key error
    if (err.code === 11000) {
        err.statusCode = 400;
        err.message = `Duplicate field value entered: ${Object.keys(err.keyValue)}`;
    }

    // Handle JSONWebTokenError
    if (err.name === "JsonWebTokenError") {
        err.statusCode = 401;
        err.message = "Json Web Token is invalid. Try again.";
    }

    // Handle TokenExpiredError
    if (err.name === "TokenExpiredError") {
        err.statusCode = 401;
        err.message = "Json Web Token is expired. Try again.";
    }

    res.status(err.statusCode).json({
        success: false,
        message: err.message,
        stack: process.env.NODE_ENV === "production" ? undefined : err.stack
    });
};

export default errorMiddleware;
