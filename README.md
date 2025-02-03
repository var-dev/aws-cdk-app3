# AWS-CDK-APP3
- This is a sample app that shows how to get AWS temp credentials for an SPA.
- Here the app reads from the web asset bucket using AWS s3client library and prints out whatever is there.
- For details refer to documentation in the ```frontend``` and ```backend``` folders.
## What you need to make it work.
- Begin with firing up ```npm i``` command in ```frontend```, ```backend``` and ```utils``` folders.
#### Then go to the ```backend``` folder.
- Create ```stackOutputs.json``` from provided sample. Do not worry about the content, the file will be overwritten once the first ```npm run deploy``` executed.
- Create ```oktaProps.json``` from provided sample. See the following section on how to set up Okta.
- Using AWS Console set up AWS IDP for Okta. Details are in the following section.
- Generate AWS Cloudfront RSA keys. CF frontend uses signed cookie to authorize access. More in the ```backend``` folder. For now use the command ```npm run genCfKeys``` to complete this task.
- In ```stacks/mainAppStack.ts``` change the stack class name. May want to use code find/replace and search for ```YourNameAppStack```.
- Same, modify ```YourNameAppStack``` and constructIdPrefix value ```qwe123``` in  ```Launcher.ts```. 
- Create a file in ```frontend/dist```. I.e.: ```touch ../frontend/dist/1.txt```. This is necessary to avoid an error when building stack for the first time.
- Do ```npm run deploy```
#### Then go to the ```frontend``` folder.
- Do ```npm run build```
#### Then go back to the ```backend``` folder.
- Do ```npm run deploy``` one more time.
#### That should be it.


## Okta setup.
#### Create new / modify existing app.
1. OIDC - OpenID Connect
2. Single-Page Application
3. General Settings
   - App integration name 
   - Core grants
     - Authorization Code
4. Sign-in redirect URIs
   - https://your-cf-domain.cloudfront.net/okta/callback
5. Save
6. Copy ```Client ID``` and add it to ```oktaProps.json```

## AWS setup.
The below tasks can't be done by AWS CDK especially if IDP URL has already been added. Manually creating it and adding Audiences is the simplest path forward.
#### Setup your Okta IDP. Done once per IDP URL.
- In AWS console go to IAM->Identity providers.
- Only one URL allowed per IDP. I.e.: your-idp.okta.com.
- Skip if the Okta IDP URL you plan to use is already there.
- Copy ARN and add it to ```oktaProps.json```
#### Setup AWS Audiences.
- In AWS console go to IAM->Identity providers->your-idp.okta.com->Audiences
- Add ```Client ID``` from the Okta setup, step #6.

## RSA keys refresh.
- Same as above, first generate AWS Cloudfront RSA keys: ```npm run genCfKeys```. New values will overwrite what was in the ```cloudfrontKeys.json``` file previously.
- Entry name _*PublicKey2_ in ```stacks/mainAppStack.ts``` needs to be modified. _PublicKey1_ should be good. That name change tells CDK to dispose of the old RSA keys and provision a brand new pair. TODO: replace the name with a random string generator function.
