import middy from '@middy/core'
import httpErrorHandler from '@middy/http-error-handler'
import httpHeaderNormalizer from '@middy/http-header-normalizer'
import httpUrlEncodeBodyParser from '@middy/http-urlencode-body-parser'
import {SerializeOptions, serialize} from 'cookie'

import {awsCookieParser} from '../../utils/awsCookieParser.js'

import {LambdaFunctionURLEvent, LambdaFunctionURLResult, Context} from 'aws-lambda'
import createError from 'http-errors'
import { prepareJwks } from './prepareJwks.js'
import { readFileSync } from 'node:fs'
import path from 'node:path'


const appDomain = process.env.APP_DOMAIN ?? 'undefinedAppDomain'
const oktaDomain = process.env.OKTA_DOMAIN ?? 'undefinedOktaDomain'
const oktaClientId = process.env.OKTA_CLIENT_ID ?? 'undefinedClientId'
console.log(`appDomain: ${appDomain}`)
console.log(`oktaDomain: ${oktaDomain}`)
console.log(`oktaClientId: ${oktaClientId}`)

const cookieOpts: SerializeOptions = {
  httpOnly: true,
  sameSite: 'strict',
  secure: true,
  domain: appDomain,
  path: '/',
}


// LambdaFunctionURLEvent LambdaFunctionURLResult
// todo validator cookies, body.state, body.code
const getHandler = async (event:LambdaFunctionURLEvent, context: Context): Promise<LambdaFunctionURLResult> => {
    const iifeFetchJwks = readFileSync('iifeFetchJwks.js')
    const cookies = awsCookieParser(event)
    console.log(`\ncookies: ${JSON.stringify(cookies, undefined, 2)}\n`)
    
    const body = event.body as unknown as Record<string, string>
    console.log(`\nbody: ${JSON.stringify(body, undefined, 2)}\n`)

    if ( cookies.okta_state !== `${body.state}` ) {
      console.error(`State mismatch: ${cookies.okta_state} !== ${body.state}`)
      throw createError.BadRequest('State mismatch lSq3LNeLmN')
    }


    // Do OIDC authorization code flow process
    const autzCodeFlowUri = `https://${oktaDomain}/oauth2/v1/token`
    const fetchQueryParams = 
      `client_id=${cookies.okta_client_id}` + 
      `&grant_type=authorization_code` + 
      `&redirect_uri=${cookies.okta_redirect_uri}` + 
      `&code_verifier=${cookies.pkce_verifier}` + 
      `&state=${body.state}` + 
      `&code=${body.code}`
    const fetchPostOptions = {
      method: 'POST',
      headers: {
        "accept": "application/json",
        "content-type": "application/x-www-form-urlencoded",
      },
      body: `${fetchQueryParams}`
    }
    console.log(`\nautzCodeFlowUri: ${autzCodeFlowUri}\nfetchPostOptions: ${JSON.stringify(fetchPostOptions, undefined, 2)}\n`)

    const responseAutzCodeFlowPromise = 
      fetch(autzCodeFlowUri, fetchPostOptions)
      .then(
        (resolve)=>resolve.json(),
        (err)=>{console.error(`\n NfD2N1KaJD responseAutzCodeFlow:\n${JSON.stringify(err, undefined, 2)}`); return err}
      )
      .then((resolve)=>{
        console.log(`OIDC object:\n ${JSON.stringify(resolve, undefined, 2)}`)
        return resolve
      })
      .catch((err)=>{
        throw createError.BadRequest(`${err.statusText} NfD2N1KaJD`);
      })


    return { 
      statusCode: 200,
      body: `
        <!DOCTYPE html>
        <html>
          <head>
            
            <script>
              var oktaDomain = '${oktaDomain}';
              ${iifeFetchJwks}
            </script>
          </head>
          <body>
            <h1>Redirecting2</h1>
          </body>
        </html>
      `,
      headers: {
        "Content-Type": "text/html",
      },
      cookies: [
        serialize('access_token', (await responseAutzCodeFlowPromise).access_token, {...cookieOpts, maxAge: (await responseAutzCodeFlowPromise).expires_in}),
        serialize('id_token', (await responseAutzCodeFlowPromise).id_token, {...cookieOpts, maxAge: (await responseAutzCodeFlowPromise).expires_in}),
        serialize('expires_ms', `${Date.now() + Number((await responseAutzCodeFlowPromise).expires_in ?? 3600) * 1000}`, {...cookieOpts, maxAge: (await responseAutzCodeFlowPromise).expires_in, httpOnly: false}),  //Date.now() + token lifetime
      ]
    }
  }


export const handler = middy()
  .use(httpErrorHandler())
  .use(httpHeaderNormalizer())
  .use(httpUrlEncodeBodyParser())  // {disableContentTypeError: true}
  .handler(getHandler)