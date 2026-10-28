package apierror

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type Error struct {
	Code      string       `json:"code"`
	Message   string       `json:"message"`
	RequestID string       `json:"request_id,omitempty"`
}

type envelope struct {
	Error Error `json:"error"`
}

// Write sends e as JSON with the given HTTP status.
func Write(w http.ResponseWriter, httpStatus int, e Error) {
	h := w.Header()
	h.Del("Content-Length")
	h.Set("Content-Type", "application/json")
	h.Set("X-Content-Type-Options", "nosniff")
	w.WriteHeader(httpStatus)
	_ = json.NewEncoder(w).Encode(envelope{Error: e})
}

var codeNames = map[codes.Code]string{
	codes.Canceled:           "CANCELED",
	codes.Unknown:            "INTERNAL",
	codes.InvalidArgument:    "INVALID_ARGUMENT",
	codes.DeadlineExceeded:   "DEADLINE_EXCEEDED",
	codes.NotFound:           "NOT_FOUND",
	codes.AlreadyExists:      "ALREADY_EXISTS",
	codes.PermissionDenied:   "PERMISSION_DENIED",
	codes.ResourceExhausted:  "RESOURCE_EXHAUSTED",
	codes.FailedPrecondition: "FAILED_PRECONDITION",
	codes.Aborted:            "ABORTED",
	codes.OutOfRange:         "OUT_OF_RANGE",
	codes.Unimplemented:      "UNIMPLEMENTED",
	codes.Internal:           "INTERNAL",
	codes.Unavailable:        "UNAVAILABLE",
	codes.DataLoss:           "INTERNAL",
	codes.Unauthenticated:    "UNAUTHENTICATED",
}

func FromError(err error) (int, Error) {
	var he *runtime.HTTPStatusError
	if errors.As(err, &he) {
		switch he.HTTPStatus {
		case http.StatusNotFound:
			return he.HTTPStatus, Error{Code: "NOT_FOUND", Message: "route not found"}
		case http.StatusMethodNotAllowed:
			return he.HTTPStatus, Error{Code: "METHOD_NOT_ALLOWED", Message: "method not allowed"}
		default:
			return he.HTTPStatus, Error{Code: "INVALID_ARGUMENT", Message: "bad request"}
		}
	}

	st := status.Convert(err)
	httpStatus := runtime.HTTPStatusFromCode(st.Code())

	switch st.Code() {
	case codes.Internal, codes.Unknown, codes.DataLoss:
		return http.StatusInternalServerError, Error{Code: "INTERNAL", Message: "internal error"}
	case codes.Unavailable:
		return httpStatus, Error{Code: "UNAVAILABLE", Message: "service temporarily unavailable, please retry"}
	case codes.DeadlineExceeded:
		return httpStatus, Error{Code: "DEADLINE_EXCEEDED", Message: "request timed out"}
	case codes.Unimplemented:
		return httpStatus, Error{Code: "UNIMPLEMENTED", Message: "not implemented"}
	case codes.Canceled:
		return httpStatus, Error{Code: "CANCELED", Message: "request canceled"}
	}

	e := Error{Code: codeNames[st.Code()], Message: st.Message()}
	if e.Code == "" {
		e.Code = "UNKNOWN"
	}
	return httpStatus, e
}