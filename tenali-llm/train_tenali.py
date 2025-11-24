"""
Tenali LLM Training Pipeline Runner
-----------------------------------
Orchestrates the entire training process:
1. Dataset Preparation (JSONL -> HuggingFace Dataset)
2. Continued Pre-training (Optional)
3. Instruction Fine-tuning (LoRA/QLoRA)

Usage:
    python train_tenali.py
"""

import os
import subprocess
import sys
import time

def run_step(step_name, script_path, args=[]):
    print(f"\n{'='*60}")
    print(f"🚀 STARTING: {step_name}")
    print(f"{'='*60}\n")
    
    cmd = [sys.executable, script_path] + args
    
    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        # Stream output
        for line in process.stdout:
            print(line, end='')
            
        return_code = process.wait()
        
        if return_code != 0:
            print(f"\n❌ {step_name} FAILED with exit code {return_code}")
            print("Error output:")
            print(process.stderr.read())
            return False
        else:
            print(f"\n✅ {step_name} COMPLETED successfully.")
            return True
            
    except Exception as e:
        print(f"Error running {step_name}: {e}")
        return False

def main():
    print("🤖 Tenali LLM Training Pipeline")
    print("==============================")
    print("This script will train your custom Tenali model using the collected data.")
    
    # Step 1: Prepare Dataset
    print("\n[Step 1/3] Dataset Preparation")
    if input("Run dataset preparation? (y/n): ").lower() == 'y':
        if not run_step("Dataset Preparation", "training/prepare_dataset.py"):
            return
    else:
        print("Skipping dataset preparation.")

    # Step 2: Continued Pre-training
    print("\n[Step 2/3] Continued Pre-training (Domain Adaptation)")
    print("Note: This step requires significant GPU resources and time.")
    print("It adapts the base LLaMA model to financial text.")
    if input("Run continued pre-training? (y/n): ").lower() == 'y':
        # Use torchrun for distributed training if available, else python
        # For simplicity in this runner, we use python, but in prod use torchrun
        if not run_step("Continued Pre-training", "training/train_continued.py"):
            print("Warning: Pre-training failed. You can try skipping to fine-tuning.")
    else:
        print("Skipping continued pre-training.")

    # Step 3: Instruction Fine-tuning
    print("\n[Step 3/3] Instruction Fine-tuning (Persona Injection)")
    print("This step teaches the model how to behave as Tenali (Analyst/Trader).")
    if input("Run instruction fine-tuning? (y/n): ").lower() == 'y':
        if not run_step("Instruction Fine-tuning", "training/train_instruction.py"):
            return
    else:
        print("Skipping instruction fine-tuning.")
        
    print("\n🎉 Pipeline Execution Finished!")
    print("Check 'checkpoints/' directory for your trained models.")

if __name__ == "__main__":
    main()
