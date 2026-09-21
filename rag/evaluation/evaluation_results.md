# RAG Retrieval Evaluation Report

- **Date / Timestamp**: `2026-09-21T11:43:43.697826+00:00`
- **Dataset Size**: 8 benchmark questions
- **Evaluation Top-K**: 3

## 1. Summary Comparison Table

| Retrieval Mode | Hit Rate @ K (Recall) | Mean Reciprocal Rank (MRR) | Precision @ K | Avg Latency (ms) |
| :--- | :---: | :---: | :---: | :---: |
| **Keyword** | 100.0% | 0.9167 | 0.3333 | 214.9 ms |
| **Vector** | 100.0% | 0.9375 | 0.4583 | 790.4 ms |
| **Hybrid** | 100.0% | 1.0000 | 0.4583 | 105.8 ms |
| **Hybrid Reranked** | 100.0% | 1.0000 | 0.4583 | 245.5 ms |

## 2. Key Findings & Insights
- **Hybrid vs Vector/Keyword**: Combining full-text BM25 and vector search yields higher recall on technical vocabulary and acronyms (e.g. BDP, TCP, SACK).
- **Heuristic Reranking**: Boosts exact phrase matches and aligns table/formula questions with structured table chunks.
- **Zero Credit Spend in Tests**: Evaluation can be executed against live Azure Search or deterministic offline mocks.

## 3. Query Breakdown

| Query ID | Query Text | Mode | Hit? | MRR | Precision | Latency |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| `q1` | What are the layers of the network protoco... | `keyword` | ✓ | 1.00 | 0.33 | 1107.9 ms |
| `q2` | What is the transport layer responsible fo... | `keyword` | ✓ | 0.33 | 0.33 | 96.9 ms |
| `q3` | What is congestion control and what algori... | `keyword` | ✓ | 1.00 | 0.33 | 62.9 ms |
| `q4` | What protocols are associated with the net... | `keyword` | ✓ | 1.00 | 0.33 | 93.3 ms |
| `q5` | What is the mathematical formula for throu... | `keyword` | ✓ | 1.00 | 0.33 | 66.6 ms |
| `q6` | What are the review questions on page 2? | `keyword` | ✓ | 1.00 | 0.33 | 134.1 ms |
| `q7` | Show the protocol data units PDU table for... | `keyword` | ✓ | 1.00 | 0.33 | 87.0 ms |
| `q8` | Contrast TCP selective acknowledgments SAC... | `keyword` | ✓ | 1.00 | 0.33 | 70.6 ms |
| `q1` | What are the layers of the network protoco... | `vector` | ✓ | 1.00 | 0.67 | 2076.3 ms |
| `q2` | What is the transport layer responsible fo... | `vector` | ✓ | 0.50 | 0.67 | 349.5 ms |
| `q3` | What is congestion control and what algori... | `vector` | ✓ | 1.00 | 0.33 | 404.4 ms |
| `q4` | What protocols are associated with the net... | `vector` | ✓ | 1.00 | 0.67 | 317.1 ms |
| `q5` | What is the mathematical formula for throu... | `vector` | ✓ | 1.00 | 0.33 | 1737.6 ms |
| `q6` | What are the review questions on page 2? | `vector` | ✓ | 1.00 | 0.33 | 346.6 ms |
| `q7` | Show the protocol data units PDU table for... | `vector` | ✓ | 1.00 | 0.33 | 600.4 ms |
| `q8` | Contrast TCP selective acknowledgments SAC... | `vector` | ✓ | 1.00 | 0.33 | 490.8 ms |
| `q1` | What are the layers of the network protoco... | `hybrid` | ✓ | 1.00 | 0.67 | 133.3 ms |
| `q2` | What is the transport layer responsible fo... | `hybrid` | ✓ | 1.00 | 0.67 | 79.8 ms |
| `q3` | What is congestion control and what algori... | `hybrid` | ✓ | 1.00 | 0.33 | 76.0 ms |
| `q4` | What protocols are associated with the net... | `hybrid` | ✓ | 1.00 | 0.67 | 144.6 ms |
| `q5` | What is the mathematical formula for throu... | `hybrid` | ✓ | 1.00 | 0.33 | 89.2 ms |
| `q6` | What are the review questions on page 2? | `hybrid` | ✓ | 1.00 | 0.33 | 130.5 ms |
| `q7` | Show the protocol data units PDU table for... | `hybrid` | ✓ | 1.00 | 0.33 | 107.1 ms |
| `q8` | Contrast TCP selective acknowledgments SAC... | `hybrid` | ✓ | 1.00 | 0.33 | 86.0 ms |
| `q1` | What are the layers of the network protoco... | `hybrid_reranked` | ✓ | 1.00 | 0.67 | 81.4 ms |
| `q2` | What is the transport layer responsible fo... | `hybrid_reranked` | ✓ | 1.00 | 0.67 | 87.4 ms |
| `q3` | What is congestion control and what algori... | `hybrid_reranked` | ✓ | 1.00 | 0.33 | 374.6 ms |
| `q4` | What protocols are associated with the net... | `hybrid_reranked` | ✓ | 1.00 | 0.67 | 80.7 ms |
| `q5` | What is the mathematical formula for throu... | `hybrid_reranked` | ✓ | 1.00 | 0.33 | 597.7 ms |
| `q6` | What are the review questions on page 2? | `hybrid_reranked` | ✓ | 1.00 | 0.33 | 127.1 ms |
| `q7` | Show the protocol data units PDU table for... | `hybrid_reranked` | ✓ | 1.00 | 0.33 | 294.8 ms |
| `q8` | Contrast TCP selective acknowledgments SAC... | `hybrid_reranked` | ✓ | 1.00 | 0.33 | 320.3 ms |

## 4. Context Grounding Completeness
- **Average Fact Grounding Score**: `97.3%`
- **Facts Verified**: `36 / 37`

| Query ID | Query | Expected Facts | Matched Facts | Grounding Score |
| :--- | :--- | :--- | :--- | :---: |
| `q1` | What are the layers of the network pr... | Application, Transport, Network, Data Link, Physical | Application, Transport, Network, Data Link, Physical | 100% |
| `q2` | What is the transport layer responsib... | TCP, UDP, QUIC, Segment, Datagram | TCP, UDP, QUIC, Segment, Datagram | 100% |
| `q3` | What is congestion control and what a... | Tahoe, Reno, CUBIC, AIMD, BBR, Kleinrock | Tahoe, Reno, CUBIC, AIMD, BBR, Kleinrock | 100% |
| `q4` | What protocols are associated with th... | IPv4, IPv6, BGP, Packet | IPv4, IPv6, BGP, Packet | 100% |
| `q5` | What is the mathematical formula for ... | BDP, Bandwidth, RTT, Mathis, Throughput | BDP, Bandwidth, RTT, Mathis, Throughput | 100% |
| `q6` | What are the review questions on page 2? | SACK, Bandwidth-Delay Product, UDP, low-latency | SACK, Bandwidth-Delay Product, UDP, low-latency | 100% |
| `q7` | Show the protocol data units PDU tabl... | Message, Segment, Packet, Frame, Bits | Message, Segment, Packet, Frame, Bits | 100% |
| `q8` | Contrast TCP selective acknowledgment... | SACK, cumulative ACK, packet loss recovery | SACK, packet loss recovery | 67% |
