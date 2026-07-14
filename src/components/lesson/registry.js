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
}
