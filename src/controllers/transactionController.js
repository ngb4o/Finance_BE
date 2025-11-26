import { StatusCodes } from 'http-status-codes'
import { transactionService } from '~/services/transactionService'

/**
 * Controller: Tạo transaction mới
 * req.userId được lấy từ JWT middleware
 */
const createNew = async (req, res, next) => {
  try {
    const result = await transactionService.createNew(req.body, req.userId)

    res.status(StatusCodes.CREATED).json({
      message: 'Transaction created successfully!',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Controller: Lấy danh sách transactions
 */
const getList = async (req, res, next) => {
  try {
    const result = await transactionService.getList(req.query, req.userId)

    res.status(StatusCodes.OK).json({
      message: 'Get transactions successfully!',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Controller: Lấy chi tiết transaction
 */
const getDetails = async (req, res, next) => {
  try {
    const result = await transactionService.getDetails(req.params.id, req.userId)

    res.status(StatusCodes.OK).json({
      message: 'Get transaction details successfully!',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Controller: Cập nhật transaction
 */
const update = async (req, res, next) => {
  try {
    const result = await transactionService.update(req.params.id, req.body, req.userId)

    res.status(StatusCodes.OK).json({
      message: 'Transaction updated successfully!',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Controller: Xóa transaction
 */
const deleteOne = async (req, res, next) => {
  try {
    const result = await transactionService.deleteOne(req.params.id, req.userId)

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * Controller: Lấy thống kê transactions
 */
const getStatistics = async (req, res, next) => {
  try {
    const result = await transactionService.getStatistics(req.query, req.userId)

    res.status(StatusCodes.OK).json({
      message: 'Get statistics successfully!',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const transactionController = {
  createNew,
  getList,
  getDetails,
  update,
  deleteOne,
  getStatistics
}
