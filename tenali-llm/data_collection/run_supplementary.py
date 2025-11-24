"""
Run All Supplementary Data Collection Scripts
---------------------------------------------
Runs the following collectors in sequence:
1. Economic Data (Macro, Central Banks)
2. Crypto Data (Prices, On-chain)
3. Technical Patterns (SMC, Indicators)
4. News & Filings (SEC, Financial News)

Usage:
    python data_collection/run_supplementary.py
"""

import os
import subprocess
import sys
from dotenv import load_dotenv

def run_script(script_name):
    print(f"\n{'='*50}")
    print(f"Running {script_name}...")
    print(f"{'='*50}\n")
    
    script_path = os.path.join("data_collection", script_name)
    
    try:
        # Run script and stream output
        process = subprocess.Popen(
            [sys.executable, script_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        # Print output in real-time
        for line in process.stdout:
            print(line, end='')
            
        # Wait for completion
        return_code = process.wait()
        
        if return_code != 0:
            print(f"\n❌ {script_name} failed with exit code {return_code}")
            print("Error output:")
            print(process.stderr.read())
        else:
            print(f"\n✅ {script_name} completed successfully.")
            
    except Exception as e:
        print(f"Error running {script_name}: {e}")

if __name__ == "__main__":
    # Load env vars
    load_dotenv()
    
    print("Starting Supplementary Data Collection...")
    print("Ensure you have set FRED_API_KEY in .env")
    
    scripts = [
        "economic_data.py",
        "crypto_data.py",
        "technical_patterns.py",
        "news_filings.py"
    ]
    
    for script in scripts:
        run_script(script)
    
    print("\n🎉 All supplementary data collection complete!")
