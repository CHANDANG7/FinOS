"""
Dataset Preparation for Tenali LLM Training
Converts collected data into instruction-response format
"""

import json
import os
from pathlib import Path
from datasets import Dataset
from transformers import AutoTokenizer
from tqdm import tqdm

# Your Tenali system prompt
TENALI_SYSTEM_PROMPT = """You are FinOS — an AI trained solely for global finance, markets, economics, and investing.

RESPONSE STRUCTURE:
1) Executive Summary (2-3 lines)
2) Deep Analysis (Macro, Technical, Fundamental, SMC, etc.)
3) Actionable Insights (Educational, NOT advice)
4) Data & Sources
5) Disclaimer: "This analysis is for educational purposes only and not investment advice."

TONE: Professional, clear, concise
- Economics professor (macro clarity)
- Hedge-fund manager (strategy depth)
- Quant analyst (precision)
- Price-action + SMC trader (chart insight)
"""

class DatasetPreparator:
    def __init__(self, data_dir='./data', output_dir='./training_data'):
        self.data_dir = data_dir
        self.output_dir = output_dir
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        
    def load_all_data(self):
        """Load all collected JSONL files"""
        print("Loading collected data...")
        
        all_data = []
        
        # Find all JSONL files
        for root, dirs, files in os.walk(self.data_dir):
            for file in files:
                if file.endswith('.jsonl'):
                    filepath = os.path.join(root, file)
                    print(f"Loading {filepath}...")
                    
                    with open(filepath, 'r') as f:
                        for line in f:
                            try:
                                item = json.loads(line)
                                all_data.append(item)
                            except:
                                continue
        
        print(f"Loaded {len(all_data)} total items")
        return all_data
    
    def create_instruction_dataset(self, data):
        """Convert raw data into instruction-response pairs"""
        print("Creating instruction dataset...")
        
        instruction_data = []
        
        for item in tqdm(data):
            # Extract text content
            text = item.get('text', '')
            
            if not text:
                continue
            
            # Check if already in instruction format (from production pipeline)
            if 'instruction' in item and 'output' in item:
                instruction_data.append(item)
                continue

            # Create instruction based on data type
            if 'symbol' in item:
                instruction = f"Analyze {item['symbol']}"
            elif 'indicator' in item:
                instruction = f"Explain {item['indicator']}"
            elif 'coin_id' in item:
                instruction = f"Analyze {item['coin_id']} cryptocurrency"
            elif 'topic' in item:
                instruction = f"Discuss {item['topic']}"
            else:
                instruction = "Provide financial analysis"
            
            # Create instruction-response pair
            instruction_data.append({
                'instruction': instruction,
                'input': '',
                'output': text,
                'system': TENALI_SYSTEM_PROMPT,
            })
        
        print(f"Created {len(instruction_data)} instruction-response pairs")
        return instruction_data
    
    def save_dataset(self, data, filename='tenali_training_data.jsonl'):
        """Save dataset as JSONL"""
        filepath = os.path.join(self.output_dir, filename)
        
        with open(filepath, 'w') as f:
            for item in data:
                f.write(json.dumps(item) + '\n')
        
        print(f"Saved dataset to {filepath}")
        return filepath
    
    def create_huggingface_dataset(self, data):
        """Convert to HuggingFace Dataset format"""
        print("Creating HuggingFace dataset...")
        
        # Split into train/validation
        split_idx = int(len(data) * 0.95)
        train_data = data[:split_idx]
        val_data = data[split_idx:]
        
        train_dataset = Dataset.from_list(train_data)
        val_dataset = Dataset.from_list(val_data)
        
        # Save
        train_dataset.save_to_disk(f"{self.output_dir}/train")
        val_dataset.save_to_disk(f"{self.output_dir}/validation")
        
        print(f"Train: {len(train_dataset)} examples")
        print(f"Validation: {len(val_dataset)} examples")
        
        return train_dataset, val_dataset

if __name__ == "__main__":
    preparator = DatasetPreparator()
    
    # Load all collected data
    raw_data = preparator.load_all_data()
    
    # Create instruction dataset
    instruction_data = preparator.create_instruction_dataset(raw_data)
    
    # Save as JSONL
    preparator.save_dataset(instruction_data)
    
    # Create HuggingFace datasets
    train_ds, val_ds = preparator.create_huggingface_dataset(instruction_data)
    
    print("Dataset preparation complete!")
    print(f"Ready for training with {len(instruction_data)} examples")
