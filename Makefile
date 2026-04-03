PYTHON ?= python3

.PHONY: run test eval lint

run:
	@echo "Define a repo-local run command."

test:
	$(PYTHON) -m pytest -q tests/test_codex_standards.py --noconftest

eval:
	$(PYTHON) evals/runner.py --check

lint:
	$(PYTHON) -m py_compile core/config.py core/prompt_loader.py core/llm.py core/trace.py tests/test_codex_standards.py evals/runner.py
