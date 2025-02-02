import middy from '@middy/core'
import httpErrorHandler from '@middy/http-error-handler'
import createError from 'http-errors'
import { LambdaFunctionURLEvent, LambdaFunctionURLResult } from 'aws-lambda'
import { getAwsCredentialsOkta } from './getAwsCredentialsOkta'
import { awsCookieParser } from '../../utils/awsCookieParser'
import { serialize, SerializeOptions } from 'cookie'


const appDomain = process.env.APP_DOMAIN ?? 'undefinedAppDomain'
const oktaDomain = process.env.OKTA_DOMAIN ?? 'undefinedOktaDomain'
const oktaClientId = process.env.OKTA_CLIENT_ID ?? 'undefinedClientId'
const appRegion = process.env.APP_REGION ?? 'undefinedAppRegion'

console.log(`appDomain: ${appDomain}`)
console.log(`oktaDomain: ${oktaDomain}`)
console.log(`oktaClientId: ${oktaClientId}`)
console.log(`appRegion: ${appRegion}`)

function getWebIdRole(criteria?:unknown): string {
  const webidRole:string[] = []
  webidRole.push(process.env.WEBID_ROLE1 ?? 'undefinedWebidRole1')
  console.log(`webidRole[]: ${JSON.stringify(webidRole)}`)
  return webidRole[0]
}

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
    const cookies = awsCookieParser(event)// as unknown as Record<string, string>
    console.log(`\ncookies: ${JSON.stringify(cookies, undefined, 2)}\n`)
  
    const idToken = cookies.id_token
    if (!idToken ) {
      console.error(`\nHN6KapUDJu Missing id_token:\n`)
      throw createError.BadRequest('Missing token HN6KapUDJu')
    }
  
  const awsCredentialsPromise = 
    getAwsCredentialsOkta(idToken, getWebIdRole(), appRegion)
    .then(
      (resolve=>{
        console.log(`\nTemp AWS Credentials:\n${JSON.stringify(resolve, undefined, 2)}`)
        return resolve
      }),
      (err)=>{console.error(`\n Guu304eEE7 getAwsCredentials:\n${JSON.stringify(err, undefined, 2)}`); return err}
      )
    .catch((err)=>{
      throw createError.BadRequest(`${err.statusText} Guu304eEE7`);
    })


  return {
    statusCode: 200,
    body: `${JSON.stringify(await awsCredentialsPromise, undefined, 2)}`,
    headers: {
      "Content-Type": "application/json",
    },
    cookies: [  // By setting  MaxAge = 0 we're removing the below cookies we no longer need 
      serialize('access_token', '', cookieOpts),
      serialize('nonce', '', cookieOpts),
      serialize('okta_client_id', '', cookieOpts),
      serialize('okta_domain', '', cookieOpts),
      serialize('okta_redirect_uri', '', cookieOpts),
      serialize('okta_state', '', cookieOpts),
      serialize('pkce_challange', '', cookieOpts),
      serialize('pkce_verifier', '', cookieOpts),
    ]
  }
}

export const handler = middy()
  .use(httpErrorHandler())
  .handler(getHandler)

