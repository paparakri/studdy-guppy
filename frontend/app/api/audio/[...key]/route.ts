// frontend/app/api/audio/[...key]/route.ts - NEW FILE
import { NextRequest, NextResponse } from 'next/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { s3Client } from '@/lib/aws-config'

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    // Await params before using them (Next.js 15+ requirement)
    const resolvedParams = await params
    const key = resolvedParams.key.join('/')
    console.log('Audio proxy request for key:', key)
    
    const response = await s3Client.send(new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
    }))
    
    if (!response.Body) {
      console.error('No audio body found for key:', key)
      return new NextResponse('Audio not found', { status: 404 })
    }
    
    // Convert the stream to bytes
    const audioStream = response.Body as any
    const audioBytes = await audioStream.transformToByteArray()
    
    console.log(`Successfully fetched audio: ${key}, size: ${audioBytes.length} bytes`)
    
    return new NextResponse(audioBytes, {
      headers: {
        'Content-Type': response.ContentType || 'audio/mpeg',
        'Content-Length': audioBytes.length.toString(),
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Range, Content-Length',
        // Support for audio seeking
        'Accept-Ranges': 'bytes',
      },
    })
  } catch (error) {
    console.error('Audio proxy error for key:', (await params).key.join('/'), error)
    return new NextResponse('Audio not found', { 
      status: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    })
  }
}

export async function HEAD(
  request: NextRequest, 
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const resolvedParams = await params
    const key = resolvedParams.key.join('/')
    
    const response = await s3Client.send(new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
    }))
    
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': response.ContentType || 'audio/mpeg',
        'Content-Length': response.ContentLength?.toString() || '0',
        'Access-Control-Allow-Origin': '*',
        'Accept-Ranges': 'bytes',
      },
    })
  } catch (error) {
    return new NextResponse(null, { 
      status: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Range, Content-Length',
    },
  })
}