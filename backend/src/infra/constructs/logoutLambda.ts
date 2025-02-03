import { CfnOutput, } from 'aws-cdk-lib';
import { FunctionUrl, FunctionUrlAuthType, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from "constructs"
import path from 'path';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { readFileSync } from 'fs';
import { flattenObject } from '../../../../utils/src/flattenObject';


export class LogoutLambda extends Construct{

  public readonly logoutLambda: NodejsFunction
  public readonly functionUrl: FunctionUrl

  constructor(scope: Construct, id: string){
    super(scope, id)

    const stackOutputs = JSON.parse(readFileSync(path.join(__dirname, '..', '..', '..', './stackOutputs.json'), 'utf-8'))
    const { 
      appDomain,
    } = flattenObject(stackOutputs)
        
    
    this.logoutLambda = new NodejsFunction(this, `Self`, {
      runtime: Runtime.NODEJS_20_X,
      memorySize: 128,
      entry: path.join(__dirname, '..', 'services', 'logoutLambda', 'index.ts'),
      logRetention: RetentionDays.ONE_DAY,
      environment: {
        APP_DOMAIN: appDomain,
      }
    })

    this.functionUrl = this.logoutLambda.addFunctionUrl({ authType: FunctionUrlAuthType.NONE });

    new CfnOutput(this, "Url", {
      key: 'logoutLambdaUrl',
      value: this.functionUrl.url,
    });
  }
}

