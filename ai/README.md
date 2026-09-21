# AI & LLM Engineering Subsystem (`ai/`)

## 1. Subsystem Overview & Ownership
**Owner**: Member 1 — AI / LLM Engineer  
**Folder**: `ai/`  
**Primary Responsibility**: Owns the intelligence layer of the **Multimodal Learning Agent**. Transforms user input and grounded RAG document context into structured, pedagogical learning responses using Azure OpenAI and Pydantic schemas.

---

## 2. Core Architectural Flow

```
[ Student Query + Target Difficulty ]
                 │
                 ▼
[ Grounded RAG Context Chunks (from Member 2 - rag/) ]
                 │
                 ▼
[ Prompt Engineering Templates (ai/prompts/*.txt) ]
                 │
                 ▼
[ AzureOpenAIService (gpt-4o-mini / gpt-4o) ] ── (Supports Mock Mode for \$0 Dev)
                 │
                 ▼
[ Pydantic Structured Output Validation (ai/llm/structured_output.py) ]
                 │
       ┌─────────┼─────────┬─────────┐
       ▼         ▼         ▼         ▼
  EXPLANATION   QUIZ   FLASHCARDS  RECOMMENDATION & ASSESSMENT
```

---

## 3. Subsystem Directory Layout

```
ai/
├── README.md                          # Subsystem documentation & integration guide
├── llm/
│   ├── model_config.py                # Environment config loader for Azure OpenAI
│   ├── azure_openai.py                # Azure OpenAI client wrapper & mock engine
│   └── structured_output.py           # Pydantic v2 schemas & JSON repair utility
├── prompts/
│   ├── system.txt                     # Persona, pedagogical rules & grounding principles
│   ├── tutor.txt                      # Grounded Q&A prompt template
│   ├── explanation.txt                # Deep-dive concept explanation prompt
│   ├── quiz.txt                       # Multiple-choice quiz prompt
│   ├── flashcards.txt                 # Active-recall flashcard prompt
│   └── recommendations.txt            # Quiz performance assessment & study next steps
├── generation/
│   ├── explanation_generator.py       # Grounded explanation generator
│   ├── quiz_generator.py              # Multiple-choice quiz generator
│   ├── flashcard_generator.py         # Active-recall flashcard deck generator
│   └── recommendation_generator.py    # Weak topic detector & study planner
└── evaluation/
    └── llm_evaluation.py              # Faithfulness, grounding & latency benchmark suite
```

---

## 4. Integration Guide for Member 5 (Backend APIs)

To plug Member 1's intelligence layer into FastAPI backend routes (`server/app/api/`), import the generator instances directly:

### 4.1 Concept Explanation Route (`/api/chat/explain`)
```python
from ai.generation.explanation_generator import ExplanationGenerator

generator = ExplanationGenerator()
explanation = generator.generate_explanation(
    query="Explain deadlock conditions",
    context_chunks=retrieved_chunks,  # List of dicts from rag/
    difficulty="Intermediate",
)
return explanation.model_dump()
```

### 4.2 Quiz Generation Route (`/api/quiz/generate`)
```python
from ai.generation.quiz_generator import QuizGenerator

generator = QuizGenerator()
quiz = generator.generate_quiz(
    topic="Operating Systems",
    context_chunks=retrieved_chunks,
    num_questions=5,
    difficulty="Medium",
)
return quiz.model_dump()
```

### 4.3 Flashcards Generation Route (`/api/flashcards/generate`)
```python
from ai.generation.flashcard_generator import FlashcardGenerator

generator = FlashcardGenerator()
deck = generator.generate_flashcards(
    topic="Deadlocks",
    context_chunks=retrieved_chunks,
    num_cards=5,
)
return deck.model_dump()
```

### 4.4 Assessment & Weak Topic Recommendation (`/api/quiz/submit`)
```python
from ai.generation.recommendation_generator import RecommendationGenerator

generator = RecommendationGenerator()
recommendations = generator.evaluate_quiz_submission(
    quiz=quiz_pydantic_instance,
    user_answers={1: "A", 2: "C", 3: "B"},
)
return recommendations.model_dump()
```

---

## 5. Zero-Cost Student Safeguards & Testing

- **Mock Mode**: Set `force_mock=True` or omit Azure keys to run 100% offline without consuming Azure credits.
- **Run Unit Tests**:
  ```bash
  .venv/bin/python -m unittest tests/test_ai_subsystem.py -v
  ```
- **Run Interactive CLI Demo**:
  ```bash
  .venv/bin/python scripts/demo_ai_generators.py --mode mock
  ```
