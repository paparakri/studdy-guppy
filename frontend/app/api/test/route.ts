// app/api/test-aws/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { callClaude, s3Client, bedrockClient } from '@/lib/aws-config';
import { ListBucketsCommand } from '@aws-sdk/client-s3';

export async function GET() {
  try {
    // Test 1: Bedrock (Claude)
    const claudeResponse = await callClaude('Say "AWS is working!" in a friendly way.');
    
    // Test 2: S3 (List buckets)
    const s3Response = await s3Client.send(new ListBucketsCommand({}));
    
    return NextResponse.json({
      success: true,
      claudeResponse,
      s3Buckets: s3Response.Buckets?.map(b => b.Name) || [],
      message: 'All AWS services are working!'
    });
  } catch (error) {
    console.error('AWS Test Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'AWS connection failed'
    }, { status: 500 });
  }
}