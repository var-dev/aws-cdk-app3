import { CfnOutput, Duration, RemovalPolicy, Stack, StackProps, } from 'aws-cdk-lib'
import { AccessLevel, AllowedMethods, CachePolicy, Distribution, KeyGroup, OriginRequestPolicy, PriceClass, PublicKey, ResponseHeadersPolicy, ViewerProtocolPolicy,  } from 'aws-cdk-lib/aws-cloudfront';
import { FunctionUrlOrigin, S3BucketOrigin, } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Bucket, BucketAccessControl, BucketEncryption, EventType, HttpMethods, ObjectOwnership } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

import { LogBucket } from '../constructs/logBucket';

import path from 'node:path';
import fs from 'fs';

import { OktaLoginLambda } from '../constructs/oktaLoginLambda';
import { OktaCallbackLambda } from '../constructs/oktaCallbackLambda';
import { OktaAuthorizeLambda } from '../constructs/oktaAuthorizeLambda';
import { OktaOidcFederation } from '../constructs/oktaOidcFederation';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Trail } from 'aws-cdk-lib/aws-cloudtrail';
import { CustomStackProps } from '../Launcher';
import { AwsCredentialsLambda } from '../constructs/awsCredentialsLambda';
import { LogoutLambda } from '../constructs/logoutLambda';


const {publicKey} = JSON.parse(fs.readFileSync('./cloudfrontKeys.json', 'utf-8'))

export class YourNameAppStack extends Stack {

  constructor(scope: Construct, id: string, props?: CustomStackProps) {
      super(scope, id, props)

    const cloudTrail = new Trail(this, `${props?.constructIdPrefix}CloudTrail`, {
      bucket: new Bucket(this, `${props?.constructIdPrefix}CloudTrailBucket`, {
        lifecycleRules: [{expiration: Duration.days(1),}],
        removalPolicy: RemovalPolicy.DESTROY,
        autoDeleteObjects: true
      }),
      sendToCloudWatchLogs: true,
      // cloudWatchLogGroup: logGroup,
      cloudWatchLogsRetention: RetentionDays.ONE_DAY,
      isMultiRegionTrail: false
    })

    const logBucket = new LogBucket(this, `${props?.constructIdPrefix}LogBucket`).logBucket
  
    const assetBucket = new Bucket(this, `${props?.constructIdPrefix}AssetBucket`, {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
      blockPublicAccess: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      accessControl: BucketAccessControl.PRIVATE,
      versioned: false,
      encryption: BucketEncryption.S3_MANAGED,
      objectOwnership: ObjectOwnership.BUCKET_OWNER_ENFORCED,
      cors:[
        {
          allowedMethods: [HttpMethods.GET,], // Adjust as needed
          allowedOrigins: ['*'],    // Adjust to your specific origins
          allowedHeaders: ['*'],    // Adjust as needed
        },
      ]
    })

    new CfnOutput(this, `${props?.constructIdPrefix}AssetBucketName`, {
      key: 'assetBucketName',
      value: assetBucket.bucketName,
    })

    cloudTrail.addS3EventSelector([{
      bucket: assetBucket,
      objectPrefix: `${props?.constructIdPrefix}AssetBucketAccessLogs`
    }])

    const cloudfrontPublicKey = new PublicKey(this, `${props?.constructIdPrefix}PublicKey2`, {
      encodedKey: publicKey,
    })
    cloudfrontPublicKey.applyRemovalPolicy(RemovalPolicy.DESTROY)

    new CfnOutput(this, `${props?.constructIdPrefix}PublicKeyId`, {
      key: 'publicKeyId',
      value: cloudfrontPublicKey.publicKeyId,
    })

    const cloudfrontKeyGroup = new KeyGroup(this, `${props?.constructIdPrefix}KeyGroup`, {
      items: [cloudfrontPublicKey],
    })

    const cloudfrontDistribution = new Distribution(this, 'Distribution1', {
      priceClass: PriceClass.PRICE_CLASS_100,
      logBucket: logBucket,
      logFilePrefix: 'cfAccessLogs',
      defaultRootObject: 'index.html',
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/error-403.html' },
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/error-404.html' },
      ],
      defaultBehavior:{
        trustedKeyGroups:[cloudfrontKeyGroup],
        origin: S3BucketOrigin.withOriginAccessControl(assetBucket,{
          originId: `${props?.constructIdPrefix}S3origin`,
          originPath: '/web/static',
          originAccessControlId: `${props?.constructIdPrefix}S3originAccessControl`,
          originAccessLevels: [AccessLevel.READ],
        }),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: CachePolicy.CACHING_DISABLED,
      },
    })
    cloudfrontDistribution.applyRemovalPolicy(RemovalPolicy.DESTROY)

    new CfnOutput(this, `${props?.constructIdPrefix}DistributionUrl`, {
      key: 'distributionUrl',
      value: `https://${cloudfrontDistribution.distributionDomainName}`,
    })

    new CfnOutput(this, `${props?.constructIdPrefix}DistributionDomainName`, {
      key: 'appDomain',
      value: `${cloudfrontDistribution.distributionDomainName}`,
    })

    new BucketDeployment(this, `${props?.constructIdPrefix}DeployWebsite`, {
      sources: [
        Source.asset(path.join(__dirname, '..', '..', '..', '..','frontend','dist')),
      ],
      destinationBucket: assetBucket,
      destinationKeyPrefix: 'web/static', // optional prefix in destination bucket
    });

    const behaviorOptionsOktaLambda = {
      allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      cachePolicy: CachePolicy.CACHING_DISABLED,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      responseHeadersPolicy: ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS,
    }

    const oktaLoginLambda = new OktaLoginLambda(this, `${props?.constructIdPrefix}OktaLoginLambda`)
    cloudfrontDistribution.addBehavior('/okta/login', new FunctionUrlOrigin(oktaLoginLambda.functionUrl), behaviorOptionsOktaLambda)

    const logoutLambda = new LogoutLambda(this, `${props?.constructIdPrefix}LogoutLambda`)
    cloudfrontDistribution.addBehavior('/logout', new FunctionUrlOrigin(logoutLambda.functionUrl), behaviorOptionsOktaLambda)


    const oktaCallbackLambda = new OktaCallbackLambda(this, `${props?.constructIdPrefix}OktaCallbackLambda`)
    cloudfrontDistribution.addBehavior('/okta/callback', new FunctionUrlOrigin(oktaCallbackLambda.functionUrl), 
      {...behaviorOptionsOktaLambda, allowedMethods: AllowedMethods.ALLOW_ALL}
    )

    const oktaAuthorizeLambda = new OktaAuthorizeLambda(this, `${props?.constructIdPrefix}OktaAuthorizeLambda`)
    cloudfrontDistribution.addBehavior('/okta/authorize', new FunctionUrlOrigin(oktaAuthorizeLambda.functionUrl), behaviorOptionsOktaLambda)

    const awsCredentialsLambda = new AwsCredentialsLambda(this, `${props?.constructIdPrefix}AwsCredentialsLambda`)
    cloudfrontDistribution.addBehavior('/aws/credentials', new FunctionUrlOrigin(awsCredentialsLambda.functionUrl), 
      {...behaviorOptionsOktaLambda, 
        allowedMethods: AllowedMethods.ALLOW_ALL, 
        trustedKeyGroups:[cloudfrontKeyGroup],
      }
    )
    
    const assetBucketUnprotectedOrigin = S3BucketOrigin.withOriginAccessControl( assetBucket, {
      originPath: '/web/static',  
      originAccessLevels: [AccessLevel.READ],
    })

    const behaviorOptionsS3unprotected = {
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      cachePolicy: CachePolicy.CACHING_DISABLED,
    }
    
    cloudfrontDistribution.addBehavior('/error-*', assetBucketUnprotectedOrigin, behaviorOptionsS3unprotected)

    cloudfrontDistribution.addBehavior('/assets/error-*', assetBucketUnprotectedOrigin, behaviorOptionsS3unprotected)

    cloudfrontDistribution.addBehavior('/assets/vite-*', assetBucketUnprotectedOrigin, behaviorOptionsS3unprotected)

    new OktaOidcFederation(this, `${props?.constructIdPrefix}OktaOidcFederation`)
  }
}