import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { userRoute } from '~/routes/v1/userRoute'
import { transactionRoute } from '~/routes/v1/transactionRoute'

const Router = express.Router()

/** Check APIs V1 **/
Router.get('/status', (req, res) => {
  res.status(StatusCodes.OK).json({ message: 'API V1 are ready to use' })
})

/** User APIs (public - không cần auth) **/
Router.use('/users', userRoute)

/** Transaction APIs (cần JWT auth) **/
Router.use('/transactions', transactionRoute)

export const APIs_V1 = Router