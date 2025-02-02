
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3"
import stackOutputs from 'virtual:stackOutputs'
import { AwsTempCredentials } from "./awsResourceAccessWrapper"

export async function awsListBucketPromise(credentialsPromise: Promise<AwsTempCredentials>): Promise<any> {
  const region = stackOutputs.appRegion
  const Bucket = stackOutputs.assetBucketName
  let tmpCredentials = await credentialsPromise

  // console.log(
  //   `region: ${region}`,
  //   `Bucket: ${Bucket}`,
  //   `Credentials: ${JSON.stringify(Object.keys(tmpCredentials)).substring(0, 100)}`
  // )

  const s3Client = new S3Client({
    region, 
    credentials:{
      accessKeyId: tmpCredentials.AccessKeyId,
      secretAccessKey: tmpCredentials.SecretAccessKey,
      sessionToken: tmpCredentials.SessionToken
    }
    // {
    //   accessKeyId: 'your-access-key-id', // Replace with your access key ID
    //   secretAccessKey: 'your-secret-access-key', // Replace with your secret access key
    //   sessionToken: 'your-session-token' // Replace with your session token
    // }
  })

  const params = {
    Bucket,
  }

  const dataPromise = s3Client.send(new ListObjectsV2Command(params))
    .then((data)=>{
      if (data.Contents) { 
        return data
      } else {
        Promise.reject(()=>{
          console.log('No files found in the bucket.')
        })
      }
    })
    .catch((err)=>{
      console.error('Error listing files:', err)
    })

  return dataPromise
}

