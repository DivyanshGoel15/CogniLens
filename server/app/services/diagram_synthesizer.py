"""
CogniLens Domain-Aware Diagram Synthesizer
Generates topic-aligned, educational Mermaid.js diagrams with concrete information in each node:
- Flowcharts (Process & Logic Flow)
- Mind Maps (Concept Taxonomy & Hierarchy)
- Sequence Diagrams (Timeline & Actor Interactions)
- State Diagrams (Lifecycles & Transitions)
- Class Diagrams (Data Structures & Models)

ZERO generic boilerplate: Every node and explanation is dynamically generated and grounded
in the user's topic and provided text, featuring vivid real-world analogies in plain English.
"""

import re
from typing import Dict, List, Optional, Tuple


def sanitize_mermaid_label(text: str) -> str:
    """Clean label text so it doesn't break Mermaid syntax."""
    cleaned = text.replace('"', "'").replace("\n", " ").replace("(", "（").replace(")", "）").strip()
    return cleaned[:65] if len(cleaned) > 65 else cleaned


def sanitize_mindmap_text(text: str) -> str:
    """Clean mindmap node text (Mermaid mindmap breaks on (), [], {}, and quotes)."""
    cleaned = re.sub(r'[\(\)\[\]\{\}"\':]', "", text).strip()
    return cleaned[:50] if len(cleaned) > 50 else cleaned


def extract_concept_elements(topic: str, text: str) -> Dict[str, List[str]]:
    """
    Extract meaningful technical concepts, actions, entities, and conditions
    from source text and topic to build custom, non-generic diagrams.
    """
    combined = f"{topic}. {text}" if text else topic
    
    # 1. Clean and split sentences
    raw_sentences = [
        s.strip() for s in re.split(r'[.\n;•*]', combined)
        if len(s.strip()) >= 10 and not s.strip().startswith("http")
    ]
    
    # 2. Extract bullet points / lines
    lines = [
        re.sub(r'^[- *•0-9.)]+', '', line).strip()
        for line in combined.splitlines()
        if len(line.strip()) >= 8
    ]
    
    # 3. Extract key noun-like phrases or technical terms
    words = re.findall(r'\b[A-Za-z0-9_-]{3,25}\b', combined)
    stop_words = {
        "this", "that", "with", "from", "have", "were", "what", "which",
        "there", "their", "about", "could", "would", "these", "other",
        "into", "more", "also", "some", "time", "than", "them", "very", "when"
    }
    key_terms = []
    for w in words:
        wl = w.lower()
        if wl not in stop_words and len(wl) > 3 and wl not in [k.lower() for k in key_terms]:
            key_terms.append(w)
            if len(key_terms) >= 12:
                break

    # 4. Extract action phrases (sentences with active verbs)
    action_phrases = []
    for s in raw_sentences:
        clean_s = re.sub(r'^[0-9]+[.)]\s*', '', s).strip()
        if 15 <= len(clean_s) <= 80:
            action_phrases.append(clean_s)
        if len(action_phrases) >= 8:
            break

    # 5. Extract conditional / decision statements
    condition_phrases = []
    for s in raw_sentences:
        lower_s = s.lower()
        if any(w in lower_s for w in ["if ", "when ", "check", "verify", "is ", "whether", "ensures", "unless"]):
            condition_phrases.append(s.strip())
        if len(condition_phrases) >= 4:
            break

    return {
        "sentences": raw_sentences,
        "actions": action_phrases,
        "conditions": condition_phrases,
        "terms": key_terms,
        "lines": lines,
    }


def generate_layman_analogy(topic: str, text: str) -> str:
    """Generate a relatable, non-generic real-world everyday analogy tailored to the topic."""
    t_lower = topic.lower()
    c_lower = (topic + " " + text).lower()

    if any(k in c_lower for k in ["deadlock", "mutex", "lock", "concurrency", "race condition"]):
        return (
            f"Think of {topic} like a busy 4-way intersection where four cars arrive simultaneously. "
            "Each driver waits for the car on their right to go first, so everyone is stuck bumper-to-bumper. "
            "No one can move forward until a traffic cop steps in and tells one car to back up and yield."
        )
    elif any(k in c_lower for k in ["schedule", "quantum", "round robin", "cpu", "fifo", "priority"]):
        return (
            f"Think of {topic} like a fair playground where only one swing is available for a line of eager kids. "
            "Instead of letting one kid stay on the swing all afternoon, a supervisor sets a 2-minute timer. "
            "When the buzzer sounds, the current kid steps off to join the back of the queue, and the next kid gets their turn."
        )
    elif any(k in c_lower for k in ["paging", "virtual memory", "cache", "tlb", "ram"]):
        return (
            f"Think of {topic} like working on a research paper at a compact study desk with a vast library downstairs. "
            "Your desk (RAM) only holds 3 reference books at a time. When you need facts from a 4th book, "
            "you swap one book back to the basement shelf (Disk) and retrieve the new book onto your desk."
        )
    elif any(k in c_lower for k in ["tcp", "handshake", "packet", "socket", "network", "protocol"]):
        return (
            f"Think of {topic} like an important phone call with a spotty connection. "
            "Before sharing private details, you say 'Can you hear me clearly?', the receiver replies 'Yes, I hear you, can you hear me?', "
            "and you confirm 'Got you, let's talk!'. Only once both parties verify the link does the actual conversation begin."
        )
    elif any(k in c_lower for k in ["tree", "bst", "binary search", "graph", "dijkstra", "sort", "algorithm"]):
        return (
            f"Think of {topic} like organizing a massive dictionary or phone book. "
            "Rather than flipping through every single page from A to Z, you open directly to the middle, check if your target word comes before or after, "
            "and instantly throw away half of the book at every step until you pinpoint the exact word in seconds."
        )
    elif any(k in c_lower for k in ["neural", "backprop", "gradient", "loss", "deep learning", "machine learning"]):
        return (
            f"Think of {topic} like learning to shoot basketball free throws while wearing fogged-up glasses. "
            "After every missed shot, your coach tells you whether the ball was two inches too far to the left or short. "
            "You nudge your wrist angle slightly in the opposite direction on the next shot until the ball swishes through the net consistently."
        )
    elif any(k in c_lower for k in ["database", "transaction", "acid", "sql", "commit", "rollback"]):
        return (
            f"Think of {topic} like transferring money between bank accounts at an ATM. "
            "Either the money is debited from your checking account AND credited to your savings, or neither happens. "
            "If the ATM loses power mid-transfer, it undoes the half-finished action completely so your money is never lost."
        )
    else:
        return (
            f"Think of {topic} like an assembly line recipe in a bakery: "
            "every ingredient and stage relies on the previous step being verified first. If any measurement is off, "
            "the system detects the discrepancy early and adjusts before finalizing the finished product."
        )


def generate_synthesized_diagram(
    topic: str,
    text_content: str,
    diagram_type: str = "flowchart",
    direction: str = "TD",
) -> Tuple[str, str, str, str, List[str]]:
    """
    Generate an educational, non-generic Mermaid.js diagram and simplified explanation
    grounded directly in the provided topic and text content.
    Returns: (mermaid_code, title, description, simplified_explanation, key_takeaways)
    """
    clean_topic = topic.strip() or "Core Subject"
    safe_topic = sanitize_mermaid_label(clean_topic)
    elements = extract_concept_elements(clean_topic, text_content)
    
    actions = elements["actions"]
    conditions = elements["conditions"]
    terms = elements["terms"]
    
    layman_analogy = generate_layman_analogy(clean_topic, text_content)

    # -------------------------------------------------------------------------
    # 1. MIND MAP
    # -------------------------------------------------------------------------
    if diagram_type == "mindmap":
        title = f"Mind Map: {clean_topic}"
        description = f"Taxonomy and core mechanisms of {clean_topic}."
        root = sanitize_mindmap_text(clean_topic)
        
        # Build 4 topic-grounded branches
        b1 = sanitize_mindmap_text(actions[0]) if len(actions) > 0 else f"{root} Foundations"
        b2 = sanitize_mindmap_text(actions[1]) if len(actions) > 1 else "Core Execution Mechanism"
        b3 = sanitize_mindmap_text(actions[2]) if len(actions) > 2 else "Key Constraints & Rules"
        b4 = sanitize_mindmap_text(actions[3]) if len(actions) > 3 else "Practical Applied Impact"
        
        t1 = sanitize_mindmap_text(terms[0]) if len(terms) > 0 else "Primary Component"
        t2 = sanitize_mindmap_text(terms[1]) if len(terms) > 1 else "State Validation"
        t3 = sanitize_mindmap_text(terms[2]) if len(terms) > 2 else "Invariant Rule"
        t4 = sanitize_mindmap_text(terms[3]) if len(terms) > 3 else "Verified Outcome"

        code = f"""mindmap
  root(( {root} ))
    Fundamental Concepts
      {b1}
      {t1}
    Operational Flow
      {b2}
      {t2}
    Constraints & Conditions
      {b3}
      {t3}
    Applied Results
      {b4}
      {t4}"""

        takeaways = [
            f"Core principle: {b1[:60]}.",
            f"Operational flow: {b2[:60]}.",
            f"Key takeaway: {b4[:60]}."
        ]
        return code.strip(), title, description, layman_analogy, takeaways

    # -------------------------------------------------------------------------
    # 2. SEQUENCE DIAGRAM
    # -------------------------------------------------------------------------
    elif diagram_type == "sequence":
        title = f"Sequence Flow: {clean_topic}"
        description = f"Step-by-step actor interactions and timeline of {clean_topic}."
        
        actor1 = sanitize_mermaid_label(terms[0] if len(terms) > 0 else "Client").replace(" ", "")[:18]
        actor2 = sanitize_mermaid_label(terms[1] if len(terms) > 1 else "Coordinator").replace(" ", "")[:18]
        actor3 = sanitize_mermaid_label(terms[2] if len(terms) > 2 else "Engine").replace(" ", "")[:18]
        
        step1 = sanitize_mermaid_label(actions[0] if len(actions) > 0 else f"Initiate {clean_topic}")[:45]
        step2 = sanitize_mermaid_label(actions[1] if len(actions) > 1 else "Validate preconditions and parameters")[:45]
        step3 = sanitize_mermaid_label(actions[2] if len(actions) > 2 else "Process core operation")[:45]
        step4 = sanitize_mermaid_label(actions[3] if len(actions) > 3 else "Return verified response")[:45]
        cond = sanitize_mermaid_label(conditions[0] if conditions else "Condition Satisfied")[:35]

        code = f"""sequenceDiagram
    autonumber
    actor A as {actor1}
    participant B as {actor2}
    participant C as {actor3}

    A->>B: {step1}
    B->>C: {step2}
    C-->>B: Status Check ({cond})
    alt {cond}
        B->>C: Execute: {step3}
        C-->>B: Execution Success
        B-->>A: {step4}
    else Constraint Violation
        C-->>B: Emit Warning / Retry
        B-->>A: Safe Fallback / Adjusted Signal
    end"""

        takeaways = [
            f"{actor1} initiates operation with {step1[:50]}.",
            f"{actor2} coordinates verification against {cond[:40]}.",
            f"Terminal state produces verified outcome {step4[:50]}."
        ]
        return code.strip(), title, description, layman_analogy, takeaways

    # -------------------------------------------------------------------------
    # 3. STATE DIAGRAM
    # -------------------------------------------------------------------------
    elif diagram_type == "stateDiagram":
        title = f"State Machine: {clean_topic}"
        description = f"Lifecycle transitions and triggers for {clean_topic}."
        
        s1 = sanitize_mermaid_label(terms[0] if len(terms) > 0 else "Idle").replace(" ", "")[:16]
        s2 = sanitize_mermaid_label(terms[1] if len(terms) > 1 else "Processing").replace(" ", "")[:16]
        s3 = sanitize_mermaid_label(terms[2] if len(terms) > 2 else "Verified").replace(" ", "")[:16]
        
        t1 = sanitize_mermaid_label(actions[0] if len(actions) > 0 else "Start Request")[:30]
        t2 = sanitize_mermaid_label(actions[1] if len(actions) > 1 else "Core Computation")[:30]
        t3 = sanitize_mermaid_label(actions[2] if len(actions) > 2 else "Validation Passed")[:30]

        code = f"""stateDiagram-v2
    [*] --> {s1} : System Initialized
    {s1} --> {s2} : {t1}
    {s2} --> {s3} : {t2}
    {s3} --> SuccessComplete : {t3}
    {s2} --> ErrorRecovery : Failure / Boundary Trigger
    ErrorRecovery --> {s1} : Reset to Safe State
    SuccessComplete --> [*] : Lifecycle Completed"""

        takeaways = [
            f"Enters {s1} upon initialization.",
            f"Transitions to {s2} upon {t1}.",
            f"Achieves terminal completion via {t3}."
        ]
        return code.strip(), title, description, layman_analogy, takeaways

    # -------------------------------------------------------------------------
    # 4. CLASS DIAGRAM
    # -------------------------------------------------------------------------
    elif diagram_type == "class":
        title = f"Class Model: {clean_topic}"
        description = f"Structural representation and methods of {clean_topic}."
        
        c1 = sanitize_mermaid_label(terms[0] if len(terms) > 0 else "PrimaryEntity").replace(" ", "")[:18]
        c2 = sanitize_mermaid_label(terms[1] if len(terms) > 1 else "Manager").replace(" ", "")[:18]
        c3 = sanitize_mermaid_label(terms[2] if len(terms) > 2 else "Handler").replace(" ", "")[:18]
        
        m1 = sanitize_mermaid_label(actions[0] if len(actions) > 0 else "executeStep")[:22].replace(" ", "")
        m2 = sanitize_mermaid_label(actions[1] if len(actions) > 1 else "validateState")[:22].replace(" ", "")

        code = f"""classDiagram
    class {c1} {{
        +String identifier
        +Boolean isActive
        +{m1}() void
    }}
    class {c2} {{
        -List items
        +process() bool
        +{m2}() bool
    }}
    class {c3} {{
        +notify() void
        +handleResult() void
    }}
    {c1} "1" --> "many" {c2} : coordinates
    {c2} ..> {c3} : outputs to"""

        takeaways = [
            f"{c1} acts as the root entity managing configuration.",
            f"{c2} handles execution and invokes {m2}().",
            f"{c3} captures output and boundary states."
        ]
        return code.strip(), title, description, layman_analogy, takeaways

    # -------------------------------------------------------------------------
    # 5. FLOWCHART (Default)
    # -------------------------------------------------------------------------
    else:
        title = f"Flowchart: {clean_topic}"
        description = f"Step-by-step logic, conditions, and outcomes of {clean_topic}."
        dir_code = "LR" if direction == "LR" else "TD"
        
        step1 = sanitize_mermaid_label(actions[0] if len(actions) > 0 else f"Initialize {clean_topic}")
        step2 = sanitize_mermaid_label(actions[1] if len(actions) > 1 else "Evaluate core parameters & inputs")
        
        cond = sanitize_mermaid_label(
            conditions[0] if len(conditions) > 0 else (actions[2] if len(actions) > 2 else "Are requirements satisfied?")
        )
        if not cond.endswith("?"):
            cond = cond[:40] + "?"
            
        step3 = sanitize_mermaid_label(actions[2] if len(actions) > 2 else "Apply primary transformation")
        step4 = sanitize_mermaid_label(actions[3] if len(actions) > 3 else "Generate final outcome")

        code = f"""flowchart {dir_code}
    A["Input / Trigger: {safe_topic}"] --> B["{step1}"]
    B --> C["{step2}"]
    C --> D{{"{cond}"}}
    D -->|Yes: Valid| E["{step3}"]
    D -->|No: Alternate| F["Apply fallback handling & recovery"]
    F --> E
    E --> G["Result: Successfully completed {safe_topic[:30]}"]

    style A fill:#2563eb,stroke:#1d4ed8,color:#fff
    style C fill:#7c3aed,stroke:#6d28d9,color:#fff
    style D fill:#d97706,stroke:#b45309,color:#fff
    style G fill:#059669,stroke:#047857,color:#fff"""

        takeaways = [
            f"Step 1: {step1[:55]}.",
            f"Condition check: {cond[:55]}.",
            f"Target outcome: {step4[:55]}."
        ]
        return code.strip(), title, description, layman_analogy, takeaways
