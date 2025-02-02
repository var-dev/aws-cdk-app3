import { Buffer } from "node:buffer";
import createError from 'http-errors'

export async function prepareJwks(cachedJwksB64:string, oktaDomain: string):Promise<string> {
  // Decode base64utl jwks 
  try {
    if (
      cachedJwksB64.length > 100 &&
      Array.isArray(JSON.parse(Buffer.from(cachedJwksB64,'base64url').toString('utf8')))
    ) {
    console.log(`Cached JWKS ${Buffer.from(cachedJwksB64,'base64url').toString('utf8')}`)
    
    return Promise.resolve(cachedJwksB64)
  }} catch(err: any)  {
    console.error(`YEWfuXrB7j cachedJwksB64: ${cachedJwksB64}\n ${err}`)
    throw createError.BadRequest(`Error processing JWKS YEWfuXrB7j`);
  }
  
  const jwksJsonPromise = 
    fetch(`https://${oktaDomain}/oauth2/v1/keys`)
    .then(
      (resolve)=>resolve.json(),
      (err)=>{console.error(`\n8eRg2V9aXz JWKS:\n${JSON.stringify(err, undefined, 2)}`); return err}
    )
    .then((resolve)=>{
      console.log(`JWKS JSON:\n ${JSON.stringify(resolve.keys, undefined, 2)}`)
      const buffer = Buffer.from(JSON.stringify(resolve.keys), 'utf8')
      return buffer.toString('base64url')
    })
    .catch((err)=>{
      console.error(`8eRg2V9aXz ${JSON.stringify(err)}`)
      throw createError.BadRequest(`${err.statusText} 8eRg2V9aXz`);
    })

    return jwksJsonPromise
}