COLLECTION := $(value)
MOCKS_SERVER_URL := http://localhost:3100/__set-collection

.PHONY: switch-collection
switch-collection:
ifeq ($(COLLECTION),segments)
	curl -X POST "$(MOCKS_SERVER_URL)" -d collection="$(COLLECTION)"
else ifeq ($(COLLECTION),server_timeout)
	curl -X POST "$(MOCKS_SERVER_URL)" -d collection="$(COLLECTION)"
else ifeq ($(COLLECTION),server_failure)
	curl -X POST "$(MOCKS_SERVER_URL)" -d collection="$(COLLECTION)"
else
	$(error "Invalid collection supplied. supported are 'segments', 'server_timeout', and 'server_failure', not '$(COLLECTION).'")
endif
