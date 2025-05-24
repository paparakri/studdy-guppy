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
if (!process.env.AWS_REGION) {
  throw new Error('AWS_REGION is not set');
}

// AWS client configuration
const awsConfig = {
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

// Initialize clients
export const bedrockClient = new BedrockRuntime(awsConfig);
export const s3Client = new S3Client(awsConfig);
export const transcribeClient = new TranscribeClient(awsConfig);
export const pollyClient = new PollyClient(awsConfig);

// Helper function for Claude
export async function callClaude(prompt: string): Promise<string> {
  try {
    console.log('🔧 Calling Bedrock with prompt:', prompt.substring(0, 50) + '...');
    
    const response = await bedrockClient.invokeModel({
      modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    // 🎯 FIX: Properly handle the response body in Node.js
    const responseBody = new TextDecoder().decode(response.body);
    const result = JSON.parse(responseBody);
    
    console.log('✅ Bedrock response received');
    return result.content[0].text;
  } catch (error) {
    console.error('❌ Full Bedrock error details:', error);
    console.error('Error name:', (error as any)?.name);
    console.error('Error message:', (error as any)?.message);
    console.error('Error code:', (error as any)?.$metadata?.httpStatusCode);
    throw error;
  }
}