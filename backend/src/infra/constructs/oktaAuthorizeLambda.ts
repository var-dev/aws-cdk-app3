import { CfnOutput } from 'aws-cdk-lib';
import { FunctionUrl, FunctionUrlAuthType, Runtime } from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { Construct } from "constructs"
import path from 'path'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'

import { flattenObject } from '../../../../utils/src/flattenObject'
import stackOutputs from './../../../stackOutputs.json'
import {oktaDomain, oktaClientId} from './../../../oktaProps.json'
import {privateKey} from './../../../cloudfrontKeys.json'


export class OktaAuthorizeLambda extends Construct{

  public readonly oktaAuthorizeLambda: NodejsFunction
  public readonly functionUrl: FunctionUrl

  constructor(scope: Construct, id: string){
    super(scope, id)

    const { 
      appDomain,
      distributionUrl, 
      publicKeyId,
    } = flattenObject(stackOutputs)

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

