import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'

// Transaction types (tránh circular dependency)
const TRANSACTION_TYPES = {
  EXPENSE: 'expense',
  INCOME: 'income',
  TRANSFER: 'transfer'
}

/**
 * Validation cho tạo transaction mới
 */
const createNew = async (req, res, next) => {
  const correctCondition = Joi.object({
    // type: Loại transaction (expense, income, transfer)
    type: Joi.string().required()
      .valid(TRANSACTION_TYPES.EXPENSE, TRANSACTION_TYPES.INCOME, TRANSACTION_TYPES.TRANSFER),

    // amount: Số tiền (bắt buộc, phải > 0)
    amount: Joi.number().required().positive().min(0.01),

    // category: Danh mục (bắt buộc)
    category: Joi.string().required().min(2).max(50).trim().strict(),

    // note: Ghi chú (không bắt buộc)
    note: Joi.string().max(500).trim().strict().optional(),

    // date: Ngày giao dịch (không bắt buộc, mặc định là hôm nay)
    date: Joi.date().optional(),

    // walletId: ID của ví (không bắt buộc)
    walletId: Joi.string().optional()
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    const errorMessage = error.details?.map(detail => detail.message).join(', ') || error.message
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage))
  }
}

/**
 * Validation cho cập nhật transaction
 */
const update = async (req, res, next) => {
  const correctCondition = Joi.object({
    // type: Loại transaction (không bắt buộc khi update)
    type: Joi.string()
      .valid(TRANSACTION_TYPES.EXPENSE, TRANSACTION_TYPES.INCOME, TRANSACTION_TYPES.TRANSFER)
      .optional(),

    // amount: Số tiền (không bắt buộc khi update)
    amount: Joi.number().positive().min(0.01).optional(),

    // category: Danh mục (không bắt buộc khi update)
    category: Joi.string().min(2).max(50).trim().strict().optional(),

    // note: Ghi chú (không bắt buộc)
    note: Joi.string().max(500).trim().strict().optional(),

    // date: Ngày giao dịch (không bắt buộc)
    date: Joi.date().optional(),

    // walletId: ID của ví (không bắt buộc)
    walletId: Joi.string().optional()
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    const errorMessage = error.details?.map(detail => detail.message).join(', ') || error.message
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage))
  }
}

/**
 * Validation cho query parameters (get list)
 */
const getList = async (req, res, next) => {
  const correctCondition = Joi.object({
    // type: Lọc theo loại transaction
    type: Joi.string()
      .valid(TRANSACTION_TYPES.EXPENSE, TRANSACTION_TYPES.INCOME, TRANSACTION_TYPES.TRANSFER)
      .optional(),

    // category: Lọc theo category
    category: Joi.string().optional(),

    // dateFrom: Ngày bắt đầu (ISO string hoặc timestamp)
    dateFrom: Joi.date().optional(),

    // dateTo: Ngày kết thúc (ISO string hoặc timestamp)
    dateTo: Joi.date().optional(),

    // limit: Số lượng records mỗi page (mặc định 50)
    limit: Joi.number().integer().min(1).max(100).optional(),

    // skip: Số lượng records bỏ qua (cho pagination)
    skip: Joi.number().integer().min(0).optional()
  })

  try {
    await correctCondition.validateAsync(req.query, { abortEarly: false })
    next()
  } catch (error) {
    const errorMessage = error.details?.map(detail => detail.message).join(', ') || error.message
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage))
  }
}

export const transactionValidation = {
  createNew,
  update,
  getList
}