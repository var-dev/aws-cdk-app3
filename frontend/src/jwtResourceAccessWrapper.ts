import cloudfrontKeys from 'virtual:cloudfrontKeys'
import { KJUR, KEYUTIL, RSAKey } from 'jsrsasign'
import { getCookie } from './../utils/common'

class JwtResourceAccessWrapper {
  private token: string;

  constructor() {
    this.token = this.getToken
  }

  private get getToken(){
    const token = getCookie('Token')
    const isValid = KJUR.jws.JWS.verifyJWT(token, this.publicKey, { alg: ['RS256'] });
    if (isValid) {
      return token
    } else {
      throw new Error('Invalid token')
    }
  }
  
  private get publicKey(){
    const key = cloudfrontKeys.publicKey
    if (key.includes('END PUBLIC KEY')) {
      return KEYUTIL.getKey(cloudfrontKeys.publicKey) as RSAKey
    } else {
      throw new Error('RSA key not found')
    }
  }

  public getClaim(claim: string){
    let result
    try {
      result = (KJUR.jws.JWS.parse(this.token).payloadObj! as any)[claim] ? (KJUR.jws.JWS.parse(this.token).payloadObj! as any)[claim] : ''
      
    } catch (error) {
      console.error('JWT Parse Error:', error)
      throw new Error('JWT Parse Error')
    }
    return result
  }
}


export const jwtMaster = new JwtResourceAccessWrapper()

// Decoded token: {
//   "headerObj": {
//     "alg": "RS256",
//     "typ": "JWT"
//   },
//   "payloadObj": {
//     "name": "test tset",
//     "email": "test@test.test",
//     "iat": 1737954984,
//     "exp": 1737958584,
//     "nonce": "nonce-q8cklPtHtCJWDsOJirEAVw",
//     "preferred_username": "test@test.test",
//     "auth_time": 1737949601
//   },
//   "headerPP": "{\n  \"alg\": \"RS256\",\n  \"typ\": \"JWT\"\n}",
//   "payloadPP": "{\n  \"name\": \"test tset\",\n  \"email\": \"test@test.test\",\n  \"iat\": 1737954984,\n  \"exp\": 1737958584,\n  \"nonce\": \"nonce-q8cklPtHtCJWDsOJirEAVw\",\n  \"preferred_username\": \"test@test.test\",\n  \"auth_time\": 1737949601\n}",
//   "sigHex": "0c951964e327cba79f1239cf8da2..."
// }