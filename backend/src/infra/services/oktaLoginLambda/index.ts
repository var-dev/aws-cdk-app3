import middy from '@middy/core'
import httpErrorHandler from '@middy/http-error-handler'
import {SerializeOptions, serialize} from 'cookie'
import { createHash, randomBytes } from 'node:crypto'
import createError from 'http-errors'
import { LambdaFunctionURLResult } from 'aws-lambda'


const appDomain = process.env.APP_DOMAIN ?? 'undefinedAppDomain'
const oktaDomain = process.env.OKTA_DOMAIN ?? 'undefinedOktaDomain'
const oktaClientId = process.env.OKTA_CLIENT_ID ?? 'undefinedClientId'
const oktaRedirectUri = encodeURIComponent(`https://${appDomain}/okta/callback`)
console.log(`appDomain: ${appDomain}`)
console.log(`oktaDomain: ${oktaDomain}`)
console.log(`oktaClientId: ${oktaClientId}`)

const cookieOpts: SerializeOptions = {
  httpOnly: true,
  sameSite: 'none',
  secure: true,
  domain: appDomain,
  path: '/okta',
}

const getHandler = async (): Promise<LambdaFunctionURLResult> => {
  const state = `state-${randomBytes(32).toString('base64url')}`
  const nonce = `nonce-${randomBytes(16).toString('base64url')}`
  const pkceVerifier = `${randomBytes(32).toString('base64url')}`
  const pkceChallenge = `${createHash('sha256').update(pkceVerifier).digest('base64url')}`
  const authorizeUrl = 
    `URL=https://${oktaDomain}/oauth2/v1/authorize` + 
    `?client_id=${oktaClientId}` + 
    `&redirect_uri=${oktaRedirectUri}` + 
    `&scope=${encodeURIComponent(`openid email profile`)}` + 
    `&response_type=code` + 
    `&response_mode=form_post` + 
    `&code_challenge_method=S256` + 
    `&code_challenge=${pkceChallenge}` + 
    `&state=${state}` +
    `&nonce=${nonce}`
  console.log(`\nstate: ${state}\n nonce: ${nonce}\n pkceVerifier: ${pkceVerifier}\n pkceChallenge: ${pkceChallenge}\n authorizeUrl: ${authorizeUrl}\n`)  

  if(authorizeUrl.includes('undefined')) {
    console.error(`WOHcX335aa undefined found in authorizeUrl: ${authorizeUrl}`)
    throw createError.BadRequest('Url undefined WOHcX335aa')
  }

  return {
    statusCode: 302,
    body: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta http-equiv="Refresh" content="0; ${authorizeUrl}"/>
        </head>
        <body>
          <h1>Redirecting</h1>
        </body>
      </html>
    `,
    headers: {
      "Content-Type": "text/html",
    },
    cookies: [
      serialize('pkce_verifier', pkceVerifier, {...cookieOpts, path: '/okta/callback'}),
      serialize('pkce_challange', pkceChallenge, {...cookieOpts, path: '/okta/login'}),
      serialize('okta_domain', oktaDomain, cookieOpts),
      serialize('okta_client_id', oktaClientId, cookieOpts),
      serialize('okta_redirect_uri', oktaRedirectUri, cookieOpts),
      serialize('nonce', nonce, {...cookieOpts, path: '/',}),
      serialize('okta_state', state, cookieOpts),
    ],
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