import { CfnOutput, Duration, } from 'aws-cdk-lib';
import { Construct } from "constructs"
import { Conditions, Effect, ManagedPolicy, OpenIdConnectProvider, PolicyStatement, Role, WebIdentityPrincipal } from 'aws-cdk-lib/aws-iam';

import {oktaDomain, oktaClientId, awsIdpForOkta} from './../../../oktaProps.json'


export class OktaOidcFederation extends Construct{

  constructor(scope: Construct, id: string){
    super(scope, id)

    // const oktaProvider = new OpenIdConnectProvider(this, 'OidcProvider', {
    //   url: `https://${oktaDomain}/custom`,
    //   clientIds: [oktaClientId],
    // })


    // This assumes that AWS Okta IDP already exists. Check IAM->Identity providers in AWS console.
    const oktaProvider = OpenIdConnectProvider.fromOpenIdConnectProviderArn(this, 'OidcProvider', awsIdpForOkta)
      // Attention! clientIds can't be added via CDK in this case
      // Add your Okta clientId in IAM->Identity providers->your-idp.okta.com->Audiences manually
    
    const conditions: Conditions = {
      StringEquals: { [`${oktaDomain}:aud`]: oktaClientId },
    }

    const federatedRole = new Role(this, 'FederatedRole', {
      assumedBy: new WebIdentityPrincipal(oktaProvider.openIdConnectProviderArn, conditions),
      maxSessionDuration: Duration.hours(1),
    })

    federatedRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('ReadOnlyAccess'))

    federatedRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:ListBucket',
      ],
      resources: ['*'],
    }))

    new CfnOutput(this, "RoleArn", { 
      key: 'oktaFederatedRoleArn',
      value: federatedRole.roleArn,
    });

    new CfnOutput(this, "AppRegion", {
      key: 'appRegion',
      value: process.env.AWS_REGION || 'us-east-1',
    })
  }
}

