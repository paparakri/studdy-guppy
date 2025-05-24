## Installation

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   pnpm i
   ```

3. Install AWS SDK and other required packages:
   ```bash
   pnpm install @aws-sdk/client-bedrock-runtime @aws-sdk/client-s3 @aws-sdk/client-transcribe @aws-sdk/client-polly formidable
   pnpm install -D @types/formidable
   ```

4. Configure AWS credentials in .env.local file:
   ```python
    AWS_ACCESS_KEY_ID = "your_access_key"
    AWS_SECRET_ACCESS_KEY = "your_secret_key"
    AWS_SESSION_TOKEN = "your_session_token"  # Optional
    AWS_DEFAULT_REGION = "your_region"
   ```

## Running the Application

### Frontend

1. Start the development server:
   ```bash
   cd frontend
   pnpm dev
   ```

2. The application will be available at `http://localhost:3000`

## Features

- Text-to-flowchart conversion using AWS Bedrock
- Interactive web interface
- Customizable flowchart generation
- Support for both raw text and pre-formatted notes
- PNG output generation

## Dependencies

### Frontend
- Next.js
- AWS SDK for JavaScript
- Formidable
- TypeScript

### Backend
- AWS
  - Bedrock 
  - Transcribe
  - Polly
  - S3