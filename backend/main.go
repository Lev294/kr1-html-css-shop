package main

import (
	"encoding/json"
	"flag"
	"log"
	"net/http"
	"os"
	"time"
)

type product struct {
	Code            string      `json:"code"`
	Name            string      `json:"name"`
	Category        string      `json:"category"`
	Price           int         `json:"price"`
	DiscountPercent int         `json:"discountPercent"`
	InStock         bool        `json:"inStock"`
	Variant         string      `json:"variant"`
	Image           string      `json:"image"`
	Alt             string      `json:"alt"`
	Description     string      `json:"description"`
	Specs           []string    `json:"specs"`
	Details         [][2]string `json:"details"`
	Package         []string    `json:"package,omitempty"`
}

func (p product) finalPrice() int {
	return p.Price - (p.Price*p.DiscountPercent+50)/100
}

type shop struct {
	products []product
	byCode   map[string]product
	dataDir  string
}

func (s shop) routes(frontend string) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/products", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, s.products)
	})
	mux.HandleFunc("GET /api/products/{code}", func(w http.ResponseWriter, r *http.Request) {
		item, exists := s.byCode[r.PathValue("code")]
		if !exists {
			writeError(w, http.StatusNotFound, "", "Товар не найден.")
			return
		}
		writeJSON(w, http.StatusOK, item)
	})
	mux.HandleFunc("POST /api/orders", s.createOrder)
	mux.HandleFunc("POST /api/messages", s.createMessage)
	mux.Handle("GET /", http.FileServer(http.Dir(frontend)))
	return mux
}

func main() {
	addr := flag.String("addr", "127.0.0.1:8080", "адрес HTTP-сервера")
	dist := flag.String("dist", "dist", "папка со сборкой React")
	data := flag.String("data", "var", "папка для заявок и сообщений")
	flag.Parse()

	raw, err := os.ReadFile("data/products.json")
	if err != nil {
		log.Fatal(err)
	}
	store := shop{dataDir: *data, byCode: make(map[string]product)}
	if err := json.Unmarshal(raw, &store.products); err != nil {
		log.Fatal(err)
	}
	for _, item := range store.products {
		store.byCode[item.Code] = item
	}
	server := http.Server{
		Addr: *addr, Handler: store.routes(*dist),
		ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second,
		WriteTimeout: 15 * time.Second, IdleTimeout: 30 * time.Second,
	}
	log.Printf("ShopProject: http://%s", *addr)
	log.Fatal(server.ListenAndServe())
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(value); err != nil {
		log.Printf("encode response: %v", err)
	}
}

func writeError(w http.ResponseWriter, status int, field, message string) {
	writeJSON(w, status, struct {
		Error string `json:"error"`
		Field string `json:"field,omitempty"`
	}{Error: message, Field: field})
}
