import { CfnOutput } from 'aws-cdk-lib';
import { FunctionUrl, FunctionUrlAuthType, Runtime } from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { Construct } from "constructs"
import path from 'path'
import fs from 'node:fs'
import { RetentionDays } from 'aws-cdk-lib/aws-logs';


export class AwsCredentialsLambda extends Construct{

  public readonly awsCredentialsLambda: NodejsFunction
  public readonly functionUrl: FunctionUrl

  constructor(scope: Construct, id: string){
    super(scope, id)

    const { YourNameAppStack:
      { 
        distributionUrl, 
        publicKeyId,
        oktaFederatedRoleArn,
        appRegion
      }} = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', './stackOutputs.json'), 'utf-8'))

    const { 
          appDomain,
          oktaDomain, 
          oktaClientId
        } = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', './oktaProps.json'), 'utf-8'))
    

    this.awsCredentialsLambda = new NodejsFunction(this, `Self`, {
      runtime: Runtime.NODEJS_20_X,
      memorySize: 128,
      entry: path.join(__dirname, '..', 'services', 'awsCredentialsLambda', 'index.ts'),
      logRetention: RetentionDays.ONE_DAY,
      environment: {
        DISTRIBUTIONURL: distributionUrl,
        PUBLICKEYID: publicKeyId,
        APP_DOMAIN: appDomain,
        OKTA_DOMAIN: oktaDomain,
        OKTA_CLIENT_ID: oktaClientId,
        WEBID_ROLE1: oktaFederatedRoleArn,
        APP_REGION: appRegion,
      }
    })

    this.functionUrl = this.awsCredentialsLambda.addFunctionUrl({ authType: FunctionUrlAuthType.NONE });

    new CfnOutput(this, `Url`, {
      key: 'awsCredentialsLambdaUrl',
      value: this.functionUrl.url,
    });
  }
}

