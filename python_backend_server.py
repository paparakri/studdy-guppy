# python_backend_server.py

# --- Flask and Utility Imports ---
from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import os
import io
import json

# --- AWS SDK (boto3) Imports ---
import boto3
from botocore.exceptions import ClientError

# --- WARNING: HARDCODING CREDENTIALS IS NOT SECURE FOR PRODUCTION ---
# --- This is ONLY for temporary local testing to bypass environment variable issues. ---
# --- IMPORTANT: These temporary credentials will expire. You MUST obtain new ones and update them here when they do. ---
AWS_ACCESS_KEY_ID = "ASIAWJQQQEACX5RB53NE"
AWS_SECRET_ACCESS_KEY = "auwj+uFRtHOvyKt9Z1M3Bh7/Zf6Co90or+vOmNS2"
AWS_SESSION_TOKEN = "IQoJb3JpZ2luX2VjEEoaCXVzLWVhc3QtMSJIMEYCIQCgq9M/4pHB6xF9prd8xV7drSk7qI9KLIGnGORTv1WudQIhAJqCqfn/GVh+h0PvK0vi53RUXJG/c7wmxsNEoRg8XegnKpkCCBIQARoMNDMyNzUyNTY2Mjc3Igwyqjjch7XMHjelJ+0q9gFuakI8mQ1orUM1nu7mqsQBzy3DNXrv2HhQD1OHUpWmvtDyIXuR7nOIk8qK6e4SpcKQQigIxLYzl8/CPnTbWVsUONpAoMWSgEn2qmdURhMdRS6t9Y9b0qB0gKtR0CoWSj+TAMUnojurqU0rXL3tIlKA0lHo1Wu0BSQqIfqtBTl4a6rbLI/rDWQhqqtSwIv/4EPWh1S3AnZT1P81dRQ1RDg4nZxe/JU8IQEQJkIwJcIq7vYLhy1k+emkkddGJFv8tBdaZZFnwTp4eOfkAHE5B+gzExArY75t/MdixUhOeuWENVO4ZYVQnAS6h581/OoZcHUCiVh5z2Uwv57GwQY6nAEr1nRfU+EHL722cRX/cAhI/TLhiDx+Jzy2b5uarHHlPIt/p7aLjABrHTR7FE/S3sD/zsuWzXXsS4uiJzjCiMLdk8BWqd4C+BkT2upd/380y+35etcTStS8BeVKOH94M0AoO5qvEYHJzhkjLIVWaKU1n+f8JN+rfy9+56p/VyR/HmaIMM8La8Z57Os8pCz4wjkVEkaLkPLW/MYgxJI="
AWS_DEFAULT_REGION = "us-west-2"

# --- Flask App Setup ---
app = Flask(__name__, static_folder='public', static_url_path='')
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024

# --- AWS Client Configurations (boto3) ---
# CORRECTED: Using AWS_DEFAULT_REGION for region_name
textract_client = boto3.client(
    'textract',
    region_name=AWS_DEFAULT_REGION, # Corrected variable name
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    aws_session_token=AWS_SESSION_TOKEN
)

# CORRECTED: Using AWS_DEFAULT_REGION for region_name
bedrock_runtime_client = boto3.client(
    'bedrock-runtime',
    region_name=AWS_DEFAULT_REGION, # Corrected variable name
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    aws_session_token=AWS_SESSION_TOKEN
)

# --- Helper function for allowed file types ---
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}

def allowed_file(filename):
    """
    Checks if the uploaded file has an allowed extension.
    """
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- API ENDPOINT: Process Image with Textract & Claude ---
@app.route('/process-image-with-ai', methods=['POST'])
def process_image_with_ai():
    """
    Receives an image file, sends it to AWS Textract for text extraction,
    then sends the extracted text to AWS Bedrock (Claude model) for summarization in Greek.
    """
    print('Request received at /process-image-with-ai')

    # Check if an image file was provided in the request
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided for AI processing.'}), 400

    file = request.files['image']

    # Check if a file was selected but empty
    if file.filename == '':
        return jsonify({'error': 'No selected file.'}), 400

    # Validate file type
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. Only JPEG, PNG, and PDF are allowed.'}), 400

    extracted_text = ''
    claude_response_text = ''

    try:
        # Read the image bytes from the uploaded file
        image_bytes = file.read()

        print('Sending image to Amazon Textract...')
        # Call Textract to detect text in the document.
        # Note: For robust Greek OCR, AWS recommends using asynchronous operations
        # (StartDocumentTextDetection with LanguageCode='el' and GetDocumentTextDetection).
        # detect_document_text primarily supports 'en' and 'es' for explicit LanguageCode.
        # However, it can often still extract characters from other languages.
        textract_response = textract_client.detect_document_text(
            Document={'Bytes': image_bytes}
        )

        # Extract line-by-line text from Textract's response
        if 'Blocks' in textract_response:
            for block in textract_response['Blocks']:
                if block['BlockType'] == 'LINE' and 'Text' in block:
                    extracted_text += block['Text'] + '\n'
        
        # Log the extracted text (first 200 chars for brevity)
        print('Text extracted by Textract:\n', extracted_text.strip()[:200] + ('...' if len(extracted_text) > 200 else ''))

        # Return an error if Textract found no text
        if not extracted_text.strip():
            return jsonify({'error': 'No readable text found in the image by Textract.'}), 400

        print('Sending extracted text to Claude via Bedrock...')
        claude_model_id = "anthropic.claude-3-sonnet-20240229-v1:0"

        # Construct the prompt for Claude, explicitly asking for a summary in Greek
        claude_prompt = {
            "anthropic_version": "bedrock-2023-05-31",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": f"Review these medical notes, which may be in Greek, and provide a concise summary in Greek, highlighting key diagnoses, symptoms, and recommended actions. If any parts are unclear, note that. \n\nMedical Notes:\n{extracted_text.strip()}"}
                    ]
                }
            ],
            "max_tokens": 1000, # Max tokens for Claude's response
            "temperature": 0.3, # Controls randomness of the response
        }

        # Invoke the Claude model via Bedrock Runtime
        bedrock_response = bedrock_runtime_client.invoke_model(
            modelId=claude_model_id,
            contentType="application/json",
            accept="application/json",
            body=json.dumps(claude_prompt) # Convert prompt dictionary to JSON string
        )

        # Parse the response from Bedrock
        response_body = json.loads(bedrock_response['body'].read())

        # Extract the text content from Claude's response
        if 'content' in response_body and isinstance(response_body['content'], list):
            claude_response_text = "".join([block['text'] for block in response_body['content'] if 'text' in block])
        else:
            # Fallback for older Claude response structures or unexpected formats
            claude_response_text = response_body.get('completion', "No direct text content found from Claude. Check response structure.")
        
        # Log Claude's processed text (first 200 chars for brevity)
        print('Claude Processed Text:\n', claude_response_text.strip())

        # Return successful JSON response
        return jsonify({
            'success': True,
            'extractedText': extracted_text.strip(),
            'claudeProcessedText': claude_response_text.strip()
        })

    except ClientError as e:
        # Handle AWS specific errors (e.g., permissions, invalid input, resource not found)
        error_code = e.response.get("Error", {}).get("Code")
        error_message = e.response.get("Error", {}).get("Message")
        print(f"AWS Client Error: {error_code} - {error_message}")
        if error_code == 'AccessDeniedException':
            print('AWS Permissions Error: Ensure your IAM user/role has permissions for Textract (DetectDocumentText) and Bedrock (InvokeModel) on the specified model.')
        elif error_code in ['ValidationException', 'BadRequestException']:
            print('AWS Input Validation Error: Check the format of the input sent to Textract or Bedrock.')
        elif error_code == 'ResourceNotFoundException':
            print('AWS Resource Not Found: Check if the Textract or Bedrock model ID is correct and available in your region.')
        return jsonify({
            'error': 'Failed to process image with AI services.',
            'details': error_message,
            'awsErrorType': error_code
        }), 500
    except Exception as e:
        # Handle any other unexpected errors
        print(f"General error in image processing workflow: {e}")
        return jsonify({
            'error': 'Failed to process image with AI services.',
            'details': str(e),
            'awsErrorType': 'UnknownError'
        }), 500

# --- Flask Static File Serving (for optional frontend) ---
@app.route('/')
def serve_index():
    """
    Serves the default index.html (or text-to-video.html as configured) from the 'public' folder.
    This is for a potential frontend, not strictly needed for backend-only testing.
    """
    return send_from_directory(app.static_folder, 'text-to-video.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """
    Serves other static files (CSS, JS, images) from the 'public' folder.
    """
    return send_from_directory(app.static_folder, filename)

# --- Main entry point for running the Flask app ---
if __name__ == '__main__':
    # Check if the 'public' directory exists (for frontend files)
    if not os.path.exists('public'):
        print("Warning: 'public' directory not found. Please create it and place your HTML/JS/CSS files inside if you plan to use a frontend.")
    
    print(f"Server running at http://localhost:3001")
    # This message is informational for frontend users; it does not affect backend-only testing.
    print(f"Open http://localhost:3001/text-to-video.html in your browser (optional frontend).")
    app.run(port=3001, debug=True)