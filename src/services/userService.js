import bcrypt from 'bcryptjs'
import { userModel } from '~/models/userModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { jwtHelper } from '~/utils/jwt'

const register = async (reqBody) => {
  const emailExists = await userModel.checkEmailExists(reqBody.email)
  if (emailExists) {
    throw new ApiError(StatusCodes.CONFLICT, 'Email already exists!')
  }

  // Hash password trước khi lưu vào database
  const hashedPassword = await bcrypt.hash(reqBody.password, 10)

  const newUser = {
    email: reqBody.email,
    password: hashedPassword,
    username: reqBody.username
  }

  const createdUser = await userModel.createNew(newUser)

  const getUser = await userModel.findOneById(createdUser.insertedId)

  // MongoDB trả về _id, không phải id
  const token = jwtHelper.generateToken({
    userId: getUser._id.toString(),
    email: getUser.email
  })

  const userResponse = {
    id: getUser._id.toString(),
    email: getUser.email,
    username: getUser.username,
    avatar: getUser.avatar,
    createdAt: getUser.createdAt
  }

  return {
    user: userResponse,
    token
  }
}

const login = async (reqBody) => {
  const user = await userModel.findOneByEmail(reqBody.email)
  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Email or password is incorrect!')
  }

  // So sánh password người dùng nhập với password đã hash trong database
  const isPasswordValid = await bcrypt.compare(reqBody.password, user.password)
  if (!isPasswordValid) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Email or password is incorrect!')
  }

  // MongoDB trả về _id, không phải id
  const token = jwtHelper.generateToken({
    userId: user._id.toString(),
    email: user.email
  })

  // Trả về id thay vì _id trong response
  const userResponse = {
    id: user._id.toString(),
    email: user.email,
    username: user.username,
    avatar: user.avatar,
    createdAt: user.createdAt
  }

  return {
    user: userResponse,
    token
  }
}

export const userService = {
  register,
  login
}