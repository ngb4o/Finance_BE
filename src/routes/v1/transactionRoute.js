import express from 'express'
import { transactionValidation } from '~/validations/transactionValidation'
import { transactionController } from '~/controllers/transactionController'
import { verifyToken } from '~/middlewares/jwtMiddleware'

const Router = express.Router()

// Tất cả routes đều cần JWT authentication
Router.use(verifyToken)

/**
 * Route: POST /v1/transactions
 * Tạo transaction mới
 */
Router.post('/', transactionValidation.createNew, transactionController.createNew)

/**
 * Route: GET /v1/transactions/statistics
 * Lấy thống kê transactions (PHẢI đặt TRƯỚC /:id để tránh match nhầm)
 * Query params: dateFrom, dateTo
 */
Router.get('/statistics', transactionController.getStatistics)

/**
 * Route: GET /v1/transactions
 * Lấy danh sách transactions (có filter và pagination)
 * Query params: type, category, dateFrom, dateTo, limit, skip
 */
Router.get('/', transactionValidation.getList, transactionController.getList)

/**
 * Route: GET /v1/transactions/:id
 * Lấy chi tiết transaction
 */
Router.get('/:id', transactionController.getDetails)

/**
 * Route: PUT /v1/transactions/:id
 * Cập nhật transaction
 */
Router.put('/:id', transactionValidation.update, transactionController.update)

/**
 * Route: DELETE /v1/transactions/:id
 * Xóa transaction (soft delete)
 */
Router.delete('/:id', transactionController.deleteOne)

export const transactionRoute = Router
