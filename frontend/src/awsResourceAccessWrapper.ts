import { awsListBucketPromise } from "./awsListBucket";

export interface AwsTempCredentials {
  readonly AccessKeyId: string
  readonly SecretAccessKey: string
  readonly SessionToken?: string
  readonly Expiration?: unknown
}

class AwsResourceAccessWrapper {
  private awsCredentialsPromise:Promise<AwsTempCredentials | void>

  constructor() {
    this.awsCredentialsPromise = this.getAwsCredentials() 
      .then((res)=>{
        // console.log('awsCredentials: ', res)
        return res
      })
      .catch((err)=>{
        console.error('AWS temp credentials fetch resulted in error', err)
        new Error(err)
      })
  }
  
  private getAwsCredentials(): Promise<AwsTempCredentials | void>{
    const fetch = window.fetch
    const getAwsCredentialsPromise =  fetch('/aws/credentials')
      .then((res)=>{
        if (res.status >= 200 && res.status < 300) {
          return res.json()
        } else {
          return Promise.reject(new Error(res.status + ": " + res.statusText))
        }
      })
      .catch(console.error)

    return getAwsCredentialsPromise
  }

  public async listBucketPromise() {
    return awsListBucketPromise(this.awsCredentialsPromise as Promise<AwsTempCredentials>)
  }
}

export const awsMaster = new AwsResourceAccessWrapper()
