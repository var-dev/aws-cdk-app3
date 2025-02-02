import middy from '@middy/core'
import httpErrorHandler from '@middy/http-error-handler'
import createError from 'http-errors'
import { LambdaFunctionURLEvent, LambdaFunctionURLResult } from 'aws-lambda'
import { awsCookieParser } from '../../utils/awsCookieParser'
import { serialize, SerializeOptions } from 'cookie'


const appDomain = process.env.APP_DOMAIN ?? 'undefinedAppDomain'
console.log(`appDomain: ${appDomain}`)

const cookieOpts: SerializeOptions = {
  httpOnly: true,
  sameSite: 'strict',
  secure: true,
  domain: appDomain,
  path: '/',
  maxAge: 0, 
  expires: new Date()
}

const getHandler = async (event: LambdaFunctionURLEvent): Promise<LambdaFunctionURLResult> => {
  const cookies = awsCookieParser(event)
  console.log(`\nEvent cookies:\n${JSON.stringify(cookies, undefined, 2)}`)
  const logoutCookies: string[] = Object.keys(cookies).map((cookieName)=>serialize(cookieName, cookies[cookieName], cookieOpts))
  console.log(`\nLogout cookies:\n${JSON.stringify(logoutCookies, undefined, 2)}`)
  
  return {
    statusCode: 302,
    body: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta http-equiv="Refresh" content="0; /"/>
        </head>
        <body>
          <h1>Logging out</h1>
        </body>
      </html>
    `,
    headers: {
      "Content-Type": "text/html",
    },
    cookies: logoutCookies,
  }
}


export const handler = middy()
  .use(httpErrorHandler())
  .handler(getHandler)



  // HTTP/1.1 200 OK
  // Content-Type: application/json
  // Set-Cookie: pkce_verifier=example_verifier; Path=/; HttpOnly
  // Set-Cookie: pkce_challange=example_challenge; Path=/; HttpOnly
  // Set-Cookie: okta_domain=example_domain; Path=/; HttpOnly
  // Set-Cookie: okta_client_id=example_client_id; Path=/; HttpOnly
  // Set-Cookie: okta_redirect_uri=example_redirect_uri; Path=/; HttpOnly
  // Set-Cookie: nonce=example_nonce; Path=/; HttpOnly
  // Set-Cookie: okta_state=example_state; Path=/; HttpOnly
  
  // {
  //   "statusCode": 200,
  //   "body": {
  //     "message": "Success"
  //   },
  //   "headers": {
  //     "Content-Type": "application/json"
  //   },
  //   "cookies": [
  //     "pkce_verifier",
  //     "pkce_challange",
  //     "okta_domain",
  //     "okta_client_id",
  //     "okta_redirect_uri",
  //     "nonce",
  //     "okta_state"
  //   ]
  // }