import pytest
from fastapi.testclient import TestClient

from main import app, is_dag, Node, Edge


client = TestClient(app)


def make_nodes(*ids):
    return [Node(id=i) for i in ids]


def make_edges(*pairs):
    return [Edge(source=s, target=t) for s, t in pairs]


class TestIsDAG:
    def test_empty_graph(self):
        assert is_dag([], []) is True

    def test_single_node(self):
        assert is_dag(make_nodes("A"), []) is True

    def test_simple_chain(self):
        nodes = make_nodes("A", "B", "C")
        edges = make_edges(("A", "B"), ("B", "C"))
        assert is_dag(nodes, edges) is True

    def test_simple_cycle(self):
        nodes = make_nodes("A", "B", "C")
        edges = make_edges(("A", "B"), ("B", "C"), ("C", "A"))
        assert is_dag(nodes, edges) is False

    def test_self_loop(self):
        nodes = make_nodes("A")
        edges = make_edges(("A", "A"))
        assert is_dag(nodes, edges) is False

    def test_diamond_dag(self):
        nodes = make_nodes("A", "B", "C", "D")
        edges = make_edges(("A", "B"), ("A", "C"), ("B", "D"), ("C", "D"))
        assert is_dag(nodes, edges) is True

    def test_disconnected_components(self):
        nodes = make_nodes("A", "B", "C", "D")
        edges = make_edges(("A", "B"), ("C", "D"))
        assert is_dag(nodes, edges) is True

    def test_multi_edge_dedup(self):
        nodes = make_nodes("A", "B")
        edges = make_edges(("A", "B"), ("A", "B"), ("A", "B"))
        assert is_dag(nodes, edges) is True

    def test_two_node_cycle(self):
        nodes = make_nodes("A", "B")
        edges = make_edges(("A", "B"), ("B", "A"))
        assert is_dag(nodes, edges) is False

    def test_complex_dag(self):
        nodes = make_nodes("1", "2", "3", "4", "5")
        edges = make_edges(("1", "2"), ("1", "3"), ("2", "4"), ("3", "4"), ("4", "5"))
        assert is_dag(nodes, edges) is True

    def test_edge_referencing_unknown_node_ignored(self):
        # An edge whose endpoints are not in node_ids must not create a phantom cycle.
        nodes = make_nodes("A", "B")
        edges = make_edges(("A", "B"), ("ghost", "A"))
        assert is_dag(nodes, edges) is True


class TestParseEndpoint:
    def test_valid_pipeline_returns_schema(self):
        payload = {
            "nodes": [{"id": "a"}, {"id": "b"}],
            "edges": [{"source": "a", "target": "b"}],
        }
        resp = client.post("/pipelines/parse", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data == {"num_nodes": 2, "num_edges": 1, "is_dag": True}

    def test_empty_pipeline(self):
        resp = client.post("/pipelines/parse", json={"nodes": [], "edges": []})
        assert resp.status_code == 200
        assert resp.json() == {"num_nodes": 0, "num_edges": 0, "is_dag": True}

    def test_cyclic_pipeline_reports_not_dag(self):
        payload = {
            "nodes": [{"id": "a"}, {"id": "b"}],
            "edges": [
                {"source": "a", "target": "b"},
                {"source": "b", "target": "a"},
            ],
        }
        resp = client.post("/pipelines/parse", json=payload)
        assert resp.status_code == 200
        assert resp.json()["is_dag"] is False

    def test_rich_reactflow_shape_accepted(self):
        # Extra fields (position, data, handles) must pass through, not 422.
        payload = {
            "nodes": [
                {"id": "a", "type": "customInput", "position": {"x": 0, "y": 0}, "data": {}},
            ],
            "edges": [],
        }
        resp = client.post("/pipelines/parse", json=payload)
        assert resp.status_code == 200

    def test_malformed_edge_missing_target_returns_422(self):
        payload = {"nodes": [{"id": "a"}], "edges": [{"source": "a"}]}
        resp = client.post("/pipelines/parse", json=payload)
        assert resp.status_code == 422

    def test_malformed_node_missing_id_returns_422(self):
        payload = {"nodes": [{"type": "llm"}], "edges": []}
        resp = client.post("/pipelines/parse", json=payload)
        assert resp.status_code == 422

    def test_missing_top_level_keys_returns_422(self):
        resp = client.post("/pipelines/parse", json={"nodes": [{"id": "a"}]})
        assert resp.status_code == 422

    def test_dangling_edge_returns_422(self):
        payload = {
            "nodes": [{"id": "a"}],
            "edges": [{"id": "e1", "source": "ghost", "target": "a"}],
        }
        resp = client.post("/pipelines/parse", json=payload)
        assert resp.status_code == 422

    def test_duplicate_node_ids_return_422(self):
        payload = {"nodes": [{"id": "a"}, {"id": "a"}], "edges": []}
        resp = client.post("/pipelines/parse", json=payload)
        assert resp.status_code == 422
