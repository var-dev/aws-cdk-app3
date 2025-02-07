# Frontend

 There isn't much to this frontend from the design standpoint. Though there are a few things that are worth mentioning.
 
- ```npm run build``` builds the frontend.
- ```npm run deploy``` runs a TS script in ```../utils/src``` that copies the ```./dist``` folder to the CloudFront _assetBucket_.
  - It relies on properly set-up local AWS credentials.
- _Lite_ virtual modules are used to take data from the project JSON files. I.e. PKI publicKey to verify validity of the ```Token``` is shared with the backend. In fact backend is in charge of generating that token.
  - There are 2 plugins that are in the ```plugins``` folder: ```cloudfrontKeysPlugin.ts``` and ```stackOutputsPlugin.ts```.
    - Note:  ```stackOutputs.json``` is _flattened_ before being used. That eliminates the CDK Stack naming dependency.
  - In order to be used plugins are defined in ```vite.config.ts```.
  - Virtual modules types are declared in ```src/vite-env.d.ts```.
- Frontend will only show the index.html page if the user is authenticated.
  - Cloudfront S3 origin is set up to verify validity of the authentication cookies (```CloudFront-Key-Pair-Id```, ```CloudFront-Policy```, ```CloudFront-Signature```).
  - Those are returned by the oktaCallback AWS Lambda once authentication is complete.
  - The auth cookies and Okta's ```id_token``` are required to receive AWS temp credentials.
    - In fact the auth cookies are the key to get past the CloudFront authentication process.
    - ```id_token``` is used to authorize the user to assign appropriate IAM policies to it.
    - ```id_token``` is also used to generate the custom app ```Token``` (see backend).
    - ```id_token``` as well as auth cookies are **HTTP-ONLY** and can't be read by the app JavaScript.
    - ```Token``` cookie can be read and used by the app.
- For extra security all the ```Token``` involved operations are better to be wrapped in the ```awsResourceAccessWrapper.ts``` module.
  - Other than that it implements the _singleton_ pattern (as would any ES6 module) that prevents the app from validating the ```Token``` every time a token operation is called.
- This _singleton_ consideration is even more relevant when requesting the AWS temp credentials using ```awsResourceAccessWrapper.ts```.
  - The process is time consuming. In the backend a Lambda there calls Okta API to verify your ```id_token```.
  - Therefore only one copy of the AWS temp credentials is being requested per the Frontend lifetime.
- Once AWS credentials are received the app calls AWS S3 Client library (or it can call any SDK library for that matter) and utilize the AWS resources directly.
  - This app just lists files it found in the S3 referred by CDK in the backend as assetBucket.
  - The actual bucket name is taken from the ```../backend/stackOutputs.json``` via virtual module plugin (see above). 

## vite-env.d.ts

```
/// <reference types="vite/client" />
declare module 'virtual:cloudfrontKeys' {
  export const publicKey: string
}
```
