"""
Continued Pre-training on LLaMA 3.1 with Financial Data
Hybrid approach: Start with pre-trained model, continue training on financial corpus
"""

import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling,
)
from datasets import load_from_disk
import wandb
from pathlib import Path

class TenaliContinuedTrainer:
    def __init__(
        self,
        base_model="meta-llama/Meta-Llama-3.1-70B",
        data_path="./training_data/train",
        output_dir="./checkpoints/continued",
    ):
        self.base_model = base_model
        self.data_path = data_path
        self.output_dir = output_dir
        
        # Initialize Weights & Biases
        wandb.init(project="tenali-llm", name="continued-pretraining")
        
    def load_model_and_tokenizer(self):
        """Load base model and tokenizer"""
        print(f"Loading {self.base_model}...")
        
        self.tokenizer = AutoTokenizer.from_pretrained(self.base_model)
        self.tokenizer.pad_token = self.tokenizer.eos_token
        
        self.model = AutoModelForCausalLM.from_pretrained(
            self.base_model,
            torch_dtype=torch.bfloat16,
            device_map="auto",
            use_cache=False,  # Required for gradient checkpointing
        )
        
        # Enable gradient checkpointing for memory efficiency
        self.model.gradient_checkpointing_enable()
        
        print(f"Model loaded: {self.model.num_parameters() / 1e9:.1f}B parameters")
        
    def load_dataset(self):
        """Load prepared training dataset"""
        print(f"Loading dataset from {self.data_path}...")
        
        self.train_dataset = load_from_disk(self.data_path)
        self.val_dataset = load_from_disk(self.data_path.replace('train', 'validation'))
        
        # Tokenize
        def tokenize_function(examples):
            # Combine system + instruction + output
            texts = [
                f"{ex['system']}\n\nUser: {ex['instruction']}\n\nAssistant: {ex['output']}"
                for ex in zip(
                    examples['system'],
                    examples['instruction'],
                    examples['output']
                )
            ]
            
            return self.tokenizer(
                texts,
                truncation=True,
                max_length=2048,
                padding=False,
            )
        
        self.train_dataset = self.train_dataset.map(
            tokenize_function,
            batched=True,
            remove_columns=self.train_dataset.column_names,
        )
        
        self.val_dataset = self.val_dataset.map(
            tokenize_function,
            batched=True,
            remove_columns=self.val_dataset.column_names,
        )
        
        print(f"Train: {len(self.train_dataset)} examples")
        print(f"Validation: {len(self.val_dataset)} examples")
        
    def train(self):
        """Run continued pre-training"""
        print("Starting continued pre-training...")
        
        # Training arguments
        training_args = TrainingArguments(
            output_dir=self.output_dir,
            num_train_epochs=1,  # 1 epoch through 100B tokens
            per_device_train_batch_size=1,
            per_device_eval_batch_size=1,
            gradient_accumulation_steps=16,  # Effective batch size = 16
            learning_rate=1e-5,  # Lower than from-scratch
            weight_decay=0.01,
            warmup_steps=1000,
            logging_steps=10,
            save_steps=1000,
            eval_steps=1000,
            save_total_limit=3,
            bf16=True,
            gradient_checkpointing=True,
            dataloader_num_workers=4,
            report_to="wandb",
            load_best_model_at_end=True,
            metric_for_best_model="eval_loss",
        )
        
        # Data collator
        data_collator = DataCollatorForLanguageModeling(
            tokenizer=self.tokenizer,
            mlm=False,  # Causal LM, not masked LM
        )
        
        # Trainer
        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=self.train_dataset,
            eval_dataset=self.val_dataset,
            data_collator=data_collator,
        )
        
        # Train
        trainer.train()
        
        # Save final model
        final_dir = f"{self.output_dir}/final"
        trainer.save_model(final_dir)
        self.tokenizer.save_pretrained(final_dir)
        
        print(f"Training complete! Model saved to {final_dir}")

if __name__ == "__main__":
    # Initialize trainer
    trainer = TenaliContinuedTrainer(
        base_model="Qwen/Qwen2.5-1.5B-Instruct",
        data_path="./training_data/train",
        output_dir="./checkpoints/continued",
    )
    
    # Load model and data
    trainer.load_model_and_tokenizer()
    trainer.load_dataset()
    
    # Train
    trainer.train()
    
    print("Continued pre-training complete!")
    print("Next step: Instruction fine-tuning with train_instruction.py")
