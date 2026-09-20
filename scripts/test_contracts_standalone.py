import sys
from pathlib import Path

# Add project root to sys.path
ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

class MonkeyPatch:
    def __init__(self):
        self._undo = []

    def setattr(self, target, name, value):
        old_val = getattr(target, name, None)
        self._undo.append((target, name, old_val, hasattr(target, name)))
        setattr(target, name, value)

    def undo(self):
        for target, name, old_val, had_attr in reversed(self._undo):
            if had_attr:
                setattr(target, name, old_val)
            else:
                delattr(target, name)
        self._undo.clear()

class Approx:
    def __init__(self, val, rel=1e-6, abs=1e-12):
        self.val = val
        self.rel = rel
        self.abs = abs

    def __eq__(self, other):
        return abs(self.val - other) <= max(self.rel * max(abs(self.val), abs(other)), self.abs)

class RaisesContext:
    def __init__(self, exc_type, match=None):
        self.exc_type = exc_type
        self.match = match

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:
            raise AssertionError(f"Expected {self.exc_type.__name__} was not raised")
        if not issubclass(exc_type, self.exc_type):
            return False
        if self.match and self.match not in str(exc_val):
            raise AssertionError(f"Expected exception message matching '{self.match}', got '{exc_val}'")
        return True

class MockPytest:
    approx = Approx
    raises = RaisesContext

    class mark:
        @staticmethod
        def parametrize(argnames, argvalues):
            def decorator(fn):
                fn._parametrize = (argnames, argvalues)
                return fn
            return decorator

sys.modules["pytest"] = MockPytest()

# Now import tests.test_contracts
from tests import test_contracts

tests_to_run = [
    test_contracts.test_public_function_signatures_are_stable,
    test_contracts.test_document_validator_accepts_contract,
    test_contracts.test_search_result_validator_checks_order_method_and_uniqueness,
    test_contracts.test_chunk_documents_preserves_identity_and_metadata,
    test_contracts.test_semantic_search_uses_shared_embedding_and_contract,
    test_contracts.test_lexical_search_returns_bm25_contract,
    test_contracts.test_rrf_uses_rank_deduplicates_and_marks_hybrid,
    test_contracts.test_reorder_is_non_mutating_and_context_contains_source,
    test_contracts.test_retrieve_uses_dense_score_for_fallback,
    test_contracts.test_retrieve_fuses_once_when_dense_is_confident,
    test_contracts.test_retrieve_survives_fallback_provider_error,
    test_contracts.test_generation_result_validator_accepts_safe_refusal,
]

passed = 0
failed = 0

# Test parametrized test_document_validator_rejects_missing_fields
for missing in ["id", "content", "metadata"]:
    try:
        test_contracts.test_document_validator_rejects_missing_fields(missing)
        passed += 1
        print(f"✓ test_document_validator_rejects_missing_fields[{missing}] PASSED")
    except Exception as e:
        failed += 1
        print(f"✗ test_document_validator_rejects_missing_fields[{missing}] FAILED: {e}")

# Run other tests
for test_fn in tests_to_run:
    mp = MonkeyPatch()
    try:
        import inspect
        params = list(inspect.signature(test_fn).parameters)
        if "monkeypatch" in params:
            test_fn(mp)
        else:
            test_fn()
        passed += 1
        print(f"✓ {test_fn.__name__} PASSED")
    except Exception as e:
        failed += 1
        print(f"✗ {test_fn.__name__} FAILED: {e}")
        import traceback
        traceback.print_exc()
    finally:
        mp.undo()

print("\n" + "="*50)
print(f"SUMMARY: {passed} passed, {failed} failed.")
if failed == 0:
    print(">>> ALL CONTRACT TESTS PASSED! <<<")
print("="*50)
