import pick from 'lodash/pick'
import path from 'path'
import { readFileSync } from 'node:fs'
import { flattenObject } from '../../utils/src/flattenObject'

 
export default function stackOutputs() {
    const 
      name = 'stackOutputs',
      virtualModuleId = `virtual:${name}`,
      processData = 
        (data:any) => 
          pick(data, 'oktaFederatedRoleArn', 'appRegion', 'assetBucketName')

 
  return {
    name: 'stack-outputs-plugin',
    resolveId(id: string) {
      if (id === virtualModuleId) {
        return '\0' + virtualModuleId;
      }
    },
    load(id: string) {
      if (id === '\0' + virtualModuleId) {
        const stackOutputsPath = path.resolve(__dirname, '..', '..', 'backend', 'stackOutputs.json')
        const stackOutputs = JSON.parse(readFileSync(stackOutputsPath, 'utf-8'))
        const stackOutputsFlat = flattenObject(stackOutputs)
        const processedData = processData(stackOutputsFlat);
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
