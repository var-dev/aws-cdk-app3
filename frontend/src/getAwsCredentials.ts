import { AssumeRoleWithWebIdentityCommand, AssumeRoleWithWebIdentityCommandOutput, AssumeRoleWithWebIdentityRequest, Credentials, STSClient } from "@aws-sdk/client-sts"

export async function getAwsCredentials (
    oidcToken: string, 
    roleArn: string,
    region = 'us-east-1'
  ): Promise<Credentials> {
  const client = new STSClient({ region }); // Replace with your preferred region

  const params: AssumeRoleWithWebIdentityRequest = {
    RoleArn: roleArn, // required
    WebIdentityToken: oidcToken, // required
    RoleSessionName: "OktaFederatedSession", // required
    DurationSeconds: 3600, // 1 hour, adjust as needed (max 12 hours or 43200 seconds)
  };

  try {
    const command = new AssumeRoleWithWebIdentityCommand(params);
    const response: AssumeRoleWithWebIdentityCommandOutput = await client.send(command);

    if (response.Credentials) {
      return {
        AccessKeyId: response.Credentials.AccessKeyId,
        SecretAccessKey: response.Credentials.SecretAccessKey,
        SessionToken: response.Credentials.SessionToken,
        Expiration: response.Credentials.Expiration,
      };
    } else {
      throw new Error("No credentials returned");
    }
  } catch (error) {
    console.error("Error assuming role:", error);
    throw error;
  }
}
