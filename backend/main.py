from collections import defaultdict, deque
from typing import List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, model_validator


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Typed models keep malformed payloads at the validation layer (HTTP 422)
# instead of letting a missing key raise a KeyError -> HTTP 500 downstream.
# extra="allow" preserves the rich node/edge shape React Flow sends without
# enumerating every field.
class Node(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: str
    type: Optional[str] = None


class Edge(BaseModel):
    model_config = ConfigDict(extra="allow")
    source: str
    target: str
    id: Optional[str] = None
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None


class PipelineRequest(BaseModel):
    nodes: List[Node]
    edges: List[Edge]

    @model_validator(mode="after")
    def validate_graph_references(self):
        node_ids = [node.id for node in self.nodes]
        if len(node_ids) != len(set(node_ids)):
            raise ValueError("Node ids must be unique")

        known_ids = set(node_ids)
        dangling = [
            edge.id or f"{edge.source}->{edge.target}"
            for edge in self.edges
            if edge.source not in known_ids or edge.target not in known_ids
        ]
        if dangling:
            raise ValueError(
                "Every edge endpoint must reference a node in the pipeline: "
                + ", ".join(dangling)
            )
        return self


class PipelineResponse(BaseModel):
    num_nodes: int
    num_edges: int
    is_dag: bool


def is_dag(nodes: List[Node], edges: List[Edge]) -> bool:
    node_ids = {n.id for n in nodes}
    if not node_ids:
        return True

    # Dedupe edges to prevent multi-edge false cycles in Kahn's algorithm.
    unique_edges = {(e.source, e.target) for e in edges}

    # Self-edge is an instant cycle.
    if any(s == t for s, t in unique_edges):
        return False

    adj = defaultdict(list)
    indegree = {nid: 0 for nid in node_ids}

    for src, tgt in unique_edges:
        if src in node_ids and tgt in node_ids:
            adj[src].append(tgt)
            indegree[tgt] += 1

    queue = deque(nid for nid, deg in indegree.items() if deg == 0)
    visited = 0

    while queue:
        node = queue.popleft()
        visited += 1
        for neighbor in adj[node]:
            indegree[neighbor] -= 1
            if indegree[neighbor] == 0:
                queue.append(neighbor)

    return visited == len(node_ids)


@app.get("/")
def read_root():
    return {"Ping": "Pong"}


@app.post("/pipelines/parse")
def parse_pipeline(request: PipelineRequest):
    num_nodes = len(request.nodes)
    num_edges = len(request.edges)
    dag = is_dag(request.nodes, request.edges)
    return PipelineResponse(num_nodes=num_nodes, num_edges=num_edges, is_dag=dag)
