import { LambdaFunctionURLEvent } from 'aws-lambda'
import { parse } from 'cookie'

export const awsCookieParser = (e: LambdaFunctionURLEvent): Record<string, string> => {

  const event = e as LambdaFunctionURLEvent

  let cookieObject = {}

  // API Gateway V1
  if (event.headers?.Cookie) {
    cookieObject = parse(event.headers.Cookie)
  }

  // API Gateway V2
  if (
    event.cookies
    && Array.isArray(event.cookies)
  ) {
    cookieObject = event.cookies.reduce(
      (accumulator, cookieValue) => {         // reduce callbackfn
        return {...accumulator, ...parse(cookieValue)}
      },
      {}        // initialValue
    )
  }

  return cookieObject
}