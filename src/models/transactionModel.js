import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { GET_DB } from '~/config/mongodb'

// Tên collection trong MongoDB
const TRANSACTION_COLLECTION_NAME = 'transactions'

// Enum cho loại transaction
const TRANSACTION_TYPES = {
  EXPENSE: 'expense', // Chi tiêu
  INCOME: 'income', // Thu nhập
  TRANSFER: 'transfer' // Chuyển khoản
}

// Schema validation cho Transaction
const TRANSACTION_COLLECTION_SCHEMA = Joi.object({
  // userId: ID của user sở hữu transaction này (bắt buộc)
  // Lưu dưới dạng ObjectId trong DB, nhưng validate như string
  userId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),

  // type: Loại transaction (expense, income, transfer)
  type: Joi.string().required().valid(TRANSACTION_TYPES.EXPENSE, TRANSACTION_TYPES.INCOME, TRANSACTION_TYPES.TRANSFER),

  // amount: Số tiền (bắt buộc, phải > 0)
  amount: Joi.number().required().positive().min(0.01),

  // category: Danh mục chi tiêu/thu nhập (bắt buộc)
  // Expense: Food, Daily, Traffic, Social, Housing, Gift, Phone, Clothes, Relax, Beauty, Health, Tax
  // Income: Bonus, Salary, Investment, Part time, Freelance
  category: Joi.string().required().min(2).max(50).trim().strict(),

  // note: Ghi chú (không bắt buộc)
  note: Joi.string().max(500).trim().strict().default(''),

  // date: Ngày giao dịch (mặc định là hôm nay)
  date: Joi.date().default(() => new Date()),

  // walletId: ID của ví (nếu có nhiều ví) - không bắt buộc
  walletId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).default(null),

  // Thời gian tạo và cập nhật
  createdAt: Joi.date().default(() => new Date()),
  updatedAt: Joi.date().default(null),
  _destroy: Joi.boolean().default(false)
})

/**
 * Validate dữ liệu trước khi tạo transaction mới
 * @param {Object} data - Dữ liệu transaction cần validate
 * @returns {Object} - Dữ liệu đã được validate và format
 */
const validateBeforeCreate = async (data) => {
  return await TRANSACTION_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

/**
 * Tạo transaction mới trong database
 * @param {Object} data - Dữ liệu transaction cần tạo
 * @returns {Object} - Kết quả insert (có insertedId)
 */
const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    // Chuyển userId từ string thành ObjectId
    if (validData.userId) {
      validData.userId = new ObjectId(validData.userId)
    }
    return await GET_DB().collection(TRANSACTION_COLLECTION_NAME).insertOne(validData)
  } catch (error) {
    throw new Error(error.message || error)
  }
}

/**
 * Tìm transaction theo ID
 * @param {string} id - Transaction ID cần tìm
 * @returns {Object|null} - Transaction object hoặc null nếu không tìm thấy
 */
const findOneById = async (id) => {
  try {
    return await GET_DB().collection(TRANSACTION_COLLECTION_NAME).findOne({ _id: new ObjectId(id) })
  } catch (error) {
    throw new Error(error.message || error)
  }
}

/**
 * Lấy danh sách transactions của user với filter và pagination
 * @param {Object} query - Query object (userId, type, category, dateFrom, dateTo, etc.)
 * @param {Object} options - Options (limit, skip, sort)
 * @returns {Array} - Mảng các transactions
 */
const findMany = async (query = {}, options = {}) => {
  try {
    const {
      limit = 50,
      skip = 0,
      sort = { date: -1 } // Mặc định sort theo date giảm dần (mới nhất trước)
    } = options

    // Build query object
    const findQuery = { _destroy: false, ...query }

    // Tìm transactions với pagination
    const transactions = await GET_DB()
      .collection(TRANSACTION_COLLECTION_NAME)
      .find(findQuery)
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .toArray()

    // Đếm tổng số records (không có limit)
    const total = await GET_DB()
      .collection(TRANSACTION_COLLECTION_NAME)
      .countDocuments(findQuery)

    return {
      transactions,
      total,
      limit,
      skip
    }
  } catch (error) {
    throw new Error(error.message || error)
  }
}

/**
 * Cập nhật transaction
 * @param {string} id - Transaction ID cần cập nhật
 * @param {Object} updateData - Dữ liệu cần cập nhật
 * @returns {Object} - Kết quả update
 */
const update = async (id, updateData) => {
  try {
    // Thêm updatedAt
    const dataToUpdate = {
      ...updateData,
      updatedAt: Date.now()
    }

    return await GET_DB()
      .collection(TRANSACTION_COLLECTION_NAME)
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: dataToUpdate }
      )
  } catch (error) {
    throw new Error(error.message || error)
  }
}

/**
 * Xóa transaction (soft delete)
 * @param {string} id - Transaction ID cần xóa
 * @returns {Object} - Kết quả delete
 */
const deleteOne = async (id) => {
  try {
    // Soft delete: set _destroy = true thay vì xóa thật
    return await GET_DB()
      .collection(TRANSACTION_COLLECTION_NAME)
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { _destroy: true, updatedAt: Date.now() } }
      )
  } catch (error) {
    throw new Error(error.message || error)
  }
}

/**
 * Thống kê transactions theo khoảng thời gian
 * @param {string} userId - User ID
 * @param {Date} dateFrom - Ngày bắt đầu
 * @param {Date} dateTo - Ngày kết thúc
 * @returns {Object} - Thống kê (totalExpense, totalIncome, balance, byCategory)
 */
const getStatistics = async (userId, dateFrom, dateTo) => {
  try {
    // userId có thể là string hoặc ObjectId, chuyển thành ObjectId
    const userIdObjectId = userId instanceof ObjectId ? userId : new ObjectId(userId)

    const matchQuery = {
      userId: userIdObjectId,
      _destroy: false,
      date: {
        $gte: dateFrom,
        $lte: dateTo
      }
    }

    // Aggregate để tính tổng expense, income
    const stats = await GET_DB()
      .collection(TRANSACTION_COLLECTION_NAME)
      .aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ])
      .toArray()

    // Tính tổng theo category
    const byCategory = await GET_DB()
      .collection(TRANSACTION_COLLECTION_NAME)
      .aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: { type: '$type', category: '$category' },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { total: -1 } }
      ])
      .toArray()

    // Format kết quả
    const totalExpense = stats.find(s => s._id === TRANSACTION_TYPES.EXPENSE)?.total || 0
    const totalIncome = stats.find(s => s._id === TRANSACTION_TYPES.INCOME)?.total || 0
    const balance = totalIncome - totalExpense

    return {
      totalExpense,
      totalIncome,
      balance,
      byCategory
    }
  } catch (error) {
    throw new Error(error.message || error)
  }
}

export const transactionModel = {
  TRANSACTION_COLLECTION_NAME,
  TRANSACTION_COLLECTION_SCHEMA,
  TRANSACTION_TYPES,
  createNew,
  findOneById,
  findMany,
  update,
  deleteOne,
  getStatistics
}