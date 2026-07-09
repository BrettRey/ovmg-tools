test:
	node tests/run-fixtures.mjs
	node tests/run-sim-smoke.mjs

lab:
	node lab/build.mjs

.PHONY: test lab
