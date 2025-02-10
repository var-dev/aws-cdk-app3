# Backend Overview.
Apart from obvious, minimization of repetition of the same code over and over again, when a web page needs to be hosted, user authenticated, AWS resources interfaced with, I intend to keep this "chapter" to document some design pattern related to `backend` serverless development using AWS CDK.  

## Architecture (AI generated)
The `backend` chapter of this project is designed using a microservices architecture to ensure scalability and maintainability. Each service is responsible for a specific functionality and communicates with other services via RESTful APIs.

## Technologies Used (AI generated)
- **Programming Language**: Typescript
- **Framework**: AWS CDK
- **Database**: N/A
- **Authentication**: Okta
- **Containerization**: AWS Lambda
- **Orchestration**: AWS CDK

## Key Functionalities (AI generated)
- **Certificate Generation**: Handles the creation and signing of digital certificates.
- **User Management**: Manages user registration, authentication, and authorization.
- **API Gateway**: Acts as a single entry point for all client requests and routes them to the appropriate services.
- **Logging and Monitoring**: Implements logging and monitoring to track the performance and health of the services.

## Setup Instructions (AI generated)
1. Clone the repository.
2. Navigate to the `backend` directory.
3. Build the Docker images using `npm run build`.
4. Follow the URL *AppStack.distributionUrl

## Contribution Guidelines
- Fork the repository.
- Create a new branch for your feature or bugfix.
- Submit a pull request with a detailed description of your changes.


### Here's `backend` structure with a brief description of some nested folders:

```
.vscode/                  # Contains Visual Studio Code specific settings
cdk.out/                  # Output directory for CDK synth and deploy
src/                      # Contains the source code of the project
  infra/                  # Infrastructure related code
    constructs/           # Contains AWS CDK constructs
    services/             # Contains AWS lambda handler and their modules 
    stacks/               # Contains CDK stack definitions
    utils/                # Contains utility functions
temp/                     # Temporary files
```

## Authentication Sequence.  

1.  `/okta/login` - When GET request comes in, it triggers CloudFront behavior that launches `oktaLoginLambda`. This function constructs Okta hosted OIDC login URL and then sends it back in `meta http-equiv="Refresh"` frame with code **302 Redirect**. Once the browser receives this response it follows the custom Okta Login link as if the end-user clicked on it.

2.  `okta.com/oauth2/v1/authorize?client_id` - Okta authorization returns its hosted login prompt. After successful login it calls the predefined (in your app auth profile) callback URL.

3.  `/okta/callback` - This behavior is triggered by GET request. In the response body (from the above step) Okta has sent us authorization `code` that this `oktaCallbackLambda` will attempt to exchange for Okta `id_token` and `access_token`.
    - It sends POST request to `okta.com/oauth2/v1/token`.
    - Redirects to the next in chain `/okta/authorize` while storing `id_token` and `access_token` values in **HttpOnly** cookies.
    - In parallel with the above POST, the lambda fetches your Okta app JWKS and stores it as `okta_jwks` cookie to be reused later.

4.  `/okta/authorize` - Triggers `oktaAuthorizeLambda` which does the following:
    - Verifies id and access tokens locally using obtained in the previous step JWKS.
    - Creates the CloudFront signed cookies: `CloudFront-Key-Pair-Id`, `CloudFront-Signature` and `CloudFront-Policy`.
    - Creates an app own JWT `Token`. It will only be needed if the app is going to publish/use some sort of API interface.
    - Finally, since all the CloudFront authentication cookie requirements are now satisfied, the lambda returns **302 Redirect** pointing to the main app url `/`.

5. From here on the **frontend** portion of the app takes over.

## Other CloudFront Lambda Behaviors.

  - `/logout` - Triggers `logoutLambda`. This lambda deletes authentication cookies effectively forcing you to login again.
  - `/aws/credentials` - Triggers `awsCredentialsLambda`. This lambda is used by **frontend** to obtain temporary AWS credentials.


#
# Features.

## Common Lambda Props.

  Common props are parsed from the props files: `cloudfrontKeys.json`, `oktaProps.json` and `stackOutputs.json` inside the stack constructs (i.e. `src/infra/constructs/oktaLoginLambda.ts`) and delivered to Lambdas as environment variables.

## Redirects.

  Communication between `frontend` and `backend` is chained via redirects. i.e. oktaLoginLambda composes the Okta login/auth URL and then redirects to it.
  - Two types of redirects are used in this project.
  - `<meta http-equiv="Refresh" content="0; ${redirectUrl}"/>` - inside \<html\>\<head\>\<\/head\>.
  - `window.location.replace("${redirectUrl}")` - in the JavaScript code.

## Flattening.
  `stackOutputs.json` is generated by the `cdk deploy` process and depending on the **Stack** structure may have a certain nested hierarchy where each stack name is a key of the object. Those names have no particular relevance other than separating name spaces. So in order to not to track those object keys after each parse `stackOutputs.json` needs to be flattened.
  ```
  import {flattenObject} from '../../../../utils/src/flattenObject'

  const stackOutputs = JSON.parse(readFileSync(path.join(__dirname, '..', '..', '..', './stackOutputs.json'), 'utf-8'))
  const { 
    appDomain,
  } = flattenObject(stackOutputs)
  ```


## oktaCallbackLambda.

  This AWS Lambda executes some code on both server and client side in the browser. To achieve this the following steps were taken:
- `iifeFetchJwks.js` script implements the client (browser) side functionality.
- It's a regular `.js` file that doesn't need to be built. Though compilation/build is fairly foreseeable for complex scenarios.
- It is copied into the lambda bundle by `OktaCallbackLambda` that has `afterBundling` command hook.
- `afterBundling` is executed after the bundling process is complete but before the lambda is zipped up.
- From the lambda perspective the `.js` code is on local filesystem and can now be read by the handler, i.e. using `readFileSync`, see the handler code.
- The `iifeFetchJwks.js` content is included verbatim between the `html` \<script\>\<\/script\> tags.
- Variable `var oktaDomain = '${oktaDomain}';` in the lambda **HTML** section turns into a regular assignment in the browser: `var oktaDomain = 'dev-123456789.okta.com';`.
- It's important to properly "stringify" these types of assignments. Must use `JSON.stringify` and `JSON.parse` for arrays and objects.
- It's worth mentioning that some `client-side` tasks can be asynchronous and therefore may not finish before the web page fully renders and redirects.
- In order to adapt to this scenario the redirect is implemented inside the `then` clause of `iifeFetchJwks`: 
```
    .then((res)=>{
      // HTTP redirect:
      window.location.replace("/okta/authorize");
    })
```
- It's possible to do the OIDC authorization `fetch` in the browser too. It will probably save some lambda run-time \$. But I want to keep it simple here so it is what it is.
- Though if implemented, and I repeat the above mentioned notion here, all **async** tasks need to be chained up in a sequence of `.then()`. Even second fetch should look like `.then(res=>fetch(url))`. This is syntactically correct as the fetch API returns Promise.