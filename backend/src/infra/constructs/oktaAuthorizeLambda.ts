import { CfnOutput } from 'aws-cdk-lib';
import { FunctionUrl, FunctionUrlAuthType, Runtime } from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { Construct } from "constructs"
import path from 'path'
import fs, { readFileSync } from 'node:fs'
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { flattenObject } from '../../../../utils/src/flattenObject';


export class OktaAuthorizeLambda extends Construct{

  public readonly oktaAuthorizeLambda: NodejsFunction
  public readonly functionUrl: FunctionUrl

  constructor(scope: Construct, id: string){
    super(scope, id)

    const { privateKey } = JSON.parse(readFileSync(path.join(__dirname, '..', '..', '..', './cloudfrontKeys.json'), 'utf-8'))

    const stackOutputs = JSON.parse(readFileSync(path.join(__dirname, '..', '..', '..', './stackOutputs.json'), 'utf-8'))
    const { 
      appDomain,
      distributionUrl, 
      publicKeyId,
    } = flattenObject(stackOutputs)
          
    const { 
          oktaDomain, 
          oktaClientId
        } = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', './oktaProps.json'), 'utf-8'))
    

    this.oktaAuthorizeLambda = new NodejsFunction(this, `Self`, {
      runtime: Runtime.NODEJS_20_X,
      memorySize: 128,
      // handler: 'index.handler',
      // code: lambda.Code.fromAsset('src/lambda'),
      entry: path.join(__dirname, '..', 'services', 'oktaAuthorizeLambda', 'index.ts'),
      logRetention: RetentionDays.ONE_DAY,
      environment: {
        DISTRIBUTIONURL: distributionUrl,
        PUBLICKEYID: publicKeyId,
        PRIVATEKEY: privateKey,
        APP_DOMAIN: appDomain,
        OKTA_DOMAIN: oktaDomain,
        OKTA_CLIENT_ID: oktaClientId,
      }
    })

    this.functionUrl = this.oktaAuthorizeLambda.addFunctionUrl({ authType: FunctionUrlAuthType.NONE });

    new CfnOutput(this, `Url`, {
      key: 'oktaAuthorizeLambdaUrl',
      value: this.functionUrl.url,
    });
  }
}

