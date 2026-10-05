package middleware

import (
	"net"
	"net/http"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

type entry struct {
	lim  *rate.Limiter
	seen time.Time
}

func RateLimit(rps rate.Limit, burst int) Middleware {
	var (
		mu sync.Mutex
		m  = map[string]*entry{}
	)
	go func() {
		for range time.Tick(time.Minute) {
			mu.Lock()
			for ip, e := range m {
				if time.Since(e.seen) > 5*time.Minute {
					delete(m, ip)
				}
			}
			mu.Unlock()
		}
	}()

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip, _, err := net.SplitHostPort(r.RemoteAddr)
			if err != nil {
				ip = r.RemoteAddr
			}
			mu.Lock()
			e, ok := m[ip]
			if !ok {
				e = &entry{lim: rate.NewLimiter(rps, burst)}
				m[ip] = e
			}
			e.seen = time.Now()
			allowed := e.lim.Allow()
			mu.Unlock()

			if !allowed {
				w.Header().Set("Retry-After", "1")
				http.Error(w, `{"error":"rate limit exceeded"}`, http.StatusTooManyRequests)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}