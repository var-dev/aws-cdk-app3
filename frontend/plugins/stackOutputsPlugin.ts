import pick from 'lodash/pick'
import path from 'path';
import fs from 'fs';
 
export default function stackOutputs() {
    const 
      name = 'stackOutputs',
      virtualModuleId = `virtual:${name}`,
      processData = 
        (data:any) => 
          pick({...data.YourNameAppStack}, 'oktaFederatedRoleArn', 'appRegion', 'assetBucketName')

 
  return {
    name: 'stack-outputs-plugin',
    resolveId(id: string) {
      if (id === virtualModuleId) {
        return '\0' + virtualModuleId;
      }
    },
    load(id: string) {
      if (id === '\0' + virtualModuleId) {
        const jsonPath = path.resolve(__dirname, '..', '..', 'backend', 'stackOutputs.json')
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        const processedData = processData(jsonData);
        return `export default ${JSON.stringify(processedData)}`;
      }
    }
  }
}


// YourNameAppStack.appDomain
// YourNameAppStack.appRegion
// YourNameAppStack.assetBucketName
// YourNameAppStack.awsCredentialsLambdaUrl
// YourNameAppStack.distributionUrl
// YourNameAppStack.logBucketName
// YourNameAppStack.logoutLambdaUrl
// YourNameAppStack.oktaAuthorizeLambdaUrl
// YourNameAppStack.oktaCallbackLambdaUrl
// YourNameAppStack.oktaFederatedRoleArn
// YourNameAppStack.oktaLoginLambdaUrl
// YourNameAppStack.publicKeyId