package httpx

import (
	"encoding/json"
	"errors"
	"net/http"
)

func grpcCode(httpStatus int) int {
	switch httpStatus {
	case http.StatusBadRequest:
		return 3 // InvalidArgument
	case http.StatusUnauthorized:
		return 16 // Unauthenticated
	case http.StatusForbidden:
		return 7 // PermissionDenied
	case http.StatusNotFound:
		return 5 // NotFound
	case http.StatusConflict:
		return 6 // AlreadyExists
	case http.StatusRequestEntityTooLarge:
		return 3
	case http.StatusTooManyRequests:
		return 8 // ResourceExhausted
	case http.StatusServiceUnavailable:
		return 14 // Unavailable
	case http.StatusGatewayTimeout:
		return 4 // DeadlineExceeded
	case http.StatusInternalServerError:
		return 13 // Internal
	default:
		return 2 // Unknown
	}
}

func WriteJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

type errorBody struct {
	Code    int   `json:"code"`
	Message string `json:"message"`
	Details []any `json:"details"`
}

func WriteError(w http.ResponseWriter, status int, msg string) {
	WriteJSON(w, status, errorBody{Code: grpcCode(status), Message: msg, Details: []any{}})
}

func Decode(w http.ResponseWriter, r *http.Request, dst any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20) // 1 MiB
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()

	if err := dec.Decode(dst); err != nil {
		var tooBig *http.MaxBytesError
		if errors.As(err, &tooBig) {
			WriteError(w, http.StatusRequestEntityTooLarge, "request body too large")
		} else {
			WriteError(w, http.StatusBadRequest, "invalid request body")
		}
		return false
	}
	if dec.More() {
		WriteError(w, http.StatusBadRequest, "invalid request body")
		return false
	}
	return true
}
