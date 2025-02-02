/// <reference types="vite/client" />
declare module 'virtual:cloudfrontKeys' {
  export const publicKey: string
}

declare module 'virtual:stackOutputs' {
  export const oktaFederatedRoleArn: string
  export const appRegion: string
  export const assetBucketName: string
}
