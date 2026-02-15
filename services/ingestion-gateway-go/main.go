package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"
)

type EventEntity struct {
	Type       string `json:"type"`
	ID         string `json:"id"`
	ExternalID string `json:"externalId,omitempty"`
}

type EventMetadata struct {
	CorrelationID string `json:"correlationId"`
	IdempotencyKey string `json:"idempotencyKey"`
	ActorEmail     string `json:"actorEmail,omitempty"`
}

type SalesEventEnvelope struct {
	EventID       string                 `json:"eventId"`
	EventType     string                 `json:"eventType"`
	OccurredAt    string                 `json:"occurredAt"`
	Source        string                 `json:"source"`
	WorkspaceSlug string                 `json:"workspaceSlug"`
	Entity        EventEntity            `json:"entity"`
	Payload       map[string]interface{} `json:"payload"`
	Metadata      EventMetadata          `json:"metadata"`
}

func healthHandler(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("content-type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(`{"status":"ok","service":"ingestion-gateway-go"}`))
}

func ingestHandler(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()

	var envelope SalesEventEnvelope
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&envelope); err != nil {
		http.Error(w, `{"error":"invalid JSON body"}`, http.StatusBadRequest)
		return
	}

	if envelope.EventID == "" || envelope.EventType == "" || envelope.WorkspaceSlug == "" {
		http.Error(w, `{"error":"missing required envelope fields"}`, http.StatusBadRequest)
		return
	}

	log.Printf(
		"ingested eventId=%s eventType=%s source=%s workspace=%s",
		envelope.EventID,
		envelope.EventType,
		envelope.Source,
		envelope.WorkspaceSlug,
	)

	// TODO: persist normalized event + enqueue for downstream workers.
	w.Header().Set("content-type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	_, _ = w.Write([]byte(`{"status":"accepted"}`))
}

func main() {
	port := os.Getenv("INGESTION_GATEWAY_PORT")
	if port == "" {
		port = "8081"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", healthHandler)
	mux.HandleFunc("/v1/events/ingest", ingestHandler)

	server := &http.Server{
		Addr:              ":" + port,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
	}

	log.Printf("ingestion gateway listening on :%s", port)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server error: %v", err)
	}
}
