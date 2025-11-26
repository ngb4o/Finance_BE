import { StatusCodes } from 'http-status-codes'
import { userService } from '~/services/userService'

const register = async (req, res, next) => {
  try {
    const result = await userService.register(req.body)

    res.status(StatusCodes.CREATED).json({
      message: 'Register successfully!',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

const login = async (req, res, next) => {
  try {
    const result = await userService.login(req.body)

    res.status(StatusCodes.OK).json({
      message: 'Login successfully!',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const userController = {
  register,
  login
}