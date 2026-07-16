// Maps content-data ids → interactive components.
// Lesson data stays serializable; components register here.
import DiagramGenAI from './diagrams/DiagramGenAI'
import DiagramNextToken from './diagrams/DiagramNextToken'
import DiagramStack from './diagrams/DiagramStack'
import DiagramContextWindow from './diagrams/DiagramContextWindow'
import DiagramHallucination from './diagrams/DiagramHallucination'
import DiagramTraining from './diagrams/DiagramTraining'
import DiagramOpenClosed from './diagrams/DiagramOpenClosed'
import DemoPossibilities from './demos/DemoPossibilities'
import DemoNextToken from './demos/DemoNextToken'
import DemoLandscape from './demos/DemoLandscape'
import DemoTokenizer from './demos/DemoTokenizer'
import DemoHallucinationGame from './demos/DemoHallucinationGame'
import DemoRLHF from './demos/DemoRLHF'
import DemoModelPicker from './demos/DemoModelPicker'
import DiagramRequestAnatomy from './diagrams/DiagramRequestAnatomy'
import DiagramMessagesLoop from './diagrams/DiagramMessagesLoop'
import DiagramPromptSandwich from './diagrams/DiagramPromptSandwich'
import DiagramStreaming from './diagrams/DiagramStreaming'
import DiagramStructuredLoop from './diagrams/DiagramStructuredLoop'
import DiagramBackoff from './diagrams/DiagramBackoff'
import DiagramChatArch from './diagrams/DiagramChatArch'
import DemoMessageBuilder from './demos/DemoMessageBuilder'
import DemoSystemPrompt from './demos/DemoSystemPrompt'
import DemoStreaming from './demos/DemoStreaming'
import DemoSampling from './demos/DemoSampling'
import DemoStructured from './demos/DemoStructured'
import DemoVision from './demos/DemoVision'
import DemoBackoff from './demos/DemoBackoff'
import DiagramPromptAnatomy from './diagrams/DiagramPromptAnatomy'
import DiagramFewShot from './diagrams/DiagramFewShot'
import DiagramCoT from './diagrams/DiagramCoT'
import DiagramFormatControl from './diagrams/DiagramFormatControl'
import DiagramTemplate from './diagrams/DiagramTemplate'
import DiagramInjection from './diagrams/DiagramInjection'
import DiagramPromptEval from './diagrams/DiagramPromptEval'
import DemoPromptBuilder from './demos/DemoPromptBuilder'
import DemoFewShot from './demos/DemoFewShot'
import DemoCoT from './demos/DemoCoT'
import DemoInjectionSandbox from './demos/DemoInjectionSandbox'
import DemoPromptAB from './demos/DemoPromptAB'
// Module 4: Python for JS devs
import DiagramJSPyMap from './diagrams/DiagramJSPyMap'
import DiagramNpmPip from './diagrams/DiagramNpmPip'
import DiagramPyAsync from './diagrams/DiagramPyAsync'
import DemoJSPyTranslator from './demos/DemoJSPyTranslator'
import DemoComprehension from './demos/DemoComprehension'
import DemoPyDataStructures from './demos/DemoPyDataStructures'
// Module 5: Inside the Transformer
import DiagramWordVector from './diagrams/DiagramWordVector'
import DiagramTransformerArch from './diagrams/DiagramTransformerArch'
import DiagramKVCache from './diagrams/DiagramKVCache'
import DiagramScaling from './diagrams/DiagramScaling'
import DemoEmbeddingMap from './demos/DemoEmbeddingMap'
import DemoAttentionViz from './demos/DemoAttentionViz'
import DemoBPEBuilder from './demos/DemoBPEBuilder'
import DemoSamplingRace from './demos/DemoSamplingRace'
import DemoTransformerTour from './demos/DemoTransformerTour'
// Module 6: Embeddings & Semantic Search
import DiagramEmbedPipeline from './diagrams/DiagramEmbedPipeline'
import DiagramVectorIndex from './diagrams/DiagramVectorIndex'
import DemoVectorSearch from './demos/DemoVectorSearch'
import DemoChunkingLab from './demos/DemoChunkingLab'
import DemoCosineSim from './demos/DemoCosineSim'
import DemoHybridSearch from './demos/DemoHybridSearch'
// Module 7: RAG
import DiagramRAGArch from './diagrams/DiagramRAGArch'
import DiagramRAGDecision from './diagrams/DiagramRAGDecision'
import DiagramAdvancedRAG from './diagrams/DiagramAdvancedRAG'
import DiagramProductionRAG from './diagrams/DiagramProductionRAG'
import DemoRAGPipeline from './demos/DemoRAGPipeline'
import DemoRAGPlayground from './demos/DemoRAGPlayground'
import DemoRetrievalEval from './demos/DemoRetrievalEval'
import DemoCitations from './demos/DemoCitations'

export const DIAGRAMS = {
  'genai-vs-traditional': DiagramGenAI,
  'next-token-loop': DiagramNextToken,
  'genai-stack': DiagramStack,
  'context-window': DiagramContextWindow,
  'hallucination-branch': DiagramHallucination,
  'training-pipeline': DiagramTraining,
  'open-vs-closed': DiagramOpenClosed,
  'request-anatomy': DiagramRequestAnatomy,
  'messages-loop': DiagramMessagesLoop,
  'prompt-sandwich': DiagramPromptSandwich,
  'streaming-timeline': DiagramStreaming,
  'structured-loop': DiagramStructuredLoop,
  'backoff-timeline': DiagramBackoff,
  'chat-architecture': DiagramChatArch,
  'prompt-anatomy': DiagramPromptAnatomy,
  'few-shot': DiagramFewShot,
  'chain-of-thought': DiagramCoT,
  'format-control': DiagramFormatControl,
  'prompt-template': DiagramTemplate,
  'injection-attack': DiagramInjection,
  'prompt-eval': DiagramPromptEval,
  'js-py-map': DiagramJSPyMap,
  'npm-pip-map': DiagramNpmPip,
  'py-async-model': DiagramPyAsync,
  'word-to-vector': DiagramWordVector,
  'transformer-arch': DiagramTransformerArch,
  'kv-cache': DiagramKVCache,
  'scaling-curve': DiagramScaling,
  'embed-pipeline': DiagramEmbedPipeline,
  'vector-index': DiagramVectorIndex,
  'rag-architecture': DiagramRAGArch,
  'rag-decision': DiagramRAGDecision,
  'advanced-rag': DiagramAdvancedRAG,
  'production-rag': DiagramProductionRAG,
}

export const DEMOS = {
  'prompt-possibilities': DemoPossibilities,
  'next-token': DemoNextToken,
  'model-landscape': DemoLandscape,
  'tokenizer': DemoTokenizer,
  'hallucination-game': DemoHallucinationGame,
  'rlhf-ranker': DemoRLHF,
  'model-picker': DemoModelPicker,
  'message-builder': DemoMessageBuilder,
  'system-prompt-split': DemoSystemPrompt,
  'streaming-race': DemoStreaming,
  'sampling-lab': DemoSampling,
  'structured-retry': DemoStructured,
  'vision-payload': DemoVision,
  'backoff-sim': DemoBackoff,
  'prompt-builder': DemoPromptBuilder,
  'few-shot-classifier': DemoFewShot,
  'cot-reveal': DemoCoT,
  'injection-sandbox': DemoInjectionSandbox,
  'prompt-ab': DemoPromptAB,
  'js-py-translator': DemoJSPyTranslator,
  'comprehension-builder': DemoComprehension,
  'py-data-structures': DemoPyDataStructures,
  'embedding-map': DemoEmbeddingMap,
  'attention-viz': DemoAttentionViz,
  'bpe-builder': DemoBPEBuilder,
  'sampling-race': DemoSamplingRace,
  'transformer-tour': DemoTransformerTour,
  'vector-search-viz': DemoVectorSearch,
  'chunking-lab': DemoChunkingLab,
  'cosine-playground': DemoCosineSim,
  'hybrid-search': DemoHybridSearch,
  'rag-pipeline-sim': DemoRAGPipeline,
  'rag-playground': DemoRAGPlayground,
  'retrieval-eval': DemoRetrievalEval,
  'citation-grounding': DemoCitations,
}
