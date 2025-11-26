import express from 'express'
import { userValidation } from '~/validations/userValidation'
import { userController } from '~/controllers/userController'

// Tạo Express Router để định nghĩa các routes
const Router = express.Router()

/**
 * Route: POST /v1/users/register
 * Đăng ký user mới
 *
 * Flow: Request → userValidation.register (validate dữ liệu) → userController.register (xử lý)
 */
Router.post('/register', userValidation.register, userController.register)

/**
 * Route: POST /v1/users/login
 * Đăng nhập user
 *
 * Flow: Request → userValidation.login (validate dữ liệu) → userController.login (xử lý)
 */
Router.post('/login', userValidation.login, userController.login)

export const userRoute = Router