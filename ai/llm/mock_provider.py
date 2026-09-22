"""Deterministic Mock LLM Provider for unit testing and offline development.

Allows running full conversational, explanation, quiz, and flashcard generation
without internet access, API keys, or consuming token quotas.

The mock is fully dynamic: flashcards and quiz questions are generated for the
actual requested topic and the exact number of cards/questions requested.
"""

import hashlib
from typing import Any, Dict, List, Optional, Type, TypeVar
from pydantic import BaseModel

from ai.llm.base_provider import BaseLLMProvider
from ai.llm.structured_output import (
    ExplanationResponse,
    FlashcardItem,
    FlashcardResponse,
    QuizOption,
    QuizQuestion,
    QuizResponse,
    SourceCitation,
)

T = TypeVar("T", bound=BaseModel)


# ---------------------------------------------------------------------------
# Topic Knowledge Base
# Each entry: list of (subtopic, question, answer, hint, difficulty)
# The entries are large enough to cover any num_cards via cycling.
# ---------------------------------------------------------------------------
_TOPIC_CARDS: Dict[str, List[tuple]] = {
    "default": [
        ("Definition", "What is the core definition of {topic}?",
         "{topic} is a foundational concept that describes a structured approach to solving problems in its domain.",
         "Think about what the concept fundamentally represents.", "Easy"),
        ("Key Principle", "What is the most important principle underlying {topic}?",
         "The key principle of {topic} is that structure and systematic reasoning lead to reliable, reproducible outcomes.",
         "Consider the governing rule.", "Medium"),
        ("Application", "Give a real-world application of {topic}.",
         "{topic} is applied in engineering systems, scientific computing, and academic research to solve domain-specific challenges.",
         "Think about practical use-cases.", "Medium"),
        ("Common Mistake", "What is the most common mistake when working with {topic}?",
         "Ignoring boundary conditions and edge cases, which leads to incorrect results and hard-to-debug failures.",
         "Think about what gets overlooked.", "Hard"),
        ("Formula / Rule", "What formula or rule governs {topic}?",
         "The governing invariant of {topic} ensures consistency by relating input constraints to output expectations through a well-defined transformation.",
         "Recall the mathematical or logical expression.", "Hard"),
        ("Comparison", "How does {topic} differ from closely related concepts?",
         "{topic} is distinct in that it imposes stricter preconditions and offers stronger guarantees than its alternatives.",
         "Think about what makes it unique.", "Medium"),
        ("Verification", "How do you verify correctness in {topic}?",
         "Verification involves checking that all preconditions are satisfied, tracing intermediate steps, and validating output against known test cases.",
         "Think about testing strategies.", "Medium"),
        ("History / Origin", "Who introduced {topic} and when was it formalized?",
         "{topic} was formalized through academic research and standardized in textbooks, forming a cornerstone of the discipline.",
         "Consider foundational papers or researchers.", "Easy"),
        ("Complexity", "What is the time or space complexity associated with {topic}?",
         "Depending on implementation, {topic} operates in polynomial time with memory requirements proportional to input size.",
         "Think about Big-O notation.", "Hard"),
        ("Analogy", "What is a good real-world analogy to understand {topic}?",
         "Think of {topic} like a factory assembly line: each step depends on the previous one, ensuring a structured and predictable output.",
         "What everyday process matches this structure?", "Easy"),
    ],
    "operating systems": [
        ("Process States", "List all 5 process states in a typical OS process life-cycle.",
         "New → Ready → Running → Waiting (Blocked) → Terminated. A process transitions between states based on scheduling and I/O events.",
         "NRRWT", "Medium"),
        ("Deadlock", "What are the 4 Coffman conditions required for deadlock?",
         "1. Mutual Exclusion 2. Hold and Wait 3. No Preemption 4. Circular Wait — all four must hold simultaneously.",
         "Remember: ME HW NP CW", "Medium"),
        ("Scheduling", "What is the difference between preemptive and non-preemptive scheduling?",
         "Preemptive scheduling allows the OS to forcibly remove a running process from the CPU. Non-preemptive scheduling lets a process run until it voluntarily yields or terminates.",
         "Think about who decides when to stop.", "Easy"),
        ("Paging", "How does demand paging differ from simple paging?",
         "Demand paging only loads pages into memory when they are actually referenced (lazy loading), reducing memory usage. Simple paging loads the entire process at start.",
         "Lazy vs. eager loading.", "Hard"),
        ("Semaphore", "What is the difference between a binary semaphore and a mutex?",
         "A binary semaphore can be signaled by any thread; a mutex must be released by the thread that acquired it, enforcing ownership semantics.",
         "Ownership matters for mutex.", "Hard"),
        ("Banker's Algorithm", "What does the Banker's Algorithm determine?",
         "It determines whether granting a resource request will leave the system in a safe state — one where all processes can eventually complete.",
         "Safe state = no deadlock possible.", "Medium"),
        ("Virtual Memory", "What is thrashing in virtual memory?",
         "Thrashing occurs when a process spends more time swapping pages in and out (page faults) than executing, causing severe performance degradation.",
         "Too many page faults.", "Hard"),
        ("File Systems", "What is an inode in a Unix file system?",
         "An inode is a data structure storing file metadata (permissions, owner, size, timestamps, disk block pointers) but NOT the filename.",
         "Index node — metadata only.", "Medium"),
        ("Context Switch", "What is a context switch and what overhead does it introduce?",
         "A context switch saves the CPU state of the current process and restores the state of the next scheduled process. Overhead includes saving/restoring registers and flushing the TLB.",
         "State save + restore.", "Medium"),
        ("Memory Allocation", "Compare first-fit, best-fit, and worst-fit memory allocation strategies.",
         "First-fit: Allocates the first hole large enough. Best-fit: Smallest hole that fits (minimizes waste). Worst-fit: Largest hole (maximizes leftover fragments).",
         "Each trades off speed vs. fragmentation.", "Hard"),
    ],
    "data structures": [
        ("Array", "What is the time complexity of accessing an element in an array?",
         "O(1) — Arrays provide constant-time random access because elements are stored contiguously in memory, and the address is computed directly.",
         "Contiguous memory = direct address computation.", "Easy"),
        ("Linked List", "When is a doubly linked list preferred over a singly linked list?",
         "When traversal in both directions is needed, or when deletion of a node requires access to the previous node without extra traversal.",
         "Backward traversal requirement.", "Medium"),
        ("Stack", "What is the LIFO property and which operations implement it?",
         "Last In, First Out: the most recently pushed element is popped first. Implemented via push() (insert at top) and pop() (remove from top).",
         "Think of a stack of plates.", "Easy"),
        ("Queue", "What distinguishes a circular queue from a linear queue?",
         "A circular queue wraps the rear pointer back to the front when the end of the array is reached, reusing freed slots and avoiding wasted space.",
         "Modular index arithmetic.", "Medium"),
        ("Binary Search Tree", "What property must every node in a BST satisfy?",
         "Every node's left subtree contains only values less than the node, and every node's right subtree contains only values greater than the node.",
         "Left < Node < Right", "Easy"),
        ("AVL Tree", "How does an AVL tree maintain balance and what is the balance factor?",
         "Balance factor = height(left subtree) − height(right subtree). AVL trees perform rotations (LL, RR, LR, RL) whenever |balance factor| > 1.",
         "Rotations restore balance.", "Hard"),
        ("Heap", "What is the heap property for a max-heap?",
         "In a max-heap, every parent node is greater than or equal to its children, guaranteeing the maximum element is always at the root.",
         "Parent ≥ Children.", "Easy"),
        ("Graph", "What is the difference between BFS and DFS traversal?",
         "BFS uses a queue and explores neighbors level by level (shortest path in unweighted graphs). DFS uses a stack (or recursion) and explores as deep as possible before backtracking.",
         "BFS = queue, DFS = stack.", "Medium"),
        ("Hashing", "What is a hash collision and how is it resolved by chaining?",
         "A collision occurs when two keys hash to the same index. Chaining resolves it by storing all colliding elements in a linked list at that index.",
         "Multiple keys, same bucket.", "Medium"),
        ("Dynamic Programming", "What two properties must a problem have for DP to apply?",
         "1. Optimal substructure: the optimal solution contains optimal solutions to subproblems. 2. Overlapping subproblems: the same subproblems are solved multiple times.",
         "Memoization helps with overlapping subproblems.", "Hard"),
    ],
    "machine learning": [
        ("Gradient Descent", "What is the parameter update rule in gradient descent?",
         "θ := θ − α · ∇J(θ), where α is the learning rate and ∇J(θ) is the gradient of the cost function with respect to parameters.",
         "Move opposite the gradient.", "Medium"),
        ("Overfitting", "What is overfitting and how is it mitigated?",
         "Overfitting is when a model memorizes training data but generalizes poorly. Mitigation: regularization (L1/L2), dropout, early stopping, more training data.",
         "Too complex for the data.", "Medium"),
        ("Bias-Variance", "Explain the bias-variance tradeoff.",
         "High bias → underfitting (model too simple). High variance → overfitting (model too complex). The goal is to minimize total error = Bias² + Variance + Irreducible noise.",
         "Underfitting ↔ Overfitting tradeoff.", "Hard"),
        ("Cross-Validation", "What is k-fold cross-validation?",
         "The dataset is split into k equal folds. The model trains on k−1 folds and validates on the remaining fold. This repeats k times, and results are averaged.",
         "Each fold serves as a validation set once.", "Medium"),
        ("Regularization", "What is the difference between L1 (Lasso) and L2 (Ridge) regularization?",
         "L1 adds the sum of absolute weights to the loss — it promotes sparsity (zeros out weights). L2 adds the sum of squared weights — it shrinks all weights smoothly.",
         "L1 = sparse, L2 = smooth shrinkage.", "Hard"),
        ("Activation Functions", "Why is ReLU preferred over sigmoid in deep networks?",
         "ReLU avoids the vanishing gradient problem that plagues sigmoid/tanh in deep networks because its gradient is either 0 or 1, not a compressed range.",
         "Gradient doesn't vanish for positive inputs.", "Hard"),
        ("Precision/Recall", "Define precision and recall in classification.",
         "Precision = TP / (TP + FP) — fraction of predicted positives that are correct. Recall = TP / (TP + FN) — fraction of actual positives that were found.",
         "Precision = quality, Recall = coverage.", "Medium"),
        ("Decision Trees", "What is information gain used for in decision trees?",
         "Information gain measures the reduction in entropy (disorder) achieved by splitting on a feature. The feature with the highest gain is chosen as the split.",
         "Entropy reduction = better split.", "Medium"),
        ("SVM", "What is the margin in a Support Vector Machine?",
         "The margin is the distance between the decision hyperplane and the nearest data points (support vectors). SVMs maximize this margin to improve generalization.",
         "Maximize the gap.", "Hard"),
        ("Neural Networks", "What is backpropagation and why is it needed?",
         "Backpropagation computes gradients of the loss with respect to each weight using the chain rule, propagated backward from the output layer to the input layer.",
         "Chain rule applied backward.", "Hard"),
    ],
    "computer networks": [
        ("OSI Model", "List the 7 layers of the OSI model from bottom to top.",
         "Physical → Data Link → Network → Transport → Session → Presentation → Application. Mnemonic: 'Please Do Not Throw Sausage Pizza Away'",
         "P D N T S P A", "Easy"),
        ("TCP vs UDP", "What is the key difference between TCP and UDP?",
         "TCP is connection-oriented, reliable, and uses acknowledgements, retransmission, and flow control. UDP is connectionless, unreliable, and offers lower latency.",
         "Reliability vs. speed.", "Easy"),
        ("IP Addressing", "What is the difference between classful and classless IP addressing?",
         "Classful: fixed subnet boundaries (Class A/B/C). Classless (CIDR): uses variable-length subnet masks (e.g. /26) allowing flexible allocation.",
         "CIDR = flexible subnetting.", "Medium"),
        ("TCP Handshake", "Describe the TCP 3-way handshake.",
         "1. Client sends SYN. 2. Server replies SYN-ACK. 3. Client sends ACK. The connection is now established and both sides synchronize sequence numbers.",
         "SYN → SYN-ACK → ACK", "Easy"),
        ("Congestion Control", "What algorithm does TCP use to avoid congestion?",
         "TCP uses AIMD (Additive Increase Multiplicative Decrease): increases cwnd by 1 MSS each RTT during congestion avoidance; halves cwnd on packet loss detection.",
         "Slow Start → Congestion Avoidance → AIMD", "Hard"),
        ("DNS", "How does DNS resolve a domain name?",
         "Query goes: Local cache → Recursive resolver → Root nameserver → TLD nameserver → Authoritative nameserver → IP returned and cached.",
         "Hierarchical resolution.", "Medium"),
        ("Routing", "Difference between Distance Vector and Link State routing?",
         "Distance Vector: each router shares only its routing table with neighbors (Bellman-Ford). Link State: each router shares global link info, builds a complete topology map (Dijkstra).",
         "DV = local knowledge, LS = global knowledge.", "Hard"),
        ("HTTP", "What is the difference between HTTP/1.1 and HTTP/2?",
         "HTTP/2 adds multiplexing (multiple streams over one connection), header compression (HPACK), and server push, dramatically improving page load performance.",
         "Multiplexing is the key addition.", "Medium"),
        ("Subnetting", "What does CIDR /24 mean in terms of usable hosts?",
         "A /24 subnet has 8 host bits, providing 2⁸ = 256 addresses. Subtracting 2 (network and broadcast) gives 254 usable host addresses.",
         "Host bits = 32 minus prefix.", "Medium"),
        ("Firewall", "What is the difference between stateful and stateless firewalls?",
         "Stateful firewalls track active connections and allow return traffic automatically. Stateless firewalls evaluate each packet independently against rules.",
         "State tracking vs. per-packet rules.", "Hard"),
    ],
    "dbms": [
        ("Normalization", "What violation does 1NF (First Normal Form) eliminate?",
         "1NF eliminates repeating groups and multi-valued attributes. Every column must hold atomic (indivisible) values and each row must be unique.",
         "Atomic values, no repeating groups.", "Easy"),
        ("2NF", "What is a partial dependency and why does 2NF eliminate it?",
         "A partial dependency is when a non-key attribute depends on only part of a composite primary key. 2NF moves such attributes to separate tables to eliminate redundancy.",
         "Non-key depends on part of key.", "Medium"),
        ("3NF", "What is a transitive dependency and how does 3NF address it?",
         "A transitive dependency is A → B → C where C depends on B which depends on A (primary key). 3NF separates B and C into their own table.",
         "Non-key depends on non-key.", "Medium"),
        ("BCNF", "State the condition for Boyce-Codd Normal Form (BCNF).",
         "For every non-trivial functional dependency X → Y, X must be a superkey. BCNF is stricter than 3NF and eliminates all remaining anomalies from FDs.",
         "Every determinant must be a superkey.", "Hard"),
        ("Transactions", "Name the 4 ACID properties and briefly define each.",
         "Atomicity: all or nothing. Consistency: valid state before and after. Isolation: transactions don't interfere. Durability: committed changes persist.",
         "A C I D", "Easy"),
        ("Indexing", "What is the difference between a clustered and non-clustered index?",
         "Clustered: physical row order matches index order (one per table). Non-clustered: index is a separate structure with pointers to the actual rows.",
         "Clustered = physical order.", "Hard"),
        ("SQL Joins", "What is the difference between INNER JOIN and LEFT OUTER JOIN?",
         "INNER JOIN returns only rows with matching values in both tables. LEFT JOIN returns all rows from the left table plus matched rows from the right (NULLs for no match).",
         "LEFT JOIN keeps all left rows.", "Easy"),
        ("Functional Dependency", "Define a functional dependency X → Y.",
         "X → Y means that for any two tuples in a relation, if they have the same value for X they must also have the same value for Y. X functionally determines Y.",
         "Same X always gives same Y.", "Medium"),
        ("ER Model", "What does cardinality express in an ER diagram?",
         "Cardinality specifies the number of instances of one entity that can be associated with instances of another: one-to-one, one-to-many, or many-to-many.",
         "1:1, 1:N, M:N", "Easy"),
        ("Deadlock in DBMS", "How do database systems handle deadlocks?",
         "Detection: build wait-for graphs and detect cycles, then abort a victim. Prevention: require acquiring all locks upfront or enforce ordering. Avoidance: timestamp-based protocols.",
         "Detect, prevent, or avoid.", "Hard"),
    ],
}

# keyword → canonical key in _TOPIC_CARDS
_KEYWORD_MAP: List[tuple] = [
    (["operating system", "os", "process", "scheduling", "deadlock", "semaphore", "paging", "memory management"], "operating systems"),
    (["data structure", "array", "linked list", "stack", "queue", "tree", "graph", "heap", "hash"], "data structures"),
    (["machine learning", "neural network", "deep learning", "gradient", "classification", "regression", "overfitting", "svm"], "machine learning"),
    (["network", "tcp", "udp", "ip", "dns", "http", "routing", "osi", "subnet"], "computer networks"),
    (["dbms", "database", "sql", "normalization", "transaction", "index", "join", "acid", "er model"], "dbms"),
]


def _resolve_topic_key(topic: str) -> str:
    """Resolve a topic string to a key in _TOPIC_CARDS."""
    lower = topic.lower()
    for keywords, key in _KEYWORD_MAP:
        if any(kw in lower for kw in keywords):
            return key
    return "default"


def _generate_flashcard_items(topic: str, num_cards: int) -> List[FlashcardItem]:
    """Generate exactly num_cards unique, topic-specific flashcard items."""
    key = _resolve_topic_key(topic)
    base_cards = _TOPIC_CARDS.get(key, _TOPIC_CARDS["default"])

    items: List[FlashcardItem] = []
    for i in range(num_cards):
        # Cycle through base cards if num_cards > available
        tmpl = base_cards[i % len(base_cards)]
        subtopic, q_tmpl, a_tmpl, hint, difficulty = tmpl

        # For "default" topic, substitute the actual topic name into placeholders
        question = q_tmpl.format(topic=topic)
        answer = a_tmpl.format(topic=topic)

        # Vary difficulty based on position in deck (spread Easy/Medium/Hard)
        if num_cards <= 5:
            diff = difficulty
        else:
            position_ratio = i / max(num_cards - 1, 1)
            if position_ratio < 0.3:
                diff = "Easy"
            elif position_ratio < 0.7:
                diff = "Medium"
            else:
                diff = "Hard"

        items.append(FlashcardItem(
            card_id=i + 1,
            front_question=question,
            back_answer=answer,
            hint=hint,
            topic=subtopic,
            difficulty=diff,
        ))

    return items


def _generate_quiz_questions(topic: str, num_questions: int, difficulty: str = "Medium") -> List[QuizQuestion]:
    """Generate exactly num_questions quiz questions for the topic."""
    key = _resolve_topic_key(topic)
    base_cards = _TOPIC_CARDS.get(key, _TOPIC_CARDS["default"])

    questions: List[QuizQuestion] = []
    for i in range(num_questions):
        tmpl = base_cards[i % len(base_cards)]
        subtopic, q_tmpl, a_tmpl, hint, card_diff = tmpl

        question_text = q_tmpl.format(topic=topic)
        correct_answer = a_tmpl.format(topic=topic)

        # Build 4 options — correct + 3 distractors derived from the answer
        correct_id = "A"
        words = correct_answer.split()
        distractor1 = " ".join(words[:max(1, len(words) // 2)]) + " (incorrect variant)"
        distractor2 = f"The opposite of the correct principle for {subtopic}."
        distractor3 = f"A common misconception about {subtopic} that ignores key constraints."

        options = [
            QuizOption(option_id="A", text=correct_answer[:200], explanation="Correct answer."),
            QuizOption(option_id="B", text=distractor1[:200], explanation="Partially correct but incomplete."),
            QuizOption(option_id="C", text=distractor2[:200], explanation="Incorrect — reverses the actual principle."),
            QuizOption(option_id="D", text=distractor3[:200], explanation="A common misconception."),
        ]

        questions.append(QuizQuestion(
            question_id=i + 1,
            question_text=question_text,
            options=options,
            correct_option_id=correct_id,
            explanation=f"The correct answer is: {correct_answer[:300]}",
            difficulty=card_diff,
            topic=subtopic,
        ))

    return questions


class MockLLMProvider(BaseLLMProvider):
    """Mock LLM Provider returning topic-aware, fully dynamic responses."""

    def __init__(self, canned_response: Optional[str] = None) -> None:
        """Initialize MockLLMProvider with optional canned response text."""
        self.canned_response = canned_response
        self.last_prompt: Optional[str] = None
        self.last_system_instruction: Optional[str] = None

    def _extract_topic_and_count(self, prompt: str, field: str = "topic") -> tuple:
        """Try to extract topic and num_cards from a rendered prompt string."""
        topic = "General"
        count = 5

        # Look for topic= in the prompt (from render_prompt template variables)
        for line in prompt.split("\n"):
            line_lower = line.lower().strip()
            if "topic:" in line_lower or "topic =" in line_lower:
                parts = line.split(":", 1)
                if len(parts) > 1:
                    candidate = parts[1].strip().strip("'\"").rstrip(".")
                    if len(candidate) > 1:
                        topic = candidate
            if "num_cards:" in line_lower or "number of cards:" in line_lower or "generate" in line_lower:
                import re
                nums = re.findall(r'\b(\d+)\s*(?:card|flashcard)', line_lower)
                if nums:
                    count = int(nums[0])

        return topic, count

    def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 1500,
    ) -> str:
        """Generate deterministic text response."""
        self.last_prompt = prompt
        self.last_system_instruction = system_instruction

        if self.canned_response is not None:
            return self.canned_response

        return (
            "Based on the provided academic context [Source 1], "
            "this concept is a foundational principle that governs how systems behave "
            "under defined conditions and constraints [Source 2]."
        )

    def generate_structured(
        self,
        prompt: str,
        schema: Type[T],
        system_instruction: Optional[str] = None,
        temperature: float = 0.1,
        max_tokens: int = 2000,
    ) -> T:
        """Generate fully dynamic Pydantic schema instances based on prompt content."""
        self.last_prompt = prompt
        self.last_system_instruction = system_instruction

        schema_name = schema.__name__

        # ------------------------------------------------------------------ #
        # Dynamic Flashcard generation                                        #
        # ------------------------------------------------------------------ #
        if schema_name == "FlashcardResponse" or (isinstance(schema, type) and issubclass(schema, FlashcardResponse)):
            # Parse topic and num_cards from the rendered prompt
            topic, num_cards = self._extract_topic_and_count(prompt)

            # Fallback: scan for any integer that could be num_cards
            import re
            all_nums = re.findall(r'\b(\d+)\b', prompt)
            for n in all_nums:
                val = int(n)
                if 3 <= val <= 30:
                    num_cards = val
                    break

            cards = _generate_flashcard_items(topic, num_cards)
            inst = FlashcardResponse(
                title=f"{topic} Active Recall Deck",
                topic=topic,
                total_cards=len(cards),
                cards=cards,
            )
            return inst  # type: ignore

        # ------------------------------------------------------------------ #
        # Dynamic Quiz generation                                             #
        # ------------------------------------------------------------------ #
        elif schema_name == "QuizResponse" or (isinstance(schema, type) and issubclass(schema, QuizResponse)):
            topic, num_questions = self._extract_topic_and_count(prompt)

            import re
            all_nums = re.findall(r'\b(\d+)\b', prompt)
            for n in all_nums:
                val = int(n)
                if 2 <= val <= 20:
                    num_questions = val
                    break

            questions = _generate_quiz_questions(topic, num_questions)
            inst = QuizResponse(
                title=f"{topic} Quiz",
                topic=topic,
                total_questions=len(questions),
                target_difficulty="Medium",
                questions=questions,
            )
            return inst  # type: ignore

        # ------------------------------------------------------------------ #
        # Explanation generation                                              #
        # ------------------------------------------------------------------ #
        elif schema_name == "ExplanationResponse" or (isinstance(schema, type) and issubclass(schema, ExplanationResponse)):
            topic, _ = self._extract_topic_and_count(prompt)
            key = _resolve_topic_key(topic)
            base = _TOPIC_CARDS.get(key, _TOPIC_CARDS["default"])

            key_concepts = [b[0] for b in base[:6]]
            follow_ups = [b[1].format(topic=topic) for b in base[6:9]]

            inst = ExplanationResponse(
                title=f"{topic} — Comprehensive Explanation",
                summary=f"{topic} is a structured domain of knowledge covering {', '.join(key_concepts[:3])} and related principles.",
                detailed_explanation=(
                    f"In-depth study of {topic} begins with understanding its core definitions and invariants. "
                    f"Key subtopics include: {', '.join(key_concepts)}. "
                    f"Each concept builds on the previous, forming a coherent framework used in academic and professional contexts. "
                    f"Practical mastery requires understanding both theoretical proofs and real-world trade-offs."
                ),
                key_concepts=key_concepts,
                analogy=f"Studying {topic} is like assembling a puzzle: each piece (concept) has a specific place and the full picture only emerges when they fit together.",
                citations=[
                    SourceCitation(
                        page_number=1,
                        section=key_concepts[0] if key_concepts else "Introduction",
                        snippet=f"Foundational definition and scope of {topic}.",
                        relevance_score=0.94,
                    )
                ],
                follow_up_questions=follow_ups,
                difficulty_level="Intermediate",
            )
            return inst  # type: ignore

        # ------------------------------------------------------------------ #
        # Fallback — generic field population                                 #
        # ------------------------------------------------------------------ #
        data: Dict[str, Any] = {}
        fields = getattr(schema, "model_fields", None) or getattr(schema, "__fields__", {})
        for name, field in fields.items():
            ann = field.annotation
            if ann == str:
                data[name] = f"Mock {name}"
            elif ann == int:
                data[name] = 1
            elif ann == float:
                data[name] = 1.0
            elif ann == bool:
                data[name] = True
            elif getattr(ann, "__origin__", None) == list:
                data[name] = []
            else:
                data[name] = None
        if hasattr(schema, "model_validate"):
            return schema.model_validate(data)
        return schema.parse_obj(data)
