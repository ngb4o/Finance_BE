import { transactionModel } from '~/models/transactionModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { ObjectId } from 'mongodb'

/**
 * Service: Tạo transaction mới
 * @param {Object} reqBody - Dữ liệu từ request body
 * @param {string} userId - User ID từ JWT token
 * @returns {Object} - Transaction đã tạo
 */
const createNew = async (reqBody, userId) => {
  // Tạo transaction object với userId từ JWT token
  const newTransaction = {
    ...reqBody,
    userId: userId, // Lấy từ JWT token (không cho user tự set)
    date: reqBody.date ? new Date(reqBody.date) : new Date() // Chuyển date string thành Date object
  }

  // Tạo transaction trong database
  const createdTransaction = await transactionModel.createNew(newTransaction)

  // Lấy transaction vừa tạo để trả về
  const getTransaction = await transactionModel.findOneById(createdTransaction.insertedId)

  return getTransaction
}

/**
 * Service: Lấy danh sách transactions của user
 * @param {Object} query - Query parameters (type, category, dateFrom, dateTo, limit, skip)
 * @param {string} userId - User ID từ JWT token
 * @returns {Object} - Danh sách transactions với pagination
 */
const getList = async (query, userId) => {
  // Build query object
  // userId từ JWT là string, cần chuyển thành ObjectId để query
  const findQuery = {
    userId: userId instanceof ObjectId ? userId : new ObjectId(userId),
    _destroy: false
  }

  // Thêm filter theo type nếu có
  if (query.type) {
    findQuery.type = query.type
  }

  // Thêm filter theo category nếu có
  if (query.category) {
    findQuery.category = query.category
  }

  // Thêm filter theo khoảng thời gian nếu có
  if (query.dateFrom || query.dateTo) {
    findQuery.date = {}
    if (query.dateFrom) {
      findQuery.date.$gte = new Date(query.dateFrom)
    }
    if (query.dateTo) {
      findQuery.date.$lte = new Date(query.dateTo)
    }
  }

  // Options cho pagination
  const options = {
    limit: parseInt(query.limit) || 50,
    skip: parseInt(query.skip) || 0,
    sort: { date: -1 } // Mới nhất trước
  }

  // Lấy danh sách transactions
  const result = await transactionModel.findMany(findQuery, options)

  return result
}

/**
 * Service: Lấy chi tiết transaction
 * @param {string} transactionId - Transaction ID
 * @param {string} userId - User ID từ JWT token (để verify ownership)
 * @returns {Object} - Transaction object
 */
const getDetails = async (transactionId, userId) => {
  const transaction = await transactionModel.findOneById(transactionId)

  if (!transaction) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Transaction not found!')
  }

  // Kiểm tra transaction có thuộc về user này không
  // So sánh ObjectId (transaction.userId là ObjectId từ DB, userId là string từ JWT)
  const transactionUserId = transaction.userId.toString()
  const requestUserId = userId instanceof ObjectId ? userId.toString() : userId
  if (transactionUserId !== requestUserId) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have permission to access this transaction!')
  }

  return transaction
}

/**
 * Service: Cập nhật transaction
 * @param {string} transactionId - Transaction ID
 * @param {Object} updateData - Dữ liệu cần cập nhật
 * @param {string} userId - User ID từ JWT token
 * @returns {Object} - Transaction đã cập nhật
 */
const update = async (transactionId, updateData, userId) => {
  // Kiểm tra transaction có tồn tại và thuộc về user không
  const transaction = await getDetails(transactionId, userId)

  // Chỉ cho phép cập nhật các field được phép
  const allowedFields = ['type', 'amount', 'category', 'note', 'date', 'walletId']
  const dataToUpdate = {}

  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      dataToUpdate[field] = updateData[field]
    }
  })

  // Chuyển date string thành Date object nếu có
  if (dataToUpdate.date) {
    dataToUpdate.date = new Date(dataToUpdate.date)
  }

  // Cập nhật transaction
  await transactionModel.update(transactionId, dataToUpdate)

  // Lấy transaction đã cập nhật
  const updatedTransaction = await transactionModel.findOneById(transactionId)

  return updatedTransaction
}

/**
 * Service: Xóa transaction (soft delete)
 * @param {string} transactionId - Transaction ID
 * @param {string} userId - User ID từ JWT token
 * @returns {Object} - Kết quả xóa
 */
const deleteOne = async (transactionId, userId) => {
  // Kiểm tra transaction có tồn tại và thuộc về user không
  await getDetails(transactionId, userId)

  // Soft delete
  await transactionModel.deleteOne(transactionId)

  return { message: 'Transaction deleted successfully!' }
}

/**
 * Service: Lấy thống kê transactions
 * @param {Object} query - Query parameters (dateFrom, dateTo)
 * @param {string} userId - User ID từ JWT token
 * @returns {Object} - Thống kê (totalExpense, totalIncome, balance, byCategory)
 */
const getStatistics = async (query, userId) => {
  // Mặc định lấy thống kê trong tháng hiện tại nếu không có dateFrom/dateTo
  const now = new Date()
  const dateFrom = query.dateFrom ? new Date(query.dateFrom) : new Date(now.getFullYear(), now.getMonth(), 1)
  const dateTo = query.dateTo ? new Date(query.dateTo) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  // Lấy thống kê
  const statistics = await transactionModel.getStatistics(userId, dateFrom, dateTo)

  return {
    ...statistics,
    dateFrom,
    dateTo
  }
}

export const transactionService = {
  createNew,
  getList,
  getDetails,
  update,
  deleteOne,
  getStatistics
}