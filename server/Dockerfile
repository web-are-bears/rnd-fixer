ARG GO_VERSION=1.26

FROM golang:${GO_VERSION}-alpine
WORKDIR /src
ENV CGO_ENABLED=0

# Download dependencies first so they're cached between code changes.
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Which service to run: "auth" or "gateway" (./cmd/<SERVICE>/main.go).
ARG SERVICE
RUN test -n "${SERVICE}" || (echo "build arg SERVICE is required" && exit 1)
ENV SERVICE=${SERVICE}

# sh -c so ${SERVICE} is expanded; exec makes go run PID 1.
CMD ["sh", "-c", "exec go run ./cmd/${SERVICE}/main.go"]