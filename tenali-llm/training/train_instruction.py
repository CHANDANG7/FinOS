"""
Instruction Fine-tuning for Tenali Persona
Teaches the model your custom response format and financial expertise
"""

import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
)
from datasets import load_from_disk
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
import wandb
from dotenv import load_dotenv
import os

# Load environment variables (HF_TOKEN, etc.)
load_dotenv()
# Also try loading from parent dirs if needed
from pathlib import Path
env_path = Path('../finos-app/.env.local')
if env_path.exists():
    load_dotenv(env_path)

class TenaliInstructionTrainer:
    def __init__(
        self,
        base_model="./checkpoints/continued/final",
        data_path="./training_data/train",
        output_dir="./checkpoints/instruction",
    ):
        self.base_model = base_model
        self.data_path = data_path
        self.output_dir = output_dir
        
        # Disable W&B online requirement to reduce friction
        if not os.getenv("WANDB_API_KEY"):
            os.environ["WANDB_MODE"] = "offline"
            
        wandb.init(project="tenali-llm", name="instruction-finetuning")
        
    def load_model_with_lora(self):
        """Load model and apply LoRA for efficient fine-tuning"""
        import os
        
        # Check if local checkpoint exists
        if os.path.exists(self.base_model):
            print(f"Loading local checkpoint from {self.base_model}...")
            model_id = self.base_model
        else:
            print(f"Local checkpoint not found at {self.base_model}")
            print("Falling back to base model: Qwen/Qwen2.5-1.5B-Instruct")
            model_id = "Qwen/Qwen2.5-1.5B-Instruct"
            
        # Configure 4-bit quantization
        from transformers import BitsAndBytesConfig
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.bfloat16,
            bnb_4bit_use_double_quant=True,
        )

        try:
            self.tokenizer = AutoTokenizer.from_pretrained(model_id)
            self.tokenizer.pad_token = self.tokenizer.eos_token
            
            self.model = AutoModelForCausalLM.from_pretrained(
                model_id,
                quantization_config=bnb_config,
                device_map={"": 0},
            )
        except OSError as e:
            if "gated repo" in str(e) or "401" in str(e):
                print("\n" + "="*60)
                print("❌ AUTHENTICATION ERROR: GATED MODEL ACCESS DENIED")
                print("="*60)
                print(f"The model '{model_id}' is a gated repository.")
                print("You must accept the license terms on Hugging Face:")
                print(f"🔗 https://huggingface.co/{model_id}")
                print("\nAND ensure you have set HF_TOKEN in your .env file.")
                print("Get your token here: https://huggingface.co/settings/tokens")
                print("="*60 + "\n")
                raise e
            else:
                raise e
        
        # Enable gradients for input embeddings (required for gradient checkpointing)
        self.model.enable_input_require_grads()
        
        # Prepare for k-bit training
        self.model = prepare_model_for_kbit_training(self.model)
        
        # LoRA configuration
        lora_config = LoraConfig(
            r=16,  # Rank
            lora_alpha=32,
            target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],
            lora_dropout=0.05,
            bias="none",
            task_type="CAUSAL_LM",
        )
        
        self.model = get_peft_model(self.model, lora_config)
        self.model.print_trainable_parameters()
        
    def load_dataset(self):
        """Load instruction dataset"""
        print(f"Loading dataset from {self.data_path}...")
        
        from pathlib import Path
        val_path = str(Path(self.data_path).parent / "validation")
        
        self.train_dataset = load_from_disk(self.data_path)
        self.val_dataset = load_from_disk(val_path)
        
        # Tokenize dataset
        def tokenize_function(examples):
            # Combine system + instruction + output
            texts = [
                f"{sys}\n\nUser: {inst}\n\nAssistant: {out}"
                for sys, inst, out in zip(
                    examples['system'],
                    examples['instruction'],
                    examples['output']
                )
            ]
            
            tokenized = self.tokenizer(
                texts,
                truncation=True,
                max_length=1024,  # Reduced from 2048 to save memory
                padding="max_length",
            )
            tokenized["labels"] = tokenized["input_ids"].copy()
            return tokenized
            
        print("Tokenizing dataset...")
        self.train_dataset = self.train_dataset.map(tokenize_function, batched=True)
        self.val_dataset = self.val_dataset.map(tokenize_function, batched=True)
        
        print(f"Train: {len(self.train_dataset)} examples")
        print(f"Validation: {len(self.val_dataset)} examples")
        
    def train(self):
        """Run instruction fine-tuning"""
        print("Starting instruction fine-tuning...")
        
        # Clear cache before training
        torch.cuda.empty_cache()
        
        training_args = TrainingArguments(
            output_dir=self.output_dir,
            num_train_epochs=3,
            per_device_train_batch_size=1,
            per_device_eval_batch_size=1,
            gradient_accumulation_steps=16,
            learning_rate=2e-4,
            weight_decay=0.01,
            warmup_steps=100,
            logging_steps=10,
            save_strategy="steps",
            save_steps=500,
            eval_strategy="steps",
            eval_steps=500,
            save_total_limit=3,
            bf16=True,
            gradient_checkpointing=True,
            report_to="wandb",
            load_best_model_at_end=True,
            optim="paged_adamw_8bit",  # Use paged optimizer to save VRAM
        )
        
        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=self.train_dataset,
            eval_dataset=self.val_dataset,
        )
        
        trainer.train()
        
        # Save final model
        final_dir = f"{self.output_dir}/final"
        trainer.save_model(final_dir)
        self.tokenizer.save_pretrained(final_dir)
        
        print(f"Training complete! Model saved to {final_dir}")

if __name__ == "__main__":
    trainer = TenaliInstructionTrainer()
    trainer.load_model_with_lora()
    trainer.load_dataset()
    trainer.train()
    
    print("Instruction fine-tuning complete!")
    print("Tenali is ready for deployment!")
