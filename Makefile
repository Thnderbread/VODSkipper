COLLECTION := $(value)
MOCKS_SERVER_URL := http://localhost:3100/__set-collection

.PHONY: switch-collection
switch-collection:
	curl -X POST "$(MOCKS_SERVER_URL)" -d collection="$(COLLECTION)"
