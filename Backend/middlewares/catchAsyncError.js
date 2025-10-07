const catchAsyncError = (thefunction) => async (req, res, next) => {
    try {
        await thefunction(req, res, next);
    } catch (error) {
        res.status(error.code || 500).json({
            success: false,
            message: error.message || "Internal Server Error",
        });
    }
}

export default catchAsyncError;