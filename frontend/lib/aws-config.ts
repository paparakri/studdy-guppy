// lib/aws-config.ts
import { BedrockRuntime } from '@aws-sdk/client-bedrock-runtime';
import { S3Client } from '@aws-sdk/client-s3';
import { TranscribeClient } from '@aws-sdk/client-transcribe';
import { PollyClient } from '@aws-sdk/client-polly';

// Validate environment variables
if (!process.env.AWS_ACCESS_KEY_ID) {
  throw new Error('AWS_ACCESS_KEY_ID is not set');
}
if (!process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error('AWS_SECRET_ACCESS_KEY is not set');
}
if (!process.env.AWS_SESSION_TOKEN) {
  throw new Error('AWS_SESSION_TOKEN is not set (required for temporary credentials)');
}

// AWS client configuration for temporary credentials
const awsConfig = {
  region: process.env.AWS_REGION || 'us-west-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN, // This is the key difference!
  },
};

// Initialize clients
export const bedrockClient = new BedrockRuntime(awsConfig);
export const s3Client = new S3Client(awsConfig);
export const transcribeClient = new TranscribeClient(awsConfig);
export const pollyClient = new PollyClient(awsConfig);

// Helper function for Claude
export async function callClaude(prompt: string, maxTokens: number = 1000): Promise<string> {
  try {
    const response = await bedrockClient.invokeModel({
      modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const responseBody = new TextDecoder().decode(response.body);
    const result = JSON.parse(responseBody);

    return result.content[0].text;
  } catch (error) {
    console.error('Bedrock error:', error);
    throw new Error('Failed to call Claude');
  }
}