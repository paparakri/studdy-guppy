import argparse
import boto3
import json
import base64
import os # For checking if mermaid-cli is installed
from botocore.exceptions import ClientError

# To render Mermaid.js to image, you'd typically need a separate tool.
# For demonstration, I'll add a placeholder function for it.
# You'd need to install Node.js and then 'npm install -g @mermaid-js/mermaid-cli'

# --- YOUR PROVIDED AWS CREDENTIALS ---
AWS_ACCESS_KEY_ID = "ASIAWJQQQEACX5RB53NE"
AWS_SECRET_ACCESS_KEY = "auwj+uFRtHOvyKt9Z1M3Bh7/Zf6Co90or+vOmNS2"
AWS_SESSION_TOKEN = "IQoJb3JpZ2luX2VjEEoaCXVzLWVhc3QtMSJIMEYCIQCgq9M/4pHB6xF9prd8xV7drSk7qI9KLIGnGORTv1WudQIhAJqCqfn/GVh+h0PvK0vi53RUXJG/c7wmxsNEoRg8XegnKpkCCBIQARoMNDMyNzUyNTY2Mjc3Igwyqjjch7XMHjelJ+0q9gFuakI8mQ1orUM1nu7mqsQBzy3DNXrv2HhQD1OHUpWmvtDyIXuR7nOIk8qK6e4SpcKQQigIxLYzl8/CPnTbWVsUONpAoMWSgEn2qmdURhMdRS6t9Y9b0qB0gKtR0CoWSj+TAMUnojurqU0rXL3tIlKA0lHo1Wu0BSQqIfqtBTl4a6rbLI/rDWQhqqtSwIv/4EPWh1S3AnZT1P81dRQ1RDg4nZxe/JU8IQEQJkIwJcIq7vYLhy1k+emkkddGJFv8tBdaZZFnwTp4eOfkAHE5B+gzExArY75t/MdixUhOeuWENVO4ZYVQnAS6h581/OoZcHUCiVh5z2Uwv57GwQY6nAEr1nRfU+EHL722cRX/cAhI/TLhiDx+Jzy2b5uarHHlPIt/p7aLjABrHTR7FE/S3sD/zsuWzXXsS4uiJzjCiMLdk8BWqd4C+BkT2upd/380y+35etcTStS8BeVKOH94M0AoO5qvEYHJzhkjLIVWaKU1n+f8JN+rfy9+56p/VyR/HmaIMM8La8Z57Os8pCz4wjkVEkaLkPLW/MYgxJI="
AWS_DEFAULT_REGION = "us-west-2"
# ------------------------------------

def get_bedrock_client():
    """Initializes and returns a boto3 Bedrock Runtime client using hardcoded credentials."""
    return boto3.client(
        service_name='bedrock-runtime',
        region_name=AWS_DEFAULT_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        aws_session_token=AWS_SESSION_TOKEN
    )

def generate_mermaid_flowchart_code(text):
    """
    Sends raw text to Claude 3 Sonnet to generate Mermaid.js flowchart code.
    """
    bedrock_client = get_bedrock_client()
    model_id = "anthropic.claude-3-sonnet-20240229-v1:0"

    prompt_template = f"""
    Based on the following text, generate a Mermaid.js flowchart diagram code.
    Focus on key steps, decisions, and outcomes, showing a clear linear or branching flow.
    Use standard flowchart shapes like 'start', 'end', 'process', 'decision' as appropriate.
    Keep the diagram concise and clear.
    The output should ONLY contain the Mermaid code block, enclosed in ````mermaid` and ````.
    Ensure the generated code adheres to the principles of the AWS Responsible AI policy.

    Text:
    ---
    {text}
    ---

    Mermaid Flowchart Code:
    """

    try:
        response = bedrock_client.invoke_model(
            modelId=model_id,
            contentType='application/json',
            accept='application/json',
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 1000, # Allow more tokens for code generation
                "messages": [
                    {
                        "role": "user",
                        "content": prompt_template
                    }
                ]
            })
        )
        response_body = json.loads(response['body'].read())
        if response_body and response_body.get('content'):
            mermaid_code = response_body['content'][0]['text']
            # Extract only the code block if Claude adds extra text
            if mermaid_code.startswith("```mermaid"):
                mermaid_code = mermaid_code.split("```mermaid\n", 1)[1]
            if mermaid_code.endswith("\n```"):
                mermaid_code = mermaid_code.rsplit("\n```", 1)[0]
            return mermaid_code.strip()
        else:
            print("Error: No Mermaid code received from Claude.")
            return None
    except ClientError as e:
        print(f"Error invoking Claude model for Mermaid code: {e}")
        if "UnrecognizedClientException" in str(e) or "NoCredentialsError" in str(e):
            print("This often means your AWS credentials are expired or invalid.")
        return None

def render_mermaid_to_png(mermaid_code, output_filename="flowchart.png"):
    """
    Renders Mermaid.js code to a PNG image using mermaid-cli.
    Requires Node.js and mermaid-cli to be installed:
    npm install -g @mermaid-js/mermaid-cli
    """
    if not mermaid_code:
        print("No Mermaid code to render.")
        return False

    temp_mermaid_file = "temp_flowchart.mmd"
    with open(temp_mermaid_file, "w") as f:
        f.write(mermaid_code)

    print(f"Attempting to render Mermaid code to {output_filename} using mermaid-cli...")
    try:
        import subprocess
        # Check if mmdc (mermaid-cli) is available
        if subprocess.run(['which', 'mmdc'], capture_output=True).returncode != 0:
            print("Error: 'mmdc' (mermaid-cli) not found in PATH.")
            print("Please install Node.js and then 'npm install -g @mermaid-js/mermaid-cli'")
            return False

        command = [
            "mmdc",
            "-i", temp_mermaid_file,
            "-o", output_filename,
            "-w", "1200",  # Width of the output image
            "-H", "800",   # Height of the output image
            "-b", "transparent" # Transparent background
        ]
        result = subprocess.run(command, capture_output=True, text=True)

        if result.returncode == 0:
            print(f"Flowchart successfully rendered to {output_filename}")
            return True
        else:
            print(f"Error rendering Mermaid to PNG: {result.stderr}")
            print(f"Mermaid code that caused the error:\n{mermaid_code}")
            return False
    except FileNotFoundError:
        print("Error: 'mmdc' (mermaid-cli) command not found.")
        print("Please ensure Node.js is installed and 'npm install -g @mermaid-js/mermaid-cli' has been run.")
        return False
    except Exception as e:
        print(f"An unexpected error occurred during Mermaid rendering: {e}")
        return False
    finally:
        if os.path.exists(temp_mermaid_file):
            os.remove(temp_mermaid_file)


def main():
    parser = argparse.ArgumentParser(description="Generate a flowchart from notes or raw text using AWS Bedrock and render with Mermaid-CLI.")
    parser.add_argument("--notes_file", type=str, help="Path to a file containing pre-formatted notes.")
    parser.add_argument("--raw_text_file", type=str, help="Path to a file containing raw text to be summarized by Claude.")
    parser.add_argument("--output", type=str, default="flowchart.png", help="Output filename for the generated image (e.g., my_graph.png).")

    args = parser.parse_args()

    input_text = None

    if args.raw_text_file:
        try:
            with open(args.raw_text_file, 'r') as f:
                input_text = f.read()
            print("Generating Mermaid flowchart code with Claude 3 Sonnet...")
            mermaid_code = generate_mermaid_flowchart_code(input_text)
            if mermaid_code:
                print("\n--- Claude's Generated Mermaid Code ---")
                print(mermaid_code)
                print("-------------------------------------\n")
            else:
                print("Failed to generate Mermaid code from raw text. Exiting.")
                return
        except FileNotFoundError:
            print(f"Error: Raw text file '{args.raw_text_file}' not found.")
            return
    elif args.notes_file:
        try:
            with open(args.notes_file, 'r') as f:
                input_text = f.read() # Use notes file content directly for Mermaid generation
            print(f"Generating Mermaid flowchart code from file: {args.notes_file}")
            mermaid_code = generate_mermaid_flowchart_code(input_text)
            if mermaid_code:
                print("\n--- Claude's Generated Mermaid Code ---")
                print(mermaid_code)
                print("-------------------------------------\n")
            else:
                print("Failed to generate Mermaid code from notes. Exiting.")
                return
        except FileNotFoundError:
            print(f"Error: Notes file '{args.notes_file}' not found.")
            return
    else:
        print("Please provide either --notes_file or --raw_text_file.")
        parser.print_help()
        return

    if mermaid_code:
        print("Rendering Mermaid code to PNG...")
        render_mermaid_to_png(mermaid_code, args.output)
    else:
        print("No Mermaid code available to render a flowchart.")

if __name__ == "__main__":
    main()