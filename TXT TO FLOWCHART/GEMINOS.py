import argparse
import boto3
import json
import base64
import os
import subprocess
from botocore.exceptions import ClientError

AWS_ACCESS_KEY_ID = ""
AWS_SECRET_ACCESS_KEY = ""
AWS_SESSION_TOKEN = ""
AWS_DEFAULT_REGION = ""



# -----------------------------------------------------------

def get_bedrock_client():
    """Initializes and returns a boto3 Bedrock Runtime client using hardcoded credentials."""
    return boto3.client(
        service_name='bedrock-runtime',
        region_name=AWS_DEFAULT_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        aws_session_token=AWS_SESSION_TOKEN if AWS_SESSION_TOKEN else None
    )


def verify_aws_credentials():
    """
    CHECKPOINT 1: Verifies if AWS credentials are valid by making a simple STS call.
    """
    print("\n--- CHECKPOINT 1: Verifying AWS Credentials ---")
    try:
        sts_client = boto3.client(
            'sts',
            region_name=AWS_DEFAULT_REGION,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            aws_session_token=AWS_SESSION_TOKEN if AWS_SESSION_TOKEN else None
        )
        sts_client.get_caller_identity()
        print("CHECKPOINT 1: AWS Credentials are VALID.")
        return True
    except ClientError as e:
        print(f"CHECKPOINT 1 FAILED: AWS Credential Error: {e}")
        if "UnrecognizedClientException" in str(e) or "InvalidClientTokenId" in str(e):
            print("Reason: Your security token/credentials are expired, invalid, or incorrect.")
            print("Please update AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_SESSION_TOKEN in the script.")
        elif "SignatureDoesNotMatch" in str(e):
            print("Reason: The secret access key is incorrect.")
        else:
            print("Reason: An unexpected AWS client error occurred.")
        return False
    except Exception as e:
        print(f"CHECKPOINT 1 FAILED: An unexpected error occurred during credential verification: {e}")
        return False


def generate_mermaid_flowchart_code(text, user_guidance=None):
    """
    CHECKPOINT 2: Sends raw text to Claude 3 Sonnet to generate Mermaid.js flowchart code.
    Includes an optional user_guidance prompt.
    """
    print("\n--- CHECKPOINT 2: Generating Mermaid Code with Claude 3 Sonnet ---")
    bedrock_client = get_bedrock_client()
    model_id = "anthropic.claude-3-sonnet-20240229-v1:0"

    # Add user guidance to the prompt if provided
    guidance_section = ""
    if user_guidance:
        guidance_section = f"""
    Additional User Guidance for Flowchart Generation:
    ---
    {user_guidance}
    ---
    """

    prompt_template = f"""
    Based on the following text, generate a Mermaid.js flowchart diagram code.
    {guidance_section}
    Focus on **only the most essential steps, decisions, and outcomes**.
    Keep node labels **very concise** and to the point (e.g., "Start", "Process Data", "Decision?", "End").
    Show a clear linear or branching flow.
    Use standard flowchart shapes like 'start', 'end', 'process', 'decision' as appropriate.
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
                "max_tokens": 300,  # Reduced token limit for more concise output
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
            if mermaid_code.startswith("```mermaid"):
                mermaid_code = mermaid_code.split("```mermaid\n", 1)[1]
            if mermaid_code.endswith("\n```"):
                mermaid_code = mermaid_code.rsplit("\n```", 1)[0]
            print("CHECKPOINT 2: Successfully generated Mermaid code.")
            return mermaid_code.strip()
        else:
            print("CHECKPOINT 2 FAILED: No Mermaid code received from Claude.")
            return None
    except ClientError as e:
        print(f"CHECKPOINT 2 FAILED: Error invoking Claude model for Mermaid code: {e}")
        if "UnrecognizedClientException" in str(e) or "NoCredentialsError" in str(e):
            print(
                "Reason: This often means your AWS credentials are expired or invalid. (Already checked in Checkpoint 1, but this is a double-check).")
        return None
    except Exception as e:
        print(f"CHECKPOINT 2 FAILED: An unexpected error occurred during Claude invocation: {e}")
        return None


def render_mermaid_to_png_local(mermaid_code, output_filename="flowchart.png"):
    """
    CHECKPOINT 3: Renders Mermaid.js code to a PNG image using mermaid-cli locally.
    This version uses shell=True for Windows compatibility.
    """
    print("\n--- CHECKPOINT 3: Rendering Mermaid to PNG locally ---")
    if not mermaid_code:
        print("CHECKPOINT 3 FAILED: No Mermaid code to render.")
        return False

    temp_mermaid_file = "temp_flowchart.mmd"
    with open(temp_mermaid_file, "w") as f:
        f.write(mermaid_code)

    print("\n--- Python Script's PATH Environment Variable ---")
    script_path_env = os.environ.get('PATH', 'PATH not found').split(os.pathsep)
    for p in script_path_env:
        print(f"  - {p}")
    print("--------------------------------------------------\n")

    print(f"Attempting to render Mermaid code to {output_filename} using mermaid-cli locally (with shell=True)...")
    try:
        mmdc_command_name = 'mmdc'

        command_string = (
            f"{mmdc_command_name} -i \"{temp_mermaid_file}\" -o \"{output_filename}\" "
            f"-w 1200 -H 800 -b transparent"
        )

        print(f"DEBUG: Executing command string: {command_string}")

        result = subprocess.run(command_string, capture_output=True, text=True, shell=True, check=False)

        if result.returncode == 0:
            print(f"CHECKPOINT 3: Flowchart successfully rendered to {output_filename}")
            return True
        else:
            print(f"CHECKPOINT 3 FAILED: Error rendering Mermaid to PNG: {result.stderr}")
            print(f"Mermaid code that caused the error:\n{mermaid_code}")
            return False
    except FileNotFoundError:
        print(
            f"CHECKPOINT 3 FAILED: The '{mmdc_command_name}' command was not found by the shell. This typically means it's not installed or not in your system's PATH.")
        print("Please ensure Node.js is installed and then 'npm install -g @mermaid-js/mermaid-cli' has been run.")
        return False
    except Exception as e:
        print(f"CHECKPOINT 3 FAILED: An unexpected error occurred during Mermaid rendering: {e}")
        return False
    finally:
        if os.path.exists(temp_mermaid_file):
            os.remove(temp_mermaid_file)


def main():
    parser = argparse.ArgumentParser(
        description="Generate a flowchart from notes or raw text using AWS Bedrock and render with Mermaid-CLI.")
    parser.add_argument("--notes_file", type=str, help="Path to a file containing pre-formatted notes.")
    parser.add_argument("--raw_text_file", type=str,
                        help="Path to a file containing raw text to be summarized by Claude.")
    parser.add_argument("--output", type=str, default="flowchart.png",
                        help="Output filename for the generated image (e.g., my_graph.png).")
    parser.add_argument("--guidance_prompt", type=str,
                        help="Optional user guidance to add to Claude's prompt for more specific flowchart generation. E.g., 'Ensure all nodes are rectangular' or 'Focus on the user journey.'")

    args = parser.parse_args()

    input_text = None

    # Checkpoint 1: Verify AWS Credentials
    if not verify_aws_credentials():
        print("\nExiting due to invalid AWS credentials.")
        return

    if args.raw_text_file:
        try:
            with open(args.raw_text_file, 'r') as f:
                input_text = f.read()
            print("Generating Mermaid flowchart code with Claude 3 Sonnet (concise version)...")
            # Pass user_guidance to the generation function
            mermaid_code = generate_mermaid_flowchart_code(input_text, args.guidance_prompt)
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
                input_text = f.read()
            print(f"Generating Mermaid flowchart code from file: {args.notes_file} (concise version)...")
            # Pass user_guidance to the generation function
            mermaid_code = generate_mermaid_flowchart_code(input_text, args.guidance_prompt)
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
        render_mermaid_to_png_local(mermaid_code, args.output)
    else:
        print("No Mermaid code available to render a flowchart.")


if __name__ == "__main__":
    main()