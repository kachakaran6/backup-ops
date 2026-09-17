package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"runtime"
	"syscall"
	"time"
)

type HeartbeatPayload struct {
	AgentID      string                 `json:"agentId"`
	Hostname     string                 `json:"hostname"`
	Version      string                 `json:"version"`
	Status       string                 `json:"status"`
	Timestamp    string                 `json:"timestamp"`
	SystemInfo   map[string]interface{} `json:"systemInfo"`
	Capabilities []string               `json:"capabilities"`
}

type ChecksumRequest struct {
	Path string `json:"path"`
}

type ChecksumResponse struct {
	Path      string `json:"path"`
	Algorithm string `json:"algorithm"`
	Digest    string `json:"digest"`
	SizeBytes int64  `json:"sizeBytes"`
	Error     string `json:"error,omitempty"`
}

func main() {
	agentID := os.Getenv("AGENT_ID")
	if agentID == "" {
		agentID = "agent-node-default"
	}

	apiURL := os.Getenv("BACKUP_OPS_API_URL")
	if apiURL == "" {
		apiURL = "http://localhost:3000"
	}

	port := os.Getenv("AGENT_PORT")
	if port == "" {
		port = "8080"
	}

	hostname, _ := os.Hostname()

	log.Println("====================================================")
	log.Printf(" Starting BackupOps Infrastructure Agent (%s)", agentID)
	log.Printf(" Hostname: %s | OS: %s/%s | CPUs: %d", hostname, runtime.GOOS, runtime.GOARCH, runtime.NumCPU())
	log.Printf(" Control Plane URL: %s", apiURL)
	log.Printf(" Agent Daemon Port: %s", port)
	log.Println("====================================================")

	// Heartbeat Goroutine
	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	go func() {
		for range ticker.C {
			sendHeartbeat(apiURL, agentID, hostname)
		}
	}()

	// HTTP Handlers for privileged agent operations
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":    "healthy",
			"agentId":   agentID,
			"hostname":  hostname,
			"timestamp": time.Now().UTC().Format(time.RFC3339),
			"version":   "1.0.0",
		})
	})

	http.HandleFunc("/api/v1/checksum", handleChecksum)

	server := &http.Server{
		Addr: ":" + port,
	}

	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Agent HTTP server error: %v", err)
		}
	}()

	// Graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	log.Println("Shutting down BackupOps Infrastructure Agent...")
}

func sendHeartbeat(apiURL, agentID, hostname string) {
	payload := HeartbeatPayload{
		AgentID:   agentID,
		Hostname:  hostname,
		Version:   "1.0.0",
		Status:    "online",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		SystemInfo: map[string]interface{}{
			"os":       runtime.GOOS,
			"arch":     runtime.GOARCH,
			"cpus":     runtime.NumCPU(),
			"numGoroutine": runtime.NumGoroutine(),
		},
		Capabilities: []string{"filesystem.read", "filesystem.write", "checksum.sha256", "docker.snapshot"},
	}

	data, err := json.Marshal(payload)
	if err != nil {
		return
	}

	resp, err := http.Post(fmt.Sprintf("%s/api/v1/agent/heartbeat", apiURL), "application/json", bytes.NewBuffer(data))
	if err != nil {
		// Control plane may be connecting
		return
	}
	defer resp.Body.Close()
}

func handleChecksum(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ChecksumRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	info, err := os.Stat(req.Path)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(ChecksumResponse{
			Path:  req.Path,
			Error: err.Error(),
		})
		return
	}

	file, err := os.Open(req.Path)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ChecksumResponse{
			Path:  req.Path,
			Error: err.Error(),
		})
		return
	}
	defer file.Close()

	hash := sha256.New()
	if _, err := io.Copy(hash, file); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ChecksumResponse{
			Path:  req.Path,
			Error: err.Error(),
		})
		return
	}

	digest := hex.EncodeToString(hash.Sum(nil))
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ChecksumResponse{
		Path:      req.Path,
		Algorithm: "sha256",
		Digest:    digest,
		SizeBytes: info.Size(),
	})
}
