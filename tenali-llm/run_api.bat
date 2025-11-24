@echo off
echo Starting Tenali LLM API Server...
echo Model: Qwen 2.5 1.5B (Instruction Tuned)
echo Device: GPU (4-bit Quantization)

python deployment/api.py

pause
