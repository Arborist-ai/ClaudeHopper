/**
 * AI Model Configuration
 * 
 * This file defines the models used for various tasks in the application.
 * Models are organized by task type and include options for different 
 * performance/resource requirements.
 */

// Model configuration interface
export interface ModelConfig {
  name: string;         // Model name/identifier for the provider
  provider: string;     // Model provider (ollama, openai, etc.)
  description: string;  // Human-readable description
  contextSize: number;  // Approximate context window size
  resourceLevel: 'low' | 'medium' | 'high'; // Computational requirements
}

// Model categories
export enum ModelTaskType {
  EMBEDDING = 'embedding',
  SUMMARIZATION = 'summarization',
  METADATA_EXTRACTION = 'metadata_extraction',
  IMAGE_EMBEDDING = 'image_embedding',
  SECTION_DETECTION = 'section_detection'
}

// Model registry with options for each task
export const modelRegistry: Record<ModelTaskType, Record<string, ModelConfig>> = {
  [ModelTaskType.EMBEDDING]: {
    'snowflake-arctic-embed2': {
      name: 'snowflake-arctic-embed2',
      provider: 'ollama',
      description: 'Fast, lightweight embedding model with decent semantic understanding',
      contextSize: 8192,
      resourceLevel: 'low'
    },
    'nomic-embed-text': {
      name: 'nomic-embed-text',
      provider: 'ollama',
      description: 'Better for technical content, with a longer context window',
      contextSize: 8192,
      resourceLevel: 'medium'
    },
    'all-MiniLM-L6-v2': {
      name: 'all-MiniLM-L6-v2',
      provider: 'ollama',
      description: 'Strong performance for semantic similarity, widely used',
      contextSize: 4096,
      resourceLevel: 'low'
    },
    'bge-large-en-v1.5': {
      name: 'bge-large-en-v1.5',
      provider: 'ollama',
      description: 'High-quality embeddings with good technical understanding',
      contextSize: 4096,
      resourceLevel: 'medium'
    }
  },
  
  [ModelTaskType.SUMMARIZATION]: {
    'llama3.1:8b': {
      name: 'llama3.1:8b',
      provider: 'ollama',
      description: 'Lightweight, fast summarization with decent comprehension',
      contextSize: 8192,
      resourceLevel: 'low'
    },
    'phi-3-medium': {
      name: 'phi-3-medium',
      provider: 'ollama',
      description: 'Good balance of performance and resource usage for summarization',
      contextSize: 8192,
      resourceLevel: 'medium'
    },
    'phi-3-mini': {
      name: 'phi-3-mini',
      provider: 'ollama',
      description: 'Efficient model that runs well on consumer hardware',
      contextSize: 4096,
      resourceLevel: 'low'
    },
    'phi4': {
      name: 'phi4',
      provider: 'ollama',
      description: 'Microsoft\'s latest Phi model with improved reasoning and comprehension',
      contextSize: 8192,
      resourceLevel: 'medium'
    },
    'llama3.1:70b': {
      name: 'llama3.1:70b',
      provider: 'ollama',
      description: 'Comprehensive understanding, high quality summarization (requires powerful hardware)',
      contextSize: 8192,
      resourceLevel: 'high'
    },
    'mistral-large': {
      name: 'mistral-large',
      provider: 'ollama',
      description: 'Excellent technical content summarization with good context understanding',
      contextSize: 8192,
      resourceLevel: 'high'
    }
  },
  
  [ModelTaskType.METADATA_EXTRACTION]: {
    'llama3.1:8b': {
      name: 'llama3.1:8b',
      provider: 'ollama',
      description: 'Basic metadata extraction capabilities',
      contextSize: 8192,
      resourceLevel: 'low'
    },
    'phi-3-mini': {
      name: 'phi-3-mini',
      provider: 'ollama',
      description: 'Efficient model for metadata extraction',
      contextSize: 4096,
      resourceLevel: 'low'
    },
    'phi-3-medium': {
      name: 'phi-3-medium',
      provider: 'ollama',
      description: 'Improved metadata extraction with good accuracy',
      contextSize: 8192,
      resourceLevel: 'medium'
    },
    'phi4': {
      name: 'phi4',
      provider: 'ollama',
      description: 'High-quality metadata extraction with strong reasoning capabilities',
      contextSize: 8192,
      resourceLevel: 'medium'
    }
  },
  
  [ModelTaskType.IMAGE_EMBEDDING]: {
    'clip': {
      name: 'clip',
      provider: 'ollama',
      description: 'Image embedding model for visual similarity search',
      contextSize: 0, // Not applicable for image models
      resourceLevel: 'medium'
    },
    'llava:13b': {
      name: 'llava:13b',
      provider: 'ollama',
      description: 'Multimodal model for understanding images and text together',
      contextSize: 0,
      resourceLevel: 'high'
    }
  },
  
  [ModelTaskType.SECTION_DETECTION]: {
    'llama3.1:8b': {
      name: 'llama3.1:8b',
      provider: 'ollama',
      description: 'Basic document structure analysis',
      contextSize: 8192,
      resourceLevel: 'low'
    },
    'phi-3-mini': {
      name: 'phi-3-mini',
      provider: 'ollama',
      description: 'Efficient model for document section detection',
      contextSize: 4096,
      resourceLevel: 'low'
    },
    'phi4': {
      name: 'phi4',
      provider: 'ollama',
      description: 'Advanced document structure analysis with better reasoning',
      contextSize: 8192,
      resourceLevel: 'medium'
    }
  }
};

// Default model selections based on your requirements
export const defaultModels = {
  [ModelTaskType.EMBEDDING]: 'nomic-embed-text',
  [ModelTaskType.SUMMARIZATION]: 'phi4',
  [ModelTaskType.METADATA_EXTRACTION]: 'phi4',
  [ModelTaskType.IMAGE_EMBEDDING]: 'clip',
  [ModelTaskType.SECTION_DETECTION]: 'phi4'
};

/**
 * Get the configuration for a specific model
 * 
 * @param taskType The type of task the model is used for
 * @param modelName Optional specific model name (defaults to the default for that task)
 * @returns Model configuration
 */
export function getModelConfig(taskType: ModelTaskType, modelName?: string): ModelConfig {
  const selectedModelName = modelName || defaultModels[taskType];
  const taskModels = modelRegistry[taskType];
  
  if (!taskModels[selectedModelName]) {
    // Fall back to default if the requested model isn't available
    console.warn(`Model ${selectedModelName} not found for task ${taskType}. Using default.`);
    return taskModels[defaultModels[taskType]];
  }
  
  return taskModels[selectedModelName];
}

/**
 * Get all available models for a specific task
 * 
 * @param taskType The type of task
 * @returns Array of model configurations
 */
export function getAvailableModels(taskType: ModelTaskType): ModelConfig[] {
  return Object.values(modelRegistry[taskType]);
}
