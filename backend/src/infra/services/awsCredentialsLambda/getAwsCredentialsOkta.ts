import { AssumeRoleWithWebIdentityCommand, AssumeRoleWithWebIdentityCommandOutput, AssumeRoleWithWebIdentityRequest, Credentials, STSClient } from "@aws-sdk/client-sts"

export async function getAwsCredentialsOkta (
    oidcToken: string, 
    roleArn: string,
    roleName = 'Role1',
    region = 'us-east-1'
  ): Promise<Credentials> {
  const client = new STSClient({ region })

  const params: AssumeRoleWithWebIdentityRequest = {
    RoleArn: roleArn, // required
    WebIdentityToken: oidcToken, // required
    RoleSessionName: roleName,  // required. An identifier for the assumed role session. Typically, you pass the name
                                // or identifier that is associated with the user who is using your application.
    DurationSeconds: 3600, // 1 hour, adjust as needed (max 12 hours or 43200 seconds)
  }

  try {
    const command = new AssumeRoleWithWebIdentityCommand(params)
    const response: AssumeRoleWithWebIdentityCommandOutput = await client.send(command)

    if (response.Credentials) {
      return {
        AccessKeyId: response.Credentials.AccessKeyId,
        SecretAccessKey: response.Credentials.SecretAccessKey,
        SessionToken: response.Credentials.SessionToken,
        Expiration: response.Credentials.Expiration,
      } as Credentials
    } else {
      throw new Error("No credentials returned")
    }
  } catch (error) {
    console.error("Error assuming role:", error)
    throw error
  }
}
