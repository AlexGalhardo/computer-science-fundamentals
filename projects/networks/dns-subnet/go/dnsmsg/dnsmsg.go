// Package dnsmsg encodes and decodes the small part of the DNS wire format (RFC 1035) that
// the mini-project needs: the header, one question and records of type A, NS and CNAME.
package dnsmsg

import (
	"encoding/binary"
	"errors"
	"fmt"
	"net/netip"
	"strings"
)

// Type is the type of a resource record.
type Type uint16

// The record types understood by this package, with their numbers from RFC 1035.
const (
	TypeA     Type = 1
	TypeNS    Type = 2
	TypeCNAME Type = 5
)

func (t Type) String() string {
	switch t {
	case TypeA:
		return "A"
	case TypeNS:
		return "NS"
	case TypeCNAME:
		return "CNAME"
	}
	return fmt.Sprintf("TYPE%d", uint16(t))
}

// ParseType turns the textual name of a type into its number.
func ParseType(text string) (Type, error) {
	for _, t := range []Type{TypeA, TypeNS, TypeCNAME} {
		if strings.EqualFold(text, t.String()) {
			return t, nil
		}
	}
	return 0, fmt.Errorf("unsupported record type %q", text)
}

// Response codes used here.
const (
	RCodeSuccess  = 0
	RCodeFormat   = 1
	RCodeNotFound = 3 // NXDOMAIN: the name does not exist
	RCodeRefused  = 5
)

const classIN = 1

// Record is one resource record. Addr is used by type A, Target by NS and CNAME.
type Record struct {
	Name   string
	Type   Type
	TTL    uint32
	Addr   netip.Addr
	Target string
}

func (r Record) String() string {
	value := r.Target
	if r.Type == TypeA {
		value = r.Addr.String()
	}
	return fmt.Sprintf("%s %d %s %s", r.Name, r.TTL, r.Type, value)
}

// Question is what a query asks: a name and a record type.
type Question struct {
	Name string
	Type Type
}

// Message is a DNS query or response.
//
// EN: A response has three sections after the question. Answer holds the records asked for.
// Authority holds NS records that say who to ask next (a referral). Additional holds helper
// records, typically the addresses of those name servers, called glue.
// PT: Uma resposta tem três seções depois da pergunta. Answer traz os registros pedidos.
// Authority traz registros NS que dizem a quem perguntar em seguida (uma indicação).
// Additional traz registros de apoio, tipicamente os endereços desses servidores de nomes,
// chamados de glue.
// ES: Una respuesta tiene tres secciones después de la pregunta. Answer trae los registros
// pedidos. Authority trae registros NS que dicen a quién preguntar después (una referencia).
// Additional trae registros de apoyo, típicamente las direcciones de esos servidores de nombres,
// llamados glue.
type Message struct {
	ID            uint16
	Response      bool
	Authoritative bool
	RCode         int
	Question      Question
	Answer        []Record
	Authority     []Record
	Additional    []Record
}

// ErrMalformed is returned for a packet that is not a valid DNS message.
var ErrMalformed = errors.New("malformed DNS message")

// Canonical returns a name in lower case with the trailing dot of the root.
//
// EN: DNS names are case-insensitive and every full name ends at the root, written as a final
// dot. Normalising once avoids comparing "Example.TEST" with "example.test." all over the code.
// PT: Nomes DNS não diferenciam maiúsculas de minúsculas e todo nome completo termina na raiz,
// escrita como um ponto final. Normalizar uma vez evita comparar "Example.TEST" com
// "example.test." por todo o código.
// ES: Los nombres DNS no distinguen mayúsculas de minúsculas y todo nombre completo termina en la
// raíz, escrita como un punto final. Normalizar una vez evita comparar "Example.TEST" con
// "example.test." por todo el código.
func Canonical(name string) string {
	name = strings.ToLower(strings.TrimSpace(name))
	if !strings.HasSuffix(name, ".") {
		name += "."
	}
	return name
}

// Parent returns the name one label up, and false when name is already the root.
func Parent(name string) (string, bool) {
	if name == "." {
		return "", false
	}
	_, rest, _ := strings.Cut(name, ".")
	if rest == "" {
		return ".", true
	}
	return rest, true
}

// IsSubdomain reports whether name is equal to zone or below it in the tree.
func IsSubdomain(name, zone string) bool {
	return zone == "." || name == zone || strings.HasSuffix(name, "."+zone)
}

func appendName(buf []byte, name string) ([]byte, error) {
	if name != "." {
		for label := range strings.SplitSeq(strings.TrimSuffix(name, "."), ".") {
			if label == "" || len(label) > 63 {
				return nil, fmt.Errorf("invalid label in %q", name)
			}
			buf = append(buf, byte(len(label)))
			buf = append(buf, label...)
		}
	}
	return append(buf, 0), nil
}

func appendRecord(buf []byte, r Record) ([]byte, error) {
	buf, err := appendName(buf, r.Name)
	if err != nil {
		return nil, err
	}
	buf = binary.BigEndian.AppendUint16(buf, uint16(r.Type))
	buf = binary.BigEndian.AppendUint16(buf, classIN)
	buf = binary.BigEndian.AppendUint32(buf, r.TTL)
	var data []byte
	if r.Type == TypeA {
		if !r.Addr.Is4() {
			return nil, fmt.Errorf("record %s needs an IPv4 address", r.Name)
		}
		addr := r.Addr.As4()
		data = addr[:]
	} else if data, err = appendName(nil, r.Target); err != nil {
		return nil, err
	}
	buf = binary.BigEndian.AppendUint16(buf, uint16(len(data)))
	return append(buf, data...), nil
}

// Pack encodes the message in wire format.
func (m Message) Pack() ([]byte, error) {
	var flags uint16
	if m.Response {
		flags |= 1 << 15
	}
	if m.Authoritative {
		flags |= 1 << 10
	}
	flags |= uint16(m.RCode & 0xf)

	buf := make([]byte, 0, 512)
	buf = binary.BigEndian.AppendUint16(buf, m.ID)
	buf = binary.BigEndian.AppendUint16(buf, flags)
	for _, count := range []int{1, len(m.Answer), len(m.Authority), len(m.Additional)} {
		buf = binary.BigEndian.AppendUint16(buf, uint16(count))
	}
	buf, err := appendName(buf, m.Question.Name)
	if err != nil {
		return nil, err
	}
	buf = binary.BigEndian.AppendUint16(buf, uint16(m.Question.Type))
	buf = binary.BigEndian.AppendUint16(buf, classIN)
	for _, section := range [][]Record{m.Answer, m.Authority, m.Additional} {
		for _, record := range section {
			if buf, err = appendRecord(buf, record); err != nil {
				return nil, err
			}
		}
	}
	return buf, nil
}

type reader struct {
	msg []byte
	pos int
}

func (r *reader) uint16() (uint16, error) {
	if r.pos+2 > len(r.msg) {
		return 0, ErrMalformed
	}
	value := binary.BigEndian.Uint16(r.msg[r.pos:])
	r.pos += 2
	return value, nil
}

func (r *reader) uint32() (uint32, error) {
	if r.pos+4 > len(r.msg) {
		return 0, ErrMalformed
	}
	value := binary.BigEndian.Uint32(r.msg[r.pos:])
	r.pos += 4
	return value, nil
}

// name reads a domain name, following compression pointers.
//
// EN: To save space a name may end with a pointer: two bytes starting with the bits 11 that
// give the offset of the rest of the name earlier in the message. A hostile packet can make
// pointers loop, so the number of jumps is limited.
// PT: Para economizar espaço um nome pode terminar com um ponteiro: dois bytes começando pelos
// bits 11 que dão o deslocamento do resto do nome em um ponto anterior da mensagem. Um pacote
// hostil pode fazer os ponteiros formarem um laço, então o número de saltos é limitado.
// ES: Para ahorrar espacio un nombre puede terminar con un puntero: dos bytes que empiezan con los
// bits 11 y que dan el desplazamiento del resto del nombre en un punto anterior del mensaje. Un
// paquete hostil puede hacer que los punteros formen un ciclo, así que el número de saltos es
// limitado.
func (r *reader) name() (string, error) {
	var labels []string
	pos, jumps, end := r.pos, 0, -1
	for {
		if pos >= len(r.msg) {
			return "", ErrMalformed
		}
		length := int(r.msg[pos])
		switch {
		case length == 0:
			if end < 0 {
				end = pos + 1
			}
			r.pos = end
			if len(labels) == 0 {
				return ".", nil
			}
			return strings.ToLower(strings.Join(labels, ".")) + ".", nil
		case length&0xc0 == 0xc0:
			if pos+2 > len(r.msg) || jumps >= 16 {
				return "", ErrMalformed
			}
			if end < 0 {
				end = pos + 2
			}
			pos = int(binary.BigEndian.Uint16(r.msg[pos:]) & 0x3fff)
			jumps++
		case length > 63 || pos+1+length > len(r.msg):
			return "", ErrMalformed
		default:
			labels = append(labels, string(r.msg[pos+1:pos+1+length]))
			pos += 1 + length
		}
	}
}

func (r *reader) record() (Record, bool, error) {
	name, err := r.name()
	if err != nil {
		return Record{}, false, err
	}
	kind, err := r.uint16()
	if err != nil {
		return Record{}, false, err
	}
	if _, err := r.uint16(); err != nil { // class
		return Record{}, false, err
	}
	ttl, err := r.uint32()
	if err != nil {
		return Record{}, false, err
	}
	length, err := r.uint16()
	if err != nil {
		return Record{}, false, err
	}
	end := r.pos + int(length)
	if end > len(r.msg) {
		return Record{}, false, ErrMalformed
	}
	record := Record{Name: name, Type: Type(kind), TTL: ttl}
	known := true
	switch record.Type {
	case TypeA:
		addr, ok := netip.AddrFromSlice(r.msg[r.pos:end])
		if !ok || !addr.Is4() {
			return Record{}, false, ErrMalformed
		}
		record.Addr = addr
	case TypeNS, TypeCNAME:
		if record.Target, err = r.name(); err != nil {
			return Record{}, false, err
		}
	default:
		known = false // a type this resolver does not use: skipped, not an error
	}
	r.pos = end
	return record, known, nil
}

// Unpack decodes a message in wire format.
func Unpack(msg []byte) (Message, error) {
	r := &reader{msg: msg}
	var header [6]uint16
	for i := range header {
		value, err := r.uint16()
		if err != nil {
			return Message{}, err
		}
		header[i] = value
	}
	if header[2] != 1 {
		return Message{}, ErrMalformed
	}
	m := Message{
		ID:            header[0],
		Response:      header[1]&(1<<15) != 0,
		Authoritative: header[1]&(1<<10) != 0,
		RCode:         int(header[1] & 0xf),
	}
	name, err := r.name()
	if err != nil {
		return Message{}, err
	}
	kind, err := r.uint16()
	if err != nil {
		return Message{}, err
	}
	if _, err := r.uint16(); err != nil { // class
		return Message{}, err
	}
	m.Question = Question{Name: name, Type: Type(kind)}
	for i, section := range []*[]Record{&m.Answer, &m.Authority, &m.Additional} {
		for range header[3+i] {
			record, known, err := r.record()
			if err != nil {
				return Message{}, err
			}
			if known {
				*section = append(*section, record)
			}
		}
	}
	return m, nil
}
