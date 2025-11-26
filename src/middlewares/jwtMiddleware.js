import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { jwtHelper } from '~/utils/jwt'

/**
 * Middleware: Verify JWT token và lấy userId từ token
 * Middleware này sẽ:
 * 1. Lấy token từ header Authorization: Bearer <token>
 * 2. Verify token
 * 3. Lưu userId vào req.userId để các controller/service sử dụng
 */
export const verifyToken = async (req, res, next) => {
  try {
    // Lấy token từ header Authorization
    const authHeader = req.headers.authorization

    // Kiểm tra có header Authorization không
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Authorization header is missing or invalid!')
    }

    // Lấy token (bỏ phần "Bearer ")
    const token = authHeader.substring(7)

    // Verify token và lấy payload
    const decoded = jwtHelper.verifyToken(token)

    // Lưu userId vào req để các controller/service sử dụng
    req.userId = decoded.userId

    // Chuyển sang middleware/controller tiếp theo
    next()
  } catch (error) {
    // Nếu token không hợp lệ hoặc hết hạn
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or expired token!'))
    } else {
      next(error)
    }
  }
}