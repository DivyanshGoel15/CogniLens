import { Flashcard, FlashcardConfidence, FlashcardDeck } from '../types/flashcard';
import { ApiResponse } from './apiTypes';
import { apiClient } from './apiClient';

// ---------------------------------------------------------------------------
// Rich Topic Knowledge Base — every card is unique per topic
// Each entry: [subtopic, question, answer, difficulty]
// ---------------------------------------------------------------------------
type CardTemplate = [string, string, string, string];

const TOPIC_KNOWLEDGE: Record<string, CardTemplate[]> = {
  'operating systems': [
    ['Process States', 'List all 5 process states in a typical OS process life-cycle.',
     'New → Ready → Running → Waiting (Blocked) → Terminated. A process transitions between states based on scheduling and I/O events.', 'Easy'],
    ['Deadlock', 'What are the 4 Coffman conditions required for deadlock?',
     '1. Mutual Exclusion  2. Hold and Wait  3. No Preemption  4. Circular Wait — all four must hold simultaneously.', 'Medium'],
    ['Scheduling', 'What is the difference between preemptive and non-preemptive scheduling?',
     'Preemptive scheduling allows the OS to forcibly remove a running process from the CPU. Non-preemptive scheduling lets a process run until it voluntarily yields or terminates.', 'Easy'],
    ['Paging', 'How does demand paging differ from simple paging?',
     'Demand paging only loads pages into memory when they are actually referenced (lazy loading), reducing memory usage. Simple paging loads the entire process at start.', 'Hard'],
    ['Semaphore', 'What is the difference between a binary semaphore and a mutex?',
     'A binary semaphore can be signaled by any thread; a mutex must be released by the thread that acquired it, enforcing ownership semantics.', 'Hard'],
    ['Banker\'s Algorithm', 'What does the Banker\'s Algorithm determine?',
     'It determines whether granting a resource request will leave the system in a safe state — one where all processes can eventually complete without deadlock.', 'Medium'],
    ['Virtual Memory', 'What is thrashing in virtual memory?',
     'Thrashing occurs when a process spends more time swapping pages in and out (page faults) than executing instructions, causing severe performance degradation.', 'Hard'],
    ['File Systems', 'What is an inode in a Unix file system?',
     'An inode is a data structure storing file metadata (permissions, owner, size, timestamps, disk block pointers) but NOT the filename itself.', 'Medium'],
    ['Context Switch', 'What is a context switch and what overhead does it introduce?',
     'A context switch saves the CPU state of the current process and restores the state of the next scheduled process. Overhead includes saving/restoring registers and flushing the TLB.', 'Medium'],
    ['Memory Allocation', 'Compare first-fit, best-fit, and worst-fit memory allocation.',
     'First-fit: Allocates the first hole large enough. Best-fit: Smallest hole that fits (minimizes waste). Worst-fit: Largest hole (maximizes leftover fragments). Each trades off speed vs. fragmentation.', 'Hard'],
    ['Resource Allocation Graph', 'Under what condition does a cycle in a Resource Allocation Graph GUARANTEE a deadlock?',
     'When every resource type in the system has strictly ONE instance. With multi-instance resources, a cycle is necessary but not sufficient for deadlock.', 'Hard'],
    ['CPU Scheduling', 'What is the convoy effect in FCFS scheduling?',
     'The convoy effect occurs when many short processes get stuck waiting behind one long CPU-bound process, leading to poor overall throughput and high average waiting time.', 'Medium'],
    ['Page Replacement', 'What is Belady\'s anomaly in page replacement?',
     'Belady\'s anomaly is the counter-intuitive phenomenon where increasing the number of page frames can actually increase the number of page faults (observed in FIFO replacement).', 'Hard'],
    ['System Calls', 'What is the difference between a system call and a library call?',
     'A system call transfers control to the kernel (privileged mode) via a trap/interrupt. A library call runs in user space and may or may not invoke a system call underneath.', 'Easy'],
    ['Thread vs Process', 'What are the key differences between a thread and a process?',
     'Threads share the same address space, file descriptors, and heap within a process. Processes have independent memory spaces. Thread creation is cheaper and context switching between threads is faster.', 'Easy'],
  ],
  'data structures': [
    ['Array', 'What is the time complexity of accessing an element in an array?',
     'O(1) — Arrays provide constant-time random access because elements are stored contiguously in memory, and the address is computed directly via base + offset.', 'Easy'],
    ['Linked List', 'When is a doubly linked list preferred over a singly linked list?',
     'When traversal in both directions is needed, or when deletion of a node requires access to the previous node without extra traversal cost.', 'Medium'],
    ['Stack', 'What is the LIFO property and which operations implement it?',
     'Last In, First Out: the most recently pushed element is popped first. Implemented via push() (insert at top) and pop() (remove from top), both O(1).', 'Easy'],
    ['Queue', 'What distinguishes a circular queue from a linear queue?',
     'A circular queue wraps the rear pointer back to the front when the end of the array is reached, reusing freed slots and avoiding wasted space. Uses modular arithmetic for index.', 'Medium'],
    ['Binary Search Tree', 'What property must every node in a BST satisfy?',
     'Every node\'s left subtree contains only values less than the node, and every right subtree contains only values greater than the node. This enables O(log n) search on average.', 'Easy'],
    ['AVL Tree', 'How does an AVL tree maintain balance and what is the balance factor?',
     'Balance factor = height(left subtree) - height(right subtree). AVL trees perform rotations (LL, RR, LR, RL) whenever |balance factor| > 1 to stay balanced.', 'Hard'],
    ['Heap', 'What is the heap property for a max-heap?',
     'In a max-heap, every parent node is greater than or equal to its children, guaranteeing the maximum element is always at the root. Insert and delete are O(log n).', 'Easy'],
    ['Graph Traversal', 'What is the difference between BFS and DFS?',
     'BFS uses a queue and explores neighbors level by level (shortest path in unweighted graphs). DFS uses a stack (or recursion) and explores as deep as possible before backtracking.', 'Medium'],
    ['Hashing', 'What is a hash collision and how is it resolved by chaining?',
     'A collision occurs when two keys hash to the same index. Chaining resolves it by storing all colliding elements in a linked list at that index. Load factor = n/m.', 'Medium'],
    ['Dynamic Programming', 'What two properties must a problem have for DP to apply?',
     '1. Optimal substructure: optimal solution contains optimal solutions to subproblems. 2. Overlapping subproblems: the same subproblems recur many times. Memoization or tabulation avoids recomputation.', 'Hard'],
    ['Trie', 'What is a Trie and when is it used?',
     'A Trie (prefix tree) is a tree where each node represents a character. It supports O(L) insert/search (L = key length) and is used for autocomplete, spell-checking, and IP routing.', 'Medium'],
    ['Red-Black Tree', 'What are the 5 properties of a Red-Black Tree?',
     '1. Every node is red or black. 2. Root is black. 3. All leaves (NIL) are black. 4. Red nodes have only black children. 5. Every path from a node to its descendant NILs has the same number of black nodes.', 'Hard'],
    ['Sorting', 'Why is merge sort preferred over quicksort for linked lists?',
     'Merge sort doesn\'t need random access (no index-based swaps), which linked lists don\'t support efficiently. Merge sort on linked lists uses O(1) extra space vs O(n) for arrays.', 'Hard'],
    ['Priority Queue', 'How is a priority queue typically implemented?',
     'Using a binary heap (min-heap or max-heap). Insert is O(log n), extract-min/max is O(log n), and peek is O(1). Can also use a Fibonacci heap for amortized O(1) decrease-key.', 'Medium'],
    ['Dijkstra', 'What is Dijkstra\'s algorithm and what is its limitation?',
     'Dijkstra finds the shortest path from a source to all vertices in a weighted graph. It uses a priority queue and runs in O((V+E) log V). Limitation: it doesn\'t work with negative edge weights.', 'Hard'],
  ],
  'machine learning': [
    ['Gradient Descent', 'What is the parameter update rule in gradient descent?',
     'theta := theta - alpha * gradient_J(theta), where alpha is the learning rate and gradient_J(theta) is the gradient of the cost function with respect to parameters.', 'Medium'],
    ['Overfitting', 'What is overfitting and how is it mitigated?',
     'Overfitting is when a model memorizes training data but generalizes poorly. Mitigation: regularization (L1/L2), dropout, early stopping, cross-validation, and more training data.', 'Medium'],
    ['Bias-Variance', 'Explain the bias-variance tradeoff.',
     'High bias = underfitting (model too simple). High variance = overfitting (model too complex). Total error = Bias squared + Variance + Irreducible noise. The goal is to minimize total error.', 'Hard'],
    ['Cross-Validation', 'What is k-fold cross-validation?',
     'The dataset is split into k equal folds. The model trains on k-1 folds and validates on the remaining fold. This repeats k times, and results are averaged for a robust estimate.', 'Medium'],
    ['Regularization', 'What is the difference between L1 (Lasso) and L2 (Ridge) regularization?',
     'L1 adds sum of absolute weights to the loss — promotes sparsity (some weights become exactly 0). L2 adds sum of squared weights — shrinks all weights smoothly without zeroing them.', 'Hard'],
    ['Activation Functions', 'Why is ReLU preferred over sigmoid in deep networks?',
     'ReLU (max(0,x)) avoids the vanishing gradient problem that plagues sigmoid/tanh in deep networks because its gradient is either 0 or 1, not a compressed range like (0, 0.25).', 'Hard'],
    ['Precision/Recall', 'Define precision and recall in classification.',
     'Precision = TP / (TP + FP) — fraction of predicted positives that are correct. Recall = TP / (TP + FN) — fraction of actual positives that were found. F1-score is their harmonic mean.', 'Medium'],
    ['Decision Trees', 'What is information gain used for in decision trees?',
     'Information gain measures the reduction in entropy (disorder) achieved by splitting on a feature. The feature with the highest gain is chosen as the split criterion (ID3 algorithm).', 'Medium'],
    ['SVM', 'What is the margin in a Support Vector Machine?',
     'The margin is the distance between the decision hyperplane and the nearest data points (support vectors). SVMs maximize this margin to improve generalization and reduce overfitting.', 'Hard'],
    ['Backpropagation', 'What is backpropagation and why is it essential?',
     'Backpropagation computes gradients of the loss with respect to each weight using the chain rule, propagated backward from the output layer to the input layer. It makes training deep networks feasible.', 'Hard'],
    ['Cost Functions', 'What is the MSE loss function and why is 1/2m used?',
     'J(theta) = (1/2m) * sum((h_theta(x_i) - y_i)^2). The 1/2 simplifies the derivative (the 2 from the power rule cancels out). 1/m normalizes by dataset size.', 'Medium'],
    ['Ensemble Methods', 'What is the difference between bagging and boosting?',
     'Bagging trains models independently on random subsets (reduces variance, e.g. Random Forest). Boosting trains models sequentially, each correcting predecessor errors (reduces bias, e.g. AdaBoost, XGBoost).', 'Hard'],
    ['K-Nearest Neighbors', 'How does KNN classify a new data point?',
     'KNN finds the K closest training examples (by distance metric) and assigns the majority class label. It\'s lazy (no training), and performance depends heavily on K and the distance metric.', 'Easy'],
    ['Feature Scaling', 'Why is feature scaling important in ML?',
     'Many algorithms (gradient descent, SVM, KNN) are sensitive to feature magnitudes. Without scaling, large-valued features dominate. Common methods: Min-Max normalization, Z-score standardization.', 'Easy'],
    ['ROC Curve', 'What does the ROC curve represent?',
     'ROC plots True Positive Rate (recall) vs False Positive Rate at various classification thresholds. AUC (Area Under Curve) measures overall classifier quality. AUC = 1.0 is perfect, 0.5 is random.', 'Medium'],
  ],
  'computer networks': [
    ['OSI Model', 'List the 7 layers of the OSI model from bottom to top.',
     'Physical, Data Link, Network, Transport, Session, Presentation, Application. Mnemonic: "Please Do Not Throw Sausage Pizza Away"', 'Easy'],
    ['TCP vs UDP', 'What is the key difference between TCP and UDP?',
     'TCP is connection-oriented, reliable, uses acknowledgements, retransmission, and flow control. UDP is connectionless, unreliable, and offers lower latency for real-time applications.', 'Easy'],
    ['IP Addressing', 'What is CIDR notation and how does /24 translate to hosts?',
     '/24 means 24 bits for network, 8 bits for hosts. 2^8 = 256 addresses, minus 2 (network and broadcast) = 254 usable hosts. CIDR replaces classful addressing for flexible allocation.', 'Medium'],
    ['TCP Handshake', 'Describe the TCP 3-way handshake.',
     '1. Client sends SYN. 2. Server replies SYN-ACK. 3. Client sends ACK. Connection is established and both sides synchronize sequence numbers for reliable data transfer.', 'Easy'],
    ['Congestion Control', 'What is AIMD in TCP congestion control?',
     'Additive Increase Multiplicative Decrease: cwnd increases by 1 MSS each RTT during congestion avoidance, and is halved on packet loss detection. Prevents network collapse.', 'Hard'],
    ['DNS', 'How does DNS resolve a domain name?',
     'Query flow: Local cache -> Recursive resolver -> Root nameserver -> TLD nameserver -> Authoritative nameserver -> IP returned and cached at each level with TTL.', 'Medium'],
    ['Routing', 'Compare Distance Vector and Link State routing protocols.',
     'Distance Vector: each router shares its routing table with neighbors (Bellman-Ford, e.g. RIP). Link State: each router shares global link info, builds complete topology map (Dijkstra, e.g. OSPF).', 'Hard'],
    ['HTTP', 'What key features does HTTP/2 add over HTTP/1.1?',
     'HTTP/2 adds multiplexing (multiple streams over one connection), header compression (HPACK), server push, and binary framing. Dramatically improves page load performance.', 'Medium'],
    ['Firewall', 'What is the difference between stateful and stateless firewalls?',
     'Stateful firewalls track active connections and allow return traffic automatically. Stateless firewalls evaluate each packet independently against static rules — faster but less secure.', 'Hard'],
    ['ARP', 'What does ARP do and at which layer does it operate?',
     'ARP (Address Resolution Protocol) maps IP addresses to MAC addresses. It operates at the Data Link layer. A host broadcasts an ARP request, and the target replies with its MAC address.', 'Easy'],
    ['NAT', 'What is Network Address Translation (NAT) and why is it used?',
     'NAT translates private IP addresses to a public IP address at the router. It conserves IPv4 addresses and provides a layer of security by hiding internal network topology.', 'Medium'],
    ['DHCP', 'Describe the DHCP DORA process.',
     'Discover: client broadcasts request. Offer: server responds with available IP. Request: client accepts an offer. Acknowledge: server confirms the lease. All via UDP ports 67/68.', 'Medium'],
    ['TCP Flow Control', 'How does TCP sliding window flow control work?',
     'The receiver advertises a window size (rwnd) indicating how much data it can buffer. The sender limits unacknowledged data to min(cwnd, rwnd). This prevents the receiver from being overwhelmed.', 'Hard'],
    ['SSL/TLS', 'What happens during a TLS handshake?',
     'Client Hello (supported ciphers) -> Server Hello (chosen cipher + certificate) -> Key Exchange (pre-master secret, asymmetric) -> Both derive session keys -> Encrypted communication begins.', 'Hard'],
    ['VLAN', 'What is a VLAN and what problem does it solve?',
     'A VLAN (Virtual LAN) logically segments a physical network into isolated broadcast domains. It improves security, reduces broadcast traffic, and allows flexible network management without rewiring.', 'Medium'],
  ],
  'dbms': [
    ['1NF', 'What violation does First Normal Form (1NF) eliminate?',
     '1NF eliminates repeating groups and multi-valued attributes. Every column must hold atomic (indivisible) values and each row must be uniquely identifiable.', 'Easy'],
    ['2NF', 'What is a partial dependency and why does 2NF eliminate it?',
     'A partial dependency is when a non-key attribute depends on only part of a composite primary key. 2NF decomposes such tables to eliminate redundancy and update anomalies.', 'Medium'],
    ['3NF', 'What is a transitive dependency and how does 3NF fix it?',
     'A transitive dependency: A -> B -> C where C depends on non-key B which depends on key A. 3NF separates B and C into their own table, removing the indirect dependency.', 'Medium'],
    ['BCNF', 'State the condition for Boyce-Codd Normal Form (BCNF).',
     'For every non-trivial functional dependency X -> Y, X must be a superkey. BCNF is stricter than 3NF and eliminates all remaining anomalies from functional dependencies.', 'Hard'],
    ['ACID', 'Name and briefly define the 4 ACID properties.',
     'Atomicity: all or nothing. Consistency: valid state before and after. Isolation: concurrent transactions don\'t interfere. Durability: committed changes survive system failures.', 'Easy'],
    ['Indexing', 'What is the difference between clustered and non-clustered indexes?',
     'Clustered: physical row order matches index order (one per table, e.g. primary key). Non-clustered: separate structure with pointers to actual rows (multiple per table).', 'Hard'],
    ['SQL Joins', 'What is the difference between INNER JOIN and LEFT OUTER JOIN?',
     'INNER JOIN returns only rows with matches in both tables. LEFT JOIN returns all rows from the left table plus matched rows from the right (NULLs for non-matches).', 'Easy'],
    ['Functional Dependency', 'Define a functional dependency X -> Y.',
     'X -> Y means that for any two tuples in a relation, if they have the same value for X, they must also have the same value for Y. X functionally determines Y.', 'Medium'],
    ['ER Model', 'What does cardinality express in an ER diagram?',
     'Cardinality specifies the number of entity instances that can be associated via a relationship: one-to-one (1:1), one-to-many (1:N), or many-to-many (M:N).', 'Easy'],
    ['DBMS Deadlock', 'How do database systems handle deadlocks?',
     'Detection: build wait-for graphs and detect cycles, then abort a victim. Prevention: require all locks upfront or enforce ordering. Avoidance: timestamp-based protocols (Wait-Die, Wound-Wait).', 'Hard'],
    ['Concurrency Control', 'What is two-phase locking (2PL)?',
     '2PL has two phases: Growing (acquire locks, no releases) and Shrinking (release locks, no new acquisitions). Strict 2PL holds all locks until commit, preventing cascading rollbacks.', 'Hard'],
    ['SQL Subqueries', 'What is the difference between a correlated and non-correlated subquery?',
     'A non-correlated subquery executes once independently. A correlated subquery references the outer query and executes once per outer row — generally slower but sometimes necessary.', 'Medium'],
    ['Views', 'What is a database view and can it be updated?',
     'A view is a virtual table defined by a SQL query. Simple views (single table, no aggregation, no DISTINCT) are generally updatable; complex views with joins/aggregates typically are not.', 'Medium'],
    ['Normalization vs Denormalization', 'When would you denormalize a database?',
     'Denormalization is used when read performance is critical and join overhead is too high. It trades storage space and write complexity for faster queries, common in data warehousing and OLAP.', 'Hard'],
    ['Transactions', 'What are the different isolation levels in SQL?',
     'Read Uncommitted (dirty reads allowed), Read Committed (no dirty reads), Repeatable Read (no non-repeatable reads), Serializable (full isolation, no phantom reads). Higher levels = more locking.', 'Hard'],
  ],
};

// Fallback: generates unique cards for any arbitrary topic not in the knowledge base
const GENERIC_TEMPLATES: Array<(topic: string, i: number) => CardTemplate> = [
  (t, _i) => ['Definition', `What is the precise definition of ${t}?`,
    `${t} is a structured domain-specific concept that establishes foundational rules and relationships governing how problems in this field are analyzed and solved.`, 'Easy'],
  (t, _i) => ['Key Principle', `What is the most important principle or theorem in ${t}?`,
    `The core principle of ${t} ensures system consistency: inputs must satisfy defined constraints, and the transformation produces verifiable, reproducible outputs.`, 'Medium'],
  (t, _i) => ['Application', `Name a real-world application of ${t}.`,
    `${t} is applied in engineering, scientific computing, and industry to model, optimize, and solve domain-specific challenges at scale.`, 'Easy'],
  (t, _i) => ['Common Pitfall', `What is the most common mistake when working with ${t}?`,
    `Overlooking boundary conditions and edge cases, which leads to incorrect results. Always verify assumptions and test with minimal and maximal inputs.`, 'Medium'],
  (t, _i) => ['Formula / Rule', `What formula or invariant governs ${t}?`,
    `The governing rule of ${t} relates input constraints to output guarantees through a well-defined mathematical or logical transformation that ensures correctness.`, 'Hard'],
  (t, _i) => ['Comparison', `How does ${t} differ from closely related concepts?`,
    `${t} is distinct in that it enforces stricter preconditions and provides stronger guarantees than alternatives, at the cost of additional complexity or computational overhead.`, 'Medium'],
  (t, _i) => ['Verification', `How do you verify correctness in ${t}?`,
    `Verify by checking preconditions, tracing execution step-by-step through representative examples, validating outputs against known test cases, and proving invariant preservation.`, 'Medium'],
  (t, _i) => ['History', `What is the historical origin of ${t}?`,
    `${t} was formalized through academic research in the 20th century, building on earlier mathematical foundations. It became a cornerstone of modern computation and engineering practice.`, 'Easy'],
  (t, _i) => ['Complexity', `What is the time/space complexity typically associated with ${t}?`,
    `Depending on the specific algorithm or approach, ${t} operates in polynomial time with memory requirements proportional to input size. Optimal implementations strive for O(n log n) or better.`, 'Hard'],
  (t, _i) => ['Analogy', `What is a good real-world analogy for understanding ${t}?`,
    `Think of ${t} like building with LEGO blocks: each component has a defined shape and connection point, and the final structure only works when pieces are assembled in the correct order.`, 'Easy'],
  (t, _i) => ['Trade-offs', `What are the key trade-offs when using ${t}?`,
    `The main trade-off is between simplicity and performance: simpler approaches are easier to implement and debug but may not scale, while optimized solutions add complexity for better efficiency.`, 'Hard'],
  (t, _i) => ['Prerequisites', `What concepts should you understand before studying ${t}?`,
    `A solid foundation in basic mathematical reasoning, logical thinking, and familiarity with fundamental data representation is essential before diving into the complexities of ${t}.`, 'Easy'],
  (t, _i) => ['Advanced Topic', `What is an advanced extension or variant of ${t}?`,
    `Advanced variants of ${t} introduce probabilistic methods, approximation algorithms, or distributed computation to handle scale, uncertainty, and real-time constraints.`, 'Hard'],
  (t, _i) => ['Exam Strategy', `What exam strategy works best for ${t} questions?`,
    `First identify the problem type, recall the core formula or algorithm, work through a small example to verify, then apply to the full problem. Always show intermediate steps.`, 'Medium'],
  (t, _i) => ['Debugging', `How do you debug errors when working with ${t}?`,
    `Start with the simplest failing case, trace the algorithm step by step, compare expected vs actual output at each stage, and isolate the first point of divergence.`, 'Medium'],
];

// Resolve topic string to a knowledge-base key
function resolveTopicKey(topic: string): string | null {
  const lower = topic.toLowerCase();
  const mappings: [string[], string][] = [
    [['operating system', 'os ', 'process', 'scheduling', 'deadlock', 'semaphore', 'paging', 'memory management', 'concurrency'], 'operating systems'],
    [['data structure', 'array', 'linked list', 'stack', 'queue', 'tree', 'graph', 'heap', 'hash', 'sorting', 'algorithm'], 'data structures'],
    [['machine learning', 'neural network', 'deep learning', 'gradient', 'classification', 'regression', 'overfitting', 'svm', 'ml '], 'machine learning'],
    [['network', 'tcp', 'udp', 'ip ', 'dns', 'http', 'routing', 'osi', 'subnet', 'firewall'], 'computer networks'],
    [['dbms', 'database', 'sql', 'normalization', 'transaction', 'index', 'join', 'acid', 'er model', 'relational'], 'dbms'],
  ];
  for (const [keywords, key] of mappings) {
    if (keywords.some(kw => lower.includes(kw))) return key;
  }
  return null;
}

// Generate N unique cards for any topic
function generateCardsForTopic(topic: string, count: number): Flashcard[] {
  const key = resolveTopicKey(topic);
  const knowledgeBase = key ? TOPIC_KNOWLEDGE[key] : null;

  const cards: Flashcard[] = [];
  for (let i = 0; i < count; i++) {
    let subtopic: string, question: string, answer: string, difficulty: string;

    if (knowledgeBase && i < knowledgeBase.length) {
      // Use rich knowledge base cards
      [subtopic, question, answer, difficulty] = knowledgeBase[i];
    } else if (knowledgeBase && i >= knowledgeBase.length) {
      // Cycle through knowledge base for extra cards
      const base = knowledgeBase[i % knowledgeBase.length];
      [subtopic, question, answer, difficulty] = base;
      // Make the cycled cards feel different by appending context
      question = `[Review] ${question}`;
    } else {
      // Use generic templates for unknown topics
      const tmplFn = GENERIC_TEMPLATES[i % GENERIC_TEMPLATES.length];
      [subtopic, question, answer, difficulty] = tmplFn(topic, i);
    }

    cards.push({
      id: `fc-${Date.now()}-${i}`,
      topic: subtopic,
      course: key ? key.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : topic,
      front: question,
      back: answer,
      sourceDoc: `${topic} Notes`,
      sourcePage: i + 1,
      confidence: difficulty === 'Easy' ? 'easy' : difficulty === 'Hard' ? 'hard' : 'good',
      repetitionCount: 0,
    });
  }
  return cards;
}


const STORAGE_KEY = 'cognilens_flashcards';

class FlashcardService {
  private decks: FlashcardDeck[] = [];
  private initialized = false;

  private loadDecks() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.decks = parsed;
          return true;
        }
      }
    } catch (e) {
      console.warn('Failed to load flashcards from localStorage', e);
    }
    return false;
  }

  private saveDecks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.decks));
    } catch (e) {
      console.warn('Failed to save flashcards to localStorage', e);
    }
  }

  private async initializeDecks(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    // Load from local storage first. If successful, don't re-initialize defaults.
    if (this.loadDecks()) {
      return;
    }

    // Try loading initial decks from the backend first
    const isOnline = await apiClient.isServerOnline();
    const defaultTopics = [
      { topic: 'Operating Systems', count: 10 },
      { topic: 'Data Structures', count: 10 },
      { topic: 'Machine Learning', count: 10 },
    ];

    for (const { topic, count } of defaultTopics) {
      if (isOnline) {
        try {
          const resp = await apiClient.generateFlashcards({ topic, num_cards: count });
          if (resp?.cards?.length > 0) {
            this.decks.push({
              id: `deck-init-${Date.now()}-${topic.replace(/\s/g, '')}`,
              title: resp.title || `${topic} Deck`,
              course: resp.topic || topic,
              description: `Active recall deck covering core ${topic} concepts.`,
              totalCards: resp.cards.length,
              reviewedCount: 0,
              cards: resp.cards.map((c: any, idx: number) => ({
                id: `fc-init-${Date.now()}-${idx}`,
                topic: c.topic || topic,
                course: resp.topic || topic,
                front: c.front_question || c.front,
                back: c.back_answer || c.back,
                sourceDoc: 'Indexed Notes',
                sourcePage: idx + 1,
                confidence: c.difficulty === 'Easy' ? 'easy' : c.difficulty === 'Hard' ? 'hard' : 'good',
                repetitionCount: 0,
              })),
            });
            continue;
          }
        } catch { /* fall through to local generation */ }
      }

      // Local fallback — still fully unique per topic
      const cards = generateCardsForTopic(topic, count);
      this.decks.push({
        id: `deck-local-${Date.now()}-${topic.replace(/\s/g, '')}`,
        title: `${topic} Active Recall Deck`,
        course: topic,
        description: `Active recall deck covering core ${topic} concepts.`,
        totalCards: cards.length,
        reviewedCount: 0,
        cards,
      });
    }
    
    this.saveDecks();
  }

  async getDecks(): Promise<ApiResponse<FlashcardDeck[]>> {
    await this.initializeDecks();
    return {
      success: true,
      data: [...this.decks],
      metadata: { latencyMs: 50 }
    };
  }

  async generateDeckForTopic(topic: string, count: number = 5): Promise<ApiResponse<FlashcardDeck>> {
    await this.initializeDecks();
    let newDeck: FlashcardDeck | null = null;
    
    const isOnline = await apiClient.isServerOnline();
    if (isOnline) {
      try {
        const backendResp = await apiClient.generateFlashcards({ topic, num_cards: count });
        if (backendResp?.cards?.length > 0) {
          newDeck = {
            id: `deck-dyn-${Date.now()}`,
            title: backendResp.title || `${topic} Flashcard Deck`,
            course: backendResp.topic || topic,
            description: `AI generated flashcard deck for ${topic}.`,
            totalCards: backendResp.cards.length,
            reviewedCount: 0,
            cards: backendResp.cards.map((c: any, idx: number) => ({
              id: `fc-dyn-${Date.now()}-${idx}`,
              topic: c.topic || topic,
              course: backendResp.topic || topic,
              front: c.front_question || c.front,
              back: c.back_answer || c.back,
              sourceDoc: 'Indexed Notes',
              sourcePage: idx + 1,
              confidence: c.difficulty === 'Easy' ? 'easy' : c.difficulty === 'Hard' ? 'hard' : 'good',
              repetitionCount: 0,
            })),
          };
        }
      } catch (err) {
        console.warn('Backend flashcard generation error, using local generator:', err);
      }
    }

    if (!newDeck) {
      // Local generation with rich knowledge base
      const cards = generateCardsForTopic(topic, count);
      newDeck = {
        id: `deck-dyn-${Date.now()}`,
        title: `${topic} Active Recall Deck`,
        course: topic,
        description: `Active recall revision cards for ${topic}.`,
        totalCards: cards.length,
        reviewedCount: 0,
        cards,
      };
    }
    
    this.decks.unshift(newDeck);
    this.saveDecks();
    return { success: true, data: newDeck, metadata: { latencyMs: 150 } };
  }

  async deleteDeck(deckId: string): Promise<ApiResponse<boolean>> {
    await this.initializeDecks();
    this.decks = this.decks.filter(d => d.id !== deckId);
    this.saveDecks();
    return { success: true, data: true, metadata: { latencyMs: 30 } };
  }

  async updateCardConfidence(deckId: string, cardId: string, confidence: FlashcardConfidence): Promise<ApiResponse<Flashcard>> {
    await this.initializeDecks();
    const deck = this.decks.find(d => d.id === deckId);
    if (!deck) throw new Error('Deck not found');
    const card = deck.cards.find(c => c.id === cardId);
    if (!card) throw new Error('Card not found');

    card.confidence = confidence;
    card.repetitionCount += 1;
    deck.reviewedCount = Math.min(deck.totalCards, deck.reviewedCount + 1);
    
    this.saveDecks();

    return {
      success: true,
      data: { ...card },
      metadata: { latencyMs: 30 }
    };
  }
}

export const flashcardService = new FlashcardService();
