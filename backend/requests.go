package main

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"log"
	"mime"
	"net/http"
	"net/mail"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"
)

type contactFields struct {
	Name    string `json:"name"`
	Email   string `json:"email"`
	Consent bool   `json:"consent"`
}

type orderRequest struct {
	contactFields
	Product string `json:"product"`
	Phone   string `json:"phone"`
	Date    string `json:"date,omitempty"`
	Topic   string `json:"topic,omitempty"`
	Comment string `json:"comment"`
}

type messageRequest struct {
	contactFields
	Message string `json:"message"`
}

func readJSON(w http.ResponseWriter, r *http.Request, target any) bool {
	mediaType, _, err := mime.ParseMediaType(r.Header.Get("Content-Type"))
	if err != nil || mediaType != "application/json" {
		writeError(w, http.StatusUnsupportedMediaType, "", "Отправьте данные в формате JSON.")
		return false
	}
	r.Body = http.MaxBytesReader(w, r.Body, 16<<10)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	err = decoder.Decode(target)
	if err == nil {
		if next := decoder.Decode(new(any)); next == io.EOF {
			return true
		} else {
			err = next
		}
	}
	var tooLarge *http.MaxBytesError
	if errors.As(err, &tooLarge) {
		writeError(w, http.StatusRequestEntityTooLarge, "", "Размер формы слишком большой.")
	} else {
		writeError(w, http.StatusBadRequest, "", "Не удалось прочитать данные формы.")
	}
	return false
}

func (fields *contactFields) validate() (string, string) {
	fields.Name, fields.Email = strings.TrimSpace(fields.Name), strings.TrimSpace(fields.Email)
	if length := utf8.RuneCountInString(fields.Name); length < 2 || length > 80 {
		return "name", "Укажите имя длиной от 2 до 80 символов."
	}
	address, err := mail.ParseAddress(fields.Email)
	if err != nil || len(fields.Email) > 254 || address.Address != fields.Email {
		return "email", "Укажите корректный адрес электронной почты."
	}
	if !fields.Consent {
		return "consent", "Подтвердите согласие на обработку указанных данных."
	}
	return "", ""
}

var phoneFormat = regexp.MustCompile(`^(\+7|[78])[0-9 ()-]+$`)

func (s shop) createOrder(w http.ResponseWriter, r *http.Request) {
	var request orderRequest
	if !readJSON(w, r, &request) {
		return
	}
	item, exists := s.byCode[request.Product]
	if !exists || !item.InStock {
		writeError(w, http.StatusUnprocessableEntity, "product", "Выберите товар, который есть в наличии.")
		return
	}
	if field, message := request.validate(); field != "" {
		writeError(w, http.StatusUnprocessableEntity, field, message)
		return
	}
	request.Phone = strings.TrimSpace(request.Phone)
	digits := strings.Map(func(symbol rune) rune {
		if symbol >= '0' && symbol <= '9' {
			return symbol
		}
		return -1
	}, request.Phone)
	if len(digits) != 11 || len(request.Phone) > 24 || !phoneFormat.MatchString(request.Phone) {
		writeError(w, http.StatusUnprocessableEntity, "phone", "Укажите 11 цифр телефона, начиная с +7 или 8.")
		return
	}
	request.Phone = "+7" + digits[1:]
	request.Comment = strings.TrimSpace(request.Comment)
	if utf8.RuneCountInString(request.Comment) > 1000 {
		writeError(w, http.StatusUnprocessableEntity, "comment", "Комментарий должен быть не длиннее 1000 символов.")
		return
	}
	if request.Date != "" {
		if _, err := time.Parse("2006-01-02", request.Date); err != nil {
			writeError(w, http.StatusUnprocessableEntity, "date", "Укажите корректную дату связи.")
			return
		}
	}
	if request.Topic != "" && request.Topic != "order" && request.Topic != "question" {
		writeError(w, http.StatusUnprocessableEntity, "topic", "Выберите тему заявки.")
		return
	}

	record := struct {
		orderRequest
		CreatedAt time.Time `json:"createdAt"`
		Total     int       `json:"total"`
	}{orderRequest: request, CreatedAt: time.Now().UTC(), Total: item.finalPrice()}
	id, err := s.saveRecord("orders", "SP", record)
	if err != nil {
		log.Printf("save order: %v", err)
		writeError(w, http.StatusInternalServerError, "", "Не удалось сохранить заявку. Попробуйте позже.")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"id": id, "total": record.Total})
}

func (s shop) createMessage(w http.ResponseWriter, r *http.Request) {
	var request messageRequest
	if !readJSON(w, r, &request) {
		return
	}
	if field, message := request.validate(); field != "" {
		writeError(w, http.StatusUnprocessableEntity, field, message)
		return
	}
	request.Message = strings.TrimSpace(request.Message)
	if length := utf8.RuneCountInString(request.Message); length < 10 || length > 1000 {
		writeError(w, http.StatusUnprocessableEntity, "message", "Напишите сообщение длиной от 10 до 1000 символов.")
		return
	}
	record := struct {
		messageRequest
		CreatedAt time.Time `json:"createdAt"`
	}{messageRequest: request, CreatedAt: time.Now().UTC()}
	id, err := s.saveRecord("messages", "MSG", record)
	if err != nil {
		log.Printf("save message: %v", err)
		writeError(w, http.StatusInternalServerError, "", "Не удалось сохранить сообщение. Попробуйте позже.")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]string{"id": id})
}

// На каждое обращение приходится отдельный файл. Переименование публикует только готовый JSON.
func (s shop) saveRecord(kind, prefix string, record any) (string, error) {
	dir := filepath.Join(s.dataDir, kind)
	if err := os.MkdirAll(dir, 0700); err != nil {
		return "", err
	}
	random := make([]byte, 8)
	if _, err := rand.Read(random); err != nil {
		return "", err
	}
	id := prefix + "-" + strings.ToUpper(hex.EncodeToString(random))
	file, err := os.CreateTemp(dir, ".pending-")
	if err != nil {
		return "", err
	}
	defer os.Remove(file.Name())

	encodeErr := json.NewEncoder(file).Encode(record)
	closeErr := file.Close()
	if encodeErr != nil {
		return "", encodeErr
	}
	if closeErr != nil {
		return "", closeErr
	}
	return id, os.Rename(file.Name(), filepath.Join(dir, id+".json"))
}
