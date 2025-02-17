# AWS-CDK-APP3
- This is a sample app that shows how to get AWS temp credentials for an SPA.
- Here the app reads from the web asset bucket using AWS s3client library and prints out whatever is there.
- For details refer to documentation in the `frontend` and `backend` folders.
## What you need to make it work.
- Begin with firing up `npm i` command in `frontend`, `backend` and `utils` folders.
#### Then go to the `backend` folder.
- Create `stackOutputs.json` from provided sample. Do not worry about the content, the file will be overwritten once the first `npm run deploy` executed.
- Create `oktaProps.json` from provided sample. See the following section on how to set up Okta.
- Using AWS Console set up AWS IDP for Okta. Details are in the following section.
- Copy the IDP ARN and add it to `oktaProps.json`.
- Generate AWS Cloudfront RSA keys. CF frontend uses signed cookie to authorize access. More in the `backend` folder. For now use the command `npm run genCfKeys` to complete this task.
- In `stacks/mainAppStack.ts` change the stack class name. May want to use VS Code find/replace and search for `YourNameAppStack`. VS Code F2 hot-key will work for that even better.
- Same, modify `YourNameAppStack` and constructIdPrefix value `qwe123` in  `Launcher.ts`. 
- Create a file in `frontend/dist`. I.e.: `mkdir touch ../frontend/dist && touch ../frontend/dist/1.txt`. This is necessary to avoid an error when building stack for the first time.
- If you've never worked with AWS CDK you should probably start with `npm run cdk bootstrap`. Maybe with `-- --profile="your-aws-non-default-profile"`. Make sure your AWS account is configured and **cli** is functional.  
- Do `npm run deploy`
- Go to your Okta account and update the callback URL `https://your-cf-domain.cloudfront.net/okta/callback` using the outputs from the CDK deployment task.
#### Then go to the `frontend` folder.
- Do `npm run build`
#### Then go back to the `backend` folder.
- Do `npm run deploy` one more time.
#### That should be it.
- After you're done playing do `npm run cdk destroy` to delete the app stack.


## Okta setup.
#### Create new / modify existing app.
1. OIDC - OpenID Connect
2. Single-Page Application
3. General Settings
   - App integration name 
   - Core grants
     - Authorization Code
4. Sign-in redirect URIs
   - https://your-cf-domain.cloudfront.net/okta/callback It will have to be modified later after Cloudfront `distributionUrl` param is generated by successful `npm run build`.
5. Save.
6. Copy `Client ID` and okta domain `dev-YYYYYYY.okta.com` params into `oktaProps.json`.


## AWS setup.
The below tasks can't be done by AWS CDK especially if IDP URL has already been added. Manually creating it and adding Audiences is the simplest path forward.
#### Setup your Okta IDP. Done once per IDP URL.
- In AWS console go to IAM->Identity providers.
- Configure provider. Select `OpenID Connect`, in the **Provider URL** enter okta domain `dev-YYYYYYY.okta.com`, **Audience** is your Okta `Client ID`.
- Only one URL allowed per IDP. I.e.: your-idp.okta.com.
- Skip if the Okta IDP URL you plan to use is already there.
- Copy ARN and add it to `oktaProps.json`
#### Setup AWS Audiences.
- In AWS console go to IAM->Identity providers->your-idp.okta.com->Audiences
- Add `Client ID` from the Okta setup, step #6.

## RSA keys refresh.
- Same as above, first generate AWS Cloudfront RSA keys: `npm run genCfKeys`. New values will overwrite what was in the `cloudfrontKeys.json` file previously.
- Entry name _*PublicKey2_ in `stacks/mainAppStack.ts` needs to be modified. _PublicKey1_ should be a good replacement. This name change tells CDK to dispose of the old RSA keys and provision a brand new pair. TODO: replace the name with a random string generator function.
