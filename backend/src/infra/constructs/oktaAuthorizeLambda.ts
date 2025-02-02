import { CfnOutput } from 'aws-cdk-lib';
import { FunctionUrl, FunctionUrlAuthType, Runtime } from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { Construct } from "constructs"
import path from 'path'
import fs from 'node:fs'
import { RetentionDays } from 'aws-cdk-lib/aws-logs';


export class OktaAuthorizeLambda extends Construct{

  public readonly oktaAuthorizeLambda: NodejsFunction
  public readonly functionUrl: FunctionUrl

  constructor(scope: Construct, id: string){
    super(scope, id)

    const { privateKey } = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', './cloudfrontKeys.json'), 'utf-8'))
    const { YourNameAppStack:
      { 
        distributionUrl, 
        publicKeyId
      }} = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', './stackOutputs.json'), 'utf-8'))

    const { 
          appDomain,
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

