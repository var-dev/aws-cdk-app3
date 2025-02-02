import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { getSignedCookies } from 'aws-cloudfront-sign'
import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import httpHeaderNormalizer from '@middy/http-header-normalizer';
import httpUrlEncodeBodyParser from '@middy/http-urlencode-body-parser';
import { awsCookieParser } from '../../utils/awsCookieParser';
import createError from 'http-errors'

import OktaJwtVerifier from '@okta/jwt-verifier';
import {type JSONWebKey} from 'jwks-rsa';

import jwt from 'jsonwebtoken'

import { serialize, SerializeOptions } from 'cookie';
import { omit } from 'lodash'

const oktaDomain = process.env.OKTA_DOMAIN ?? 'undefinedOktaDomain'
const clientId = process.env.OKTA_CLIENT_ID ?? 'undefinedClientId'
const appDomain = process.env.APP_DOMAIN ?? 'undefinedAppDomain'
console.log(`appDomain: ${appDomain}`)
console.log(`oktaDomain: ${oktaDomain}`)
console.log(`clientId: ${clientId}`)


const cookieOpts: SerializeOptions = {
  httpOnly: true,
  sameSite: 'none',
  secure: true,
  // maxAge: 1800,
  domain: appDomain,
  path: '/',
}

export const authorizeHandler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> => {
  const distributionUrl = process.env.DISTRIBUTIONURL ?? 'undefinedDistributionUrl'
  const publicKeyId = process.env.PUBLICKEYID ?? 'undefinedPublicKeyId'
  const privateKey =  process.env.PRIVATEKEY ?? 'undefinedPrivateKey'

  if ([
    oktaDomain,
    clientId,
    distributionUrl,
    publicKeyId,
    privateKey,
    ].join('').includes('undefined')) {
    console.error(`\nCJWs9rM86w missing env variables:\noktaDomain: ${oktaDomain}\nclientId: ${clientId}\ndistributionUrl: ${distributionUrl}\npublicKeyId: ${publicKeyId}\nprivateKey: ${privateKey.substring(0, 200)} `)
    throw createError.BadRequest('Missing required environment variables CJWs9rM86w')
  }

  console.log(`\noktaDomain: ${oktaDomain}\nclientId: ${clientId}\ndistributionUrl: ${distributionUrl}\npublicKeyId: ${publicKeyId}\nprivateKey: ${privateKey.substring(0, 200)}`)

  const cookies = awsCookieParser(event)// as unknown as Record<string, string>
  console.log(`\ncookies: ${JSON.stringify(cookies, undefined, 2)}\n`)

  const accessToken = cookies.access_token
  const idToken = cookies.id_token
  const oktaNonce = cookies.nonce
  const expiresMs = Number(cookies.expires_ms)
  const jwksString = Buffer.from(cookies.okta_jwks, 'base64url').toString('utf8')

  if (!accessToken || !idToken || !oktaNonce || !jwksString) {
    console.error(`Missing access_token, id_token, or nonce\n access_token: ${accessToken}\n id_token: ${idToken}\n nonce: ${oktaNonce}\n jwks: ${jwksString}`)
    throw createError.BadRequest('Missing access_token, id_token, jwks or nonce HN6KapUDJu')
  }

  let jwks:JSONWebKey[]
  try {
    jwks = JSON.parse(jwksString)
  } catch (err) {
    console.error(`JWKS Parse: ${err}`)
    throw createError.BadRequest('Invalid JWKS Tg3r7HxVjk')
  }
  console.log(`\nParsed JWKS: ${JSON.stringify(jwks, undefined, 2)} `)

  const oktaJwtVerifier = new OktaJwtVerifier({
    issuer: `https://${oktaDomain}`,
    clientId: `${clientId}`,
    // jwksUri: `https://${oktaDomain}/oauth2/v1/keys`,
    getKeysInterceptor: ()=>Promise.resolve(jwks)
  })

  let jwtAccessPromise: Promise<OktaJwtVerifier.Jwt>, jwtIdPromise: Promise<OktaJwtVerifier.Jwt>

  jwtAccessPromise = 
    oktaJwtVerifier.verifyAccessToken(accessToken, 'https://dev-06321814.okta.com')
    .then(
      (resolve)=>{console.log(`\njwtAccess.claims: ${JSON.stringify(resolve.claims, undefined, 2)}`)},
      (err)=>{
        console.error(`EQafqSjeVc verifyAccessToken: ${err}`)
        return err
      }
    )
    .catch((err)=>{throw createError.BadRequest('Invalid accessToken EQafqSjeVc')})
  
    

  jwtIdPromise = 
    oktaJwtVerifier.verifyIdToken(idToken, clientId, oktaNonce)
    .then(
      (resolve)=>{
        console.log(`\njwtId.claims: ${JSON.stringify(resolve.claims, undefined, 2)}`)
        return resolve
      },
      (err)=>{
        console.error(`Invalid idToken ggrNQgAh3p: ${err}`)
        return err
      }
    )
    .catch((err)=>{throw createError.BadRequest('Invalid idToken ggrNQgAh3p')})


  const cloudfrontCookiesSigningParams = {
    keypairId: publicKeyId ? publicKeyId : 'undefined',
    privateKeyString: privateKey,
    expireTime: expiresMs ?? Date.now() + 3600 * 1000 * 2  // Valid for 2 hours
  }

  const signedCookies = getSignedCookies(`${distributionUrl}/*`, cloudfrontCookiesSigningParams);
  console.log(`CloudFront signed cookies:\n${JSON.stringify(signedCookies, undefined, 2)}`)
  
  cookieOpts.maxAge = Math.round((expiresMs - Date.now()) / 1000)


  // Generate app own token based on Okta id jwt

const claims = omit((await jwtIdPromise).claims, 'sub', 'ver', 'iss', 'aud', 'jti', 'amr', 'idp', 'at_hash')
console.log(`\nApp JWT claims:\n${JSON.stringify(claims, undefined, 2)}`)

const token = jwt.sign(
  claims,
  privateKey,
  { algorithm: 'RS256' }
);
console.log(`\nApp Token:\n${token}`)

// to decode 
// const decodedToken = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
// console.log('Decoded Token:', decodedToken);
// {
//   "alg": "RS256",
//   "typ": "JWT"
// }.{
//   "name": "test tset",
//   "email": "test@test.test",
//   "iat": 1737699129,
//   "exp": 1737702729,
//   "nonce": "nonce-axspa-jo4-og5Nt5MXbWgQ",
//   "preferred_username": "test@test.test",
//   "auth_time": 1737695876
// }.[Signature]

  return {
    statusCode: 200,
    body: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta http-equiv="Refresh" content="0; /"/>
        </head>
        <body>
          <h1>Redirecting3</h1>
        </body>
      </html>
    `,
    headers: {
      "Content-Type": "text/html",
    },
    cookies: [
      serialize('CloudFront-Key-Pair-Id', signedCookies['CloudFront-Key-Pair-Id'], {...cookieOpts,}),
      serialize('CloudFront-Signature', signedCookies['CloudFront-Signature'], {...cookieOpts,}),
      serialize('CloudFront-Policy', signedCookies['CloudFront-Policy'], {...cookieOpts,}),
      serialize('Token', token, {...cookieOpts, httpOnly: false}),
    ]
  };
};

export const handler = middy()
  .use(httpErrorHandler())
  .use(httpHeaderNormalizer())
  .use(httpUrlEncodeBodyParser({disableContentTypeError: true}))   // {disableContentTypeError: true}
  .handler(authorizeHandler)