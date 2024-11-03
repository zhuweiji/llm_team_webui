import logging
import signal
import socket
import subprocess
import sys
import threading
import time
from pathlib import Path
from signal import SIGTERM  # or SIGKILL

from psutil import process_iter

# Global flag to signal all threads to stop
stop_flag = threading.Event()


logging.basicConfig(
    format='%(name)s-%(levelname)s|%(lineno)d:  %(message)s', level=logging.DEBUG)
log = logging.getLogger(__name__)


def kill_process_using_port(port_number: int):
    for proc in process_iter():
        for conns in proc.connections(kind='inet'):
            if conns.laddr.port == port_number:
                try:
                    proc.send_signal(SIGTERM)  # or SIGKILL
                except Exception:
                    pass


def close_ports(port_list):
    log.info(f'Closing ports {port_list}')
    for port in port_list:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)  # Set a timeout for the connection attempt

        try:
            sock.connect(('localhost', port))
            sock.shutdown(socket.SHUT_RDWR)
            kill_process_using_port(port)
            time.sleep(1)
            log.debug(f"Port {port} is open. Sent shutdown signal.")

        except ConnectionRefusedError:
            log.debug(f"Port {port} is not open.")
        except socket.timeout:
            log.debug(f"Probe to {port} timed out.")
        finally:
            sock.close()


def run_command(command, cwd):
    process = subprocess.Popen(
        command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, cwd=cwd)

    while not stop_flag.is_set():
        if not process.stdout or not process.stderr:
            raise Exception
        try:
            stdout_line = process.stdout.readline()
            if stdout_line:
                print(f"[{command}] {stdout_line.strip()}")
            stderr_line = process.stderr.readline()
            if stderr_line:
                print(f"[{command}] ERROR: {stderr_line.strip()}")

            # Check if the process has finished
            if process.poll() is not None:
                break
        except Exception as e:
            print(f"Error reading output from {command}: {e}")
            break

    # Terminate the process if it's still running
    if process.poll() is None:
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()


def signal_handler(signum, frame):
    print("Received termination signal. Stopping all processes...")
    stop_flag.set()


def main():
    package_root = Path(__file__).parent
    close_ports([11251, 11252])

    commands = [
        ("poetry run python -m server", package_root / 'backend'),
        ("npm run dev", package_root / 'frontend'),
    ]

    # Set up signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    threads = []
    for command, cwd in commands:
        thread = threading.Thread(target=run_command, args=(command, cwd))
        thread.start()
        threads.append(thread)

    try:
        for thread in threads:
            thread.join()
    except KeyboardInterrupt:
        print("Keyboard interrupt received. Stopping all processes...")
        stop_flag.set()
    finally:
        stop_flag.set()
        for thread in threads:
            thread.join(timeout=5)
        print("All processes stopped.")


if __name__ == "__main__":
    main()
