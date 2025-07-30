import os
import sys
from dotenv import load_dotenv
import platform
import time
import subprocess
import signal

def run_agent_service():
    """Run the FastAPI agent service with enhanced configuration"""
    # Load environment variables
    load_dotenv()

    # Get port from environment or use default
    port = int(os.getenv("AGENT_PORT", "8001"))
    host = os.getenv("AGENT_HOST", "0.0.0.0")
    reload = os.getenv("RELOAD", "true").lower() == "true"
    debug = os.getenv("DEBUG", "false").lower() == "true"

    # Check if running on Windows to avoid encoding issues
    is_windows = platform.system() == "Windows"

    # Ensure the .env file exists
    if not os.path.exists('.env'):
        print("Warning: .env file not found. Using default environment values.")

    # Plain text for Windows, emojis for other platforms
    if is_windows:
        print(f"Starting GenesisOS Agent Service on port {port}...")
        print(f"API will be available at http://localhost:{port}")
        print(f"Debug mode: {debug}")
        print(f"Press CTRL+C to stop the server")
    else:
        print(f"🚀 Starting GenesisOS Agent Service on port {port}...")
        print(f"🌐 API will be available at http://{host}:{port}")
        print(f"📚 API docs available at http://localhost:{port}/docs")
        print(f"🐛 Debug mode: {debug}")
        print(f"ℹ️ Press CTRL+C to stop the server")

    try:
        # Always use the currently running Python interpreter
        python_executable = sys.executable

        # Build the uvicorn command
        command = [
            python_executable, "-m", "uvicorn", "main:app",
            "--host", host,
            "--port", str(port)
        ]

        if reload:
            command.append("--reload")

        if debug:
            command.append("--log-level=debug")

        # Print the command we're about to run
        command_str = " ".join(command)
        print(f"Executing: {command_str}")

        # Start the server as a subprocess
        process = subprocess.Popen(command)

        # Handle signals to gracefully stop the server
        def signal_handler(sig, frame):
            print("\n🛑 Stopping Agent Service...")
            process.terminate()
            sys.exit(0)

        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)

        # Wait for the process to complete
        process.wait()

    except Exception as e:
        print(f"❌ Error starting agent service: {e}")

        if "address already in use" in str(e).lower():
            new_port = port + 1
            print(f"⚠️ Port {port} is already in use. Trying port {new_port}...")
            time.sleep(1)
            os.environ["AGENT_PORT"] = str(new_port)
            run_agent_service()
        else:
            print(f"❌ Failed to start agent service: {e}")
            sys.exit(1)

if __name__ == "__main__":
    run_agent_service()
